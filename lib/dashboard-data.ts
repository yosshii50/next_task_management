import { formatDateForInput, mapTasksToClient, sortTasksByDueDate } from "@/lib/dashboard-utils";
import prisma from "@/lib/prisma";
import type { DashboardData } from "@/types/dashboard";

export async function getDashboardData(userId: number): Promise<DashboardData> {
  const [tasks, weeklyHoliday, holidays] = await Promise.all([
    prisma.task.findMany({
      where: { userId },
    }),
    prisma.weeklyHoliday.findUnique({ where: { userId } }),
    prisma.holiday.findMany({
      where: { userId },
    }),
  ]);

  const sortedTasks = sortTasksByDueDate(tasks);

  return {
    tasks: mapTasksToClient(sortedTasks),
    weeklyHoliday: weeklyHoliday
      ? {
          sunday: weeklyHoliday.sunday,
          monday: weeklyHoliday.monday,
          tuesday: weeklyHoliday.tuesday,
          wednesday: weeklyHoliday.wednesday,
          thursday: weeklyHoliday.thursday,
          friday: weeklyHoliday.friday,
          saturday: weeklyHoliday.saturday,
        }
      : null,
    holidays: holidays.map((holiday) => ({
      date: formatDateForInput(holiday.date),
      name: holiday.name,
    })),
  };
}
