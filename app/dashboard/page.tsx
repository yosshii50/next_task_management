import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import SignOutButton from "@/components/sign-out-button";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  const displayName = session.user.name ?? session.user.email ?? "メンバー";

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Welcome back</p>
          <h1 className="mt-3 text-4xl font-semibold">
            こんにちは、<span className="text-emerald-300">{displayName}</span> さん
          </h1>
          <p className="mt-2 text-white/70">
            FlowBase へのログインが完了しました。チームの最新プロジェクトや自動化フローをここから管理できます。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">本日のタスク</h2>
            <p className="mt-2 text-sm text-white/70">ダッシュボードに表示するコンテンツをここに追加できます。</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">チームの動き</h2>
            <p className="mt-2 text-sm text-white/70">通知やアクティビティログなどを配置してください。</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-white/60">別のアカウントでログインしたい場合はサインアウトしてください。</p>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
