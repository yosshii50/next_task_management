import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ReferrersClient from "./ReferrersClient";

export default async function ReferrersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = Number(session.user.id);

  if (!userId) {
    redirect("/");
  }

  const children = await prisma.user.findMany({
    where: { parentId: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const clientChildren = children.map((child) => ({
    id: child.id,
    name: child.name,
    email: child.email,
    createdAt: child.createdAt.toISOString().slice(0, 10),
    isActive: child.isActive,
  }));

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-4xl space-y-8 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Referrer Management</p>
            <h1 className="mt-3 text-4xl font-semibold">紹介者管理</h1>
            <p className="mt-2 text-white/70">紹介コード経由で作成された子アカウントを確認できます。</p>
          </div>
          <a
            href="/settings"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
          >
            設定一覧へ戻る
          </a>
        </div>

        <section className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <ReferrersClient children={clientChildren} />
          </div>
        </section>
      </div>
    </div>
  );
}
