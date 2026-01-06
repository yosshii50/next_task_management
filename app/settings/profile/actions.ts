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

export async function updateProfile(formData: FormData) {
  const userId = await requireUserId();
  const name = formData.get("name")?.toString().trim();

  if (!name) {
    throw new Error("名前を入力してください。");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name },
  });

  revalidatePath("/settings/profile");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
