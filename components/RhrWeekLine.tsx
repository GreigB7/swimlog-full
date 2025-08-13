'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function weekBounds(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const dow = d.getDay() || 7;
  const start = new Date(d); start.setDate(d.getDate() - (dow - 1));
  const end = new Date(start); end.setDate(start.getDate() + 6);
  const f = (x: Date) => x.toISOString().slice(0,10);
  return { start: f(start), end: f(end) };
}

export default function RhrWeekLine({ userId, date }: { userId: string; date: string }) {
  const { start, end } = useMemo(() => weekBounds(date), [date]);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      const { data } = await supabase
        .from('resting_hr')
        .select('entry_date,rhr_bpm,rhr')
        .eq('user_id', userId)
        .gte('entry_date', start)
        .lte('entry_date', end)
        .order('entry_date', { ascending: true });
      setRows(data ?? []);
    })();
  }, [userId, start, end]);

  const data = useMemo(() => {
    return (rows ?? []).map((r) => ({
      x: r.entry_date,
      y: r.rhr_bpm ?? r.rhr ?? null,
    })).filter((d)=>d.y!=null);
  }, [rows]);

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Rusthartslag (week)</h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="x" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="y" dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
