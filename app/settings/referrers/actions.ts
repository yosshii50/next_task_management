"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import { authOptions } from "@/lib/auth";
import { sendChildActivationNotice, sendChildDirectInvite, sendChildLockNotice } from "@/lib/mailer";
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

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function sanitizeName(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 100);
}

function getBaseUrl() {
  const base = process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3001";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function generateTempPassword() {
  const raw = crypto.randomBytes(16).toString("base64url");
  return raw.slice(0, 16);
}

export async function addChildAccount(formData: FormData) {
  const parentId = await requireUserId();
  const email = normalizeEmail(formData.get("email"));
  const name = sanitizeName(formData.get("name"));

  if (!email) {
    throw new Error("メールアドレスを入力してください。");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("このメールアドレスは既に登録されています。");
  }

  const tempPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      parentId,
      isActive: true,
      hashedPassword,
    },
    select: { id: true },
  });

  const parent = await prisma.user.findUnique({
    where: { id: parentId },
    select: { name: true },
  });

  const loginUrl = getBaseUrl();

  await sendChildDirectInvite({
    to: email,
    childName: name,
    parentName: parent?.name,
    loginUrl,
    tempPassword,
  });

  revalidatePath("/settings/referrers");

  return { userId: user.id };
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

export async function updateChildrenStatus(formData: FormData) {
  const userId = await requireUserId();
  const rawIds = formData.getAll("childIds").map((v) => Number(v));
  const childIds = rawIds.filter((id) => Number.isInteger(id) && id > 0);
  const targetStatus = formData.get("targetStatus");
  const isActive =
    targetStatus === "active" ? true : targetStatus === "inactive" ? false : null;
  const sendActivationMail =
    isActive === true && formData.get("sendActivationMail") === "true";
  const sendDeactivationMail =
    isActive === false && formData.get("sendDeactivationMail") === "true";

  if (childIds.length === 0 || isActive === null) {
    return;
  }

  const children = await prisma.user.findMany({
    where: {
      id: { in: childIds },
      parentId: userId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
    },
  });

  if (children.length === 0) {
    return;
  }

  await prisma.user.updateMany({
    where: {
      id: { in: children.map((child) => child.id) },
      parentId: userId,
    },
    data: { isActive },
  });

  if (sendActivationMail) {
    const parent = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    const loginUrl = getBaseUrl();
    const targets = children.filter((child) => !child.isActive && child.email);

    if (targets.length > 0) {
      try {
        await Promise.all(
          targets.map((child) =>
            sendChildActivationNotice({
              to: child.email as string,
              childName: child.name,
              parentName: parent?.name,
              loginUrl,
            })
          )
        );
      } catch (error) {
        console.error(error);
      }
    }
  }

  if (sendDeactivationMail) {
    const parent = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    const loginUrl = getBaseUrl();
    const targets = children.filter((child) => child.isActive && child.email);

    if (targets.length > 0) {
      try {
        await Promise.all(
          targets.map((child) =>
            sendChildLockNotice({
              to: child.email as string,
              childName: child.name,
              parentName: parent?.name,
              loginUrl,
            })
          )
        );
      } catch (error) {
        console.error(error);
      }
    }
  }

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
