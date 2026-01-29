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

function parseChildTaskIds(formData: FormData, excludeId?: number) {
  const values = formData.getAll("childTaskIds");
  const ids = values
    .map((value) => {
      if (typeof value !== "string") return null;
      const parsed = Number(value);
      return Number.isInteger(parsed) ? parsed : null;
    })
    .filter((id): id is number => id !== null && id > 0);

  const uniqueIds = Array.from(new Set(ids));
  return typeof excludeId === "number" ? uniqueIds.filter((id) => id !== excludeId) : uniqueIds;
}

export async function createTask(formData: FormData) {
  const userId = await requireUserId();

  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const statusValue = formData.get("status")?.toString() ?? null;
  const startDateValue = formData.get("startDate")?.toString() ?? null;
  const dueDateValue = formData.get("dueDate")?.toString() ?? null;
  const childTaskIds = parseChildTaskIds(formData);

  if (!title) {
    throw new Error("タイトルは必須です。");
  }

  const validChildIds =
    childTaskIds.length > 0
      ? await prisma.task.findMany({
          where: {
            id: { in: childTaskIds },
            userId,
          },
          select: { id: true },
        })
      : [];

  if (validChildIds.length !== childTaskIds.length) {
    throw new Error("子タスクとして指定したタスクが見つかりません。");
  }

  await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        title,
        description,
        status: parseStatus(statusValue),
        startDate: parseDate(startDateValue),
        dueDate: parseDate(dueDateValue),
        userId,
      },
    });

    if (validChildIds.length > 0) {
      await tx.taskRelation.createMany({
        data: validChildIds.map((child) => ({
          parentId: created.id,
          childId: child.id,
        })),
      });
    }
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
  const childTaskIds = parseChildTaskIds(formData, taskId);

  if (!taskId || !title) {
    throw new Error("更新対象のタスク情報が不足しています。");
  }

  await prisma.$transaction(async (tx) => {
    const targetTask = await tx.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!targetTask) {
      throw new Error("更新対象のタスクが見つかりません。");
    }

    const validChildIds =
      childTaskIds.length > 0
        ? await tx.task.findMany({
            where: {
              id: { in: childTaskIds },
              userId,
            },
            select: { id: true },
          })
        : [];

    if (validChildIds.length !== childTaskIds.length) {
      throw new Error("子タスクとして指定したタスクが見つかりません。");
    }

    await tx.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        status: parseStatus(statusValue),
        startDate: parseDate(startDateValue),
        dueDate: parseDate(dueDateValue),
      },
    });

    await tx.taskRelation.deleteMany({
      where: {
        parentId: taskId,
      },
    });

    if (validChildIds.length > 0) {
      await tx.taskRelation.createMany({
        data: validChildIds.map((child) => ({
          parentId: taskId,
          childId: child.id,
        })),
      });
    }
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
