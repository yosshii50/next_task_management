"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import useSWR from "swr";
import type { TaskStatus } from "@prisma/client";

import TaskCalendar from "@/components/task-calendar";
import DatePicker from "@/components/date-picker";
import TaskEditModal from "@/components/task-edit-modal";
import { buildCalendarDays, formatDateForInput, getJapanToday } from "@/lib/dashboard-utils";
import { useEscapeKey } from "@/lib/use-escape-key";
import type { DashboardData, TaskForClient } from "@/types/dashboard";

type StatusOption = {
  value: TaskStatus;
  label: string;
};

type DashboardContentProps = {
  statusOptions: StatusOption[];
  initialData: DashboardData;
  defaultWeeks: number;
  minWeeks: number;
  maxWeeks: number;
  daysPerWeek: number;
  onCreate: (formData: FormData) => Promise<void>;
  onUpdate: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
};

type TaskNode = {
  task: TaskForClient;
  children: TaskNode[];
};

const statusColors: Record<TaskStatus, string> = {
  TODO: "bg-emerald-400",
  IN_PROGRESS: "bg-amber-400",
  DONE: "bg-slate-400",
};

const treeStatusOrder: TaskStatus[] = ["IN_PROGRESS", "TODO", "DONE"];

function buildActiveTaskTree(tasks: TaskForClient[]): TaskNode[] {
  const targetStatuses = new Set<TaskStatus>(["TODO", "IN_PROGRESS", "DONE"]);
  const activeTasks = tasks.filter((task) => targetStatuses.has(task.status));

  const taskMap = new Map(activeTasks.map((task) => [task.id, task]));
  const childrenMap = new Map<number, number[]>();
  const activeParentMap = new Map<number, number[]>();

  activeTasks.forEach((task) => {
    const activeChildren = task.childTaskIds.filter((childId) => taskMap.has(childId));
    childrenMap.set(task.id, activeChildren);
    const activeParents = task.parentTaskIds.filter((parentId) => taskMap.has(parentId));
    activeParentMap.set(task.id, activeParents);
  });

  const statusRank = treeStatusOrder.reduce<Record<TaskStatus, number>>((acc, status, index) => {
    acc[status] = index;
    return acc;
  }, {} as Record<TaskStatus, number>);

  const buildNode = (taskId: number, visited: Set<number>): TaskNode => {
    const task = taskMap.get(taskId)!;
    const node: TaskNode = { task, children: [] };

    const nextVisited = new Set(visited);
    nextVisited.add(taskId);

    const childIds = childrenMap.get(taskId) ?? [];
    childIds.forEach((childId) => {
      if (nextVisited.has(childId)) return; // cycle guard
      node.children.push(buildNode(childId, nextVisited));
    });

    node.children.sort((a, b) => {
      const statusDiff = (statusRank[a.task.status] ?? 99) - (statusRank[b.task.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      const aTime = new Date(a.task.createdAt).getTime();
      const bTime = new Date(b.task.createdAt).getTime();
      const safeATime = Number.isNaN(aTime) ? 0 : aTime;
      const safeBTime = Number.isNaN(bTime) ? 0 : bTime;
      return safeBTime - safeATime;
    });

    return node;
  };

  // 矢印を親→子で埋める（子が複数の親を持つ場合は両方にぶら下げる）
  activeTasks.forEach((task) => {
    const activeParents = activeParentMap.get(task.id) ?? [];
    activeParents.forEach((parentId) => {
      if (!taskMap.has(parentId)) return;
      const parentChildren = childrenMap.get(parentId) ?? [];
      if (!parentChildren.includes(task.id)) {
        childrenMap.set(parentId, [...parentChildren, task.id]);
      }
    });
  });

  // ルートを一意に集める（アクティブ親なしのタスク、および親チェーンの起点）
  const rootIds = new Set<number>();
  activeTasks.forEach((task) => {
    const activeParents = activeParentMap.get(task.id) ?? [];
    if (activeParents.length === 0) {
      rootIds.add(task.id);
    }
  });
  activeTasks.forEach((task) => {
    const activeParents = activeParentMap.get(task.id) ?? [];
    activeParents.forEach((parentId) => {
      const parentTask = taskMap.get(parentId);
      if (!parentTask) return;
      const parentHasParent = parentTask.parentTaskIds.some((pp) => taskMap.has(pp));
      if (!parentHasParent) {
        rootIds.add(parentId);
      }
    });
  });

  const roots: TaskNode[] = Array.from(rootIds).map((id) => buildNode(id, new Set()));

  roots.sort((a, b) => {
    const statusDiff = (statusRank[a.task.status] ?? 99) - (statusRank[b.task.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    const aTime = new Date(a.task.createdAt).getTime();
    const bTime = new Date(b.task.createdAt).getTime();
    const safeATime = Number.isNaN(aTime) ? 0 : aTime;
    const safeBTime = Number.isNaN(bTime) ? 0 : bTime;
    return safeBTime - safeATime;
  });

  return roots;
}

const fetcher = async (url: string): Promise<DashboardData> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("ダッシュボードデータの取得に失敗しました。");
  }

  return response.json();
};

export default function DashboardContent({
  statusOptions,
  initialData,
  defaultWeeks,
  minWeeks,
  maxWeeks,
  daysPerWeek,
  onCreate,
  onUpdate,
  onDelete,
}: DashboardContentProps) {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>("/api/dashboard", fetcher, {
    refreshInterval: 5000,
    fallbackData: initialData,
  });
  // SWR がまだレスポンスを返していない場合も初期データで即座に描画できるようにする。
  const dashboardData = data ?? initialData;
  const tasks = dashboardData.tasks;
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [presetDate, setPresetDate] = useState<string | null>(null);
  const [isCreating, startCreatingTransition] = useTransition();
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const todayIso = useMemo(() => formatDateForInput(getJapanToday()), []);
  const statusLabelMap = useMemo(
    () => Object.fromEntries(statusOptions.map((option) => [option.value, option.label])),
    [statusOptions]
  );

  const calendarDays = useMemo(
    () => buildCalendarDays(dashboardData, maxWeeks, daysPerWeek),
    [dashboardData, maxWeeks, daysPerWeek]
  );
  const todayTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task.startDate) return false;

      const isStarted = task.startDate <= todayIso;
      const isToday = task.startDate === todayIso;

      return (isStarted && task.status !== "DONE") || (isToday && task.status === "DONE");
    });
  }, [tasks, todayIso]);
  const sortedTodayTasks = useMemo(() => {
    const statusOrder: TaskStatus[] = ["IN_PROGRESS", "TODO", "DONE"];
    const statusRank = statusOrder.reduce<Record<TaskStatus, number>>((acc, status, index) => {
      acc[status] = index;
      return acc;
    }, {} as Record<TaskStatus, number>);

    return [...todayTasks].sort((a, b) => {
      const statusDiff = statusRank[a.status] - statusRank[b.status];
      if (statusDiff !== 0) return statusDiff;

      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      const safeATime = Number.isNaN(aTime) ? 0 : aTime;
      const safeBTime = Number.isNaN(bTime) ? 0 : bTime;
      return safeBTime - safeATime;
    });
  }, [todayTasks]);

  const activeTreeSourceTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (!task.startDate) return false;
        if (task.status === "DONE") {
          return task.startDate === todayIso; // 完了は当日分のみツリーに表示
        }
        return task.startDate <= todayIso;
      }),
    [tasks, todayIso]
  );

  const activeTaskTree = useMemo(() => buildActiveTaskTree(activeTreeSourceTasks), [activeTreeSourceTasks]);
  const taskMap = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const childMap = useMemo(() => new Map(tasks.map((task) => [task.id, task.childTaskIds ?? []])), [tasks]);

  const editingTask: TaskForClient | null = useMemo(
    () => tasks.find((task) => task.id === editingTaskId) ?? null,
    [tasks, editingTaskId]
  );

  const openEdit = (taskId: number) => {
    setEditingTaskId(taskId);
  };

  const closeEdit = () => {
    setEditingTaskId(null);
  };

  const openCreate = (date?: string) => {
    setPresetDate(date ?? todayIso);
    setIsCreateOpen(true);
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    setPresetDate(null);
  };

  const handleUpdate = async (formData: FormData) => {
    await onUpdate(formData);
    await mutate();
  };

  const handleCreate = (formData: FormData) => {
    startCreatingTransition(async () => {
      await onCreate(formData);
      await mutate();
      closeCreate();
    });
  };

  const handleDelete = async (formData: FormData) => {
    await onDelete(formData);
    await mutate();
  };

  const isDescendant = useCallback(
    (ancestorId: number, maybeDescendantId: number) => {
      if (ancestorId === maybeDescendantId) return true;
      const visited = new Set<number>();
      const stack = [ancestorId];

      while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current)) continue;
        visited.add(current);

        const children = childMap.get(current) ?? [];
        for (const childId of children) {
          if (childId === maybeDescendantId) return true;
          stack.push(childId);
        }
      }

      return false;
    },
    [childMap]
  );

  const isValidDropTarget = useCallback(
    (targetId: number) => {
      if (draggingTaskId === null) return false;
      if (targetId === draggingTaskId) return false;
      return !isDescendant(draggingTaskId, targetId);
    },
    [draggingTaskId, isDescendant]
  );

  const handleLinkByDrop = useCallback(
    async (targetId: number) => {
      const childId = draggingTaskId;
      if (childId === null) return;
      if (!isValidDropTarget(targetId)) {
        setDraggingTaskId(null);
        setDragOverId(null);
        return;
      }

      const parent = taskMap.get(targetId);
      const child = taskMap.get(childId);
      if (!parent || !child) return;

      const newChildren = Array.from(new Set([...(parent.childTaskIds ?? []), child.id]));

      const formData = new FormData();
      formData.set("taskId", parent.id.toString());
      formData.set("title", parent.title);
      formData.set("description", parent.description ?? "");
      formData.set("status", parent.status);
      formData.set("startDate", parent.startDate ?? "");
      formData.set("dueDate", parent.dueDate ?? "");
      newChildren.forEach((id) => formData.append("childTaskIds", id.toString()));

      try {
        setIsLinking(true);
        await handleUpdate(formData);
      } finally {
        setIsLinking(false);
        setDraggingTaskId(null);
        setDragOverId(null);
      }
    },
    [draggingTaskId, handleUpdate, isValidDropTarget, taskMap]
  );

  useEscapeKey(isCreateOpen, closeCreate);

  const renderTaskNode = (node: TaskNode) => {
    const isDragging = draggingTaskId === node.task.id;
    const isDroppable = isValidDropTarget(node.task.id);
    const isDragOver = dragOverId === node.task.id && isDroppable;

    const baseClasses =
      "rounded-2xl border bg-slate-950/40 px-4 py-3 transition-colors duration-150 border-white/10";
    const dragClasses = [
      isDragOver ? "border-emerald-300/70 bg-emerald-300/10" : "",
      isDragging ? "opacity-70 ring-1 ring-emerald-300/50" : "",
      !isDragging && isDroppable ? "hover:border-emerald-300/60" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <li
        key={node.task.id}
        className={`${baseClasses} ${dragClasses}`}
        draggable
        onDragStart={() => {
          setDraggingTaskId(node.task.id);
        }}
        onDragEnd={() => {
          setDraggingTaskId(null);
          setDragOverId(null);
        }}
        onDragOver={(event) => {
          if (!isDroppable) return;
          event.preventDefault();
          setDragOverId(node.task.id);
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          handleLinkByDrop(node.task.id);
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <span className={`mt-1 h-2.5 w-2.5 rounded-full ${statusColors[node.task.status]}`} aria-hidden />
            <div>
              <p className="text-sm font-semibold text-white">{node.task.title}</p>
              {node.task.description && node.task.description.trim().length > 0 && (
                <p className="mt-1 text-xs text-white/70">{node.task.description}</p>
              )}
              <p className="mt-1 text-[11px] text-white/50">
                {statusLabelMap[node.task.status] ?? node.task.status} / 開始: {node.task.startDate ?? "未設定"} / 期限:{" "}
                {node.task.dueDate ?? "未設定"}
              </p>
              <p className="mt-1 text-[11px] text-emerald-200/80">
                ドラッグ&ドロップでこのタスクの子に設定できます
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDragOver && <span className="text-[11px] font-semibold text-emerald-300">ここにドロップ</span>}
            <button
              type="button"
              onClick={() => openEdit(node.task.id)}
              className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
            >
              修正
            </button>
          </div>
        </div>
        {node.children.length > 0 && (
          <ul className="mt-2 space-y-2 border-l border-white/10 pl-4">
            {node.children.map((child) => (
              <div key={child.task.id} className="relative">
                <span className="absolute -left-4 top-3 h-px w-3 bg-white/15" aria-hidden />
                {renderTaskNode(child)}
              </div>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Focus</p>
            <h2 className="text-2xl font-semibold text-white">今日のタスク</h2>
            <p className="text-sm text-white/60">本日の予定をまとめて確認・追加できます。</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full bg-white/10 p-1 text-xs font-semibold text-white/70">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-full px-3 py-1 transition ${
                  viewMode === "list" ? "bg-emerald-400 text-slate-950 shadow" : "hover:text-white"
                }`}
              >
                リスト表示
              </button>
              <button
                type="button"
                onClick={() => setViewMode("tree")}
                className={`rounded-full px-3 py-1 transition ${
                  viewMode === "tree" ? "bg-emerald-400 text-slate-950 shadow" : "hover:text-white"
                }`}
              >
                ツリー表示
              </button>
            </div>
            <button
              type="button"
              onClick={() => openCreate(todayIso)}
              className="rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              追加
            </button>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
              {viewMode === "list" ? `${sortedTodayTasks.length} 件` : `${activeTaskTree.length} ルート`}
            </span>
            {isLinking && <span className="text-[11px] font-semibold text-emerald-300">リンク反映中...</span>}
          </div>
        </div>

        {viewMode === "list" ? (
          sortedTodayTasks.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white/60">
              今日は予定されているタスクはありません。カレンダーの日付をクリックして作成できます。
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {sortedTodayTasks.map((task) => {
                const isDragging = draggingTaskId === task.id;
                const isDroppable = isValidDropTarget(task.id);
                const isDragOver = dragOverId === task.id && isDroppable;

                const baseClasses =
                  "flex items-start justify-between gap-3 rounded-2xl border bg-slate-950/40 px-4 py-3 transition-colors duration-150";
                const dragClasses = [
                  isDragOver ? "border-emerald-300/70 bg-emerald-300/10" : "border-white/10",
                  isDragging ? "opacity-70 ring-1 ring-emerald-300/50" : "",
                  !isDragging && isDroppable ? "hover:border-emerald-300/60" : "hover:border-white/20",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <li
                    key={task.id}
                    className={`${baseClasses} ${dragClasses}`}
                    draggable
                    onDragStart={() => setDraggingTaskId(task.id)}
                    onDragEnd={() => {
                      setDraggingTaskId(null);
                      setDragOverId(null);
                    }}
                    onDragOver={(event) => {
                      if (!isDroppable) return;
                      event.preventDefault();
                      setDragOverId(task.id);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleLinkByDrop(task.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${statusColors[task.status]}`} aria-hidden />
                      <div>
                        <p className="text-sm font-semibold text-white">{task.title}</p>
                        {task.description && task.description.trim().length > 0 && (
                          <p className="mt-1 text-xs text-white/70">{task.description}</p>
                        )}
                        <p className="mt-1 text-[11px] text-white/50">
                          {statusLabelMap[task.status] ?? task.status} / 開始: {task.startDate ?? "未設定"} / 期限:{" "}
                          {task.dueDate ?? "未設定"}
                        </p>
                        <p className="mt-1 text-[11px] text-emerald-200/80">ドラッグ&ドロップで子タスクを設定</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDragOver && <span className="text-[11px] font-semibold text-emerald-300">ここにドロップ</span>}
                      <button
                        type="button"
                        onClick={() => openEdit(task.id)}
                        className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
                      >
                        修正
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        ) : activeTaskTree.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white/60">
            未着手または進行中のタスクがありません。新しいタスクを追加するとここにツリー表示されます。
          </p>
        ) : (
          <ul className="mt-4 space-y-2">{activeTaskTree.map((node) => renderTaskNode(node))}</ul>
        )}
      </section>

      <TaskCalendar
        days={calendarDays}
        defaultWeeks={defaultWeeks}
        minWeeks={minWeeks}
        maxWeeks={maxWeeks}
        daysPerWeek={daysPerWeek}
        onEditTask={openEdit}
        onCreateTask={(date) => openCreate(date)}
      />

      {isLoading && !data && <p className="text-sm text-white/60">データを読み込み中です...</p>}
      {error && <p className="text-sm text-rose-300">最新データの取得に失敗しました。時間をおいて再度お試しください。</p>}

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          tasks={tasks}
          statusOptions={statusOptions}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onClose={closeEdit}
        />
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">今日のタスクを追加</h3>
              <button onClick={closeCreate} className="text-sm text-white/60 hover:text-white">
                閉じる
              </button>
            </div>
            <form action={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-white/80" htmlFor="dashboard-create-title">
                  タイトル
                </label>
                <input
                  id="dashboard-create-title"
                  name="title"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
                  placeholder="例: デイリースタンドアップの準備"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/80" htmlFor="dashboard-create-description">
                  詳細
                </label>
                <textarea
                  id="dashboard-create-description"
                  name="description"
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
                  placeholder="メモや共有事項があれば記載してください"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm text-white/80" htmlFor="dashboard-create-status">
                    ステータス
                  </label>
                  <select
                    id="dashboard-create-status"
                    name="status"
                    defaultValue="TODO"
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white focus:border-emerald-300 focus:outline-none"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <DatePicker id="dashboard-create-startDate" name="startDate" label="開始日" defaultValue={presetDate ?? todayIso} />
                </div>
                <div>
                  <DatePicker id="dashboard-create-dueDate" name="dueDate" label="期限" defaultValue={presetDate ?? todayIso} />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreate}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                >
                  {isCreating ? "作成中..." : "追加"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
