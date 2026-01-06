import type { TaskStatus } from "@prisma/client";

type CalendarTask = {
  id: number;
  title: string;
  status: TaskStatus;
};

type CalendarDay = {
  date: string;
  label: string;
  isToday: boolean;
  isHoliday: boolean;
  holidayName?: string;
  tasks: CalendarTask[];
};

type TaskCalendarProps = {
  weeks: CalendarDay[][];
};

const statusColors: Record<TaskStatus, string> = {
  TODO: "bg-slate-500",
  IN_PROGRESS: "bg-amber-400",
  DONE: "bg-emerald-400",
};

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

export default function TaskCalendar({ weeks }: TaskCalendarProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Schedule</p>
          <h2 className="text-2xl font-semibold text-white">カレンダー</h2>
          <p className="text-sm text-white/60">今週以降5週間の予定を確認できます。</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-7 text-center text-xs font-semibold uppercase text-white/60">
        {weekdayLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="mt-2 space-y-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-2">
            {week.map((day) => {
              const baseClass = day.isToday
                ? "bg-emerald-500/20 ring-2 ring-emerald-300"
                : day.isHoliday
                ? "bg-rose-500/10"
                : "bg-slate-950/40";
              const badgeText = day.isToday ? "今日" : day.holidayName ?? (day.isHoliday ? "休日" : null);
              const badgeClass = day.isToday ? "text-emerald-300" : "text-rose-300";
              return (
                <div
                  key={day.date}
                  className={`min-h-[110px] rounded-2xl border border-white/10 px-3 py-2 text-sm ${baseClass}`}
                >
                  <div className="flex items-center justify-between text-xs text-white">
                    <span>{day.label}</span>
                    {badgeText && <span className={badgeClass}>{badgeText}</span>}
                  </div>
                  <div className="mt-2 space-y-1">
                    {day.tasks.length === 0 ? (
                      <p className="text-[10px] text-white/30">予定なし</p>
                    ) : (
                    day.tasks.slice(0, 2).map((task) => (
                      <div key={task.id} className="flex items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusColors[task.status]}`}
                          aria-hidden
                        />
                        <p className="truncate text-xs text-white/90">{task.title}</p>
                      </div>
                    ))
                  )}
                  {day.tasks.length > 2 && (
                    <p className="text-[10px] text-white/50">+{day.tasks.length - 2} 件</p>
                  )}
                </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
