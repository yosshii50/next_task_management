import Link from "next/link";

import ForgotPasswordForm from "@/components/forgot-password-form";
import ResetPasswordForm from "@/components/reset-password-form";

type ResetPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default function ResetPage({ searchParams }: ResetPageProps) {
  const token = getParam(searchParams.token);
  const user = getParam(searchParams.user);
  const hasToken = Boolean(token && user);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center lg:gap-16 lg:px-10">
          <div className="flex-1 space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Password Reset</p>
            <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
              パスワードの再設定
            </h1>
            <p className="text-base text-white/70">
              {hasToken
                ? "新しいパスワードを設定し、再度サインインしてください。"
                : "登録メールアドレスを入力すると、再設定用リンクをメールでお送りします。"}
            </p>
            <div className="flex items-center gap-3 text-sm text-white/70">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>セキュアリンクは有効期限付きです。お早めに設定を完了してください。</span>
            </div>
            <Link className="inline-flex items-center text-sm text-emerald-300 underline-offset-2 hover:underline" href="/">
              サインインに戻る
            </Link>
          </div>

          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
            <div className="mb-6 space-y-1 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                {hasToken ? "Set New Password" : "Forgot Password"}
              </p>
              <h2 className="text-2xl font-semibold text-white">
                {hasToken ? "新しいパスワードを設定" : "メールを送信"}
              </h2>
            </div>

            {hasToken ? <ResetPasswordForm token={token} userCode={user} /> : <ForgotPasswordForm />}
          </div>
        </div>
      </div>
    </div>
  );
}
