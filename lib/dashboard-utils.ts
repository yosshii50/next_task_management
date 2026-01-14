import type { TaskStatus } from "@prisma/client";

import type { CalendarDay, CalendarTask, DashboardData, TaskForClient } from "@/types/dashboard";

export const TOKYO_TIMEZONE = "Asia/Tokyo";

export function formatDateForInput(date: Date, timeZone: string = TOKYO_TIMEZONE) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getStartOfWeek(reference: Date) {
  const start = new Date(reference);
  start.setUTCHours(0, 0, 0, 0);
  const weekday = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() - weekday);
  return start;
}

export function getJapanToday() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TOKYO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "0";
  const year = Number(getPart("year"));
  const month = Number(getPart("month"));
  const day = Number(getPart("day"));

  return new Date(Date.UTC(year, month - 1, day));
}

export function sortTasksByDueDate<T extends { dueDate: Date | null; title: string }>(tasks: T[]) {
  return [...tasks].sort((a, b) => {
    const aDue = a.dueDate;
    const bDue = b.dueDate;

    if (!aDue && !bDue) {
      return a.title.localeCompare(b.title, "ja");
    }

    if (!aDue) return -1;
    if (!bDue) return 1;

    if (aDue.getTime() !== bDue.getTime()) {
      return aDue.getTime() - bDue.getTime();
    }

    return a.title.localeCompare(b.title, "ja");
  });
}

export function mapTasksToClient(
  tasks: { id: number; title: string; description: string | null; status: TaskStatus; startDate: Date | null; dueDate: Date | null }[]
): TaskForClient[] {
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    startDate: task.startDate ? formatDateForInput(task.startDate) : null,
    dueDate: task.dueDate ? formatDateForInput(task.dueDate) : null,
  }));
}

export function buildCalendarDays(data: DashboardData, maxWeeks: number, daysPerWeek: number): CalendarDay[] {
  const japanToday = getJapanToday();
  const todayIso = formatDateForInput(japanToday);
  const calendarStart = getStartOfWeek(japanToday);

  const weeklyHolidayMap: Record<number, boolean> = {
    0: data.weeklyHoliday?.sunday ?? false,
    1: data.weeklyHoliday?.monday ?? false,
    2: data.weeklyHoliday?.tuesday ?? false,
    3: data.weeklyHoliday?.wednesday ?? false,
    4: data.weeklyHoliday?.thursday ?? false,
    5: data.weeklyHoliday?.friday ?? false,
    6: data.weeklyHoliday?.saturday ?? false,
  };

  const holidayMap = data.holidays.reduce<Record<string, string>>((acc, holiday) => {
    acc[holiday.date] = holiday.name;
    return acc;
  }, {});

  const tasksByDate = data.tasks.reduce<Record<string, CalendarTask[]>>((acc, task) => {
    const start = task.startDate ? new Date(`${task.startDate}T00:00:00Z`) : null;
    const end = task.dueDate ? new Date(`${task.dueDate}T00:00:00Z`) : null;

    if (!start && !end) return acc;

    const rangeStart = start ?? end!;
    const rangeEnd = end ?? start!;
    const [from, to] = rangeStart.getTime() <= rangeEnd.getTime() ? [rangeStart, rangeEnd] : [rangeEnd, rangeStart];

    const current = new Date(from);
    while (current.getTime() <= to.getTime()) {
      const iso = formatDateForInput(current);
      acc[iso] = acc[iso] ?? [];
      acc[iso].push({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        startDate: task.startDate,
        dueDate: task.dueDate,
      });
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return acc;
  }, {});

  return Array.from({ length: maxWeeks * daysPerWeek }, (_, index) => {
    const date = new Date(calendarStart);
    date.setUTCDate(calendarStart.getUTCDate() + index);
    const iso = formatDateForInput(date);
    const weekday = date.getUTCDay();
    const holidayName = holidayMap[iso];
    const isHoliday = weeklyHolidayMap[weekday] || Boolean(holidayName);
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();

    return {
      date: iso,
      label: `${month}/${day}`,
      isToday: iso === todayIso,
      isHoliday,
      holidayName: holidayName ?? undefined,
      tasks: tasksByDate[iso] ?? [],
    };
  });
}
