"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import type { TaskStatus } from "@prisma/client";

import TaskCalendar from "@/components/task-calendar";
import TaskEditModal from "@/components/task-edit-modal";
import { buildCalendarDays } from "@/lib/dashboard-utils";
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
  onUpdate: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
};

const statusColors: Record<TaskStatus, string> = {
  TODO: "bg-emerald-400",
  IN_PROGRESS: "bg-amber-400",
  DONE: "bg-slate-400",
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
  onUpdate,
  onDelete,
}: DashboardContentProps) {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>("/api/dashboard", fetcher, {
    refreshInterval: 5000,
    fallbackData: initialData,
  });
  const tasks = data?.tasks ?? initialData.tasks;
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  const calendarDays = useMemo(
    () => (data ? buildCalendarDays(data, maxWeeks, daysPerWeek) : []),
    [data, maxWeeks, daysPerWeek]
  );
  const todayTasks = useMemo(
    () => calendarDays.find((day) => day.isToday)?.tasks ?? [],
    [calendarDays]
  );
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

  const handleUpdate = async (formData: FormData) => {
    await onUpdate(formData);
    await mutate();
  };

  const handleDelete = async (formData: FormData) => {
    await onDelete(formData);
    await mutate();
  };

  return (
    <>
      <TaskCalendar
        days={calendarDays}
        defaultWeeks={defaultWeeks}
        minWeeks={minWeeks}
        maxWeeks={maxWeeks}
        daysPerWeek={daysPerWeek}
        onEditTask={openEdit}
        onCreateTask={(date) => {
          const params = new URLSearchParams({ date });
          window.location.href = `/tasks?${params.toString()}`;
        }}
      />

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Today</p>
            <h2 className="text-2xl font-semibold text-white">今日のタスク</h2>
            <p className="text-sm text-white/60">本日の予定をカレンダーのすぐ下で確認できます。</p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            {sortedTodayTasks.length} 件
          </span>
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
    </>
  );
}
