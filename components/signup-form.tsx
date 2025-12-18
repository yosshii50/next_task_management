"use client";

import { FormEvent, useState } from "react";

type FormStatus = "idle" | "submitting" | "success";

export default function SignupForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("submitting");

    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string | null)?.trim() ?? "";

    if (!email.includes("@")) {
      setStatus("idle");
      setError("正しいメールアドレスを入力してください。");
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));

    setStatus("success");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-white/80" htmlFor="name">
          ご担当者名
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="山田 太郎"
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-white/80" htmlFor="email">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-white/80" htmlFor="referrer">
          紹介者ID
        </label>
        <input
          id="referrer"
          name="referrer"
          type="text"
          required
          placeholder="紹介者コードを入力してください"
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-rose-300">{error}</p>}
      {status === "success" && (
        <p className="rounded-xl bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">送信が完了しました。担当者より1営業日以内にご連絡いたします。</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-2xl bg-emerald-400 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "送信中..." : "この内容で申し込む"}
      </button>
    </form>
  );
}
