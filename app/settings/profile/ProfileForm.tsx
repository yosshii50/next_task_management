"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";

import { updateProfile } from "@/app/settings/profile/actions";

type ProfileFormProps = {
  defaultName: string;
  email: string;
};

export default function ProfileForm({ defaultName, email }: ProfileFormProps) {
  const [name, setName] = useState(defaultName);
  const [status, setStatus] = useState<"idle" | "pending" | "done">("idle");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (status !== "done") return;
    const timer = setTimeout(() => setStatus("idle"), 5000);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("pending");

    startTransition(async () => {
      try {
        await updateProfile(formData);
        setStatus("done");
      } catch (error) {
        console.error(error);
        setStatus("idle");
      }
    });
  }

  const statusLabel = status === "pending" ? "更新中" : status === "done" ? "更新済み" : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm text-white/80" htmlFor="profile-name">
          表示名
        </label>
        <input
          id="profile-name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="山田 太郎"
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white focus:border-emerald-300 focus:outline-none"
        />
        <p className="mt-1 text-xs text-white/60">4〜50文字程度で入力してください。</p>
      </div>

      <div>
        <label className="mb-1 block text-sm text-white/80" htmlFor="profile-email">
          メールアドレス
        </label>
        <input
          id="profile-email"
          type="email"
          value={email || "未登録"}
          disabled
          className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        {statusLabel && (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white" aria-live="polite">
            {statusLabel}
          </span>
        )}
        <a
          href="/settings"
          className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
        >
          キャンセル
        </a>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-emerald-400 px-6 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-70"
        >
          {isPending ? "更新中..." : "保存する"}
        </button>
      </div>
    </form>
  );
}
