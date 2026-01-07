"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { addChildAccount, deleteChildren, updateChildMemo, updateChildrenStatus } from "./actions";

type Child = {
  id: number;
  name: string | null;
  createdAt: string;
  isActive: boolean;
  memo: string;
};

type Props = {
  childAccounts: Child[];
};

export default function ReferrersClient({ childAccounts }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [memoDrafts, setMemoDrafts] = useState<Map<number, string>>(
    () => new Map(childAccounts.map((child) => [child.id, child.memo]))
  );
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [errorIds, setErrorIds] = useState<Set<number>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);
  const deleteSubmitRef = useRef<HTMLButtonElement>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [sendActivationEmail, setSendActivationEmail] = useState(true);

  useEffect(() => {
    setMemoDrafts(new Map(childAccounts.map((child) => [child.id, child.memo])));
    setSavedIds(new Set());
    setErrorIds(new Set());
  }, [childAccounts]);

  const selectedCount = selectedIds.size;

  const handleToggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (selectedCount === 0) return;
    setShowConfirm(true);
  };

  const submitDeletion = () => {
    if (!formRef.current) return;
    setShowConfirm(false);
    formRef.current.requestSubmit(deleteSubmitRef.current ?? undefined);
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email || isInviting) return;

    setIsInviting(true);
    setInviteMessage(null);
    setInviteError(null);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("name", inviteName.trim());

      await addChildAccount(formData);
      setInviteMessage("アカウントを作成し、仮パスワードを送信しました。");
      setInviteEmail("");
      setInviteName("");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "作成に失敗しました";
      setInviteError(message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleBulkStatusChange = async (
    targetStatus: "active" | "inactive",
    options?: { sendMail?: boolean }
  ) => {
    if (selectedCount === 0 || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const formData = new FormData();
      selectedIds.forEach((id) => {
        formData.append("childIds", String(id));
      });
      formData.append("targetStatus", targetStatus);
      if (targetStatus === "active") {
        formData.append("sendActivationMail", options?.sendMail ? "true" : "false");
      }

      await updateChildrenStatus(formData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRequestActivation = () => {
    if (selectedCount === 0 || isUpdatingStatus) return;
    setSendActivationEmail(true);
    setShowActivateConfirm(true);
  };

  const handleConfirmActivation = () => {
    setShowActivateConfirm(false);
    void handleBulkStatusChange("active", { sendMail: sendActivationEmail });
  };

  const handleMemoChange = (id: number, value: string) => {
    setMemoDrafts((prev) => {
      const next = new Map(prev);
      next.set(id, value);
      return next;
    });
    setSavedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setErrorIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSaveMemo = async (id: number) => {
    const memo = memoDrafts.get(id) ?? "";

    setSavingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setErrorIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    try {
      const formData = new FormData();
      formData.append("childId", String(id));
      formData.append("memo", memo);

      await updateChildMemo(formData);

      setSavedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    } catch (error) {
      console.error(error);
      setErrorIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const selectionInputs = useMemo(
    () =>
      Array.from(selectedIds).map((id) => (
        <input key={id} type="hidden" name="childIds" value={id} />
      )),
    [selectedIds]
  );

  return (
    <>
      <form ref={formRef} action={deleteChildren} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">子アカウント一覧</h2>
            <p className="mt-2 text-sm text-white/70">承認状況をここで確認・整理できます。</p>
          </div>
          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            {childAccounts.length} 件
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/5 p-4 text-sm text-white/80 shadow-inner">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="アカウントの名前（任意）"
              className="min-w-[180px] flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300/40"
            />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="アカウントのメールアドレス"
              className="min-w-[220px] flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300/40"
            />
            <button
              type="button"
              onClick={handleInvite}
              disabled={isInviting || !inviteEmail.trim()}
              className="rounded-full border border-emerald-300/60 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-100 transition enabled:hover:border-emerald-200 enabled:hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isInviting ? "送信中..." : "アカウントを追加"}
            </button>
          </div>
          <p className="mt-2 text-xs text-white/70">メールアドレス宛に仮パスワードを送付し、アカウントを有効化します。</p>
          {inviteMessage && <p className="mt-2 text-xs text-emerald-200">{inviteMessage}</p>}
          {inviteError && <p className="mt-2 text-xs text-red-200">{inviteError}</p>}
        </div>

        {childAccounts.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-sm text-white/60">
            まだ紹介経由の子アカウントがありません。
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-amber-400/5 px-4 py-3 text-sm text-white/80">
              <span>選択した子アカウントを一括削除できます（元に戻せません）。</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRequestActivation}
                  disabled={selectedCount === 0 || isUpdatingStatus}
                  className="rounded-full border border-emerald-300/60 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-100 transition enabled:hover:border-emerald-200 enabled:hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-white/20 disabled:text-white/40"
                >
                  {isUpdatingStatus ? "処理中..." : "選択を有効化"}
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange("inactive")}
                  disabled={selectedCount === 0 || isUpdatingStatus}
                  className="rounded-full border border-amber-300/60 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-100 transition enabled:hover:border-amber-200 enabled:hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:border-white/20 disabled:text-white/40"
                >
                  {isUpdatingStatus ? "処理中..." : "選択を無効化"}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={selectedCount === 0}
                  className="rounded-full border border-red-300/50 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-100 transition enabled:hover:border-red-200 enabled:hover:bg-red-500/20 disabled:cursor-not-allowed disabled:border-white/20 disabled:text-white/40"
                >
                  選択したアカウントを削除
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-white/5 text-left text-white/70">
                  <tr>
                    <th className="px-4 py-3">
                      <span className="sr-only">選択</span>
                    </th>
                    <th className="px-4 py-3 font-semibold">名前</th>
                    <th className="px-4 py-3 font-semibold">登録日時</th>
                    <th className="px-4 py-3 font-semibold">状態</th>
                    <th className="px-4 py-3 font-semibold">メモ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {childAccounts.map((child) => (
                    <tr key={child.id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <label className="flex items-center gap-2 text-white/80">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(child.id)}
                            onChange={() => handleToggle(child.id)}
                            className="h-4 w-4 rounded border-white/30 bg-transparent text-emerald-400 focus:ring-emerald-400"
                            aria-label={`${child.name || "未設定"}を選択`}
                          />
                        </label>
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{child.name || "未設定"}</td>
                      <td className="px-4 py-3 text-white/70">{child.createdAt}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            child.isActive
                              ? "bg-emerald-400/10 text-emerald-200"
                              : "bg-amber-400/10 text-amber-200"
                          }`}
                        >
                          {child.isActive ? "有効" : "無効"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          <textarea
                            value={memoDrafts.get(child.id) ?? ""}
                            onChange={(event) => handleMemoChange(child.id, event.target.value)}
                            placeholder="この子アカウントに関するメモ"
                            maxLength={1000}
                            rows={3}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white shadow-inner outline-none transition focus:border-emerald-300 focus:ring-1 focus:ring-emerald-300/40"
                          />
                          <div className="flex items-center justify-between gap-3 text-xs text-white/70">
                            <span
                              aria-live="polite"
                              className={`min-h-[1.25rem] ${
                                errorIds.has(child.id) ? "text-red-200" : savedIds.has(child.id) ? "text-emerald-200" : ""
                              }`}
                            >
                              {savingIds.has(child.id)
                                ? "保存中..."
                                : errorIds.has(child.id)
                                ? "保存に失敗しました"
                                : savedIds.has(child.id)
                                ? "保存しました"
                                : ""}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSaveMemo(child.id)}
                              disabled={savingIds.has(child.id)}
                              className="rounded-full border border-emerald-300/50 bg-emerald-400/10 px-3 py-1 font-semibold text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {savingIds.has(child.id) ? "保存中..." : "メモを保存"}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {selectionInputs}
        <button ref={deleteSubmitRef} type="submit" className="hidden" aria-hidden="true" />
      </form>

      {showActivateConfirm && selectedCount > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-6 text-white shadow-2xl backdrop-blur">
            <h3 className="text-lg font-semibold">有効化の確認</h3>
            <p className="mt-3 text-sm text-white/80">
              選択した {selectedCount} 件のアカウントを有効化します。よろしいですか？
            </p>
            <label className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={sendActivationEmail}
                onChange={(event) => setSendActivationEmail(event.target.checked)}
                className="h-4 w-4 rounded border-white/30 bg-transparent text-emerald-400 focus:ring-emerald-400"
              />
              <span>有効化されたことをメールで通知する（送信先: 子アカウントのメールアドレス）</span>
            </label>
            <div className="mt-6 flex justify-end gap-3 text-sm">
              <button
                type="button"
                onClick={() => setShowActivateConfirm(false)}
                className="rounded-full border border-white/20 px-4 py-2 font-semibold text-white transition hover:border-white/40"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirmActivation}
                disabled={isUpdatingStatus}
                className="rounded-full border border-emerald-300/60 bg-emerald-500/20 px-4 py-2 font-semibold text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdatingStatus ? "処理中..." : "有効化する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && selectedCount > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-6 text-white shadow-2xl backdrop-blur">
            <h3 className="text-lg font-semibold">確認</h3>
            <p className="mt-3 text-sm text-white/80">
              {selectedCount} 件のアカウントを削除します。よろしいですか？
            </p>
            <div className="mt-6 flex justify-end gap-3 text-sm">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-full border border-white/20 px-4 py-2 font-semibold text-white transition hover:border-white/40"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={submitDeletion}
                className="rounded-full border border-red-300/60 bg-red-500/20 px-4 py-2 font-semibold text-red-100 transition hover:border-red-200 hover:bg-red-500/30"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
