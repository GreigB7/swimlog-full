'use client'
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Monday–Sunday bounds for any date in that week
function weekBounds(isoDate: string) {
  const d = new Date(isoDate + 'T00:00:00');
  const day = d.getDay() || 7; // Mon=1..Sun=7
  const start = new Date(d);
  start.setDate(d.getDate() - (day - 1));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const f = (x: Date) => x.toISOString().slice(0, 10);
  return { start: f(start), end: f(end) };
}

// Categorize Dutch/English labels → Zwemmen / Landtraining / Overig
function categorize(type: string) {
  const t = (type || '').toLowerCase();
  const isSwim = /(zwem|swim)/.test(t);
  const isLand = /(land|kracht|dry|droog|gym|core)/.test(t);
  if (isSwim) return 'Zwemmen';
  if (isLand) return 'Landtraining';
  return 'Overig';
}

// Build an array of days Mon..Sun
function daysOfWeek(isoStart: string) {
  const days: string[] = [];
  const d0 = new Date(isoStart + 'T00:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(d0);
    d.setDate(d0.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}
function shortLabel(isoDate: string) {
  const d = new Date(isoDate + 'T00:00:00');
  return ['Ma','Di','Wo','Do','Vr','Za','Zo'][ (d.getDay() || 7) - 1 ];
}

export function TrainingTypeDistribution({ userId, date }: { userId: string; date: string }) {
  const { start, end } = useMemo(() => weekBounds(date), [date]);
  const dow = useMemo(() => daysOfWeek(start), [start]);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      const { data } = await supabase
        .from('training_log')
        .select('training_date,session_type,duration_minutes')
        .eq('user_id', userId)
        .gte('training_date', start)
        .lte('training_date', end);
      setRows(data ?? []);
    })();
  }, [userId, start, end]);

  // Aggregate per day
  const data = useMemo(() => {
    const map = new Map<string, { label: string; Zwemmen: number; Landtraining: number; Overig: number }>();
    for (const day of dow) map.set(day, { label: shortLabel(day), Zwemmen: 0, Landtraining: 0, Overig: 0 });

    for (const r of rows) {
      const d = r.training_date as string;
      const dur = Number(r.duration_minutes) || 0;
      if (!d || !map.has(d)) continue;
      const cat = categorize(r.session_type || '');
      const obj = map.get(d)!;
      // @ts-ignore
      obj[cat] += dur;
    }
    return dow.map(d => map.get(d)!);
  }, [rows, dow]);

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Verdeling trainingstypes (week)</h3>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            {/* Keep the familiar colors */}
            <Bar dataKey="Zwemmen"     fill="#10b981" />
            <Bar dataKey="Landtraining" fill="#8b5cf6" />
            <Bar dataKey="Overig"       fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

