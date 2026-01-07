import { NextResponse } from "next/server";

import { validatePasswordResetToken } from "@/lib/password-reset";

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = normalize(body.token);
  const userCode = normalize(body.user);

  const validation = await validatePasswordResetToken(userCode, token);

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
