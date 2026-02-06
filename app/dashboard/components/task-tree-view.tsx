import type { TaskStatus } from "@prisma/client";
import type { FC } from "react";

import { statusColors, type TaskNode } from "../utils/task-tree";

type TaskTreeViewProps = {
  nodes: TaskNode[];
  statusLabelMap: Record<TaskStatus, string>;
  draggingTaskId: number | null;
  dragOverId: number | null;
  setDraggingTaskId: (taskId: number | null) => void;
  setDragOverId: (taskId: number | null) => void;
  isValidDropTarget: (targetId: number) => boolean;
  handleLinkByDrop: (targetId: number) => void | Promise<void>;
  openEdit: (taskId: number) => void;
  isLinking: boolean;
};

const TaskTreeView: FC<TaskTreeViewProps> = ({
  nodes,
  statusLabelMap,
  draggingTaskId,
  dragOverId,
  setDraggingTaskId,
  setDragOverId,
  isValidDropTarget,
  handleLinkByDrop,
  openEdit,
  isLinking,
}) => {
  const renderTaskNode = (node: TaskNode) => {
    const isDragging = draggingTaskId === node.task.id;
    const isDroppable = isValidDropTarget(node.task.id);
    const isDragOver = dragOverId === node.task.id && isDroppable;

    const baseClasses =
      "rounded-2xl border bg-slate-950/40 px-4 py-3 transition-colors duration-150 border-white/10";
    const dragClasses = [
      isDragOver ? "border-emerald-300/70 bg-emerald-300/10" : "",
      isDragging ? "opacity-70 ring-1 ring-emerald-300/50" : "",
      !isDragging && isDroppable ? "hover:border-emerald-300/60" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <li
        key={node.task.id}
        className={`${baseClasses} ${dragClasses}`}
        draggable
        onDragStart={() => {
          setDraggingTaskId(node.task.id);
        }}
        onDragEnd={() => {
          setDraggingTaskId(null);
          setDragOverId(null);
        }}
        onDragOver={(event) => {
          if (!isDroppable) return;
          event.preventDefault();
          setDragOverId(node.task.id);
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          handleLinkByDrop(node.task.id);
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <span className={`mt-1 h-2.5 w-2.5 rounded-full ${statusColors[node.task.status]}`} aria-hidden />
            <div>
              <p className="text-sm font-semibold text-white">{node.task.title}</p>
              {node.task.description && node.task.description.trim().length > 0 && (
                <p className="mt-1 text-xs text-white/70">{node.task.description}</p>
              )}
              <p className="mt-1 text-[11px] text-white/50">
                {statusLabelMap[node.task.status] ?? node.task.status} / 開始: {node.task.startDate ?? "未設定"} / 期限: {" "}
                {node.task.dueDate ?? "未設定"}
              </p>
              <p className="mt-1 text-[11px] text-emerald-200/80">
                ドラッグ&ドロップでこのタスクの子に設定できます
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDragOver && <span className="text-[11px] font-semibold text-emerald-300">ここにドロップ</span>}
            {isLinking && isDragging && (
              <span className="text-[11px] font-semibold text-emerald-300">リンク反映中...</span>
            )}
            <button
              type="button"
              onClick={() => openEdit(node.task.id)}
              className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
            >
              修正
            </button>
          </div>
        </div>
        {node.children.length > 0 && (
          <ul className="mt-2 space-y-2 border-l border-white/10 pl-4">
            {node.children.map((child) => (
              <div key={child.task.id} className="relative">
                <span className="absolute -left-4 top-3 h-px w-3 bg-white/15" aria-hidden />
                {renderTaskNode(child)}
              </div>
            ))}
          </ul>
        )}
      </li>
    );
  };

  if (nodes.length === 0) {
    return (
      <p className="mt-4 rounded-2xl border border-dashed border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white/60">
        未着手または進行中のタスクがありません。新しいタスクを追加するとここにツリー表示されます。
      </p>
    );
  }

  return <ul className="mt-4 space-y-2">{nodes.map((node) => renderTaskNode(node))}</ul>;
};

export default TaskTreeView;
