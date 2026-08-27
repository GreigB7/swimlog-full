'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { DonutChart, LineChartSvg, StackedBarChart } from '@/components/NativeCharts';

const supabase = getSupabaseBrowserClient();

type Props = { userId: string; date: string };

type TrainRow = {
  training_date: string;            // YYYY-MM-DD (DATE column)
  session_type: string | null;      // Morning Swim | Afternoon Swim | Land Training | Other Activity
  duration_minutes: number | null;  // minutes
  effort_color: string | null;      // Green | White | Red (or dutch variants)
};

type RhrRow = { entry_date: string; resting_heart_rate: number | null };

const DAY_LABELS = ['Ma','Di','Wo','Do','Vr','Za','Zo']; // Monday → Sunday

// ---- SAFE local date helpers (no UTC conversion) ----
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Parse "YYYY-MM-DD" as a local date and pin to midday to avoid DST edges */
function fromISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setHours(12, 0, 0, 0);
  return dt;
}

// Week bounds: Monday -> Sunday (both returned as YYYY-MM-DD without UTC drift)
function weekBounds(dateISO: string) {
  const d = fromISO(dateISO);
  const js = d.getDay(); // Sun=0, Mon=1, ... Sat=6
  const offsetToMon = (js === 0 ? -6 : 1 - js);
  const start = new Date(d);
  start.setDate(d.getDate() + offsetToMon);
  start.setHours(12, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(12, 0, 0, 0);
  return { start: ymd(start), end: ymd(end) };
}

// Normalise effort strings (supports dutch/english)
function normEffort(v?: string | null) {
  const s = (v || '').toLowerCase();
  if (s.includes('groen') || s.includes('green')) return 'green';
  if (s.includes('wit')   || s.includes('white')) return 'white';
  return 'red';
}

// Colours for the PIE (type distribution)
const COLORS = {
  swim: '#3b82f6',  // blue
  land: '#f59e0b',  // orange
  other: '#94a3b8', // slate
};

export function WeeklyCharts({ userId, date }: Props) {
  const { start, end } = useMemo(() => weekBounds(date), [date]);

  const [train, setTrain] = useState<TrainRow[]>([]);
  const [rhr, setRhr] = useState<RhrRow[]>([]);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      const t = await supabase
        .from('training_log')
        .select('training_date, session_type, duration_minutes, effort_color')
        .eq('user_id', userId)
        .gte('training_date', start)
        .lte('training_date', end)
        .order('training_date', { ascending: true });
      setTrain(t.data ?? []);

      const h = await supabase
        .from('resting_hr_log')
        .select('entry_date, resting_heart_rate')
        .eq('user_id', userId)
        .gte('entry_date', start)
        .lte('entry_date', end)
        .order('entry_date', { ascending: true });
      setRhr(h.data ?? []);
    })();
  }, [userId, start, end]);

  // Totals by training type (minutes)
  const totals = useMemo(() => {
    let swim = 0, land = 0, other = 0;
    for (const r of train) {
      if (!r.duration_minutes) continue;
      const st = (r.session_type || '').toLowerCase();
      if (st.includes('morning swim') || st.includes('afternoon swim')) swim += r.duration_minutes;
      else if (st.includes('land')) land += r.duration_minutes;
      else other += r.duration_minutes;
    }
    return { swim, land, other, total: swim + land + other };
  }, [train]);

  // PIE data (uses colours above)
  const pieData = useMemo(() => ([
    { key: 'swim', label: 'Zwemmen',      value: totals.swim, color: COLORS.swim },
    { key: 'land', label: 'Landtraining', value: totals.land, color: COLORS.land },
    { key: 'other', label: 'Overig',      value: totals.other, color: COLORS.other },
  ]), [totals]);

  // Stacked minutes per day by effort (green/white/red) — Monday→Sunday
  const byDay = useMemo(() => {
    const startDate = fromISO(start);
    // skeleton Mon..Sun
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const iso = ymd(d); // IMPORTANT: no toISOString()
      return { dateISO: iso, day: DAY_LABELS[i], green: 0, white: 0, red: 0 };
    });
    const idx: Record<string, number> = {};
    days.forEach((d, i) => (idx[d.dateISO] = i));

    for (const r of train) {
      if (!r.training_date || !r.duration_minutes) continue;
      const i = idx[r.training_date]; // exact string match with DATE column
      if (i == null) continue;
      const k = normEffort(r.effort_color);
      days[i][k] += r.duration_minutes;
    }
    return days;
  }, [train, start]);

  // Weekly RHR line data
  const rhrData = useMemo(
    () => rhr.map(x => ({ date: x.entry_date, rhr: x.resting_heart_rate ?? null })),
    [rhr]
  );

  const hasPieValues = pieData.some(p => p.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* PIE: Verdeling trainingstypes (week) + totals cards */}
      <div className="card">
        <h3 className="font-semibold mb-2">Verdeling trainingstypes (week)</h3>
        {hasPieValues ? (
          <>
            <DonutChart data={pieData} height={260} totalLabel="Totaal" unit="min" />

            {/* Totals cards */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="p-2 rounded-md bg-slate-50 border">
                <div className="text-xs text-slate-500">Zwemmen (ochtend+middag)</div>
                <div className="text-lg font-semibold">{totals.swim} min</div>
              </div>
              <div className="p-2 rounded-md bg-slate-50 border">
                <div className="text-xs text-slate-500">Landtraining</div>
                <div className="text-lg font-semibold">{totals.land} min</div>
              </div>
              <div className="p-2 rounded-md bg-slate-50 border">
                <div className="text-xs text-slate-500">Overig</div>
                <div className="text-lg font-semibold">{totals.other} min</div>
              </div>
              <div className="p-2 rounded-md bg-slate-50 border">
                <div className="text-xs text-slate-500">Totaal</div>
                <div className="text-lg font-semibold">{totals.total} min</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-slate-600">Geen training deze week.</div>
        )}
      </div>

      {/* BAR: Training per dag (minuten) — op inspanning */}
      <div className="card lg:col-span-2">
        <h3 className="font-semibold mb-2">Training per dag (minuten) — op inspanning</h3>
        <StackedBarChart
          data={byDay}
          xKey="day"
          height={260}
          unit="min"
          series={[
            { key: 'green', label: 'Groen', color: '#22c55e' },
            { key: 'white', label: 'Wit', color: '#e5e7eb', stroke: '#9ca3af' },
            { key: 'red', label: 'Rood', color: '#ef4444' },
          ]}
        />
      </div>

      {/* LINE: Rusthartslag (week) */}
      <div className="card lg:col-span-3">
        <h3 className="font-semibold mb-2">Rusthartslag (week)</h3>
        {rhrData.length ? (
          <LineChartSvg
            data={rhrData}
            xKey="date"
            yKey="rhr"
            label="Rusthartslag"
            color="#0ea5e9"
            height={220}
            unit="bpm"
          />
        ) : (
          <div className="text-sm text-slate-600">Nog geen RHR-gegevens voor deze week.</div>
        )}
      </div>
    </div>
  );
}

export default WeeklyCharts;
