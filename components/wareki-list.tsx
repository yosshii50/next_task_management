"use client";

import { useState, useTransition } from "react";

import {
  createWarekiSetting,
  deleteWarekiSetting,
  updateWarekiSetting,
} from "@/app/settings/wareki/actions";
import { useEscapeKey } from "@/lib/use-escape-key";

export type WarekiSettingForClient = {
  id: number;
  eraName: string;
  startDate: string;
  endDate?: string | null;
};

type WarekiListProps = {
  settings: WarekiSettingForClient[];
};

type ModalState =
  | { type: "create" }
  | { type: "edit"; setting: WarekiSettingForClient }
  | null;

export default function WarekiList({ settings }: WarekiListProps) {
  const [modalState, setModalState] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<WarekiSettingForClient | null>(null);
  const [isSubmitting, startSubmit] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function openCreate() {
    setModalState({ type: "create" });
  }

  function openEdit(setting: WarekiSettingForClient) {
    setModalState({ type: "edit", setting });
  }

  function closeModal() {
    setModalState(null);
  }

  function openDelete(setting: WarekiSettingForClient) {
    setDeleteTarget(setting);
  }

  function closeDelete() {
    setDeleteTarget(null);
  }

  function handleSubmit(formData: FormData) {
    if (!modalState) return;

    startSubmit(async () => {
      const endDate = formData.get("endDate")?.toString().trim();
      const startDate = formData.get("startDate")?.toString().trim();
      if (startDate && endDate && endDate < startDate) {
        alert("終了日は開始日以降に設定してください。");
        return;
      }

      if (modalState.type === "edit") {
        formData.set("settingId", modalState.setting.id.toString());
        await updateWarekiSetting(formData);
      } else {
        await createWarekiSetting(formData);
      }
      closeModal();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startDelete(async () => {
      const formData = new FormData();
      formData.append("settingId", deleteTarget.id.toString());
      await deleteWarekiSetting(formData);
      closeDelete();
    });
  }

  useEscapeKey(Boolean(modalState), closeModal);
  useEscapeKey(Boolean(deleteTarget), closeDelete);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">和暦設定</h2>
          <p className="text-sm text-white/70">元号名と適用期間を管理します。</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          追加
        </button>
      </div>

      {settings.length === 0 ? (
        <p className="mt-4 text-sm text-white/60">まだ和暦設定が登録されていません。</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {settings.map((setting) => (
            <li
              key={setting.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-white">{setting.eraName}</p>
                <p className="text-xs text-white/60">
                  {setting.startDate} 〜 {setting.endDate || "（終了日未設定）"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(setting)}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
                >
                  修正
                </button>
                <button
                  type="button"
                  onClick={() => openDelete(setting)}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:border-rose-300 hover:text-rose-300"
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{modalState.type === "edit" ? "和暦を修正" : "和暦を追加"}</h3>
              <button onClick={closeModal} className="text-sm text-white/60 hover:text-white">
                閉じる
              </button>
            </div>
            <form action={handleSubmit} className="space-y-4">
              {modalState.type === "edit" && (
                <input type="hidden" name="settingId" value={modalState.setting.id} />
              )}
              <div>
                <label className="mb-1 block text-sm text-white/80" htmlFor="era-name">
                  元号名
                </label>
                <input
                  id="era-name"
                  name="eraName"
                  type="text"
                  required
                  defaultValue={modalState.type === "edit" ? modalState.setting.eraName : ""}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white focus:border-emerald-300 focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-white/80" htmlFor="wareki-start">
                    開始日
                  </label>
                  <input
                    id="wareki-start"
                    name="startDate"
                    type="date"
                    required
                    defaultValue={modalState.type === "edit" ? modalState.setting.startDate : ""}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white focus:border-emerald-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-white/80" htmlFor="wareki-end">
                    終了日（任意）
                  </label>
                  <input
                    id="wareki-end"
                    name="endDate"
                    type="date"
                    defaultValue={
                      modalState.type === "edit" && modalState.setting.endDate ? modalState.setting.endDate : ""
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white focus:border-emerald-300 focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-xs text-white/60">終了日を空欄にすると現在進行中の元号として扱います。</p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
                >
                  {isSubmitting ? "保存中..." : modalState.type === "edit" ? "更新" : "追加"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
            <h3 className="text-lg font-semibold">和暦を削除</h3>
            <p className="mt-2 text-sm text-white/70">
              「{deleteTarget.eraName} ({deleteTarget.startDate} 〜 {deleteTarget.endDate || "未設定"})」を削除しますか？
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDelete}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-300 hover:text-slate-950 disabled:opacity-60"
              >
                {isDeleting ? "削除中..." : "削除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
