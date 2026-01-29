import Link from "next/link";
import SignupForm from "@/components/signup-form";

const highlights = [
  { title: "導入サポート", body: "専任チームが要件定義から設計、初期設定まで伴走します。" },
  { title: "セキュリティ標準", body: "SOC2 / ISO27001に準拠した国内データセンターにて運用。" },
  { title: "AIワークフロー", body: "Next Taskが業務フローを自動提案し、改善サイクルを加速。" },
];

export const metadata = {
  title: "Next Task | 新規登録",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-12 lg:flex-row lg:items-start lg:gap-16 lg:px-10">
        <div className="flex-1 space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white">
            ← 戻る
          </Link>
          <div className="space-y-5">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-emerald-200">
              Early Access
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Next Taskへのご登録
            </h1>
            <p className="text-base text-white/70">
              チームの課題や導入目的を共有いただくことで、最適なプランとオンボーディングを提案します。フォーム送信後、担当より詳細のご案内を差し上げます。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-xs text-white/70">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-400/10 via-slate-900/40 to-transparent p-6 text-sm text-white/80">
            <p className="font-medium text-white">導入の流れ</p>
            <ol className="mt-3 space-y-3">
              <li>1. フォーム送信後、1営業日以内にヒアリングの日程をご連絡します。</li>
              <li>2. ヒアリングで課題を整理し、PoCまたは本導入のプランをご提案します。</li>
              <li>3. ご契約後、平均2週間で本番運用を開始できます。</li>
            </ol>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <SignupForm />
          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-2xl border border-white/30 px-4 py-3 text-base font-semibold text-white transition hover:border-white/60"
          >
            トップページへ戻る
          </Link>
        </div>
      </div>
      <section className="border-t border-white/5 bg-black/20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12 lg:flex-row lg:items-center lg:px-10">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Customer Voice</p>
            <p className="text-2xl font-semibold text-white">「業務プロセス改善のスピードが2倍に」</p>
            <p className="text-base text-white/70">
              Next Task導入により、各部門が自律的にワークフローを更新できるようになりました。統制とスピードを両立できる唯一のプラットフォームです。
            </p>
            <p className="text-sm text-white/60">DX推進部 部長 / Forward Solutions</p>
          </div>
          <div className="flex-1 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/80">導入企業（一例）</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-2xl font-semibold text-white/40 sm:grid-cols-3">
              <span>Beacon</span>
              <span>Rivus</span>
              <span>Komodo</span>
              <span>Atlas</span>
              <span>Glint</span>
              <span>North</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
