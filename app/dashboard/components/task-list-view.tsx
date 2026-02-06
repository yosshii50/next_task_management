import type { TaskStatus } from "@prisma/client";
import type { FC } from "react";

import { statusColors } from "../utils/task-tree";
import type { TaskForClient } from "@/types/dashboard";

export type TaskListViewProps = {
  tasks: TaskForClient[];
  statusLabelMap: Record<TaskStatus, string>;
  draggingTaskId: number | null;
  dragOverId: number | null;
  setDraggingTaskId: (taskId: number | null) => void;
  setDragOverId: (taskId: number | null) => void;
  isValidDropTarget: (targetId: number) => boolean;
  handleLinkByDrop: (targetId: number) => void | Promise<void>;
  openEdit: (taskId: number) => void;
};

const TaskListView: FC<TaskListViewProps> = ({
  tasks,
  statusLabelMap,
  draggingTaskId,
  dragOverId,
  setDraggingTaskId,
  setDragOverId,
  isValidDropTarget,
  handleLinkByDrop,
  openEdit,
}) => {
  if (tasks.length === 0) {
    return (
      <p className="mt-4 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white/60">
        今日は予定されているタスクはありません。カレンダーの日付をクリックして作成できます。
      </p>
    );
  }

  return (
    <ul className="mt-5 space-y-3">
      {tasks.map((task) => {
        const isDragging = draggingTaskId === task.id;
        const isDroppable = isValidDropTarget(task.id);
        const isDragOver = dragOverId === task.id && isDroppable;

        const baseClasses =
          "flex items-start justify-between gap-3 rounded-2xl border bg-slate-950/40 px-4 py-3 transition-colors duration-150";
        const dragClasses = [
          isDragOver ? "border-emerald-300/70 bg-emerald-300/10" : "border-white/10",
          isDragging ? "opacity-70 ring-1 ring-emerald-300/50" : "",
          !isDragging && isDroppable ? "hover:border-emerald-300/60" : "hover:border-white/20",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <li
            key={task.id}
            className={`${baseClasses} ${dragClasses}`}
            draggable
            onDragStart={() => setDraggingTaskId(task.id)}
            onDragEnd={() => {
              setDraggingTaskId(null);
              setDragOverId(null);
            }}
            onDragOver={(event) => {
              if (!isDroppable) return;
              event.preventDefault();
              setDragOverId(task.id);
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleLinkByDrop(task.id);
            }}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-1 h-2.5 w-2.5 rounded-full ${statusColors[task.status]}`} aria-hidden />
              <div>
                <p className="text-sm font-semibold text-white">{task.title}</p>
                {task.description && task.description.trim().length > 0 && (
                  <p className="mt-1 text-xs text-white/70">{task.description}</p>
                )}
                <p className="mt-1 text-[11px] text-white/50">
                  {statusLabelMap[task.status] ?? task.status} / 開始: {task.startDate ?? "未設定"} / 期限: {task.dueDate ?? "未設定"}
                </p>
                <p className="mt-1 text-[11px] text-emerald-200/80">ドラッグ&ドロップで子タスクを設定</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isDragOver && <span className="text-[11px] font-semibold text-emerald-300">ここにドロップ</span>}
              <button
                type="button"
                onClick={() => openEdit(task.id)}
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
              >
                修正
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default TaskListView;
