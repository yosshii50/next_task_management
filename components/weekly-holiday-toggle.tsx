"use client";

import { useOptimistic, useTransition } from "react";

import type { WeekdayKey } from "@/app/settings/holidays/actions";
import { setWeeklyHoliday } from "@/app/settings/holidays/actions";

type WeeklyHolidayState = Record<WeekdayKey, boolean>;

type WeeklyHolidayToggleProps = {
  initialState: WeeklyHolidayState;
};

const days: { key: WeekdayKey; label: string }[] = [
  { key: "sun", label: "日" },
  { key: "mon", label: "月" },
  { key: "tue", label: "火" },
  { key: "wed", label: "水" },
  { key: "thu", label: "木" },
  { key: "fri", label: "金" },
  { key: "sat", label: "土" },
];

export default function WeeklyHolidayToggle({ initialState }: WeeklyHolidayToggleProps) {
  const [optimisticState, setOptimisticState] = useOptimistic(initialState);
  const [isPending, startTransition] = useTransition();

  function handleToggle(day: WeekdayKey) {
    const nextValue = !optimisticState[day];
    setOptimisticState((prev) => ({ ...prev, [day]: nextValue }));

    startTransition(async () => {
      try {
        await setWeeklyHoliday(day, nextValue);
      } catch (error) {
        console.error(error);
      }
    });
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">曜日設定</h2>
          <p className="text-sm text-white/70">休日にしたい曜日をトグルで選択すると即時保存されます。</p>
        </div>
        {isPending && <span className="text-xs text-white/60">保存中...</span>}
      </div>
      <div className="mt-4 grid grid-cols-7 gap-2">
        {days.map((day) => {
          const active = optimisticState[day.key];
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => handleToggle(day.key)}
              className={`rounded-2xl border px-3 py-4 text-sm font-semibold transition ${
                active
                  ? "border-emerald-300 bg-emerald-400/20 text-emerald-200"
                  : "border-white/20 bg-slate-950/40 text-white/70 hover:border-white/40"
              }`}
            >
              {day.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
