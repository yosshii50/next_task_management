import { NextResponse } from "next/server";

import crypto from "crypto";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { issueActivationToken } from "@/lib/activation";
import { sendChildSignupNotice, sendParentApprovalEmail } from "@/lib/mailer";

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

function getBaseUrl() {
  const base = process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3001";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function generateTempPassword() {
  const raw = crypto.randomBytes(16).toString("base64url");
  return raw.slice(0, 16);
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
    select: { id: true, email: true, name: true },
  });

  if (!referrer) {
    return NextResponse.json({ error: "紹介者IDが見つかりません。" }, { status: 404 });
  }

  if (!referrer.email) {
    return NextResponse.json({ error: "親アカウントにメールアドレスが設定されていないため、承認メールを送信できません。" }, { status: 422 });
  }

  const userCount = await prisma.user.count();

  if (userCount > 100) {
    return NextResponse.json(
      { error: "現在一時的に新規アカウントの受付を中止しています。" },
      { status: 403 },
    );
  }

  const tempPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const user = await prisma.user.create({
    data: {
      name: name || null,
      email,
      parentId: referrer.id,
      isActive: false,
      hashedPassword,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  try {
    const { token, expiresAt } = await issueActivationToken(user.id);
    const approvalUrl = new URL("/signup/confirm", getBaseUrl());
    approvalUrl.searchParams.set("token", token);
    approvalUrl.searchParams.set("user", user.userId);
    const loginUrl = getBaseUrl();

    await sendParentApprovalEmail({
      to: referrer.email,
      childEmail: email,
      childName: name,
      parentName: referrer.name,
      approvalUrl: approvalUrl.toString(),
      expiresAt,
    });

    await sendChildSignupNotice({
      to: email,
      childName: name,
      parentName: referrer.name,
      loginUrl,
      tempPassword,
    });

    return NextResponse.json({ success: true, userCode: user.userId });
  } catch {
    return NextResponse.json(
      { error: "確認メールの送信に失敗しました。時間をおいて再度お試しください。" },
      { status: 500 },
    );
  }
}
