'use client'
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  PieChart, Pie, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line, Cell
} from "recharts";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type TrainRow = { training_date: string; session_type: string | null; effort_color: string | null; duration_minutes: number | null; };
type RhrRow   = { entry_date: string; resting_heart_rate: number | null; };

function weekBounds(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  const day = d.getDay() || 7;
  const start = new Date(d); start.setDate(d.getDate() - (day - 1));
  const end = new Date(start); end.setDate(start.getDate() + 6);
  const toStr = (x: Date) => x.toISOString().slice(0,10);
  return { start: toStr(start), end: toStr(end) };
}
function normEffort(v?: string | null) {
  const s = (v || '').trim().toLowerCase();
  if (s === 'green') return 'green';
  if (s === 'red') return 'red';
  return 'white';
}

const COLORS = {
  swim: '#3b82f6', // blue
  land: '#f59e0b', // orange
  other: '#94a3b8' // slate
};

export function WeeklyCharts({ userId, date }: { userId: string, date: string }) {
  const { start, end } = useMemo(() => weekBounds(date), [date]);
  const [train, setTrain] = useState<TrainRow[]>([]);
  const [rhr, setRhr] = useState<RhrRow[]>([]);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      const t = await supabase.from('training_log')
        .select('training_date, session_type, effort_color, duration_minutes')
        .eq('user_id', userId).gte('training_date', start).lte('training_date', end)
        .order('training_date', { ascending: true });
      setTrain(t.data ?? []);

      const r = await supabase.from('resting_hr_log')
        .select('entry_date, resting_heart_rate')
        .eq('user_id', userId).gte('entry_date', start).lte('entry_date', end)
        .order('entry_date', { ascending: true });
      setRhr(r.data ?? []);
    })();
  }, [userId, start, end]);

  // Totals by type (used for both the cards and the pie)
  const totals = useMemo(() => {
    let swim = 0, land = 0, other = 0;
    for (const r of train) {
      const minutes = r.duration_minutes ?? 0;
      const t = (r.session_type || '').toLowerCase();
      if (t === 'morning swim' || t === 'afternoon swim') swim += minutes;
      else if (t === 'land training') land += minutes;
      else other += minutes;
    }
    return { swim, land, other, total: swim + land + other };
  }, [train]);

  // Pie data with explicit colors and labels
  const pieData = useMemo(() => ([
    { key: 'swim' as const, name: 'Zwemmen',     value: totals.swim },
    { key: 'land' as const, name: 'Landtraining',value: totals.land },
    { key: 'other' as const, name: 'Overig',     value: totals.other },
  ]), [totals]);

  // Stacked by effort per day (unchanged)
  const byDay = useMemo(() => {
    const days = ['Ma','Di','Wo','Do','Vr','Za','Zo'];
    const map: Record<string, { day: string; green: number; white: number; red: number }> = {};
    days.forEach(d => map[d] = { day: d, green:0, white:0, red:0 });
    for (const r of train) {
      if (!r.duration_minutes || !r.training_date) continue;
      const d = new Date(r.training_date + "T00:00:00");
      const idx = (d.getDay() || 7) - 1;
      const e = normEffort(r.effort_color);
      map[days[idx]][e as 'green'|'white'|'red'] += r.duration_minutes;
    }
    return days.map(d => map[d]);
  }, [train]);

  const rhrData = useMemo(() => rhr.map(r => ({ date: r.entry_date, rhr: r.resting_heart_rate || null })), [rhr]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* PIE: type distribution with colors & legend */}
      <div className="card">
        <h3 className="font-semibold mb-2">Verdeling trainingstypes (week)</h3>
        {(pieData[0].value + pieData[1].value + pieData[2].value) > 0 ? (
          <>
            <div style={{ width:'100%', height:260 }}>
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
                <div className="font-semibold">{totals.swim} min</div>
              </div>
              <div className="p-2 rounded-md bg-slate-50 border">
                <div className="text-xs text-slate-500">Landtraining</div>
                <div className="font-semibold">{totals.land} min</div>
              </div>
              <div className="p-2 rounded-md bg-slate-50 border">
                <div className="text-xs text-slate-500">Overig</div>
                <div className="font-semibold">{totals.other} min</div>
              </div>
              <div className="p-2 rounded-md bg-slate-50 border">
                <div className="text-xs text-slate-500">Totaal</div>
                <div className="font-semibold">{totals.total} min</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-slate-600">Geen training deze week.</div>
        )}
      </div>

      {/* BAR: minutes per day by effort (kept) */}
      <div className="card lg:col-span-2">
        <h3 className="font-semibold mb-2">Training per dag (minuten) — op inspanning</h3>
        <div style={{ width:'100%', height:260 }}>
          <ResponsiveContainer>
            <BarChart data={byDay}>
              <XAxis dataKey="day" /><YAxis />
              <Tooltip formatter={(v: any) => [`${v} min`, 'Minuten']} />
              <Legend />
              <Bar dataKey="green" name="Groen" fill="#22c55e" stackId="effort" />
              <Bar dataKey="white" name="Wit"   fill="#e5e7eb" stroke="#9ca3af" stackId="effort" />
              <Bar dataKey="red"   name="Rood"  fill="#ef4444" stackId="effort" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* LINE: weekly RHR (kept) */}
      <div className="card lg:col-span-3">
        <h3 className="font-semibold mb-2">Rusthartslag (week)</h3>
        {rhrData.length ? (
          <div style={{ width:'100%', height:260 }}>
            <ResponsiveContainer>
              <LineChart data={rhrData}>
                <XAxis dataKey="date" /><YAxis /><Tooltip />
                <Line type="monotone" dataKey="rhr" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <div className="text-sm text-slate-600">Geen RHR-metingen deze week.</div>}
      </div>
    </div>
  );
}

