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

export async function deleteChildren(formData: FormData) {
  const userId = await requireUserId();
  const rawIds = formData.getAll("childIds").map((v) => Number(v));
  const childIds = rawIds.filter((id) => Number.isInteger(id) && id > 0);

  if (childIds.length === 0) {
    return;
  }

  await prisma.user.deleteMany({
    where: {
      id: { in: childIds },
      parentId: userId,
    },
  });

  revalidatePath("/settings/referrers");
}

export async function updateChildMemo(formData: FormData) {
  const userId = await requireUserId();
  const childId = Number(formData.get("childId"));
  const memoValue = formData.get("memo");
  const memo = typeof memoValue === "string" ? memoValue.trim() : "";

  if (!Number.isInteger(childId) || childId <= 0) {
    throw new Error("子アカウントIDが不正です。");
  }

  const sanitizedMemo = memo.length > 1000 ? memo.slice(0, 1000) : memo;

  const result = await prisma.user.updateMany({
    where: { id: childId, parentId: userId },
    data: { memo: sanitizedMemo === "" ? null : sanitizedMemo },
  });

  if (result.count === 0) {
    throw new Error("対象の子アカウントが見つかりません。");
  }

  revalidatePath("/settings/referrers");
}
