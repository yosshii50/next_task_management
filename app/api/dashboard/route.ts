import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard-data";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userIdValue = session?.user?.id;
  const userId = typeof userIdValue === "string" ? Number(userIdValue) : userIdValue;

  if (!userId) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const data = await getDashboardData(userId);

  return NextResponse.json(data);
}
