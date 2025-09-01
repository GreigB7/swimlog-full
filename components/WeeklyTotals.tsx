'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Row = {
  training_date: string;           // 'YYYY-MM-DD'
  session_type: string | null;     // e.g. 'Zwemmen (ochtend)', 'Landtraining', 'Overig'
  duration_minutes: number | null; // minutes
};

/** Parse 'YYYY-MM-DD' as a LOCAL date (no UTC shift) */
function parseLocalISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Format a Date to 'YYYY-MM-DD' in LOCAL time */
function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

/** Get Monday→Sunday bounds for the week containing isoDate (local time) */
function weekBounds(isoDate: string) {
  const base = parseLocalISO(isoDate);
  const day = base.getDay(); // 0=Sun..6=Sat
  // shift to Monday
  const monday = new Date(base);
  monday.setDate(base.getDate() + (day === 0 ? -6 : 1 - day));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toYMD(monday), end: toYMD(sunday) };
}

function classify(type: string | null): 'swim' | 'land' | 'other' {
  const t = (type || '').toLowerCase();
  if (t.includes('zwem') || t.includes('swim')) return 'swim';
  if (t.includes('land')) return 'land'; // 'landtraining' etc.
  return 'other';
}

export function WeeklyTotals(props: { userId?: string; date?: string }) {
  const [userId, setUserId] = useState<string>(props.userId ?? '');
  const date = props.date ?? toYMD(new Date());
  const { start, end } = useMemo(() => weekBounds(date), [date]);

  // Resolve userId from session if not provided
  useEffect(() => {
    if (props.userId) {
      setUserId(props.userId);
      return;
    }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) setUserId(session.user.id);
    })();
  }, [props.userId]);

  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data, error } = await supabase
        .from('training_log')
        .select('training_date, session_type, duration_minutes')
        .eq('user_id', userId)
        .gte('training_date', start)
        .lte('training_date', end);

      if (error) {
        console.error('WeeklyTotals query error:', error);
        setRows([]);
        return;
      }
      setRows((data ?? []) as Row[]);
    })();
  }, [userId, start, end]);

  const { swim, land, other, total } = useMemo(() => {
    let swim = 0, land = 0, other = 0;
    for (const r of rows) {
      const minutes = r.duration_minutes ?? 0;
      const bucket = classify(r.session_type);
      if (bucket === 'swim') swim += minutes;
      else if (bucket === 'land') land += minutes;
      else other += minutes;
    }
    return { swim, land, other, total: swim + land + other };
  }, [rows]);

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-3">
        Weektotalen (ma–zo) — {start} → {end}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-slate-50 border">
          <div className="text-xs text-slate-500">Zwemmen</div>
          <div className="text-xl font-semibold">{swim} min</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border">
          <div className="text-xs text-slate-500">Landtraining</div>
          <div className="text-xl font-semibold">{land} min</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border">
          <div className="text-xs text-slate-500">Overig</div>
          <div className="text-xl font-semibold">{other} min</div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border">
          <div className="text-xs text-slate-500">Totaal</div>
          <div className="text-xl font-semibold">{total} min</div>
        </div>
      </div>
    </div>
  );
}

export default WeeklyTotals;
