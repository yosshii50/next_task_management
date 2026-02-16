import { formatDateForInput, mapTasksToClient, sortTasksByDueDate } from "@/lib/dashboard-utils";
import prisma from "@/lib/prisma";
import type { DashboardData } from "@/types/dashboard";

export async function getDashboardData(userId: number, includeAdminSummary = false): Promise<DashboardData> {
  const [tasks, weeklyHoliday, holidays, adminSummary] = await Promise.all([
    prisma.task.findMany({
      where: { userId },
      include: {
        childRelations: {
          select: { childId: true },
        },
        parentRelations: {
          select: { parentId: true },
        },
      },
    }),
    prisma.weeklyHoliday.findUnique({ where: { userId } }),
    prisma.holiday.findMany({
      where: { userId },
    }),
    includeAdminSummary
      ? prisma.$transaction([
          prisma.user.count(),
          prisma.task.count(),
        ])
      : Promise.resolve(null),
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
    adminSummary:
      adminSummary && Array.isArray(adminSummary)
        ? {
            totalAccounts: adminSummary[0],
            totalTasks: adminSummary[1],
          }
        : undefined,
  };
}
