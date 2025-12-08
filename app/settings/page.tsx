import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const displayName = session.user?.name ?? session.user?.email ?? "メンバー";

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-3xl space-y-8 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Settings</p>
            <h1 className="mt-3 text-4xl font-semibold">アカウント設定</h1>
            <p className="mt-2 text-white/70">{displayName} さんの基本情報や通知設定を管理できます。</p>
          </div>
          <a
            href="/dashboard"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
          >
            ダッシュボードへ戻る
          </a>
        </div>

        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">プロフィール</h2>
            <p className="mt-2 text-sm text-white/70">名前やプロフィール画像の編集をここに実装してください。</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">通知</h2>
            <p className="mt-2 text-sm text-white/70">メール通知やSlack連携の設定をここに追加できます。</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">休日設定</h2>
                <p className="mt-2 text-sm text-white/70">会社やチーム全体の休日を管理します。</p>
              </div>
              <a
                href="/settings/holidays"
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
              >
                開く
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
