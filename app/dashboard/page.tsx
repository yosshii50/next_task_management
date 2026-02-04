import { TaskStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import DashboardContent from "@/app/dashboard/dashboard-content";
import SignOutButton from "@/components/sign-out-button";
import { authOptions } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard-data";

const statusOptions = [
  { value: TaskStatus.TODO, label: "未着手" },
  { value: TaskStatus.IN_PROGRESS, label: "進行中" },
  { value: TaskStatus.DONE, label: "完了" },
];

const DEFAULT_WEEKS_TO_DISPLAY = 5;
const MAX_WEEKS_TO_PRELOAD = 8;
const MIN_WEEKS = 3;
const DAYS_PER_WEEK = 7;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = Number(session.user.id);

  if (!userId) {
    redirect("/");
  }

  const displayName = session.user.name ?? session.user.email ?? "メンバー";
  const initialData = await getDashboardData(userId);

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Welcome back</p>
          <h1 className="mt-3 text-4xl font-semibold">
            こんにちは、<span className="text-emerald-300">{displayName}</span> さん
          </h1>
          <p className="mt-2 text-white/70">
            Next Task へのログインが完了しました。チームの最新プロジェクトや自動化フローをここから管理できます。
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-white/60">別のアカウントでログインしたい場合はサインアウトしてください。</p>
          <div className="flex gap-3">
            <a
              href="/settings"
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
            >
              設定
            </a>
            <a
              href="/tasks"
              className="rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-300/10"
            >
              タスク管理へ
            </a>
            <SignOutButton />
          </div>
        </div>

        <DashboardContent
          statusOptions={statusOptions}
          initialData={initialData}
          defaultWeeks={DEFAULT_WEEKS_TO_DISPLAY}
          minWeeks={MIN_WEEKS}
          maxWeeks={MAX_WEEKS_TO_PRELOAD}
          daysPerWeek={DAYS_PER_WEEK}
        />
      </div>
    </div>
  );
}
