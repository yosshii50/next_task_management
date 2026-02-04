"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import type { TaskStatus } from "@prisma/client";

import TaskList from "@/components/task-list";
import type { DashboardData } from "@/types/dashboard";

type StatusOption = {
  value: TaskStatus;
  label: string;
};

type TaskManagementContentProps = {
  statusOptions: StatusOption[];
  initialData: DashboardData;
  onCreate: (formData: FormData) => Promise<void>;
  onUpdate: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
  initialCreateDate?: string | null;
  initialEditTargetId?: number | null;
};

const fetcher = async (url: string): Promise<DashboardData> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("タスクデータの取得に失敗しました。");
  }

  return response.json();
};

export default function TaskManagementContent({
  statusOptions,
  initialData,
  onCreate,
  onUpdate,
  onDelete,
  initialCreateDate = null,
  initialEditTargetId = null,
}: TaskManagementContentProps) {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>("/api/dashboard", fetcher, {
    refreshInterval: 5000,
    fallbackData: initialData,
  });

  const tasks = data?.tasks ?? [];
  const [pendingCreateDate, setPendingCreateDate] = useState<string | null>(initialCreateDate);
  const [pendingEditId, setPendingEditId] = useState<number | null>(initialEditTargetId);
  const [visibleStatuses, setVisibleStatuses] = useState<Set<TaskStatus>>(
    () => new Set<TaskStatus>(["TODO", "IN_PROGRESS"])
  );

  const handleCreate = async (formData: FormData) => {
    await onCreate(formData);
    await mutate();
  };

  const handleUpdate = async (formData: FormData) => {
    await onUpdate(formData);
    await mutate();
  };

  const handleDelete = async (formData: FormData) => {
    await onDelete(formData);
    await mutate();
  };

  const toggleStatus = (status: TaskStatus) => {
    setVisibleStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const filteredTasks = useMemo(
    () => tasks.filter((task) => visibleStatuses.has(task.status)),
    [tasks, visibleStatuses]
  );

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">Filter</p>
            <h2 className="text-lg font-semibold text-white">表示条件</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const active = visibleStatuses.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleStatus(option.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    active
                      ? "border-emerald-300 bg-emerald-300/10 text-emerald-200"
                      : "border-white/20 bg-white/5 text-white/70 hover:border-emerald-300 hover:text-emerald-200"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-2 text-xs text-white/50">初期状態は「未着手」「進行中」を表示します。トグルで完了タスクも確認できます。</p>
      </section>

      <TaskList
        tasks={filteredTasks}
        statusOptions={statusOptions}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        editTargetId={pendingEditId}
        onEditTargetHandled={() => setPendingEditId(null)}
        createRequestDate={pendingCreateDate}
        onCreateRequestHandled={() => setPendingCreateDate(null)}
      />
      {isLoading && !data && <p className="text-sm text-white/60">データを読み込み中です...</p>}
      {error && <p className="text-sm text-rose-300">最新データの取得に失敗しました。時間をおいて再度お試しください。</p>}
    </div>
  );
}
