const features = [
  {
    title: "スマートオートメーション",
    body: "面倒なタスクを自動化し、1日をクリエイティブな作業に集中できます。",
  },
  {
    title: "チームコラボ",
    body: "部門を越えたリアルタイム連携で、意思決定が驚くほどスムーズに。",
  },
  {
    title: "安心のセキュリティ",
    body: "国内データセンターとゼロトラスト設計で、大切な情報を守ります。",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center lg:gap-16 lg:px-10">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-sm font-medium text-white/80">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              新機能「Flow AI」先行公開中
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                ビジネスを加速させる<br className="hidden sm:block" />次世代オペレーション基盤
              </h1>
              <p className="text-lg text-white/70 sm:text-xl">
                クラウド管理からワークフロー自動化まで、成長企業が必要とする機能をワンストップで提供。データを繋ぎ、チームを繋ぎ、成果を最大化します。
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-3xl font-semibold text-white">12万社</p>
                <p className="text-sm text-white/60">国内外の導入実績</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-white">+38%</p>
                <p className="text-sm text-white/60">平均生産性向上</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-white">4.9/5</p>
                <p className="text-sm text-white/60">CS満足度</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <button className="rounded-full bg-emerald-400 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-300">
                デモを予約
              </button>
              <button className="rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white transition hover:border-white/50">
                資料をダウンロード
              </button>
            </div>
          </div>

          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
            <div className="mb-6 space-y-1 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Portal Login</p>
              <h2 className="text-2xl font-semibold text-white">メンバーサインイン</h2>
              <p className="text-sm text-white/60">アカウントをお持ちでない方は <a className="text-emerald-300 underline-offset-2 hover:underline" href="#">こちらから登録</a></p>
            </div>
            <form className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-white/80" htmlFor="email">
                  メールアドレス
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
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
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-white/70">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-white/30 bg-transparent text-emerald-300 focus:ring-emerald-200" />
                  ログイン状態を保持
                </label>
                <span className="text-white/50">SAML対応</span>
              </div>
              <button type="submit" className="w-full rounded-2xl bg-emerald-400 py-3 text-base font-semibold text-slate-900 transition hover:bg-emerald-300">
                サインイン
              </button>
            </form>
            <div className="mt-6 space-y-3 text-sm text-white/60">
              <p className="text-center text-xs uppercase tracking-[0.2em] text-white/40">or continue with</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  "Google",
                  "Microsoft",
                  "Slack",
                ].map((provider) => (
                  <button
                    key={provider}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white transition hover:border-white/30"
                  >
                    {provider}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-16 lg:px-10 lg:py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Why FlowBase</p>
          <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">成果創出に必要なものを1つに</h2>
          <p className="mt-3 text-base text-white/60">
            データ統合・自動化・コラボレーションを1つのプラットフォームで完結。IT部門の負担を減らしながら、ビジネスサイドが自由に改善を回せる仕組みを提供します。
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-lg">
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm text-white/70">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
