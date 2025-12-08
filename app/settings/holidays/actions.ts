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

function parseDate(input: string | null) {
  if (!input) {
    throw new Error("日付を入力してください。");
  }

  const date = new Date(`${input}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("日付の形式が正しくありません。");
  }

  return date;
}

export async function createHoliday(formData: FormData) {
  const userId = await requireUserId();
  const date = parseDate(formData.get("date")?.toString() ?? null);
  const name = formData.get("name")?.toString().trim();

  if (!name) {
    throw new Error("名称を入力してください。");
  }

  await prisma.holiday.create({
    data: {
      userId,
      date,
      name,
    },
  });

  revalidatePath("/settings/holidays");
}

export async function updateHoliday(formData: FormData) {
  const userId = await requireUserId();
  const holidayId = Number(formData.get("holidayId"));
  const date = parseDate(formData.get("date")?.toString() ?? null);
  const name = formData.get("name")?.toString().trim();

  if (!holidayId) {
    throw new Error("更新対象が見つかりません。");
  }

  if (!name) {
    throw new Error("名称を入力してください。");
  }

  await prisma.holiday.updateMany({
    where: { id: holidayId, userId },
    data: { date, name },
  });

  revalidatePath("/settings/holidays");
}

export async function deleteHoliday(formData: FormData) {
  const userId = await requireUserId();
  const holidayId = Number(formData.get("holidayId"));

  if (!holidayId) {
    throw new Error("削除対象が見つかりません。");
  }

  await prisma.holiday.deleteMany({
    where: { id: holidayId, userId },
  });

  revalidatePath("/settings/holidays");
}
