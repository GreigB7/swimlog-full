'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function weekBounds(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const dow = d.getDay() || 7;
  const start = new Date(d); start.setDate(d.getDate() - (dow - 1));
  const end = new Date(start); end.setDate(start.getDate() + 6);
  const f = (x: Date) => x.toISOString().slice(0,10);
  return { start: f(start), end: f(end), startDate: start };
}
const DOW = ['Ma','Di','Wo','Do','Vr','Za','Zo'];
const EFF = ['Groen','Wit','Rood'] as const;
const COLORS: Record<typeof EFF[number], string> = { Groen: '#22c55e', Wit: '#e5e7eb', Rood: '#ef4444' };

function normEffort(e: string): typeof EFF[number] {
  const s = (e || '').toLowerCase();
  if (/(groen|green)/.test(s)) return 'Groen';
  if (/(wit|white)/.test(s)) return 'Wit';
  return 'Rood';
}

export default function TrainingEffortPerDay({ userId, date }: { userId: string; date: string }) {
  const { start, end, startDate } = useMemo(() => weekBounds(date), [date]);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      const { data } = await supabase
        .from('training_log')
        .select('training_date,duration_minutes,effort_color')
        .eq('user_id', userId)
        .gte('training_date', start)
        .lte('training_date', end);
      setRows(data ?? []);
    })();
  }, [userId, start, end]);

  const data = useMemo(() => {
    // init Mon..Sun
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startDate); d.setDate(startDate.getDate() + i);
      return { key: d.toISOString().slice(0,10), label: DOW[i], Groen: 0, Wit: 0, Rood: 0 };
    });
    const byKey = Object.fromEntries(days.map(d => [d.key, d]));
    for (const r of rows) {
      const key = r.training_date;
      const mins = Number(r.duration_minutes) || 0;
      const e = normEffort(r.effort_color);
      if (byKey[key]) (byKey[key] as any)[e] += mins;
    }
    return days;
  }, [rows, startDate]);

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Training per dag (minuten) — op inspanning</h3>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} stackOffset="none">
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Groen" stackId="a" fill={COLORS.Groen} />
            <Bar dataKey="Wit"   stackId="a" fill={COLORS.Wit} />
            <Bar dataKey="Rood"  stackId="a" fill={COLORS.Rood} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
