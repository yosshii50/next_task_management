import { NextResponse } from "next/server";

import { activateUser, validateActivationToken } from "@/lib/activation";

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

  return NextResponse.json({ success: true });
}
