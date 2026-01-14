"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import type { TaskStatus } from "@prisma/client";

import type { CalendarDay, CalendarTask } from "@/types/dashboard";

type TaskCalendarProps = {
  days: CalendarDay[];
  defaultWeeks: number;
  minWeeks: number;
  maxWeeks: number;
  daysPerWeek: number;
};

const statusColors: Record<TaskStatus, string> = {
  TODO: "bg-slate-500",
  IN_PROGRESS: "bg-amber-400",
  DONE: "bg-emerald-400",
};

const statusLabels: Record<TaskStatus, string> = {
  TODO: "未着手",
  IN_PROGRESS: "進行中",
  DONE: "完了",
};

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

export default function TaskCalendar({ days, defaultWeeks, minWeeks, maxWeeks, daysPerWeek }: TaskCalendarProps) {
  const initialWeeks = Math.min(Math.max(defaultWeeks, minWeeks), maxWeeks);
  const [visibleWeeks, setVisibleWeeks] = useState(initialWeeks);
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);

  const clampedWeeks = useMemo(() => Math.min(Math.max(visibleWeeks, minWeeks), maxWeeks), [visibleWeeks, minWeeks, maxWeeks]);
  const visibleDays = useMemo(
    () => days.slice(0, clampedWeeks * daysPerWeek),
    [days, clampedWeeks, daysPerWeek]
  );
  const weeks = useMemo(
    () =>
      Array.from({ length: clampedWeeks }, (_, weekIndex) =>
        visibleDays.slice(weekIndex * daysPerWeek, weekIndex * daysPerWeek + daysPerWeek)
      ),
    [visibleDays, clampedWeeks, daysPerWeek]
  );

  const handleWeeksChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    setVisibleWeeks(next);
  };

  const openTaskDetails = (task: CalendarTask) => {
    setSelectedTask(task);
  };

  const closeTaskDetails = () => {
    setSelectedTask(null);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Schedule</p>
          <h2 className="text-2xl font-semibold text-white">カレンダー</h2>
          <p className="text-sm text-white/60">今週以降{clampedWeeks}週間の予定を確認できます。</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/80">
          <label htmlFor="weeksRange" className="whitespace-nowrap text-xs text-white/60">
            表示週数
          </label>
          <input
            id="weeksRange"
            type="range"
            min={minWeeks}
            max={maxWeeks}
            value={clampedWeeks}
            onChange={handleWeeksChange}
            className="h-1.5 w-28 cursor-pointer appearance-none rounded bg-white/10 accent-emerald-300"
          />
          <span className="text-xs">{clampedWeeks}週</span>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-7 text-center text-xs font-semibold uppercase text-white/60">
        {weekdayLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="mt-2 space-y-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-2">
            {week.map((day) => {
              const baseClass = day.isToday
                ? "bg-emerald-500/20 ring-2 ring-emerald-300"
                : day.isHoliday
                ? "bg-rose-500/10"
                : "bg-slate-950/40";
              const badgeText = day.isToday ? "今日" : day.holidayName ?? (day.isHoliday ? "休日" : null);
              const badgeClass = day.isToday ? "text-emerald-300" : "text-rose-300";
              return (
                <div
                  key={day.date}
                  className={`min-h-[110px] rounded-2xl border border-white/10 px-3 py-2 text-sm ${baseClass}`}
                >
                  <div className="flex items-center justify-between text-xs text-white">
                    <span>{day.label}</span>
                    {badgeText && <span className={badgeClass}>{badgeText}</span>}
                  </div>
                  <div className="mt-2 space-y-1">
                    {day.tasks.length === 0 ? (
                      <p className="text-[10px] text-white/30">予定なし</p>
                    ) : (
                      day.tasks.slice(0, 2).map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => openTaskDetails(task)}
                          className="flex w-full items-center gap-2 rounded-xl border border-transparent px-2 py-1 text-left transition hover:border-emerald-300/40 hover:bg-white/5"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusColors[task.status]}`}
                            aria-hidden
                          />
                          <p className="truncate text-xs text-white/90">{task.title}</p>
                        </button>
                      ))
                    )}
                    {day.tasks.length > 2 && (
                      <p className="text-[10px] text-white/50">+{day.tasks.length - 2} 件</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeTaskDetails}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${statusColors[selectedTask.status]}`}
                  aria-hidden
                />
                <h3 className="text-lg font-semibold">{selectedTask.title}</h3>
              </div>
              <button onClick={closeTaskDetails} className="text-sm text-white/60 transition hover:text-white">
                閉じる
              </button>
            </div>
            <div className="space-y-3 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-white/90">
                  {statusLabels[selectedTask.status]}
                </span>
                {selectedTask.dueDate && (
                  <span className="text-xs text-emerald-200">期限: {selectedTask.dueDate}</span>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">開始日</p>
                  <p className="mt-1 text-sm text-white/90">{selectedTask.startDate ?? "未設定"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">期限</p>
                  <p className="mt-1 text-sm text-white/90">{selectedTask.dueDate ?? "未設定"}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">詳細</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-white/90">
                  {selectedTask.description && selectedTask.description.trim().length > 0 ? selectedTask.description : "詳細は未入力です。"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
