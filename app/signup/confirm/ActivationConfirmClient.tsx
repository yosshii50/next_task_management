"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type State =
  | { status: "loading" }
  | { status: "invalid"; message: string }
  | { status: "ready"; user: { name: string | null; email: string | null } }
  | { status: "activating"; user: { name: string | null; email: string | null } }
  | { status: "success" }
  | { status: "error"; message: string };

export default function ActivationConfirmPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const userCode = useMemo(() => searchParams.get("user")?.trim() ?? "", [searchParams]);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!token || !userCode) {
      setState({ status: "invalid", message: "リンクに必要な情報が不足しています。" });
      return;
    }

    let isMounted = true;

    const fetchUser = async () => {
      try {
        const response = await fetch("/api/signup/activation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, userCode }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "リンクの確認に失敗しました。");
        }

        if (isMounted) {
          setState({ status: "ready", user: data.user });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "リンクの確認に失敗しました。再度お試しください。";
        if (isMounted) {
          setState({ status: "invalid", message });
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [token, userCode]);

  const handleApprove = async () => {
    if (state.status !== "ready") return;
    setState({ status: "activating", user: state.user });

    try {
      const response = await fetch("/api/signup/activation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, userCode }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "有効化に失敗しました。");
      }

      setState({ status: "success" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "有効化に失敗しました。時間をおいて再度お試しください。";
      setState({ status: "error", message });
    }
  };

  const headline = {
    loading: "リンクを確認しています...",
    invalid: "リンクが無効です",
    ready: "アカウントの有効化確認",
    activating: "有効化を処理しています...",
    success: "有効化が完了しました",
    error: "有効化に失敗しました",
  }[state.status];

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <Link href="/" className="text-sm text-white/60 transition hover:text-white">
          ← トップへ戻る
        </Link>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Activation</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">{headline}</h1>
        </div>

        {state.status === "loading" && <p className="text-white/70">しばらくお待ちください。</p>}

        {state.status === "invalid" && (
          <div className="space-y-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm">
            <p className="font-medium text-rose-100">{state.message}</p>
            <p className="text-white/60">リンクの有効期限切れや入力ミスがないかご確認ください。</p>
          </div>
        )}

        {(state.status === "ready" || state.status === "activating") && (
          <div className="space-y-4">
            <p className="text-white/70">
              下記のユーザーを有効化します。内容をご確認のうえ「有効化する」を押してください。
            </p>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
              <p>
                氏名: <span className="text-white">{state.user.name || "未設定"}</span>
              </p>
            </div>
            <button
              onClick={handleApprove}
              disabled={state.status === "activating"}
              className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state.status === "activating" ? "有効化しています..." : "有効化する"}
            </button>
          </div>
        )}

        {state.status === "success" && (
          <div className="space-y-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm">
            <p className="font-medium text-emerald-100">アカウントを有効化しました。</p>
            <p className="text-white/70">
              メンバーにログインを案内してください。引き続きよろしくお願いいたします。
            </p>
          </div>
        )}

        {state.status === "error" && (
          <div className="space-y-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm">
            <p className="font-medium text-amber-100">{state.message}</p>
            <p className="text-white/70">時間をおいて再度お試しください。</p>
          </div>
        )}
      </div>
    </div>
  );
}
