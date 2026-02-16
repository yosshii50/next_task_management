import type { ReactNode } from "react";
import TermsBackControl from "@/components/terms-back-control";

const updatedAt = "2026年2月16日";

export const metadata = {
  title: "利用規約 | Next Task",
};

type TermsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default function TermsPage({ searchParams }: TermsPageProps) {
  const from = getParam(searchParams?.from);
  const cameFromSettings = from === "settings";
  const cameFromSignup = from === "signup";

  // サインアップ前でも閲覧できるよう、認証チェックなしで公開
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-4xl space-y-10 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Terms</p>
            <h1 className="mt-3 text-4xl font-semibold">利用規約</h1>
            <p className="mt-2 text-white/70">本サービスのご利用条件をまとめています。必ずご確認ください。</p>
          </div>
          <TermsBackControl from={cameFromSettings ? "settings" : cameFromSignup ? "signup" : "settings"} />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">Overview</p>
              <h2 className="mt-2 text-2xl font-semibold">第1条（適用）</h2>
            </div>
            <p className="text-xs text-white/60">最終更新日: {updatedAt}</p>
          </div>
          <p className="leading-relaxed text-white/80">
            本規約は、本サービスの提供条件および利用に関する当社と利用者との間の権利義務関係を定めるものです。
            利用者は本サービスを利用することで本規約に同意したものとみなされます。
          </p>
        </div>

        <div className="space-y-6">
          <Section title="第2条（アカウント管理）">
            <ul className="list-disc space-y-2 pl-5 text-white/80">
              <li>登録情報は正確かつ最新に保ち、第三者に共有・譲渡しないでください。</li>
              <li>ログイン情報の管理は利用者の責任で行い、不正利用が疑われる場合は直ちに当社へ連絡してください。</li>
            </ul>
          </Section>

          <Section title="第3条（禁止事項）">
            <ul className="list-disc space-y-2 pl-5 text-white/80">
              <li>法令または公序良俗に違反する行為</li>
              <li>システムへの不正アクセス、リバースエンジニアリング、負荷試験等の行為</li>
              <li>第三者の権利侵害（知的財産、プライバシー、名誉等）</li>
              <li>虚偽情報の登録や、当社が不適切と判断する行為</li>
            </ul>
          </Section>

          <Section title="第4条（サービス内容の変更・停止）">
            <p className="text-white/80">
              当社は、事前通知の上で本サービスの全部または一部を変更、追加、停止、または終了することがあります。
              重大な変更がある場合は、可能な限り事前に通知します。
            </p>
          </Section>

          <Section title="第5条（知的財産権）">
            <p className="text-white/80">
              本サービスに関するすべての著作権、商標権、その他の知的財産権は当社または正当な権利者に帰属します。
              利用者は非独占的な利用権を得るのみで、権利を譲渡・再許諾することはできません。
            </p>
          </Section>

          <Section title="第6条（免責事項）">
            <ul className="list-disc space-y-2 pl-5 text-white/80">
              <li>当社は、本サービスの提供にあたり、瑕疵のないことを保証しません。</li>
              <li>利用者が被った損害について、当社の故意または重過失がない限り責任を負いません。</li>
              <li>不可抗力（自然災害、通信障害等）による損害について当社は責任を負いません。</li>
            </ul>
          </Section>

          <Section title="第7条（利用停止・契約解除）">
            <p className="text-white/80">
              利用者が本規約に違反した場合、当社は事前の通知なくアカウントの利用停止または契約解除を行うことがあります。
            </p>
          </Section>

          <Section title="第8条（規約の変更）">
            <p className="text-white/80">
              法令改正やサービス改善に応じて本規約を改定することがあります。重要な変更は本サービス上で告知し、告知後も利用を継続することで改定に同意したものとみなします。
            </p>
          </Section>

          <Section title="第9条（準拠法・裁判管轄）">
            <p className="text-white/80">
              本規約は日本法に準拠し、紛争が生じた場合は当社所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </Section>
        </div>

        <div className="rounded-3xl border border-white/10 bg-emerald-500/10 p-6 text-white">
          <h3 className="text-lg font-semibold">お問い合わせ</h3>
          <p className="mt-2 text-sm text-white/80">
            規約に関するご質問や個別の契約が必要な場合は、管理者またはサポート窓口までご連絡ください。
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-3 leading-relaxed text-white/90">{children}</div>
    </div>
  );
}
