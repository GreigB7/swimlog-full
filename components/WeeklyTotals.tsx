'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  /** Supplied by dashboards. If omitted, we use the logged-in user. */
  userId?: string;
  /** Any date inside the target week (YYYY-MM-DD). If omitted, we use today. */
  date?: string;
};

type TrainRow = {
  session_type: string | null;
  duration_minutes: number | null;
  training_date: string; // date column
};

/** Monday-start week bounds (inclusive), returned as YYYY-MM-DD strings. */
function weekBoundsMonday(dateISO: string) {
  const d = new Date(dateISO);
  if (isNaN(d.getTime())) {
    const t = new Date();
    return weekBoundsMonday(t.toISOString().slice(0, 10));
  }
  // JS: 0=Sun ... 6=Sat. We want Mon..Sun.
  const jsDay = d.getDay(); // 0..6
  const daysSinceMon = (jsDay + 6) % 7; // Mon=0, Tue=1, ... Sun=6
  const start = new Date(d);
  start.setDate(d.getDate() - daysSinceMon);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

function isSwim(type?: string | null) {
  if (!type) return false;
  const t = type.toLowerCase();
  return (
    t.includes('zwem') || // "Zwemmen (ochtend/middag)"
    t.includes('morning swim') ||
    t.includes('afternoon swim') ||
    t.includes('swim')
  );
}
function isLand(type?: string | null) {
  if (!type) return false;
  const t = type.toLowerCase();
  return t.includes('land') || t.includes('strength') || t.includes('dry');
}

export function WeeklyTotals({ userId: propUserId, date: propDate }: Props) {
  const [userId, setUserId] = useState<string | null>(propUserId ?? null);
  const [dateISO, setDateISO] = useState<string>(
    propDate ?? new Date().toISOString().slice(0, 10)
  );

  // If userId not provided, resolve from current session
  useEffect(() => {
    if (propUserId) return; // already provided
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) setUserId(session.user.id);
    })();
  }, [propUserId]);

  // If parent passes a new date later, keep in sync
  useEffect(() => {
    if (propDate) setDateISO(propDate);
  }, [propDate]);

  const { start, end } = useMemo(() => weekBoundsMonday(dateISO), [dateISO]);

  const [totals, setTotals] = useState({
    swim: 0,
    land: 0,
    other: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('training_log')
        .select('session_type,duration_minutes,training_date')
        .eq('user_id', userId)
        .gte('training_date', start)
        .lte('training_date', end);

      if (error) {
        console.error('WeeklyTotals query error:', error);
        setTotals({ swim: 0, land: 0, other: 0, total: 0 });
        setLoading(false);
        return;
      }

      let swim = 0, land = 0, other = 0;
      for (const r of (data as TrainRow[])) {
        const mins = Number(r.duration_minutes || 0);
        if (!mins) continue;
        if (isSwim(r.session_type)) swim += mins;
        else if (isLand(r.session_type)) land += mins;
        else other += mins;
      }
      setTotals({ swim, land, other, total: swim + land + other });
      setLoading(false);
    })();
  }, [userId, start, end]);

  const rangeLabel = useMemo(() => {
    // "Weektotalen (ma→zo) — 2025-08-11 → 2025-08-17"
    return `Weektotalen (ma→zo) — ${start} → ${end}`;
  }, [start, end]);

  if (!userId) {
    return (
      <div className="card">
        <h3 className="font-semibold mb-2">{rangeLabel}</h3>
        <div className="text-sm text-slate-600">Log in om je weektotalen te zien.</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">{rangeLabel}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-md bg-slate-50 border">
          <div className="text-sm text-slate-500">Zwemmen</div>
          <div className="text-2xl font-semibold">
            {loading ? '…' : `${totals.swim} min`}
          </div>
        </div>

        <div className="p-4 rounded-md bg-slate-50 border">
          <div className="text-sm text-slate-500">Landtraining</div>
          <div className="text-2xl font-semibold">
            {loading ? '…' : `${totals.land} min`}
          </div>
        </div>

        <div className="p-4 rounded-md bg-slate-50 border">
          <div className="text-sm text-slate-500">Overig</div>
          <div className="text-2xl font-semibold">
            {loading ? '…' : `${totals.other} min`}
          </div>
        </div>

        <div className="p-4 rounded-md bg-slate-50 border">
          <div className="text-sm text-slate-500">Totaal</div>
          <div className="text-2xl font-semibold">
            {loading ? '…' : `${totals.total} min`}
          </div>
        </div>
      </div>
    </div>
  );
}


