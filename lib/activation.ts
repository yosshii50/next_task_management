import crypto from "crypto";

import prisma from "@/lib/prisma";

type ActivationValidationResult =
  | { status: "invalid"; reason: string }
  | {
      status: "valid";
      user: {
        id: number;
        userId: string;
        name: string | null;
        email: string | null;
        isActive: boolean;
      };
    };

const TOKEN_BYTES = 32;
const TOKEN_TTL_HOURS = 48;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function issueActivationToken(userId: number) {
  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.activationToken.deleteMany({ where: { userId } });

  await prisma.activationToken.create({
    data: {
      userId,
      tokenHash,
      expires: expiresAt,
    },
  });

  return { token: rawToken, expiresAt };
}

export async function validateActivationToken(userCode: string, rawToken: string): Promise<ActivationValidationResult> {
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

  if (user.isActive) {
    return { status: "invalid", reason: "すでに有効化済みのアカウントです。" };
  }

  const tokenHash = hashToken(rawToken);
  const activationToken = await prisma.activationToken.findUnique({
    where: { tokenHash },
    select: { userId: true, expires: true },
  });

  if (!activationToken || activationToken.userId !== user.id) {
    return { status: "invalid", reason: "リンクが無効です。" };
  }

  if (activationToken.expires <= new Date()) {
    return { status: "invalid", reason: "リンクの有効期限が切れています。" };
  }

  return { status: "valid", user };
}

export async function activateUser(userCode: string, rawToken: string) {
  const validation = await validateActivationToken(userCode, rawToken);

  if (validation.status !== "valid") {
    return validation;
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.activationToken.deleteMany({ where: { userId: validation.user.id } }),
    prisma.user.update({
      where: { id: validation.user.id },
      data: {
        isActive: true,
        emailVerified: validation.user.email ? now : null,
      },
    }),
  ]);

  return { status: "activated", user: validation.user };
}
