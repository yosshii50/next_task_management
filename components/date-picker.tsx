"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DatePickerProps = {
  id: string;
  name: string;
  label: string;
  defaultValue?: string | null;
  placeholder?: string;
};

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function toDate(value?: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDate(value: Date | null) {
  if (!value) return "";
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DatePicker({ id, name, label, defaultValue, placeholder = "未設定" }: DatePickerProps) {
  const initialDate = useMemo(() => toDate(defaultValue), [defaultValue]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => initialDate ?? new Date());
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const todayString = useMemo(() => formatDate(new Date()), []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!popoverRef.current) return;
      if (popoverRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    }

    if (!isOpen) return;
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const monthDays = useMemo(() => {
    const firstOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const calendarStart = new Date(firstOfMonth);
    calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());
    const startTime = calendarStart.getTime();
    return Array.from({ length: 42 }, (_, index) => new Date(startTime + index * 24 * 60 * 60 * 1000));
  }, [currentMonth]);

  const monthLabel = `${currentMonth.getFullYear()}年 ${currentMonth.getMonth() + 1}月`;
  const selectedString = formatDate(selectedDate);

  function handleSelect(date: Date) {
    setSelectedDate(date);
    setIsOpen(false);
  }

  function goPrevMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goNextMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm text-white/80" htmlFor={id}>
        {label}
      </label>
      <div className="relative" ref={popoverRef}>
        <button
          type="button"
          id={id}
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-left text-sm text-white transition focus:border-emerald-300 focus:outline-none"
        >
          <span className={selectedDate ? "text-white" : "text-white/40"}>
            {selectedDate ? selectedString : placeholder}
          </span>
          <svg
            className="h-4 w-4 text-white/60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M8 3v4m8-4v4M4 10h16" />
          </svg>
        </button>
        <input type="hidden" name={name} value={selectedString} />

        {isOpen && (
          <div className="absolute z-20 mt-2 w-full min-w-[260px] rounded-2xl border border-white/10 bg-slate-900/95 p-3 shadow-2xl backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={goPrevMonth}
                className="rounded-full border border-white/10 px-2 py-1 text-sm text-white/80 transition hover:border-white/30"
              >
                ‹
              </button>
              <div className="text-sm font-semibold text-white">{monthLabel}</div>
              <button
                type="button"
                onClick={goNextMonth}
                className="rounded-full border border-white/10 px-2 py-1 text-sm text-white/80 transition hover:border-white/30"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-white/60">
              {DAY_LABELS.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1 text-sm">
              {monthDays.map((date) => {
                const dateString = formatDate(date);
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isSelected = dateString === selectedString;
                const isToday = dateString === todayString;

                const baseClasses =
                  "flex h-9 items-center justify-center rounded-xl border border-transparent text-sm transition";
                const stateClasses = isSelected
                  ? "bg-emerald-400 text-slate-950 font-semibold"
                  : isToday
                    ? "border-emerald-300/70 text-white"
                    : isCurrentMonth
                      ? "text-white hover:border-white/20"
                      : "text-white/40 hover:border-white/10";

                return (
                  <button
                    key={dateString}
                    type="button"
                    onClick={() => handleSelect(date)}
                    className={`${baseClasses} ${stateClasses}`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
