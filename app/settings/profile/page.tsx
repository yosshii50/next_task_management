import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ProfileForm from "./ProfileForm";
import ReferrerIdCard from "@/components/referrer-id-card";

export default async function ProfileSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = Number(session.user.id);

  if (!userId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, userId: true },
  });

  const displayName = user?.name ?? "";
  const email = user?.email ?? "";
  const referrerId = user?.userId ?? "";

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-3xl space-y-8 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Profile</p>
            <h1 className="mt-3 text-4xl font-semibold">プロフィール編集</h1>
            <p className="mt-2 text-white/70">表示名を変更してチームメンバーに伝わるようにしましょう。</p>
          </div>
          <a
            href="/settings"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
          >
            設定一覧へ戻る
          </a>
        </div>

        <section className="space-y-6">
          <ReferrerIdCard referrerId={referrerId} />

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">名前</h2>
              <p className="mt-2 text-sm text-white/70">ダッシュボードや通知に表示される名前を編集します。</p>
            </div>

            <ProfileForm defaultName={displayName} email={email} />
          </div>
        </section>
      </div>
    </div>
  );
}
