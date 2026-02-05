"use client";

import { useMemo, useState, useTransition } from "react";
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

const treeStatusOrder: TaskStatus[] = ["IN_PROGRESS", "TODO"];

function buildActiveTaskTree(tasks: TaskForClient[]): TaskNode[] {
  const targetStatuses = new Set<TaskStatus>(["TODO", "IN_PROGRESS"]);
  const filtered = tasks.filter((task) => targetStatuses.has(task.status));
  const nodeMap = new Map<number, TaskNode>();

  filtered.forEach((task) => {
    nodeMap.set(task.id, { task, children: [] });
  });

  const roots: TaskNode[] = [];

  filtered.forEach((task) => {
    const node = nodeMap.get(task.id);
    if (!node) return;
    const activeParents = task.parentTaskIds.filter((parentId) => nodeMap.has(parentId));

    if (activeParents.length === 0) {
      roots.push(node);
      return;
    }

    const parentId = Math.min(...activeParents);
    const parentNode = nodeMap.get(parentId);
    if (parentNode) {
      parentNode.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const statusRank = treeStatusOrder.reduce<Record<TaskStatus, number>>((acc, status, index) => {
    acc[status] = index;
    return acc;
  }, {} as Record<TaskStatus, number>);

  const sortNodes = (nodes: TaskNode[]) => {
    nodes.sort((a, b) => {
      const statusDiff = (statusRank[a.task.status] ?? 99) - (statusRank[b.task.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;

      const aTime = new Date(a.task.createdAt).getTime();
      const bTime = new Date(b.task.createdAt).getTime();
      const safeATime = Number.isNaN(aTime) ? 0 : aTime;
      const safeBTime = Number.isNaN(bTime) ? 0 : bTime;
      return safeBTime - safeATime;
    });

    nodes.forEach((node) => sortNodes(node.children));
  };

  sortNodes(roots);

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

  const activeTaskTree = useMemo(() => buildActiveTaskTree(tasks), [tasks]);

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

  useEscapeKey(isCreateOpen, closeCreate);

  const renderTaskNode = (node: TaskNode) => (
    <li key={node.task.id} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className={`mt-1 h-2.5 w-2.5 rounded-full ${statusColors[node.task.status]}`} aria-hidden />
          <div>
            <p className="text-sm font-semibold text-white">{node.task.title}</p>
            {node.task.description && node.task.description.trim().length > 0 && (
              <p className="mt-1 text-xs text-white/70">{node.task.description}</p>
            )}
            <p className="mt-1 text-[11px] text-white/50">
              {statusLabelMap[node.task.status] ?? node.task.status} / 開始: {node.task.startDate ?? "未設定"} / 期限: {node.task.dueDate ?? "未設定"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openEdit(node.task.id)}
          className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
        >
          修正
        </button>
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

  return (
    <>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Today</p>
            <h2 className="text-2xl font-semibold text-white">今日のタスク</h2>
            <p className="text-sm text-white/60">本日の予定をカレンダーのすぐ下で確認できます。</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openCreate(todayIso)}
              className="rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              追加
            </button>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
              {sortedTodayTasks.length} 件
            </span>
          </div>
        </div>

        {sortedTodayTasks.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white/60">
            今日は予定されているタスクはありません。カレンダーの日付をクリックして作成できます。
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {sortedTodayTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${statusColors[task.status]}`} aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-white">{task.title}</p>
                    {task.description && task.description.trim().length > 0 && (
                      <p className="mt-1 text-xs text-white/70">{task.description}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(task.id)}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
                >
                  修正
                </button>
              </li>
            ))}
          </ul>
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

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-300">Structure</p>
            <h3 className="text-lg font-semibold text-white">未着手 / 進行中のタスクツリー</h3>
            <p className="text-xs text-white/60">親子関係をインデントで確認できます。完了済みは省いています。</p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">{activeTaskTree.length} ルート</span>
        </div>

        {activeTaskTree.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white/60">
            未着手または進行中のタスクがありません。新しいタスクを追加するとここにツリー表示されます。
          </p>
        ) : (
          <ul className="mt-4 space-y-2">{activeTaskTree.map((node) => renderTaskNode(node))}</ul>
        )}
      </section>

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
