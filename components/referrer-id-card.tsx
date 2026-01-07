"use client";

import { useState } from "react";

type Props = {
  referrerId: string;
};

export default function ReferrerIdCard({ referrerId }: Props) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const displayId = referrerId || "-";

  async function handleCopy() {
    if (!referrerId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(referrerId);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Referrer ID</p>
          <h2 className="text-2xl font-semibold text-white">あなたの紹介者ID</h2>
          <p className="mt-2 text-sm text-white/70">このIDを共有すると、相手があなた経由で登録できます。</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!referrerId}
          className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {copyState === "copied" ? "コピーしました" : copyState === "error" ? "コピーできませんでした" : "コピー"}
        </button>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-lg font-mono text-emerald-200">
        {displayId}
      </div>
    </div>
  );
}
