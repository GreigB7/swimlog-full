'use client';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend
} from 'recharts';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const COLORS = { Groen: '#22c55e', Wit: '#e5e7eb', Rood: '#ef4444' };

function daysRange(endISO: string, days = 14) {
  const end = new Date(endISO + 'T00:00:00');
  const start = new Date(end); start.setDate(end.getDate() - (days - 1));
  const arr: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
    arr.push(d.toISOString().slice(0,10));
  }
  return { start: arr[0], end: arr[arr.length-1], days: arr };
}

function normEffort(e: string): keyof typeof COLORS {
  const s = (e || '').toLowerCase();
  if (/(groen|green)/.test(s)) return 'Groen';
  if (/(wit|white)/.test(s)) return 'Wit';
  return 'Rood';
}

export default function RhrHistoryWithTraining({ userId, endDateISO }: { userId: string; endDateISO: string }) {
  const { start, end, days } = useMemo(() => daysRange(endDateISO, 14), [endDateISO]);
  const [train, setTrain] = useState<any[]>([]);
  const [rhr, setRhr] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      const t = await supabase
        .from('training_log')
        .select('training_date,duration_minutes,effort_color')
        .eq('user_id', userId)
        .gte('training_date', start)
        .lte('training_date', end);
      setTrain(t.data ?? []);
      const h = await supabase
        .from('resting_hr')
        .select('entry_date,rhr_bpm,rhr')
        .eq('user_id', userId)
        .gte('entry_date', start)
        .lte('entry_date', end);
      setRhr(h.data ?? []);
    })();
  }, [userId, start, end]);

  const data = useMemo(() => {
    const m = new Map<string, any>();
    for (const d of days) m.set(d, { x: d, Groen: 0, Wit: 0, Rood: 0, RHR: null as number | null });

    for (const t of train) {
      const key = t.training_date as string;
      const mins = Number(t.duration_minutes) || 0;
      const e = normEffort(t.effort_color);
      if (m.has(key)) (m.get(key) as any)[e] += mins / 60; // show hours in bars
    }
    for (const h of rhr) {
      const key = h.entry_date as string;
      const val = Number(h.rhr_bpm ?? h.rhr);
      if (m.has(key)) m.get(key)!.RHR = val;
    }
    return days.map((d) => m.get(d)!);
  }, [days, train, rhr]);

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Rusthartslag — historie (met trainingsuren per dag en inspanning)</h3>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <XAxis dataKey="x" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar dataKey="Groen" yAxisId="left" stackId="a" fill={COLORS.Groen} />
            <Bar dataKey="Wit"   yAxisId="left" stackId="a" fill={COLORS.Wit} />
            <Bar dataKey="Rood"  yAxisId="left" stackId="a" fill={COLORS.Rood} />
            <Line dataKey="RHR"  yAxisId="right" dot type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
