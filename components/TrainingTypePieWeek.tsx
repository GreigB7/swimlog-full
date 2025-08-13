'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = { userId: string; date: string };

// Mon–Sun bounds
function weekBounds(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const dow = d.getDay() || 7;
  const start = new Date(d); start.setDate(d.getDate() - (dow - 1));
  const end = new Date(start); end.setDate(start.getDate() + 6);
  const f = (x: Date) => x.toISOString().slice(0, 10);
  return { start: f(start), end: f(end) };
}

function categorize(type: string) {
  const t = (type || '').toLowerCase();
  const isSwim = /(zwem|swim)/.test(t);
  const isLand = /(land|kracht|dry|droog|gym|core)/.test(t);
  if (isSwim) return 'Zwemmen';
  if (isLand) return 'Landtraining';
  return 'Overig';
}

const COLORS = ['#3b82f6', '#f59e0b', '#94a3b8']; // blue, amber, slate

const TrainingTypePieWeek: React.FC<Props> = ({ userId, date }) => {
  const { start, end } = useMemo(() => weekBounds(date), [date]);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      const { data } = await supabase
        .from('training_log')
        .select('session_type,duration_minutes,training_date')
        .eq('user_id', userId)
        .gte('training_date', start)
        .lte('training_date', end);
      setRows(data ?? []);
    })();
  }, [userId, start, end]);

  const data = useMemo(() => {
    const sum = { Zwemmen: 0, Landtraining: 0, Overig: 0 };
    for (const r of rows) {
      const cat = categorize(r.session_type || '');
      // @ts-ignore
      sum[cat] += Number(r.duration_minutes) || 0;
    }
    return [
      { name: 'Zwemmen', value: sum.Zwemmen },
      { name: 'Landtraining', value: sum.Landtraining },
      { name: 'Overig', value: sum.Overig },
    ];
  }, [rows]);

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Verdeling trainingstypes (week)</h3>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrainingTypePieWeek;

