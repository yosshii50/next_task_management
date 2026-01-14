import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import ChangePasswordForm from "./ChangePasswordForm";
import DeleteAccountForm from "./DeleteAccountForm";

export default async function SecuritySettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const displayName = session.user?.name ?? session.user?.email ?? "メンバー";

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-3xl space-y-8 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Security</p>
            <h1 className="mt-3 text-4xl font-semibold">パスワードとログイン保護</h1>
            <p className="mt-2 text-white/70">
              {displayName} さんのログイン情報を安全に保つため、定期的にパスワードを更新してください。
            </p>
          </div>
          <a
            href="/settings"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
          >
            設定一覧へ戻る
          </a>
        </div>

        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">パスワードを変更</h2>
              <p className="mt-2 text-sm text-white/70">
                現在のパスワードを確認した上で新しいパスワードに更新します。使い回しを避け、8文字以上で設定してください。
              </p>
            </div>

            <ChangePasswordForm />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">おすすめのセキュリティ設定</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/70">
              <li>半年に一度を目安にパスワードを見直してください。</li>
              <li>英大文字・小文字・数字・記号を組み合わせると強度が高まります。</li>
              <li>他サービスと同じパスワードの使い回しは避けましょう。</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-red-300/20 bg-red-500/5 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">アカウントを削除</h2>
              <p className="mt-2 text-sm text-white/70">
                すべてのデータを削除してアカウントを閉鎖します。操作は元に戻せませんので、内容をよくご確認のうえ実行してください。
              </p>
            </div>

            <DeleteAccountForm />
          </div>
        </section>
      </div>
    </div>
  );
}
