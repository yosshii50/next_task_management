import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import WeeklyHolidayToggle from "@/components/weekly-holiday-toggle";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const defaultWeekState = {
  sun: false,
  mon: false,
  tue: false,
  wed: false,
  thu: false,
  fri: false,
  sat: false,
} as const;

export default async function HolidaysPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = Number(session.user.id);

  if (!userId) {
    redirect("/");
  }

  const weeklyHoliday = await prisma.weeklyHoliday.findUnique({
    where: { userId },
  });

  const weeklyState = {
    sun: weeklyHoliday?.sunday ?? defaultWeekState.sun,
    mon: weeklyHoliday?.monday ?? defaultWeekState.mon,
    tue: weeklyHoliday?.tuesday ?? defaultWeekState.tue,
    wed: weeklyHoliday?.wednesday ?? defaultWeekState.wed,
    thu: weeklyHoliday?.thursday ?? defaultWeekState.thu,
    fri: weeklyHoliday?.friday ?? defaultWeekState.fri,
    sat: weeklyHoliday?.saturday ?? defaultWeekState.sat,
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto w-full max-w-3xl space-y-8 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Holiday Settings</p>
            <h1 className="mt-3 text-4xl font-semibold">休日設定</h1>
            <p className="mt-2 text-white/70">チームや組織で共有する休日情報をここで管理してください。</p>
          </div>
          <a
            href="/settings"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300 hover:text-emerald-300"
          >
            設定一覧へ戻る
          </a>
        </div>

        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">年間カレンダー</h2>
            <p className="mt-2 text-sm text-white/70">カレンダーやリストUIを追加して、休日の登録や削除ができるように実装してください。</p>
          </div>
          <WeeklyHolidayToggle initialState={weeklyState} />
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">API 連携</h2>
            <p className="mt-2 text-sm text-white/70">Google Calendar や社内システムとの連携をここに追加できます。</p>
          </div>
        </section>
      </div>
    </div>
  );
}
