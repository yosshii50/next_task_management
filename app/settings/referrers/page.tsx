import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { deleteChildren } from "./actions";

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
            <form action={deleteChildren} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">子アカウント一覧</h2>
                  <p className="mt-2 text-sm text-white/70">承認状況や連絡先をここで確認・整理できます。</p>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  {children.length} 件
                </span>
              </div>

              {children.length === 0 ? (
                <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-sm text-white/60">
                  まだ紹介経由の子アカウントがありません。
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-amber-400/5 px-4 py-3 text-sm text-white/80">
                    <span>選択した子アカウントを一括削除できます（元に戻せません）。</span>
                    <button
                      type="submit"
                      className="rounded-full border border-red-300/50 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-100 transition hover:border-red-200 hover:bg-red-500/20"
                    >
                      選択したアカウントを削除
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-white/10">
                    <table className="min-w-full divide-y divide-white/10 text-sm">
                      <thead className="bg-white/5 text-left text-white/70">
                        <tr>
                          <th className="px-4 py-3">
                            <span className="sr-only">選択</span>
                          </th>
                          <th className="px-4 py-3 font-semibold">名前</th>
                          <th className="px-4 py-3 font-semibold">メールアドレス</th>
                          <th className="px-4 py-3 font-semibold">登録日</th>
                          <th className="px-4 py-3 font-semibold">状態</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {children.map((child) => (
                          <tr key={child.id} className="hover:bg-white/5">
                            <td className="px-4 py-3">
                              <label className="flex items-center gap-2 text-white/80">
                                <input
                                  type="checkbox"
                                  name="childIds"
                                  value={child.id}
                                  className="h-4 w-4 rounded border-white/30 bg-transparent text-emerald-400 focus:ring-emerald-400"
                                  aria-label={`${child.name || "未設定"}を選択`}
                                />
                              </label>
                            </td>
                            <td className="px-4 py-3 font-semibold text-white">
                              {child.name || "未設定"}
                            </td>
                            <td className="px-4 py-3 text-white/80">{child.email ?? "未登録"}</td>
                            <td className="px-4 py-3 text-white/70">
                              {child.createdAt.toISOString().slice(0, 10)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  child.isActive
                                    ? "bg-emerald-400/10 text-emerald-200"
                                    : "bg-amber-400/10 text-amber-200"
                                }`}
                              >
                                {child.isActive ? "有効" : "無効"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
