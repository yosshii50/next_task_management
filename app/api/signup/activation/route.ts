import { NextResponse } from "next/server";

import { activateUser, validateActivationToken } from "@/lib/activation";
import prisma from "@/lib/prisma";
import { sendChildActivationNotice } from "@/lib/mailer";

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getBaseUrl() {
  const base = process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3001";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = normalize(body.token);
  const userCode = normalize(body.userCode);

  const validation = await validateActivationToken(userCode, token);

  if (validation.status !== "valid") {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  return NextResponse.json({
    user: {
      name: validation.user.name,
      email: validation.user.email,
    },
  });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = normalize(body.token);
  const userCode = normalize(body.userCode);

  const result = await activateUser(userCode, token);

  if (result.status !== "activated") {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  const child = await prisma.user.findUnique({
    where: { id: result.user.id },
    include: { parent: { select: { name: true } } },
  });

  if (child?.email) {
    const loginUrl = getBaseUrl();
    try {
      await sendChildActivationNotice({
        to: child.email,
        childName: child.name,
        parentName: child.parent?.name,
        loginUrl,
      });
    } catch {
      // 通知メール送信失敗時も有効化結果は維持する
    }
  }

  return NextResponse.json({ success: true });
}
