import type { TaskStatus } from "@prisma/client";

export type TaskForClient = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: string;
  startDate: string | null;
  dueDate: string | null;
  childTaskIds: number[];
  parentTaskIds: number[];
};

export type CalendarTask = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: string;
  startDate: string | null;
  dueDate: string | null;
};

export type CalendarDay = {
  date: string;
  label: string;
  isToday: boolean;
  isHoliday: boolean;
  holidayName?: string;
  tasks: CalendarTask[];
};

export type WeeklyHolidaySettings = {
  sunday: boolean;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
};

export type HolidayForClient = {
  date: string;
  name: string;
};

export type AdminSummary = {
  totalAccounts: number;
  totalTasks: number;
};

export type DashboardData = {
  tasks: TaskForClient[];
  weeklyHoliday: WeeklyHolidaySettings | null;
  holidays: HolidayForClient[];
  adminSummary?: AdminSummary;
};
