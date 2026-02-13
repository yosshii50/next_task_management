import LoginForm from "@/components/login-form";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [totalAccounts, totalTasks] = await Promise.all([
    prisma.user.count(),
    prisma.task.count(),
  ]);

  const formattedAccounts = new Intl.NumberFormat("ja-JP").format(totalAccounts);
  const formattedTasks = new Intl.NumberFormat("ja-JP").format(totalTasks);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center lg:gap-16 lg:px-10">
          <div className="flex-1 space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                あなたのペースで、あなたらしく
              </h1>
              <p className="text-lg text-white/70 sm:text-xl">
                個人のタスク管理に特化したシンプル機能。いま取り組むべきことが一目でわかる。
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-3xl font-semibold text-white">{formattedAccounts}件</p>
                <p className="text-sm text-white/60">総アカウント数</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-white">{formattedTasks}件</p>
                <p className="text-sm text-white/60">総タスク数</p>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
              先着100名まで無料利用メンバーを募集中。自分のペースで試してみませんか？
            </div>
            <a
              href="https://x.com/Yosshii50"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="text-base font-bold">X</span>
              運営にXで連絡して紹介者IDを取得する
            </a>
          </div>

          <LoginForm />
        </div>
      </div>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-16 lg:px-10 lg:py-20">
      </section>
    </div>
  );
}
