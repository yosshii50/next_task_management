import type { TaskStatus } from "@prisma/client";

import type { TaskForClient } from "@/types/dashboard";

export type TaskNode = {
  task: TaskForClient;
  children: TaskNode[];
};

export const statusColors: Record<TaskStatus, string> = {
  TODO: "bg-emerald-400",
  IN_PROGRESS: "bg-amber-400",
  DONE: "bg-slate-400",
};

const treeStatusOrder: TaskStatus[] = ["IN_PROGRESS", "TODO", "DONE"];

export function buildActiveTaskTree(tasks: TaskForClient[]): TaskNode[] {
  const targetStatuses = new Set<TaskStatus>(["TODO", "IN_PROGRESS", "DONE"]);
  const activeTasks = tasks.filter((task) => targetStatuses.has(task.status));

  const taskMap = new Map(activeTasks.map((task) => [task.id, task]));
  const childrenMap = new Map<number, number[]>();
  const activeParentMap = new Map<number, number[]>();

  activeTasks.forEach((task) => {
    const activeChildren = task.childTaskIds.filter((childId) => taskMap.has(childId));
    childrenMap.set(task.id, activeChildren);
    const activeParents = task.parentTaskIds.filter((parentId) => taskMap.has(parentId));
    activeParentMap.set(task.id, activeParents);
  });

  const statusRank = treeStatusOrder.reduce<Record<TaskStatus, number>>((acc, status, index) => {
    acc[status] = index;
    return acc;
  }, {} as Record<TaskStatus, number>);

  const buildNode = (taskId: number, visited: Set<number>): TaskNode => {
    const task = taskMap.get(taskId)!;
    const node: TaskNode = { task, children: [] };

    const nextVisited = new Set(visited);
    nextVisited.add(taskId);

    const childIds = childrenMap.get(taskId) ?? [];
    childIds.forEach((childId) => {
      if (nextVisited.has(childId)) return; // cycle guard
      node.children.push(buildNode(childId, nextVisited));
    });

    node.children.sort((a, b) => {
      const statusDiff = (statusRank[a.task.status] ?? 99) - (statusRank[b.task.status] ?? 99);
      if (statusDiff !== 0) return statusDiff;
      const aTime = new Date(a.task.createdAt).getTime();
      const bTime = new Date(b.task.createdAt).getTime();
      const safeATime = Number.isNaN(aTime) ? 0 : aTime;
      const safeBTime = Number.isNaN(bTime) ? 0 : bTime;
      return safeBTime - safeATime;
    });

    return node;
  };

  // 矢印を親→子で埋める（子が複数の親を持つ場合は両方にぶら下げる）
  activeTasks.forEach((task) => {
    const activeParents = activeParentMap.get(task.id) ?? [];
    activeParents.forEach((parentId) => {
      if (!taskMap.has(parentId)) return;
      const parentChildren = childrenMap.get(parentId) ?? [];
      if (!parentChildren.includes(task.id)) {
        childrenMap.set(parentId, [...parentChildren, task.id]);
      }
    });
  });

  // ルートを一意に集める（アクティブ親なしのタスク、および親チェーンの起点）
  const rootIds = new Set<number>();
  activeTasks.forEach((task) => {
    const activeParents = activeParentMap.get(task.id) ?? [];
    if (activeParents.length === 0) {
      rootIds.add(task.id);
    }
  });
  activeTasks.forEach((task) => {
    const activeParents = activeParentMap.get(task.id) ?? [];
    activeParents.forEach((parentId) => {
      const parentTask = taskMap.get(parentId);
      if (!parentTask) return;
      const parentHasParent = parentTask.parentTaskIds.some((pp) => taskMap.has(pp));
      if (!parentHasParent) {
        rootIds.add(parentId);
      }
    });
  });

  const roots: TaskNode[] = Array.from(rootIds).map((id) => buildNode(id, new Set()));

  roots.sort((a, b) => {
    const statusDiff = (statusRank[a.task.status] ?? 99) - (statusRank[b.task.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    const aTime = new Date(a.task.createdAt).getTime();
    const bTime = new Date(b.task.createdAt).getTime();
    const safeATime = Number.isNaN(aTime) ? 0 : aTime;
    const safeBTime = Number.isNaN(bTime) ? 0 : bTime;
    return safeBTime - safeATime;
  });

  return roots;
}
