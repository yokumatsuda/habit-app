"use client";

import { useEffect, useMemo, useState } from "react";

type Habit = {
  id: number;
  habitKey: string;
  label: string;
  frequency: "daily" | "weekly";
  sortOrder: number;
  active: boolean;
};

type LogRow = {
  habitId: number;
  logDate: string; // YYYY-MM-DD
  status: "ok" | "partial" | "no";
};

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfWeekMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDaysISO(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

function symbol(st: "" | "ok" | "partial" | "no") {
  if (st === "ok") return "✅";
  if (st === "partial") return "△";
  if (st === "no") return "✕";
  return "";
}
function nextStatus(st: "" | "ok" | "partial" | "no") {
  if (st === "") return "ok";
  if (st === "ok") return "partial";
  if (st === "partial") return "no";
  return "";
}
function fmtDay(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const w = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${m}/${day}\n${w}`;
}

export default function HabitGrid() {
  // 4週表示の起点：今週(月曜開始)の3週前
  const [start, setStart] = useState(() => {
    const s = startOfWeekMonday(new Date());
    s.setDate(s.getDate() - 21);
    return toISODate(s);
  });

  const end = useMemo(() => addDaysISO(start, 27), [start]);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [logMap, setLogMap] = useState<Map<string, LogRow["status"]>>(
    new Map(),
  );

  const daily = useMemo(
    () => habits.filter((h) => h.frequency === "daily"),
    [habits],
  );
  const weekly = useMemo(
    () => habits.filter((h) => h.frequency === "weekly"),
    [habits],
  );

  useEffect(() => {
    (async () => {
      const hRes = await fetch("/api/habits");
      const hJson = await hRes.json();
      if (hJson.ok) setHabits(hJson.habits);

      const rRes = await fetch(`/api/logs?start=${start}&end=${end}`);
      const rJson = await rRes.json();
      if (rJson.ok) {
        const m = new Map<string, LogRow["status"]>();
        for (const row of rJson.logs as LogRow[]) {
          m.set(`${row.habitId}|${row.logDate}`, row.status);
        }
        setLogMap(m);
      }
    })();
  }, [start, end]);

  async function setCell(
    habitId: number,
    date: string,
    status: "" | "ok" | "partial" | "no",
  ) {
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, date, status: status || undefined }),
    });

    setLogMap((prev) => {
      const next = new Map(prev);
      const key = `${habitId}|${date}`;
      if (!status) next.delete(key);
      else next.set(key, status);
      return next;
    });
  }

  const days = useMemo(
    () => Array.from({ length: 28 }, (_, i) => addDaysISO(start, i)),
    [start],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200">
          {start} 〜 {end}（4週間）
        </div>
        <button
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
          onClick={() => setStart(addDaysISO(start, -28))}
        >
          ← 前の4週
        </button>
        <button
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
          onClick={() => setStart(addDaysISO(start, 28))}
        >
          次の4週 →
        </button>
        <button
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800"
          onClick={() => {
            const s = startOfWeekMonday(new Date());
            s.setDate(s.getDate() - 21);
            setStart(toISODate(s));
          }}
        >
          今日へ
        </button>

        <div className="ml-auto flex gap-2 text-xs text-slate-300">
          <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-1">
            ✅ ok
          </span>
          <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-1">
            △ partial
          </span>
          <span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-1">
            ✕ no
          </span>
        </div>
      </div>

      {/* daily grid */}
      <div className="overflow-auto rounded-2xl border border-slate-800 bg-slate-900 p-3">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `260px repeat(28, 40px)` }}
        >
          <div className="text-xs text-slate-400">習慣</div>
          {days.map((d) => (
            <div
              key={d}
              className="whitespace-pre-line text-center text-[11px] text-slate-400"
            >
              {fmtDay(d)}
            </div>
          ))}

          {daily.map((h) => (
            <div key={h.id} className="contents">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm">
                {h.label}
              </div>

              {days.map((d) => {
                const key = `${h.id}|${d}`;
                const st = (logMap.get(key) ?? "") as
                  | ""
                  | "ok"
                  | "partial"
                  | "no";
                const bg =
                  st === "ok"
                    ? "bg-emerald-500/20"
                    : st === "partial"
                      ? "bg-amber-400/20"
                      : st === "no"
                        ? "bg-rose-500/20"
                        : "bg-slate-950/30";

                return (
                  <button
                    key={key}
                    className={`h-10 rounded-xl border border-slate-800 ${bg} text-lg hover:-translate-y-[1px]`}
                    title={`${d} / ${h.label}`}
                    onClick={() => setCell(h.id, d, nextStatus(st))}
                  >
                    {symbol(st)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* weekly */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-sm font-semibold text-slate-200">
          週の目標（weekly）
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          ※ 週の開始日（月曜）に保存します（完了/未）
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, w) => {
            const weekStart = addDaysISO(start, w * 7);
            const weekEnd = addDaysISO(weekStart, 6);

            return (
              <div
                key={weekStart}
                className="rounded-2xl border border-slate-800 bg-slate-950/30 p-3"
              >
                <div className="text-xs text-slate-300">
                  週: {weekStart} 〜 {weekEnd}
                </div>

                <div className="mt-2 space-y-2">
                  {weekly.map((h) => {
                    const key = `${h.id}|${weekStart}`;
                    const st = (logMap.get(key) ?? "") as
                      | ""
                      | "ok"
                      | "partial"
                      | "no";
                    const done = st === "ok";
                    return (
                      <div
                        key={h.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="text-sm text-slate-200">{h.label}</div>
                        <button
                          className={`rounded-xl border border-slate-800 px-3 py-2 text-sm ${
                            done ? "bg-emerald-500/20" : "bg-slate-900"
                          } hover:bg-slate-800`}
                          onClick={() =>
                            setCell(h.id, weekStart, done ? "" : "ok")
                          }
                        >
                          {done ? "完了" : "未"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
