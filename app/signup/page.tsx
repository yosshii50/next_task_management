import Link from "next/link";
import SignupForm from "@/components/signup-form";

export const metadata = {
  title: "Next Task | 新規登録",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 pb-16 pt-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white">
          ← 戻る
        </Link>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold leading-tight text-white">Next Taskへのご登録</h1>
          <p className="text-base text-white/70">
            チーム情報とご担当者さまの連絡先をご入力ください。送信後、担当より1営業日以内にご連絡します。
          </p>
        </div>
        <SignupForm />
        <Link
          href="/"
          className="flex w-full items-center justify-center rounded-2xl border border-white/30 px-4 py-3 text-base font-semibold text-white transition hover:border-white/60"
        >
          トップページへ戻る
        </Link>
      </div>
    </div>
  );
}
