"use server";

import { TaskStatus } from "@prisma/client";
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

function parseStatus(value: string | null): TaskStatus {
  if (value && Object.values(TaskStatus).includes(value as TaskStatus)) {
    return value as TaskStatus;
  }

  return TaskStatus.TODO;
}

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function createTask(formData: FormData) {
  const userId = await requireUserId();

  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const statusValue = formData.get("status")?.toString() ?? null;
  const startDateValue = formData.get("startDate")?.toString() ?? null;
  const dueDateValue = formData.get("dueDate")?.toString() ?? null;

  if (!title) {
    throw new Error("タイトルは必須です。");
  }

  await prisma.task.create({
    data: {
      title,
      description,
      status: parseStatus(statusValue),
      startDate: parseDate(startDateValue),
      dueDate: parseDate(dueDateValue),
      userId,
    },
  });

  revalidatePath("/dashboard");
}

export async function updateTask(formData: FormData) {
  const userId = await requireUserId();

  const taskId = Number(formData.get("taskId"));
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const statusValue = formData.get("status")?.toString() ?? null;
  const startDateValue = formData.get("startDate")?.toString() ?? null;
  const dueDateValue = formData.get("dueDate")?.toString() ?? null;

  if (!taskId || !title) {
    throw new Error("更新対象のタスク情報が不足しています。");
  }

  await prisma.task.updateMany({
    where: {
      id: taskId,
      userId,
    },
    data: {
      title,
      description,
      status: parseStatus(statusValue),
      startDate: parseDate(startDateValue),
      dueDate: parseDate(dueDateValue),
    },
  });

  revalidatePath("/dashboard");
}

export async function deleteTask(formData: FormData) {
  const userId = await requireUserId();
  const taskId = Number(formData.get("taskId"));

  if (!taskId) {
    throw new Error("削除対象のタスクが見つかりません。");
  }

  await prisma.task.deleteMany({
    where: {
      id: taskId,
      userId,
    },
  });

  revalidatePath("/dashboard");
}
