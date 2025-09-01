'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TrainRow = {
  training_date: string;             // DATE column in Supabase
  session_type: string | null;
  duration_minutes: number | null;
};

function fmt(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Monday–Sunday bounds in LOCAL time for the week containing dateISO */
function weekBoundsMonSun(dateISO: string) {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setHours(0, 0, 0, 0);
  // JS: 0=Sun..6=Sat. Convert to 0=Mon..6=Sun
  const dayMon0 = (d.getDay() + 6) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - dayMon0);          // Monday
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);              // Sunday
  end.setHours(23, 59, 59, 999);

  return { startStr: fmt(start), endStr: fmt(end) };
}

export function WeeklyTotals({ userId, date }: { userId: string; date: string }) {
  const { startStr, endStr } = useMemo(() => weekBoundsMonSun(date), [date]);

  const [rows, setRows] = useState<TrainRow[]>([]);
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from('training_log')
        .select('training_date, session_type, duration_minutes')
        .eq('user_id', userId)
        .gte('training_date', startStr)
        .lte('training_date', endStr);
      setRows(data ?? []);
    })();
  }, [userId, startStr, endStr]);

  const totals = useMemo(() => {
    let swim = 0, land = 0, other = 0;
    for (const r of rows) {
      const mins = Number(r.duration_minutes) || 0;
      const t = (r.session_type || '').toLowerCase();
      if (t.includes('zwemmen')) swim += mins;            // “Zwemmen (ochtend|middag)”
      else if (t.includes('landtraining')) land += mins;  // “Landtraining”
      else other += mins;                                 // “Overig”
    }
    return { swim, land, other, total: swim + land + other };
  }, [rows]);

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">
        Weektotalen (ma–zo) — {startStr} → {endStr}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-slate-50 border">
          <div className="text-sm text-slate-500">Zwemmen</div>
          <div className="text-2xl font-semibold">{totals.swim} min</div>
        </div>
        <div className="p-4 rounded-lg bg-slate-50 border">
          <div className="text-sm text-slate-500">Landtraining</div>
          <div className="text-2xl font-semibold">{totals.land} min</div>
        </div>
        <div className="p-4 rounded-lg bg-slate-50 border">
          <div className="text-sm text-slate-500">Overig</div>
          <div className="text-2xl font-semibold">{totals.other} min</div>
        </div>
        <div className="p-4 rounded-lg bg-slate-50 border">
          <div className="text-sm text-slate-500">Totaal</div>
          <div className="text-2xl font-semibold">{totals.total} min</div>
        </div>
      </div>
    </div>
  );
}

