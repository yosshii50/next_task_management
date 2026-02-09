"use client";

import { useEffect, useState } from "react";

const pad = (value: number) => value.toString().padStart(2, "0");

const formatEraYear = (date: Date) => {
  const year = date.getFullYear();

  // 日本の元号をシンプルに計算。必要な範囲のみカバー。
  if (year >= 2019) {
    return `令和${year - 2018}年`;
  }
  if (year >= 1989) {
    return `平成${year - 1988}年`;
  }
  if (year >= 1926) {
    return `昭和${year - 1925}年`;
  }

  // 上記以前は西暦のまま返す
  return `${year}年`;
};

const formatDateTime = (date: Date) => {
  const eraYear = formatEraYear(date);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${eraYear} ${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export default function CurrentDateTime() {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    // 初回マウント後にのみ時間を計算して表示し、SSRとの不一致を防ぐ
    setNow(formatDateTime(new Date()));

    const intervalId = setInterval(() => {
      setNow(formatDateTime(new Date()));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80">
      <span className="text-emerald-300">現在</span>
      <span className="font-mono text-white">{now ?? "--:--:--"}</span>
    </div>
  );
}
