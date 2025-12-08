"use client";

import { useState, useTransition } from "react";

import { createHoliday, deleteHoliday, updateHoliday } from "@/app/settings/holidays/actions";

export type HolidayForClient = {
  id: number;
  date: string;
  name: string;
};

type HolidayListProps = {
  holidays: HolidayForClient[];
};

type ModalState =
  | { type: "create" }
  | { type: "edit"; holiday: HolidayForClient }
  | null;

export default function HolidayList({ holidays }: HolidayListProps) {
  const [modalState, setModalState] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<HolidayForClient | null>(null);
  const [isSubmitting, startSubmit] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function openCreate() {
    setModalState({ type: "create" });
  }

  function openEdit(holiday: HolidayForClient) {
    setModalState({ type: "edit", holiday });
  }

  function closeModal() {
    setModalState(null);
  }

  function openDelete(holiday: HolidayForClient) {
    setDeleteTarget(holiday);
  }

  function closeDelete() {
    setDeleteTarget(null);
  }

  function handleSubmit(formData: FormData) {
    if (!modalState) return;

    startSubmit(async () => {
      if (modalState.type === "edit") {
        formData.set("holidayId", modalState.holiday.id.toString());
        await updateHoliday(formData);
      } else {
        await createHoliday(formData);
      }
      closeModal();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startDelete(async () => {
      const formData = new FormData();
      formData.append("holidayId", deleteTarget.id.toString());
      await deleteHoliday(formData);
      closeDelete();
    });
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">祝日設定</h2>
          <p className="text-sm text-white/70">組織独自の休業日を登録します。</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          追加
        </button>
      </div>

      {holidays.length === 0 ? (
        <p className="mt-4 text-sm text-white/60">まだ祝日が登録されていません。</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {holidays.map((holiday) => (
            <li key={holiday.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">{holiday.name}</p>
                <p className="text-xs text-white/60">{holiday.date}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(holiday)}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
                >
                  修正
                </button>
                <button
                  type="button"
                  onClick={() => openDelete(holiday)}
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
              <h3 className="text-lg font-semibold">{modalState.type === "edit" ? "祝日を修正" : "祝日を追加"}</h3>
              <button onClick={closeModal} className="text-sm text-white/60 hover:text-white">
                閉じる
              </button>
            </div>
            <form action={handleSubmit} className="space-y-4">
              {modalState.type === "edit" && (
                <input type="hidden" name="holidayId" value={modalState.holiday.id} />
              )}
              <div>
                <label className="mb-1 block text-sm text-white/80" htmlFor="holiday-date">
                  日付
                </label>
                <input
                  id="holiday-date"
                  name="date"
                  type="date"
                  required
                  defaultValue={modalState.type === "edit" ? modalState.holiday.date : ""}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white focus:border-emerald-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/80" htmlFor="holiday-name">
                  名称
                </label>
                <input
                  id="holiday-name"
                  name="name"
                  type="text"
                  required
                  defaultValue={modalState.type === "edit" ? modalState.holiday.name : ""}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white focus:border-emerald-300 focus:outline-none"
                />
              </div>
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
            <h3 className="text-lg font-semibold">祝日を削除</h3>
            <p className="mt-2 text-sm text-white/70">
              「{deleteTarget.name} ({deleteTarget.date})」を削除しますか？
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
