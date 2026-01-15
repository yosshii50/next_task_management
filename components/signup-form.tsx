"use client";

import { FormEvent, useState } from "react";

type FormStatus = "idle" | "submitting" | "success";

export default function SignupForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [showNameInfo, setShowNameInfo] = useState(false);
  const [showEmailInfo, setShowEmailInfo] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("submitting");

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const name = (formData.get("name") as string | null)?.trim() ?? "";
    const email = (formData.get("email") as string | null)?.trim() ?? "";
    const referrer = (formData.get("referrer") as string | null)?.trim() ?? "";

    if (!name) {
      setStatus("idle");
      setError("名前を入力してください。");
      return;
    }

    if (!email.includes("@")) {
      setStatus("idle");
      setError("正しいメールアドレスを入力してください。");
      return;
    }

    if (!referrer) {
      setStatus("idle");
      setError("紹介者IDを入力してください。");
      return;
    }

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, referrer }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "登録処理に失敗しました。時間をおいて再度お試しください。");
      }

      formElement.reset();
      setStatus("success");
    } catch (submissionError) {
      const message =
        submissionError instanceof Error ? submissionError.message : "登録処理に失敗しました。時間をおいて再度お試しください。";
      setError(message);
      setStatus("idle");
    }

  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur"
    >
      <div>
        <div className="mb-1 flex items-center gap-2">
          <label className="block text-sm font-medium text-white/80" htmlFor="name">
            名前
          </label>
          <button
            type="button"
            onClick={() => setShowNameInfo((prev) => !prev)}
            aria-expanded={showNameInfo}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-white/40 text-xs font-bold text-white/80 transition hover:border-emerald-300 hover:text-emerald-200"
            title="紹介者があなたを識別するために使用します"
          >
            ?
          </button>
        </div>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="おなまえ"
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
        />
        {showNameInfo && (
          <p className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
            紹介者が申込者を識別するために利用します、紹介者に伝わる名前を入力してください。
          </p>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center gap-2">
          <label className="block text-sm font-medium text-white/80" htmlFor="email">
            メールアドレス
          </label>
          <button
            type="button"
            onClick={() => setShowEmailInfo((prev) => !prev)}
            aria-expanded={showEmailInfo}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-white/40 text-xs font-bold text-white/80 transition hover:border-emerald-300 hover:text-emerald-200"
            title="紹介者にはメールアドレスは通知されません"
          >
            ?
          </button>
        </div>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          lang="en"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          title="紹介者にはメールアドレスは通知されません"
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
        />
        {showEmailInfo && (
          <p className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
            入力されたメールアドレスは紹介者を含め、誰にも共有されません。
          </p>
        )}
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
          lang="en"
          inputMode="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-rose-300">{error}</p>}
      {status === "success" && (
        <p className="rounded-xl bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">メールの送信が完了しました。仮パスワードを確認し、紹介者の承認をお待ちください。</p>
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
