'use client'
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { PieChart, Pie, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend, LineChart, Line } from "recharts";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type TrainRow = { training_date: string; session_type: string | null; effort_color: string | null; duration_minutes: number | null; };
type RhrRow   = { entry_date: string; resting_heart_rate: number | null; };

function weekBounds(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  const day = d.getDay() || 7; // Monday = 1
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

  // Pie: total minutes by type (unchanged)
  const pieData = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of train) {
      if (!r.duration_minutes) continue;
      const key = r.session_type || 'Other';
      acc[key] = (acc[key] || 0) + r.duration_minutes;
    }
    return Object.entries(acc).map(([name, value]) => ({ name, value }));
  }, [train]);

  // Stacked bar by day, but now by EFFORT colors (green/white/red)
  const byDay = useMemo(() => {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const map: Record<string, { day: string; green: number; white: number; red: number }> = {};
    days.forEach(d => map[d] = { day: d, green:0, white:0, red:0 });
    for (const r of train) {
      if (!r.duration_minutes || !r.training_date) continue;
      const d = new Date(r.training_date + "T00:00:00");
      const idx = (d.getDay() || 7) - 1; // 0..6
      const e = normEffort(r.effort_color);
      map[days[idx]][e as 'green'|'white'|'red'] += r.duration_minutes;
    }
    return days.map(d => map[d]);
  }, [train]);

  // Weekly RHR line (unchanged)
  const rhrData = useMemo(() => rhr.map(r => ({ date: r.entry_date, rhr: r.resting_heart_rate || null })), [rhr]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="card">
        <h3 className="font-semibold mb-2">Training Type Distribution (week)</h3>
        {pieData.length ? (
          <div style={{ width:'100%', height:260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie dataKey="value" nameKey="name" data={pieData} outerRadius={100} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : <div className="text-sm text-slate-600">No training this week.</div>}
      </div>

      <div className="card lg:col-span-2">
        <h3 className="font-semibold mb-2">Training by Day (minutes) — by Effort</h3>
        <div style={{ width:'100%', height:260 }}>
          <ResponsiveContainer>
            <BarChart data={byDay}>
              <XAxis dataKey="day" /><YAxis /><Tooltip /><Legend />
              {/* Effort colors */}
              <Bar dataKey="green" name="Green" fill="#22c55e" stackId="effort" />
              <Bar dataKey="white" name="White" fill="#e5e7eb" stroke="#9ca3af" stackId="effort" />
              <Bar dataKey="red"   name="Red"   fill="#ef4444" stackId="effort" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card lg:col-span-3">
        <h3 className="font-semibold mb-2">Resting HR (week)</h3>
        {rhrData.length ? (
          <div style={{ width:'100%', height:260 }}>
            <ResponsiveContainer>
              <LineChart data={rhrData}>
                <XAxis dataKey="date" /><YAxis /><Tooltip />
                <Line type="monotone" dataKey="rhr" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <div className="text-sm text-slate-600">No RHR entries this week.</div>}
      </div>
    </div>
  );
}
