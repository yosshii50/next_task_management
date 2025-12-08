"use client";

import { useMemo, useState, useTransition } from "react";
import type { TaskStatus } from "@prisma/client";

type TaskForClient = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
};

type StatusOption = {
  value: TaskStatus;
  label: string;
};

type TaskListProps = {
  tasks: TaskForClient[];
  statusOptions: StatusOption[];
  onCreate: (formData: FormData) => Promise<void>;
  onUpdate: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
};

type ModalState =
  | { type: "create" }
  | { type: "edit"; task: TaskForClient }
  | null;

export default function TaskList({ tasks, statusOptions, onCreate, onUpdate, onDelete }: TaskListProps) {
  const [modalState, setModalState] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskForClient | null>(null);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const statusMap = useMemo(() => Object.fromEntries(statusOptions.map((option) => [option.value, option.label])), [statusOptions]);

  function openEditor(task: TaskForClient) {
    setModalState({ type: "edit", task });
  }

  function openCreate() {
    setModalState({ type: "create" });
  }

  function closeModal() {
    setModalState(null);
  }

  async function handleSubmit(formData: FormData) {
    if (!modalState) return;

    startSubmitTransition(async () => {
      if (modalState.type === "edit") {
        formData.set("taskId", modalState.task.id.toString());
        await onUpdate(formData);
      } else {
        await onCreate(formData);
      }
      closeModal();
    });
  }

  function openDelete(task: TaskForClient) {
    setDeleteTarget(task);
  }

  function closeDelete() {
    setDeleteTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    startDeleteTransition(async () => {
      const formData = new FormData();
      formData.append("taskId", deleteTarget.id.toString());
      await onDelete(formData);
      closeDelete();
    });
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">タスク一覧</h2>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full bg-emerald-400 px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          追加
        </button>
      </div>
      {tasks.length === 0 ? (
        <p className="mt-4 text-sm text-white/60">まだタスクがありません。「追加」ボタンから登録してください。</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">{task.title}</p>
                <p className="text-xs text-white/40">
                  ステータス: {statusMap[task.status] ?? task.status} / 期限: {task.dueDate ?? "未設定"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => openEditor(task)}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
                >
                  変更
                </button>
                <button
                  type="button"
                  onClick={() => openDelete(task)}
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
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{modalState.type === "edit" ? "タスクを編集" : "タスクを追加"}</h3>
              <button onClick={closeModal} className="text-sm text-white/60 hover:text-white">
                閉じる
              </button>
            </div>
            <form action={handleSubmit} className="space-y-4">
              {modalState.type === "edit" && (
                <input type="hidden" name="taskId" value={modalState.task.id} />
              )}
              <div>
                <label className="mb-1 block text-sm text-white/80" htmlFor="modal-title">
                  タイトル
                </label>
                <input
                  id="modal-title"
                  name="title"
                  defaultValue={modalState.type === "edit" ? modalState.task.title : ""}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/80" htmlFor="modal-description">
                  詳細
                </label>
                <textarea
                  id="modal-description"
                  name="description"
                  rows={3}
                  defaultValue={modalState.type === "edit" ? modalState.task.description ?? "" : ""}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-white/80" htmlFor="modal-status">
                    ステータス
                  </label>
                  <select
                    id="modal-status"
                    name="status"
                    defaultValue={modalState.type === "edit" ? modalState.task.status : statusOptions[0]?.value}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white focus:border-emerald-300 focus:outline-none"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-white/80" htmlFor="modal-dueDate">
                    期限
                  </label>
                  <input
                    id="modal-dueDate"
                    name="dueDate"
                    type="date"
                    defaultValue={modalState.type === "edit" ? modalState.task.dueDate ?? "" : ""}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white focus:border-emerald-300 focus:outline-none"
                  />
                </div>
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
                  {isSubmitting ? "送信中..." : modalState.type === "edit" ? "更新" : "追加"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
            <h3 className="text-lg font-semibold">タスクを削除</h3>
            <p className="mt-2 text-sm text-white/70">
              「{deleteTarget.title}」を削除しますか？ この操作は取り消せません。
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
                className="rounded-full border border-rose-300 bg-transparent px-4 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-300 hover:text-slate-950 disabled:opacity-60"
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
