"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "submitting" | "done";

export default function ForgotPasswordForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("submitting");

    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string | null)?.trim() ?? "";

    if (!email) {
      setStatus("idle");
      setError("メールアドレスを入力してください。");
      return;
    }

    try {
      const response = await fetch("/api/password/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "メールの送信に失敗しました。");
      }

      setStatus("done");
    } catch (submissionError) {
      const message =
        submissionError instanceof Error ? submissionError.message : "メールの送信に失敗しました。";
      setError(message);
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-white/80" htmlFor="email">
          登録メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-rose-300">{error}</p>}
      {status === "done" && (
        <p className="rounded-xl bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
          パスワード再設定用のメールを送信しました。届かない場合は迷惑メールをご確認ください。
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-2xl bg-emerald-400 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "送信中..." : "再設定メールを送る"}
      </button>
    </form>
  );
}
