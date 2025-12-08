import { TaskStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { createTask, deleteTask, updateTask } from "@/app/dashboard/actions";
import SignOutButton from "@/components/sign-out-button";
import TaskList from "@/components/task-list";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const statusOptions = [
  { value: TaskStatus.TODO, label: "未着手" },
  { value: TaskStatus.IN_PROGRESS, label: "進行中" },
  { value: TaskStatus.DONE, label: "完了" },
];

const formatDateForInput = (date: Date) => {
  const tzOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - tzOffset * 60000);
  return localDate.toISOString().slice(0, 10);
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = Number(session.user.id);

  if (!userId) {
    redirect("/");
  }

  const displayName = session.user.name ?? session.user.email ?? "メンバー";

  const tasks = await prisma.task.findMany({
    where: { userId },
  });

  const sortedTasks = tasks.sort((a, b) => {
    const aDue = a.dueDate;
    const bDue = b.dueDate;

    if (!aDue && !bDue) {
      return a.title.localeCompare(b.title, "ja");
    }

    if (!aDue) return -1;
    if (!bDue) return 1;

    if (aDue.getTime() !== bDue.getTime()) {
      return aDue.getTime() - bDue.getTime();
    }

    return a.title.localeCompare(b.title, "ja");
  });

  const clientTasks = sortedTasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate ? formatDateForInput(task.dueDate) : null,
  }));

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Welcome back</p>
          <h1 className="mt-3 text-4xl font-semibold">
            こんにちは、<span className="text-emerald-300">{displayName}</span> さん
          </h1>
          <p className="mt-2 text-white/70">
            FlowBase へのログインが完了しました。チームの最新プロジェクトや自動化フローをここから管理できます。
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-white/60">別のアカウントでログインしたい場合はサインアウトしてください。</p>
          <SignOutButton />
        </div>

        <TaskList
          tasks={clientTasks}
          statusOptions={statusOptions}
          onCreate={createTask}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      </div>
    </div>
  );
}
