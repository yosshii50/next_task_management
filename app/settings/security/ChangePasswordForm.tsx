"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";

import { changePassword } from "./actions";

type Status = "idle" | "pending" | "done";

export default function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (status !== "done") return;
    const timer = setTimeout(() => setStatus("idle"), 5000);
    return () => clearTimeout(timer);
  }, [status]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const newPassword = (formData.get("newPassword") as string | null)?.trim() ?? "";
    const confirmation = (formData.get("confirmation") as string | null)?.trim() ?? "";

    setError(null);

    if (newPassword !== confirmation) {
      setError("新しいパスワードが一致しません。");
      return;
    }

    setStatus("pending");

    startTransition(async () => {
      try {
        await changePassword(formData);
        setStatus("done");
        form.reset();
      } catch (submissionError) {
        const message =
          submissionError instanceof Error
            ? submissionError.message
            : "パスワードの更新に失敗しました。";
        setError(message);
        setStatus("idle");
      }
    });
  }

  const statusLabel = status === "pending" ? "更新中" : status === "done" ? "更新済み" : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm text-white/80" htmlFor="current-password">
          現在のパスワード
        </label>
        <input
          id="current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          placeholder="現在のパスワードを入力"
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-white/80" htmlFor="new-password">
          新しいパスワード
        </label>
        <input
          id="new-password"
          name="newPassword"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
          placeholder="8文字以上で入力してください"
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
        />
        <p className="mt-1 text-xs text-white/60">英数字や記号を組み合わせると安全性が高まります。</p>
      </div>

      <div>
        <label className="mb-1 block text-sm text-white/80" htmlFor="new-password-confirmation">
          新しいパスワード（確認）
        </label>
        <input
          id="new-password-confirmation"
          name="confirmation"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
          placeholder="もう一度入力してください"
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-rose-300">{error}</p>}
      {status === "done" && (
        <p className="rounded-xl bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
          パスワードを更新しました。次回のサインインから新しいパスワードをご利用ください。
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        {statusLabel && (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white" aria-live="polite">
            {statusLabel}
          </span>
        )}
        <a
          href="/settings"
          className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
        >
          キャンセル
        </a>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-emerald-400 px-6 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-70"
        >
          {isPending ? "更新中..." : "保存する"}
        </button>
      </div>
    </form>
  );
}
