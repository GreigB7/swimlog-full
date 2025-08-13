'use client'
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

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

// Categorize Dutch/English labels
function categorize(type: string) {
  const t = (type || '').toLowerCase();
  const isSwim = /(zwem|swim)/.test(t);
  const isLand = /(land|kracht|dry|droog|gym|core)/.test(t);
  if (isSwim) return 'swim';
  if (isLand) return 'land';
  return 'other';
}

export function TrainingTypeDistribution({ userId, date }: { userId: string; date: string }) {
  const { start, end } = useMemo(() => weekBounds(date), [date]);
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

  const totals = useMemo(() => {
    let swim = 0, land = 0, other = 0;
    for (const r of rows) {
      const cat = categorize(r.session_type || '');
      const dur = Number(r.duration_minutes) || 0;
      if (cat === 'swim') swim += dur;
      else if (cat === 'land') land += dur;
      else other += dur;
    }
    return { swim, land, other };
  }, [rows]);

  const chartData = useMemo(() => ([
    { label: 'Week', Zwemmen: totals.swim, Landtraining: totals.land, Overig: totals.other }
  ]), [totals]);

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Verdeling trainingstypes (week)</h3>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Zwemmen"     stackId="a" fill="#10b981" />
            <Bar dataKey="Landtraining" stackId="a" fill="#8b5cf6" />
            <Bar dataKey="Overig"       stackId="a" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-sm">
        <div><span className="inline-block w-3 h-3 align-middle mr-2" style={{background:'#10b981'}} /> <strong>Zwemmen:</strong> {Math.round(totals.swim)} min</div>
        <div><span className="inline-block w-3 h-3 align-middle mr-2" style={{background:'#8b5cf6'}} /> <strong>Landtraining:</strong> {Math.round(totals.land)} min</div>
        <div><span className="inline-block w-3 h-3 align-middle mr-2" style={{background:'#f59e0b'}} /> <strong>Overig:</strong> {Math.round(totals.other)} min</div>
      </div>
    </div>
  );
}

