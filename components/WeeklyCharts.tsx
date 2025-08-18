'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis,
  LineChart, Line,
} from 'recharts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = { userId: string; date: string };

type TrainRow = {
  training_date: string;            // YYYY-MM-DD
  session_type: string | null;      // Morning Swim | Afternoon Swim | Land Training | Other Activity
  duration_minutes: number | null;  // minutes
  effort_color: string | null;      // Green | White | Red (or dutch variants)
};

type RhrRow = { entry_date: string; resting_heart_rate: number | null };

const DAY_LABELS = ['Ma','Di','Wo','Do','Vr','Za','Zo']; // Monday → Sunday

// Week bounds: Monday 00:00:00 to Sunday 23:59:59 (ISO date strings)
function weekBounds(dateISO: string) {
  const d = new Date(dateISO + 'T00:00:00');
  const js = d.getDay(); // Sun=0, Mon=1, ... Sat=6
  const offsetToMon = (js === 0 ? -6 : 1 - js);
  const start = new Date(d);
  start.setDate(d.getDate() + offsetToMon);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (x: Date) => x.toISOString().slice(0,10);
  return { start: fmt(start), end: fmt(end) };
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
    { key: 'swim' as const, name: 'Zwemmen',      value: totals.swim },
    { key: 'land' as const, name: 'Landtraining', value: totals.land },
    { key: 'other' as const, name: 'Overig',      value: totals.other },
  ]), [totals]);

  // Stacked minutes per day by effort (green/white/red) — Monday→Sunday
  const byDay = useMemo(() => {
    // build skeleton for the week
    const startDate = new Date(start + 'T00:00:00');
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const iso = d.toISOString().slice(0,10);
      return { dateISO: iso, day: DAY_LABELS[i], green: 0, white: 0, red: 0 };
    });
    const idx: Record<string, number> = {};
    days.forEach((d, i) => (idx[d.dateISO] = i));

    for (const r of train) {
      if (!r.training_date || !r.duration_minutes) continue;
      const i = idx[r.training_date];
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
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie dataKey="value" nameKey="name" data={pieData} outerRadius={100}>
                    {pieData.map((entry) => (
                      <Cell key={entry.key} fill={COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v} min`, 'Minuten']} />
                  <Legend
                    payload={[
                      { value: 'Zwemmen',      type: 'square', color: COLORS.swim,  id: 'legend-swim' },
                      { value: 'Landtraining', type: 'square', color: COLORS.land,  id: 'legend-land' },
                      { value: 'Overig',       type: 'square', color: COLORS.other, id: 'legend-other' },
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

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
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={byDay}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(v: any) => [`${v} min`, 'Minuten']} />
              <Legend />
              <Bar dataKey="green" name="Groen" fill="#22c55e" stackId="effort" />
              <Bar dataKey="white" name="Wit"   fill="#e5e7eb" stroke="#9ca3af" stackId="effort" />
              <Bar dataKey="red"   name="Rood"  fill="#ef4444" stackId="effort" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* LINE: Rusthartslag (week) */}
      <div className="card lg:col-span-3">
        <h3 className="font-semibold mb-2">Rusthartslag (week)</h3>
        {rhrData.length ? (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={rhrData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="rhr" dot stroke="#0ea5e9" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-sm text-slate-600">Nog geen RHR-gegevens voor deze week.</div>
        )}
      </div>
    </div>
  );
}

export default WeeklyCharts;
