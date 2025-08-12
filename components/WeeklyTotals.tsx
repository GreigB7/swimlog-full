'use client'
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Row = {
  training_date: string;
  session_type: string | null;
  duration_minutes: number | null;
};

function weekBounds(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  const day = d.getDay() || 7; // Monday = 1
  const start = new Date(d);
  start.setDate(d.getDate() - (day - 1));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const toStr = (x: Date) => x.toISOString().slice(0, 10);
  return { start: toStr(start), end: toStr(end) };
}

// Props are now OPTIONAL. If missing, we resolve them inside.
export function WeeklyTotals({
  userId: userIdProp,
  date: dateProp,
}: {
  userId?: string;
  date?: string;
}) {
  const [userId, setUserId] = useState<string>(userIdProp ?? "");
  const date = dateProp ?? new Date().toISOString().slice(0, 10);
  const { start, end } = useMemo(() => weekBounds(date), [date]);

  // If userId not provided, get it from the current session.
  useEffect(() => {
    if (userIdProp) {
      setUserId(userIdProp);
      return;
    }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) setUserId(session.user.id);
    })();
  }, [userIdProp]);

  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      const { data } = await supabase
        .from("training_log")
        .select("training_date, session_type, duration_minutes")
        .eq("user_id", userId)
        .gte("training_date", start)
        .lte("training_date", end);
      setRows(data ?? []);
    })();
  }, [userId, start, end]);

  const { swim, land, other, total } = useMemo(() => {
    let swim = 0, land = 0, other = 0;
    for (const r of rows) {
      const minutes = r.duration_minutes ?? 0;
      const t = (r.session_type || "").toLowerCase();
      if (t === "morning swim" || t === "afternoon swim") swim += minutes;
      else if (t === "land training") land += minutes;
      else other += minutes;
    }
    return { swim, land, other, total: swim + land + other };
  }, [rows]);

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-3">Weekly Totals (Mon–Sun)</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-slate-50 border">
          <div className="text-xs text-slate-500">Swim</div>
          <div className="text-xl font-semibold">{swim} min</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border">
          <div className="text-xs text-slate-500">Land</div>
          <div className="text-xl font-semibold">{land} min</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border">
          <div className="text-xs text-slate-500">Other</div>
          <div className="text-xl font-semibold">{other} min</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border">
          <div className="text-xs text-slate-500">Total</div>
          <div className="text-xl font-semibold">{total} min</div>
        </div>
      </div>
    </div>
  );
}
