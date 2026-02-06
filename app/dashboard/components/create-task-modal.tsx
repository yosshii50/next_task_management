import type { TaskStatus } from "@prisma/client";
import type { FC } from "react";

import DatePicker from "@/components/date-picker";

export type StatusOption = {
  value: TaskStatus;
  label: string;
};

export type CreateTaskModalProps = {
  isOpen: boolean;
  isCreating: boolean;
  presetDate: string | null;
  todayIso: string;
  statusOptions: StatusOption[];
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
};

const CreateTaskModal: FC<CreateTaskModalProps> = ({
  isOpen,
  isCreating,
  presetDate,
  todayIso,
  statusOptions,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const defaultDate = presetDate ?? todayIso;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">今日のタスクを追加</h3>
          <button onClick={onClose} className="text-sm text-white/60 hover:text-white">
            閉じる
          </button>
        </div>
        <form action={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="dashboard-create-title">
              タイトル
            </label>
            <input
              id="dashboard-create-title"
              name="title"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
              placeholder="例: デイリースタンドアップの準備"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="dashboard-create-description">
              詳細
            </label>
            <textarea
              id="dashboard-create-description"
              name="description"
              rows={3}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-emerald-300 focus:outline-none"
              placeholder="メモや共有事項があれば記載してください"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-white/80" htmlFor="dashboard-create-status">
                ステータス
              </label>
              <select
                id="dashboard-create-status"
                name="status"
                defaultValue="TODO"
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
              <DatePicker id="dashboard-create-startDate" name="startDate" label="開始日" defaultValue={defaultDate} />
            </div>
            <div>
              <DatePicker id="dashboard-create-dueDate" name="dueDate" label="期限" defaultValue={defaultDate} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
            >
              {isCreating ? "作成中..." : "追加"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
