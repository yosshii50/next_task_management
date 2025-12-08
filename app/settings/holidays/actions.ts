"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const dayFieldMap = {
  sun: "sunday",
  mon: "monday",
  tue: "tuesday",
  wed: "wednesday",
  thu: "thursday",
  fri: "friday",
  sat: "saturday",
} as const;

export type WeekdayKey = keyof typeof dayFieldMap;

async function requireUserId() {
  const session = await getServerSession(authOptions);
  const idValue = session?.user?.id;
  const userId = typeof idValue === "string" ? Number(idValue) : idValue;

  if (!userId) {
    throw new Error("認証が必要です。");
  }

  return userId;
}

export async function setWeeklyHoliday(day: WeekdayKey, enabled: boolean) {
  const userId = await requireUserId();
  const field = dayFieldMap[day];

  await prisma.weeklyHoliday.upsert({
    where: { userId },
    create: {
      userId,
      [field]: enabled,
    },
    update: {
      [field]: enabled,
    },
  });

  revalidatePath("/settings/holidays");
}
