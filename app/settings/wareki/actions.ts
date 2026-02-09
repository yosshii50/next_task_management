"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  const idValue = session?.user?.id;
  const userId = typeof idValue === "string" ? Number(idValue) : idValue;

  if (!userId) {
    throw new Error("認証が必要です。");
  }

  return userId;
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

export async function createWarekiSetting(formData: FormData) {
  const userId = await requireUserId();
  const eraName = formData.get("eraName")?.toString().trim();
  const startDate = parseDate(formData.get("startDate")?.toString() ?? null);
  const endDateInput = formData.get("endDate")?.toString().trim();
  const endDate = endDateInput ? parseDate(endDateInput) : null;

  if (!eraName) {
    throw new Error("元号名を入力してください。");
  }
  if (endDate && endDate < startDate) {
    throw new Error("終了日は開始日以降に設定してください。");
  }

  await prisma.warekiSetting.create({
    data: {
      userId,
      eraName,
      startDate,
      endDate,
    },
  });

  revalidatePath("/settings/wareki");
}

export async function updateWarekiSetting(formData: FormData) {
  const userId = await requireUserId();
  const settingId = Number(formData.get("settingId"));
  const eraName = formData.get("eraName")?.toString().trim();
  const startDate = parseDate(formData.get("startDate")?.toString() ?? null);
  const endDateInput = formData.get("endDate")?.toString().trim();
  const endDate = endDateInput ? parseDate(endDateInput) : null;

  if (!settingId) {
    throw new Error("更新対象が見つかりません。");
  }
  if (!eraName) {
    throw new Error("元号名を入力してください。");
  }
  if (endDate && endDate < startDate) {
    throw new Error("終了日は開始日以降に設定してください。");
  }

  await prisma.warekiSetting.updateMany({
    where: { id: settingId, userId },
    data: { eraName, startDate, endDate },
  });

  revalidatePath("/settings/wareki");
}

export async function deleteWarekiSetting(formData: FormData) {
  const userId = await requireUserId();
  const settingId = Number(formData.get("settingId"));

  if (!settingId) {
    throw new Error("削除対象が見つかりません。");
  }

  await prisma.warekiSetting.deleteMany({
    where: { id: settingId, userId },
  });

  revalidatePath("/settings/wareki");
}
