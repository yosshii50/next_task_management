import { TaskStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { createTask, deleteTask, updateTask } from "@/app/dashboard/actions";
import SignOutButton from "@/components/sign-out-button";
import TaskCalendar from "@/components/task-calendar";
import TaskList from "@/components/task-list";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const statusOptions = [
  { value: TaskStatus.TODO, label: "未着手" },
  { value: TaskStatus.IN_PROGRESS, label: "進行中" },
  { value: TaskStatus.DONE, label: "完了" },
];

const formatDateForInput = (date: Date) => {
  const tzOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - tzOffset * 60000);
  return localDate.toISOString().slice(0, 10);
};

const getStartOfWeek = (reference: Date) => {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  const weekday = start.getDay();
  start.setDate(start.getDate() - weekday);
  return start;
};

const WEEKS_TO_DISPLAY = 4;
const DAYS_PER_WEEK = 7;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = Number(session.user.id);

  if (!userId) {
    redirect("/");
  }

  const displayName = session.user.name ?? session.user.email ?? "メンバー";

  const [tasks, weeklyHoliday, holidays] = await Promise.all([
    prisma.task.findMany({
      where: { userId },
    }),
    prisma.weeklyHoliday.findUnique({ where: { userId } }),
    prisma.holiday.findMany({
      where: { userId },
    }),
  ]);

  const sortedTasks = tasks.sort((a, b) => {
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

  const weeklyHolidayMap = {
    0: weeklyHoliday?.sunday ?? false,
    1: weeklyHoliday?.monday ?? false,
    2: weeklyHoliday?.tuesday ?? false,
    3: weeklyHoliday?.wednesday ?? false,
    4: weeklyHoliday?.thursday ?? false,
    5: weeklyHoliday?.friday ?? false,
    6: weeklyHoliday?.saturday ?? false,
  } as Record<number, boolean>;

  const clientTasks = sortedTasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate ? formatDateForInput(task.dueDate) : null,
  }));

  const tasksByDate = clientTasks.reduce<Record<string, { id: number; title: string; status: TaskStatus }[]>>((acc, task) => {
    if (!task.dueDate) return acc;
    acc[task.dueDate] = acc[task.dueDate] ?? [];
    acc[task.dueDate].push({ id: task.id, title: task.title, status: task.status });
    return acc;
  }, {});

  const todayIso = formatDateForInput(new Date());
  const calendarStart = getStartOfWeek(new Date());
  const holidayMap = holidays.reduce<Record<string, string>>((acc, holiday) => {
    const iso = formatDateForInput(holiday.date);
    acc[iso] = holiday.name;
    return acc;
  }, {});

  const calendarDays = Array.from({ length: WEEKS_TO_DISPLAY * DAYS_PER_WEEK }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    const iso = formatDateForInput(date);
    const weekday = date.getDay();
    const holidayName = holidayMap[iso];
    const isHoliday = weeklyHolidayMap[weekday] || Boolean(holidayName);
    return {
      date: iso,
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      isToday: iso === todayIso,
      isHoliday,
      holidayName: holidayName ?? undefined,
      tasks: tasksByDate[iso] ?? [],
    };
  });

  const calendarWeeks = Array.from({ length: WEEKS_TO_DISPLAY }, (_, weekIndex) =>
    calendarDays.slice(weekIndex * DAYS_PER_WEEK, weekIndex * DAYS_PER_WEEK + DAYS_PER_WEEK)
  );

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Welcome back</p>
          <h1 className="mt-3 text-4xl font-semibold">
            こんにちは、<span className="text-emerald-300">{displayName}</span> さん
          </h1>
          <p className="mt-2 text-white/70">
            FlowBase へのログインが完了しました。チームの最新プロジェクトや自動化フローをここから管理できます。
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-white/60">別のアカウントでログインしたい場合はサインアウトしてください。</p>
          <div className="flex gap-3">
            <a
              href="/settings"
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
            >
              設定
            </a>
            <SignOutButton />
          </div>
        </div>

        <TaskCalendar weeks={calendarWeeks} />

        <TaskList
          tasks={clientTasks}
          statusOptions={statusOptions}
          onCreate={createTask}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      </div>
    </div>
  );
}
