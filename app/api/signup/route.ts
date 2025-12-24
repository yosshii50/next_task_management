import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function sanitizeText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = sanitizeText(body.name);
  const email = normalizeEmail(body.email);
  const referrerCode = sanitizeText(body.referrer).toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "メールアドレスは必須です。" }, { status: 400 });
  }

  if (!referrerCode) {
    return NextResponse.json({ error: "紹介者IDを入力してください。" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json({ error: "このメールアドレスは既に登録されています。" }, { status: 409 });
  }

  const referrer = await prisma.user.findUnique({
    where: { userId: referrerCode },
    select: { id: true },
  });

  if (!referrer) {
    return NextResponse.json({ error: "紹介者IDが見つかりません。" }, { status: 404 });
  }

  const user = await prisma.user.create({
    data: {
      name: name || null,
      email,
      parentId: referrer.id,
      isActive: false,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  return NextResponse.json({ success: true, userCode: user.userId });
}
