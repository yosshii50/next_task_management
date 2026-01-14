"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import type { TaskStatus } from "@prisma/client";

import TaskCalendar from "@/components/task-calendar";
import TaskList from "@/components/task-list";
import { buildCalendarDays } from "@/lib/dashboard-utils";
import type { DashboardData } from "@/types/dashboard";

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
  const [editTargetId, setEditTargetId] = useState<number | null>(null);
  const [createTargetDate, setCreateTargetDate] = useState<string | null>(null);

  const calendarDays = useMemo(
    () => (data ? buildCalendarDays(data, maxWeeks, daysPerWeek) : []),
    [data, maxWeeks, daysPerWeek]
  );
  const tasks = data?.tasks ?? [];

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

  const handleEditRequest = (taskId: number) => {
    setEditTargetId(taskId);
  };

  const handleCreateRequest = (date: string) => {
    setCreateTargetDate(date);
  };

  const clearEditRequest = () => setEditTargetId(null);
  const clearCreateRequest = () => setCreateTargetDate(null);

  return (
    <>
      <TaskCalendar
        days={calendarDays}
        defaultWeeks={defaultWeeks}
        minWeeks={minWeeks}
        maxWeeks={maxWeeks}
        daysPerWeek={daysPerWeek}
        onEditTask={handleEditRequest}
        onCreateTask={handleCreateRequest}
      />

      <TaskList
        tasks={tasks}
        statusOptions={statusOptions}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        editTargetId={editTargetId}
        onEditTargetHandled={clearEditRequest}
        createRequestDate={createTargetDate}
        onCreateRequestHandled={clearCreateRequest}
      />

      {isLoading && !data && <p className="text-sm text-white/60">データを読み込み中です...</p>}
      {error && <p className="text-sm text-rose-300">最新データの取得に失敗しました。時間をおいて再度お試しください。</p>}
    </>
  );
}
