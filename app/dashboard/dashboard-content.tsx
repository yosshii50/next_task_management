"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import useSWR from "swr";
import type { TaskStatus } from "@prisma/client";

import TaskCalendar from "@/components/task-calendar";
import TaskEditModal from "@/components/task-edit-modal";
import { buildCalendarDays, formatDateForInput, getJapanToday } from "@/lib/dashboard-utils";
import { useEscapeKey } from "@/lib/use-escape-key";
import type { DashboardData, TaskForClient } from "@/types/dashboard";

import CreateTaskModal, { type StatusOption } from "./components/create-task-modal";
import TaskListView from "./components/task-list-view";
import TaskTreeView from "./components/task-tree-view";
import { buildActiveTaskTree } from "./utils/task-tree";

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
          <TaskListView
            tasks={sortedTodayTasks}
            statusLabelMap={statusLabelMap}
            draggingTaskId={draggingTaskId}
            dragOverId={dragOverId}
            setDraggingTaskId={setDraggingTaskId}
            setDragOverId={setDragOverId}
            isValidDropTarget={isValidDropTarget}
            handleLinkByDrop={handleLinkByDrop}
            openEdit={openEdit}
          />
        ) : (
          <TaskTreeView
            nodes={activeTaskTree}
            statusLabelMap={statusLabelMap}
            draggingTaskId={draggingTaskId}
            dragOverId={dragOverId}
            setDraggingTaskId={setDraggingTaskId}
            setDragOverId={setDragOverId}
            isValidDropTarget={isValidDropTarget}
            handleLinkByDrop={handleLinkByDrop}
            openEdit={openEdit}
            isLinking={isLinking}
          />
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

      <CreateTaskModal
        isOpen={isCreateOpen}
        isCreating={isCreating}
        presetDate={presetDate}
        todayIso={todayIso}
        statusOptions={statusOptions}
        onClose={closeCreate}
        onSubmit={handleCreate}
      />
    </>
  );
}
