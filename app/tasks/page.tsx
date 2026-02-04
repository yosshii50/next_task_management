import { TaskStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import TaskManagementContent from "@/app/tasks/task-management-content";
import { createTask, deleteTask, updateTask } from "@/app/dashboard/actions";
import { authOptions } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard-data";

const statusOptions = [
  { value: TaskStatus.TODO, label: "未着手" },
  { value: TaskStatus.IN_PROGRESS, label: "進行中" },
  { value: TaskStatus.DONE, label: "完了" },
];

type TaskPageProps = {
  searchParams?: {
    date?: string;
    editTaskId?: string;
  };
};

export default async function TaskManagementPage({ searchParams }: TaskPageProps = {}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = Number(session.user.id);

  if (!userId) {
    redirect("/");
  }

  const displayName = session.user.name ?? session.user.email ?? "メンバー";
  const initialData = await getDashboardData(userId);
  const requestedDate = searchParams?.date ?? null;
  const parsedEditId = searchParams?.editTaskId ? Number(searchParams.editTaskId) : null;
  const requestedEditId = parsedEditId && !Number.isNaN(parsedEditId) ? parsedEditId : null;

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Task Management</p>
            <h1 className="mt-3 text-4xl font-semibold">
              タスク管理
              <span className="ml-2 text-lg font-normal text-white/60">こんにちは、{displayName} さん</span>
            </h1>
            <p className="mt-2 text-white/70">
              タスクの追加・編集・削除はこちらの画面でまとめて行えます。完了したらダッシュボードに戻って進捗を確認しましょう。
            </p>
          </div>
          <a
            href="/dashboard"
            className="inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
          >
            ダッシュボードへ戻る
          </a>
        </div>

        <TaskManagementContent
          statusOptions={statusOptions}
          initialData={initialData}
          onCreate={createTask}
          onUpdate={updateTask}
          onDelete={deleteTask}
          initialCreateDate={requestedDate}
          initialEditTargetId={requestedEditId}
        />
      </div>
    </div>
  );
}
