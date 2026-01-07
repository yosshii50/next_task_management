import { NextResponse } from "next/server";

import { resetPassword } from "@/lib/password-reset";

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isStrongEnough(password: string) {
  return password.length >= 8;
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = normalize(body.token);
  const userCode = normalize(body.user);
  const password = normalize(body.password);

  if (!isStrongEnough(password)) {
    return NextResponse.json({ error: "パスワードは8文字以上で入力してください。" }, { status: 400 });
  }

  const result = await resetPassword(userCode, token, password);

  if (result.status !== "reset") {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
