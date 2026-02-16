"use client";

import Link from "next/link";
import { useCallback } from "react";

type From = "settings" | "signup" | "default";

export default function TermsBackControl({ from }: { from: From }) {
  const handleClose = useCallback(() => {
    // window.close() が効かない場合はサインアップ画面へフォールバック
    window.close();
    setTimeout(() => {
      if (!window.closed) {
        window.location.href = "/signup";
      }
    }, 150);
  }, []);

  if (from === "signup") {
    return (
      <button
        type="button"
        onClick={handleClose}
        className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
      >
        タブを閉じる
      </button>
    );
  }

  const href = from === "settings" ? "/settings" : "/settings";

  return (
    <Link
      href={href}
      className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
    >
      設定一覧へ戻る
    </Link>
  );
}
