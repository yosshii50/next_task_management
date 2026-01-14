"use client";

import { FormEvent, useState, useTransition } from "react";
import { signOut } from "next-auth/react";

import { deleteAccount } from "./actions";

const CONFIRM_TEXT = "削除します";

export default function DeleteAccountForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const confirmation = (formData.get("confirmation") as string | null)?.trim() ?? "";
    const password = (formData.get("password") as string | null)?.trim() ?? "";

    setError(null);

    if (confirmation !== CONFIRM_TEXT) {
      setError(`確認欄に「${CONFIRM_TEXT}」と入力してください。`);
      return;
    }

    if (!password) {
      setError("パスワードを入力してください。");
      return;
    }

    startTransition(async () => {
      try {
        await deleteAccount(formData);
        await signOut({ callbackUrl: "/" });
      } catch (submissionError) {
        const message =
          submissionError instanceof Error
            ? submissionError.message
            : "アカウントの削除に失敗しました。";
        setError(message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-red-300/20 bg-red-500/5 p-4 text-sm text-white/80">
        <p className="font-semibold text-white">削除前のご確認</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>登録済みのタスクや休日情報も含め、データはすべて削除されます。</li>
          <li>紹介者管理に紐づく関係は解除され、元に戻せません。</li>
          <li>削除完了後は自動的にサインアウトされます。</li>
        </ul>
      </div>

      <div>
        <label className="mb-1 block text-sm text-white/80" htmlFor="delete-password">
          パスワード
        </label>
        <input
          id="delete-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="現在のパスワードを入力"
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-red-300 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-white/80" htmlFor="delete-confirmation">
          確認の入力
        </label>
        <input
          id="delete-confirmation"
          name="confirmation"
          type="text"
          autoComplete="off"
          required
          placeholder={`「${CONFIRM_TEXT}」と入力してください`}
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-red-300 focus:outline-none"
        />
        <p className="mt-1 text-xs text-white/60">誤操作防止のため、上記の文言を正確に入力してください。</p>
      </div>

      {error && <p className="text-sm text-rose-200">{error}</p>}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <a
          href="/settings"
          className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
        >
          キャンセル
        </a>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full border border-red-300/50 bg-red-500/20 px-6 py-2 text-xs font-semibold text-red-100 transition hover:border-red-200 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "削除中..." : "アカウントを削除"}
        </button>
      </div>
    </form>
  );
}
