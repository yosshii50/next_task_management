"use client";

import { useMemo, useRef, useState } from "react";

import { deleteChildren } from "./actions";

type Child = {
  id: number;
  name: string | null;
  email: string | null;
  createdAt: string;
  isActive: boolean;
};

type Props = {
  children: Child[];
};

export default function ReferrersClient({ children }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const selectedCount = selectedIds.size;

  const handleToggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (selectedCount === 0) return;
    setShowConfirm(true);
  };

  const submitDeletion = () => {
    if (!formRef.current) return;
    setShowConfirm(false);
    formRef.current.requestSubmit();
  };

  const selectionInputs = useMemo(
    () =>
      Array.from(selectedIds).map((id) => (
        <input key={id} type="hidden" name="childIds" value={id} />
      )),
    [selectedIds]
  );

  return (
    <>
      <form ref={formRef} action={deleteChildren} className="space-y-4">
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
                type="button"
                onClick={handleConfirm}
                disabled={selectedCount === 0}
                className="rounded-full border border-red-300/50 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-100 transition enabled:hover:border-red-200 enabled:hover:bg-red-500/20 disabled:cursor-not-allowed disabled:border-white/20 disabled:text-white/40"
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
                            checked={selectedIds.has(child.id)}
                            onChange={() => handleToggle(child.id)}
                            className="h-4 w-4 rounded border-white/30 bg-transparent text-emerald-400 focus:ring-emerald-400"
                            aria-label={`${child.name || "未設定"}を選択`}
                          />
                        </label>
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{child.name || "未設定"}</td>
                      <td className="px-4 py-3 text-white/80">{child.email ?? "未登録"}</td>
                      <td className="px-4 py-3 text-white/70">{child.createdAt}</td>
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

        {selectionInputs}
      </form>

      {showConfirm && selectedCount > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-6 text-white shadow-2xl backdrop-blur">
            <h3 className="text-lg font-semibold">確認</h3>
            <p className="mt-3 text-sm text-white/80">
              {selectedCount} 件のアカウントを削除します。よろしいですか？
            </p>
            <div className="mt-6 flex justify-end gap-3 text-sm">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-full border border-white/20 px-4 py-2 font-semibold text-white transition hover:border-white/40"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={submitDeletion}
                className="rounded-full border border-red-300/60 bg-red-500/20 px-4 py-2 font-semibold text-red-100 transition hover:border-red-200 hover:bg-red-500/30"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
