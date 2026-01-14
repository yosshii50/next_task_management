"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";

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

function normalizePassword(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isStrongEnough(password: string) {
  return password.length >= 8;
}

export async function changePassword(formData: FormData) {
  const userId = await requireUserId();
  const currentPassword = normalizePassword(formData.get("currentPassword"));
  const newPassword = normalizePassword(formData.get("newPassword"));
  const confirmation = normalizePassword(formData.get("confirmation"));

  if (!currentPassword || !newPassword) {
    throw new Error("現在のパスワードと新しいパスワードを入力してください。");
  }

  if (newPassword !== confirmation) {
    throw new Error("新しいパスワードが一致しません。");
  }

  if (!isStrongEnough(newPassword)) {
    throw new Error("新しいパスワードは8文字以上で入力してください。");
  }

  if (currentPassword === newPassword) {
    throw new Error("現在のパスワードとは異なるものを設定してください。");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hashedPassword: true, isActive: true },
  });

  if (!user) {
    throw new Error("ユーザー情報を取得できませんでした。");
  }

  if (!user.isActive) {
    throw new Error("このアカウントは無効化されています。");
  }

  if (!user.hashedPassword) {
    throw new Error("このアカウントではパスワード変更を行えません。");
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.hashedPassword);

  if (!isCurrentValid) {
    throw new Error("現在のパスワードが正しくありません。");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: { hashedPassword },
    }),
  ]);

  revalidatePath("/settings/security");
  revalidatePath("/settings");

  return { success: true };
}

export async function deleteAccount(formData: FormData) {
  const userId = await requireUserId();
  const password = normalizePassword(formData.get("password"));
  const confirmation = normalizePassword(formData.get("confirmation"));

  if (!password) {
    throw new Error("パスワードを入力してください。");
  }

  if (confirmation !== "削除します") {
    throw new Error("確認欄に「削除します」と入力してください。");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hashedPassword: true, isActive: true },
  });

  if (!user) {
    throw new Error("ユーザー情報を取得できませんでした。");
  }

  if (!user.isActive) {
    throw new Error("このアカウントは無効化されています。");
  }

  if (!user.hashedPassword) {
    throw new Error("このアカウントではパスワードによる確認が行えません。サポートへお問い合わせください。");
  }

  const isValid = await bcrypt.compare(password, user.hashedPassword);

  if (!isValid) {
    throw new Error("パスワードが正しくありません。");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/settings/security");
  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { success: true };
}
