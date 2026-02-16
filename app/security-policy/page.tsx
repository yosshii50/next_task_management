import Link from "next/link";

export const metadata = {
  title: "セキュリティポリシー | Next Task Management",
  description: "ユーザーデータを安全に扱うための基本方針を公開しています。",
};

type SecurityPolicyPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default function SecurityPolicyPage({ searchParams }: SecurityPolicyPageProps) {
  const from = getParam(searchParams?.from);
  const cameFromSettings = from === "settings";

  const sections = [
    {
      title: "データ保護とプライバシー",
      body: "ユーザーデータは、保存時・転送時ともに暗号化を行います。収集する個人情報は最小限とし、目的外利用や無断提供は行いません。",
    },
    {
      title: "認証とアクセス管理",
      body: "認証はメールとパスワードを用いた認証を基本としています。",
    },
    {
      title: "インシデント対応",
      body: "セキュリティインシデントを検知した場合、最優先で影響範囲を特定し、関係者への連絡・封じ込め・復旧を行います。",
    },
    {
      title: "バックアップと復旧",
      body: "現在テスト運用中のためバックアップは取っていません、必要に応じて全データを消去する可能性があります。",
    },
    {
      title: "ログと監査",
      body: "管理者操作や認証イベントを中心に監査ログを保全し、不正アクセスの兆候をモニタリングします。ログは改ざん防止のための保護を施しています。",
    },
    {
      title: "お問い合わせ窓口",
      body: "セキュリティに関するご質問や懸念は、サポート窓口までご連絡ください。内容に応じて優先度を設定し、適切に対応します。",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16 lg:px-10 lg:py-20">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Security Policy</p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              セキュリティポリシー
            </h1>
            <p className="text-base text-white/70">
              ユーザーデータを安全に守るための基本方針と運用体制を公開しています。
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-white/70">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 px-3 py-1 text-emerald-100">
                暗号化とアクセス制御
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 px-3 py-1 text-emerald-100">
                ログ監査
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 px-3 py-1 text-emerald-100">
                インシデント対応
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {sections.map((section) => (
              <div
                key={section.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur"
              >
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/80">{section.body}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-white/70">
              ポリシーは必要に応じて更新します。更新日: 2026年2月16日
            </div>
            <div className="flex gap-3">
              <Link
                href={cameFromSettings ? "/settings" : "/"}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                {cameFromSettings ? "設定に戻る" : "サインインに戻る"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
