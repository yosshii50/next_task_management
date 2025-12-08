"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const providers = ["Google", "Microsoft", "Slack"];

export default function LoginForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")?.toString() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.refresh();
    setSuccess("サインインしました。");
    (event.target as HTMLFormElement).reset();
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
      <div className="mb-6 space-y-1 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">Portal Login</p>
        <h2 className="text-2xl font-semibold text-white">メンバーサインイン</h2>
        <p className="text-sm text-white/60">
          アカウントをお持ちでない方は {" "}
          <a className="text-emerald-300 underline-offset-2 hover:underline" href="#">
            こちらから登録
          </a>
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-white/80" htmlFor="email">
            メールアドレス
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
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <label className="font-medium text-white/80" htmlFor="password">
              パスワード
            </label>
            <a className="text-white/60 hover:text-white" href="#">
              パスワードをお忘れですか？
            </a>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
          />
        </div>
        <div className="flex items-center justify-between text-sm text-white/70">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="remember"
              className="h-4 w-4 rounded border-white/30 bg-transparent text-emerald-300 focus:ring-emerald-200"
            />
            ログイン状態を保持
          </label>
          <span className="text-white/50">SAML対応</span>
        </div>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        {success && <p className="text-sm text-emerald-300">{success}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-emerald-400 py-3 text-base font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "サインイン中..." : "サインイン"}
        </button>
      </form>
      <div className="mt-6 space-y-3 text-sm text-white/60">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-white/40">or continue with</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {providers.map((provider) => (
            <button
              key={provider}
              type="button"
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white transition hover:border-white/30"
            >
              {provider}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
