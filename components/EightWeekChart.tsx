'use client'
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type TRow = { training_date: string; session_type: string | null; duration_minutes: number | null; };

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

export function EightWeekChart({ userId }: { userId: string }) {
  const [rows, setRows] = useState<TRow[]>([]);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      const since = new Date(); since.setDate(since.getDate()-56);
      const sinceStr = since.toISOString().slice(0,10);
      const { data } = await supabase
        .from('training_log')
        .select('training_date, session_type, duration_minutes')
        .eq('user_id', userId)
        .gte('training_date', sinceStr)
        .order('training_date', { ascending: true });
      setRows(data ?? []);
    })();
  }, [userId]);

  const chartData = useMemo(() => {
    const map = new Map<string, { week: string; swim: number; land: number; other: number }>();
    for (const r of rows) {
      if (!r.training_date || !r.duration_minutes) continue;
      const d = new Date(r.training_date + "T00:00:00");
      const label = weekLabel(d);
      if (!map.has(label)) map.set(label, { week: label, swim:0, land:0, other:0 });
      const obj = map.get(label)!;
      const t = (r.session_type || '').toLowerCase();
      if (t === 'morning swim' || t === 'afternoon swim') obj.swim += r.duration_minutes;
      else if (t === 'land training') obj.land += r.duration_minutes;
      else obj.other += r.duration_minutes;
    }
    return Array.from(map.values());
  }, [rows]);

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-2">Weekly Totals (last 8 weeks)</h2>
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
              {/* Three separate bars per week */}
              <Bar dataKey="swim" name="Swim (min)" />
              <Bar dataKey="land" name="Land (min)" />
              <Bar dataKey="other" name="Other (min)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
