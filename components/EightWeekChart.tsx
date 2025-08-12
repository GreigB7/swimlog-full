'use client'
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// include effort_color now
type TRow = { training_date: string; effort_color: string | null; duration_minutes: number | null; };

function isoWeekStart(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  if (day !== 1) date.setUTCDate(date.getUTCDate() - day + 1);
  return date;
}
function weekLabel(d: Date) {
  const start = isoWeekStart(d);
  const onejan = new Date(Date.UTC(start.getUTCFullYear(),0,1));
  const week = Math.ceil((((start.getTime()-onejan.getTime())/86400000)+1)/7);
  return `W${week} '${String(start.getUTCFullYear()).slice(-2)}`;
}
function normEffort(v?: string | null) {
  const s = (v || '').trim().toLowerCase();
  if (s === 'green') return 'green';
  if (s === 'red') return 'red';
  // default bucket
  return 'white';
}

export function EightWeekChart({ userId }: { userId: string }) {
  const [rows, setRows] = useState<TRow[]>([]);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      const since = new Date(); since.setDate(since.getDate()-56);
      const sinceStr = since.toISOString().slice(0,10);
      const { data } = await supabase
        .from('training_log')
        .select('training_date, effort_color, duration_minutes')
        .eq('user_id', userId)
        .gte('training_date', sinceStr)
        .order('training_date', { ascending: true });
      setRows(data ?? []);
    })();
  }, [userId]);

  const chartData = useMemo(() => {
    const map = new Map<string, { week: string; green: number; white: number; red: number; total: number }>();
    for (const r of rows) {
      if (!r.training_date || !r.duration_minutes) continue;
      const d = new Date(r.training_date + "T00:00:00");
      const label = weekLabel(d);
      if (!map.has(label)) map.set(label, { week: label, green:0, white:0, red:0, total:0 });
      const obj = map.get(label)!;
      const e = normEffort(r.effort_color);
      obj[e as 'green'|'white'|'red'] += r.duration_minutes;
      obj.total += r.duration_minutes;
    }
    return Array.from(map.values());
  }, [rows]);

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-2">Weekly Totals by Effort (last 8 weeks)</h2>
      {!chartData.length ? (
        <div className="text-sm text-slate-600">No data yet.</div>
      ) : (
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              {/* Effort colors */}
              <Bar dataKey="green" stackId="effort" name="Green" fill="#22c55e" />
              <Bar dataKey="white" stackId="effort" name="White" fill="#e5e7eb" stroke="#9ca3af" />
              <Bar dataKey="red"   stackId="effort" name="Red"   fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
