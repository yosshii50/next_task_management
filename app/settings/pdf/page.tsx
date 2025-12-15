import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import PdfGenerator from "@/components/pdf-generator";
import { authOptions } from "@/lib/auth";

export default async function PdfSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const displayName = session.user?.name ?? session.user?.email ?? "メンバー";

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-4xl space-y-10 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">PDF Generator</p>
            <h1 className="mt-3 text-4xl font-semibold">PDF生成</h1>
            <p className="mt-2 text-white/70">{displayName} さん向けのPDFレイアウトプレビューを作成できます。</p>
          </div>
          <a
            href="/settings"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
          >
            設定一覧へ戻る
          </a>
        </div>

        <PdfGenerator />
      </div>
    </div>
  );
}
