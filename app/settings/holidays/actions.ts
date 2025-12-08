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

function getNthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const firstWeekday = first.getUTCDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  return new Date(Date.UTC(year, month, day));
}

function getVernalEquinoxDay(year: number) {
  return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

function getAutumnalEquinoxDay(year: number) {
  return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

type HolidayDefinition = { month: number; day?: number; name: string; generator?: (year: number) => Date };

function buildJapaneseHolidays(year: number): { date: Date; name: string }[] {
  const fixedDates: HolidayDefinition[] = [
    { month: 1, day: 1, name: "元日" },
    { month: 2, day: 11, name: "建国記念の日" },
    { month: 2, day: 23, name: "天皇誕生日" },
    { month: 4, day: 29, name: "昭和の日" },
    { month: 5, day: 3, name: "憲法記念日" },
    { month: 5, day: 4, name: "みどりの日" },
    { month: 5, day: 5, name: "こどもの日" },
    { month: 8, day: 11, name: "山の日" },
    { month: 11, day: 3, name: "文化の日" },
    { month: 11, day: 23, name: "勤労感謝の日" },
  ];

  const dynamicDates: HolidayDefinition[] = [
    {
      month: 1,
      name: "成人の日",
      generator: (y) => getNthWeekdayOfMonth(y, 0, 1, 2),
    },
    {
      month: 7,
      name: "海の日",
      generator: (y) => getNthWeekdayOfMonth(y, 6, 1, 3),
    },
    {
      month: 9,
      name: "敬老の日",
      generator: (y) => getNthWeekdayOfMonth(y, 8, 1, 3),
    },
    {
      month: 10,
      name: "スポーツの日",
      generator: (y) => getNthWeekdayOfMonth(y, 9, 1, 2),
    },
  ];

  const equinoxes: HolidayDefinition[] = [
    {
      month: 3,
      name: "春分の日",
      generator: (y) => new Date(Date.UTC(y, 2, getVernalEquinoxDay(y))),
    },
    {
      month: 9,
      name: "秋分の日",
      generator: (y) => new Date(Date.UTC(y, 8, getAutumnalEquinoxDay(y))),
    },
  ];

  const holidays: { date: Date; name: string }[] = [];

  fixedDates.forEach((def) => {
    holidays.push({ date: new Date(Date.UTC(year, def.month - 1, def.day!)), name: def.name });
  });

  dynamicDates.forEach((def) => {
    if (def.generator) {
      holidays.push({ date: def.generator(year), name: def.name });
    }
  });

  equinoxes.forEach((def) => {
    if (def.generator) {
      holidays.push({ date: def.generator(year), name: def.name });
    }
  });

  return holidays;
}

export async function generateYearlyHolidays(year: number) {
  if (!year || year < 1948) {
    throw new Error("1948年以降の年を入力してください。");
  }

  const userId = await requireUserId();
  const holidays = buildJapaneseHolidays(year);

  await prisma.$transaction(
    holidays.map((holiday) =>
      prisma.holiday.upsert({
        where: {
          userId_date: {
            userId,
            date: holiday.date,
          },
        },
        update: { name: holiday.name },
        create: {
          userId,
          date: holiday.date,
          name: holiday.name,
        },
      })
    )
  );

  revalidatePath("/settings/holidays");
}
