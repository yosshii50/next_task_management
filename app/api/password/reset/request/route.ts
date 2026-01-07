import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { issuePasswordResetToken } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/mailer";

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function getBaseUrl() {
  const base = process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3001";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);

  if (!email) {
    return NextResponse.json({ error: "メールアドレスを入力してください。" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, userId: true, email: true, name: true, isActive: true },
  });

  if (!user || !user.isActive || !user.email) {
    // ユーザーの有無を伏せるため常に成功を返す
    return NextResponse.json({ success: true });
  }

  try {
    const { token, expiresAt } = await issuePasswordResetToken(user.id);
    const resetUrl = new URL("/reset", getBaseUrl());
    resetUrl.searchParams.set("token", token);
    resetUrl.searchParams.set("user", user.userId);

    await sendPasswordResetEmail({
      to: user.email,
      userName: user.name,
      resetUrl: resetUrl.toString(),
      expiresAt,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "メールの送信に失敗しました。時間をおいて再試行してください。" },
      { status: 500 },
    );
  }
}
