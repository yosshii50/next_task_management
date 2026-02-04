"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { TaskStatus } from "@prisma/client";

import DatePicker from "./date-picker";
import type { TaskForClient } from "@/types/dashboard";

type StatusOption = {
  value: TaskStatus;
  label: string;
};

type TaskEditModalProps = {
  task: TaskForClient;
  tasks: TaskForClient[];
  statusOptions: StatusOption[];
  onUpdate: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
  onClose: () => void;
};

export default function TaskEditModal({ task, tasks, statusOptions, onUpdate, onDelete, onClose }: TaskEditModalProps) {
  const [childTaskIds, setChildTaskIds] = useState<number[]>(task.childTaskIds ?? []);
  const [childSelectValue, setChildSelectValue] = useState("");
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const taskMap = useMemo(() => new Map(tasks.map((item) => [item.id, item])), [tasks]);
  const selectedChildTasks = useMemo(
    () => childTaskIds.map((id) => taskMap.get(id)).filter((item): item is TaskForClient => Boolean(item)),
    [childTaskIds, taskMap]
  );
  const availableChildOptions = useMemo(
    () => tasks.filter((item) => item.id !== task.id && !childTaskIds.includes(item.id)),
    [childTaskIds, task.id, tasks]
  );

  useEffect(() => {
    setChildTaskIds(task.childTaskIds ?? []);
    setChildSelectValue("");
  }, [task]);

  const addChildTask = () => {
    if (!childSelectValue) return;
    const parsed = Number(childSelectValue);
    if (!Number.isInteger(parsed) || parsed <= 0 || childTaskIds.includes(parsed)) return;
    setChildTaskIds((prev) => [...prev, parsed]);
    setChildSelectValue("");
  };

  const removeChildTask = (childId: number) => {
    setChildTaskIds((prev) => prev.filter((id) => id !== childId));
  };

  const handleSubmit = (formData: FormData) => {
    startSubmitTransition(async () => {
      formData.set("taskId", task.id.toString());
      childTaskIds.forEach((childId) => formData.append("childTaskIds", childId.toString()));
      await onUpdate(formData);
      onClose();
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const formData = new FormData();
      formData.append("taskId", task.id.toString());
      await onDelete(formData);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">タスクを編集</h3>
          <button onClick={onClose} className="text-sm text-white/60 hover:text-white">
            閉じる
          </button>
        </div>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="taskId" value={task.id} />
          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="dashboard-modal-title">
              タイトル
            </label>
            <input
              id="dashboard-modal-title"
              name="title"
              defaultValue={task.title}
              required
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="dashboard-modal-description">
              詳細
            </label>
            <textarea
              id="dashboard-modal-description"
              name="description"
              rows={3}
              defaultValue={task.description ?? ""}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-white/80" htmlFor="dashboard-modal-status">
                ステータス
              </label>
              <select
                id="dashboard-modal-status"
                name="status"
                defaultValue={task.status}
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
              <DatePicker
                id="dashboard-modal-startDate"
                name="startDate"
                label="開始日"
                defaultValue={task.startDate ?? ""}
              />
            </div>
            <div>
              <DatePicker
                id="dashboard-modal-dueDate"
                name="dueDate"
                label="期限"
                defaultValue={task.dueDate ?? ""}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="text-sm font-semibold text-white">子タスク</p>
              <p className="text-xs text-white/60">既存のタスクを紐付けて階層化できます。</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedChildTasks.length === 0 ? (
                <span className="rounded-full border border-dashed border-white/20 px-3 py-1 text-xs text-white/50">
                  まだ子タスクがありません
                </span>
              ) : (
                selectedChildTasks.map((child) => (
                  <span
                    key={child.id}
                    className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white"
                  >
                    <span className="font-semibold">{child.title}</span>
                    <button
                      type="button"
                      onClick={() => removeChildTask(child.id)}
                      className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-white transition hover:bg-white/20"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={childSelectValue}
                onChange={(event) => setChildSelectValue(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white focus:border-emerald-300 focus:outline-none sm:max-w-xs"
              >
                <option value="" className="bg-slate-900 text-white">
                  子タスク候補を選択
                </option>
                {availableChildOptions.map((candidate) => (
                  <option key={candidate.id} value={candidate.id} className="bg-slate-900 text-white">
                    {candidate.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addChildTask}
                disabled={!childSelectValue}
                className="rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-300/10 disabled:opacity-60"
              >
                子タスクを追加
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-300/10"
            >
              削除
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
            >
              {isSubmitting ? "送信中..." : "更新"}
            </button>
          </div>
        </form>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
            <h4 className="text-lg font-semibold">タスクを削除</h4>
            <p className="mt-2 text-sm text-white/70">「{task.title}」を削除しますか？この操作は取り消せません。</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
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
