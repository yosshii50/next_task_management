import crypto from "crypto";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";

type ResetUser = {
  id: number;
  userId: string;
  name: string | null;
  email: string | null;
  isActive: boolean;
};

type ValidationResult =
  | { status: "invalid"; reason: string }
  | {
      status: "valid";
      user: ResetUser;
    };

type ResetResult =
  | { status: "invalid"; reason: string }
  | { status: "reset"; user: ResetUser };

const TOKEN_BYTES = 32;
const TOKEN_TTL_HOURS = 1;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function issuePasswordResetToken(userId: number) {
  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({ where: { userId } });

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expires: expiresAt,
    },
  });

  return { token: rawToken, expiresAt };
}

export async function validatePasswordResetToken(userCode: string, rawToken: string): Promise<ValidationResult> {
  if (!userCode || !rawToken) {
    return { status: "invalid", reason: "リンク情報が不足しています。" };
  }

  const user = await prisma.user.findUnique({
    where: { userId: userCode },
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      isActive: true,
    },
  });

  if (!user) {
    return { status: "invalid", reason: "対象のユーザーが見つかりません。" };
  }

  if (!user.isActive) {
    return { status: "invalid", reason: "このアカウントは無効化されています。" };
  }

  const tokenHash = hashToken(rawToken);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { userId: true, expires: true },
  });

  if (!resetToken || resetToken.userId !== user.id) {
    return { status: "invalid", reason: "リンクが無効です。" };
  }

  if (resetToken.expires <= new Date()) {
    return { status: "invalid", reason: "リンクの有効期限が切れています。" };
  }

  return { status: "valid", user };
}

export async function resetPassword(userCode: string, rawToken: string, newPassword: string): Promise<ResetResult> {
  const validation = await validatePasswordResetToken(userCode, rawToken);

  if (validation.status !== "valid") {
    return { status: "invalid", reason: validation.reason };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: validation.user.id } }),
    prisma.user.update({
      where: { id: validation.user.id },
      data: { hashedPassword },
    }),
  ]);

  return { status: "reset", user: validation.user };
}
