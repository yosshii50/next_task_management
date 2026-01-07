"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  token: string;
  userCode: string;
};

type VerificationState = "idle" | "loading" | "valid" | "invalid";

export default function ResetPasswordForm({ token, userCode }: Props) {
  const [verification, setVerification] = useState<VerificationState>("idle");
  const [userName, setUserName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      setVerification("loading");
      setError(null);

      try {
        const response = await fetch("/api/password/reset/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, user: userCode }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "リンクの確認に失敗しました。");
        }

        if (!cancelled) {
          setUserName(data.user?.name ?? null);
          setVerification("valid");
        }
      } catch (verificationError) {
        const message =
          verificationError instanceof Error
            ? verificationError.message
            : "リンクの確認に失敗しました。";
        if (!cancelled) {
          setError(message);
          setVerification("invalid");
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [token, userCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (verification !== "valid") {
      setError("このリンクは無効です。再度リクエストしてください。");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = (formData.get("password") as string | null)?.trim() ?? "";
    const confirmation = (formData.get("confirmation") as string | null)?.trim() ?? "";

    if (password !== confirmation) {
      setError("確認用のパスワードが一致しません。");
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/password/reset", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, user: userCode, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "パスワードの更新に失敗しました。");
      }

      setStatus("done");
    } catch (submissionError) {
      const message =
        submissionError instanceof Error ? submissionError.message : "パスワードの更新に失敗しました。";
      setError(message);
      setStatus("idle");
    }
  }

  if (verification === "loading") {
    return <p className="text-sm text-white/80">リンクを確認しています...</p>;
  }

  if (verification === "invalid") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-rose-300">{error ?? "このリンクは無効です。"}</p>
        <Link className="text-sm text-emerald-300 underline-offset-2 hover:underline" href="/reset">
          再設定メールを再送する
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {userName && <p className="text-sm text-white/70">{userName} さんのパスワードを再設定します。</p>}

      <div>
        <label className="mb-1 block text-sm font-medium text-white/80" htmlFor="password">
          新しいパスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          placeholder="8文字以上で入力してください"
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-white/80" htmlFor="confirmation">
          新しいパスワード（確認）
        </label>
        <input
          id="confirmation"
          name="confirmation"
          type="password"
          minLength={8}
          required
          placeholder="もう一度入力してください"
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-rose-300">{error}</p>}
      {status === "done" && (
        <p className="rounded-xl bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
          パスワードを更新しました。サインイン画面から新しいパスワードでログインしてください。
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting" || status === "done"}
        className="w-full rounded-2xl bg-emerald-400 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "更新中..." : "パスワードを更新"}
      </button>
    </form>
  );
}
