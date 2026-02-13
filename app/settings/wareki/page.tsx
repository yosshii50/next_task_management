import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import WarekiList from "@/components/wareki-list";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function toInputDate(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function WarekiSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }
  if (!session.user.isAdmin) {
    redirect("/settings");
  }

  const userId = Number(session.user.id);

  if (!userId) {
    redirect("/");
  }

  const settings = await prisma.warekiSetting.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
  });

  const list = settings.map((setting) => ({
    id: setting.id,
    eraName: setting.eraName,
    startDate: toInputDate(setting.startDate),
    endDate: toInputDate(setting.endDate),
  }));

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-3xl space-y-8 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Era Settings</p>
            <h1 className="mt-3 text-4xl font-semibold">和暦設定</h1>
            <p className="mt-2 text-white/70">元号と適用期間の追加・修正・削除を行います。</p>
          </div>
          <a
            href="/settings"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
          >
            設定一覧へ戻る
          </a>
        </div>

        <section className="space-y-6">
          <WarekiList settings={list} />
        </section>
      </div>
    </div>
  );
}
