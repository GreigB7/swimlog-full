'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
} from 'recharts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = { userId: string };

type RhrRow = { entry_date: string; resting_heart_rate: number | null };
type TrainRow = { training_date: string; effort_color: string | null; duration_minutes: number | null };
type BodyRow = { entry_date: string; height_cm: number | null; weight_kg: number | null };

const COLORS = {
  green: '#22c55e',
  white: '#e5e7eb',
  whiteStroke: '#9ca3af',
  red: '#ef4444',
  rhr: '#0ea5e9',
};

function normEffort(e: string | null | undefined): 'green' | 'white' | 'red' {
  const s = (e || '').toLowerCase();
  if (/(groen|green)/.test(s)) return 'green';
  if (/(wit|white)/.test(s)) return 'white';
  return 'red';
}

export function AllTimeTrends({ userId }: Props) {
  const [rhr, setRhr] = useState<RhrRow[]>([]);
  const [train, setTrain] = useState<TrainRow[]>([]);
  const [body, setBody] = useState<BodyRow[]>([]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const r = await supabase
        .from('resting_hr_log')
        .select('entry_date,resting_heart_rate')
        .eq('user_id', userId)
        .order('entry_date', { ascending: true });
      setRhr(r.data ?? []);

      const t = await supabase
        .from('training_log')
        .select('training_date,effort_color,duration_minutes')
        .eq('user_id', userId)
        .order('training_date', { ascending: true });
      setTrain(t.data ?? []);

      const b = await supabase
        .from('body_metrics_log')
        .select('entry_date,height_cm,weight_kg')
        .eq('user_id', userId)
        .order('entry_date', { ascending: true });
      setBody(b.data ?? []);
    })();
  }, [userId]);

  const rhrSeries = useMemo(
    () => rhr.map(x => ({ date: x.entry_date, rhr: x.resting_heart_rate ?? null })).filter(d => d.rhr != null) as { date: string; rhr: number }[],
    [rhr]
  );

  const dailyCombined = useMemo(() => {
    const agg: Record<string, { date: string; green_h: number; white_h: number; red_h: number; rhr: number | null }> = {};
    const ensure = (d: string) => (agg[d] ??= { date: d, green_h: 0, white_h: 0, red_h: 0, rhr: null });

    for (const tr of train) {
      if (!tr.training_date || !tr.duration_minutes) continue;
      const row = ensure(tr.training_date);
      const hrs = (tr.duration_minutes || 0) / 60;
      const e = normEffort(tr.effort_color);
      if (e === 'green') row.green_h += hrs;
      else if (e === 'red') row.red_h += hrs;
      else row.white_h += hrs;
    }

    for (const rr of rhrSeries) {
      const row = ensure(rr.date);
      row.rhr = rr.rhr;
    }

    return Object.values(agg).sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [train, rhrSeries]);

  const heightSeries = useMemo(
    () => body.filter(b => b.height_cm != null).map(x => ({ date: x.entry_date, height: Number(x.height_cm) })),
    [body]
  );
  const weightSeries = useMemo(
    () => body.filter(b => b.weight_kg != null).map(x => ({ date: x.entry_date, weight: Number(x.weight_kg) })),
    [body]
  );

  return (
    <div className="vstack gap-6">
      {/* RHR + Training Effort (stacked hours) */}
      <div className="card">
        <h3 className="font-semibold mb-2">Rusthartslag — historie (met trainingsuren per dag en inspanning)</h3>
        {dailyCombined.length ? (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={dailyCombined}>
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (name.includes('uur')) return [`${Number(value).toFixed(2)} uur`, ''];
                    if (name.includes('RHR')) return [`${value} bpm`, ''];
                    return [value, ''];
                  }}
                  labelFormatter={(lbl) => `Datum: ${lbl}`}
                />
                <Legend
                  payload={[
                    { value: 'Groen (uur)', type: 'square', color: COLORS.green, id: 'lg-green' },
                    { value: 'Wit (uur)', type: 'square', color: COLORS.white, id: 'lg-white' },
                    { value: 'Rood (uur)', type: 'square', color: COLORS.red, id: 'lg-red' },
                    { value: 'RHR (bpm)', type: 'line', color: COLORS.rhr, id: 'lg-rhr' },
                  ]}
                />
                <Bar yAxisId="left" dataKey="green_h" name="Groen (uur)" stackId="h" fill={COLORS.green} />
                <Bar yAxisId="left" dataKey="white_h" name="Wit (uur)" stackId="h" fill={COLORS.white} stroke={COLORS.whiteStroke} />
                <Bar yAxisId="left" dataKey="red_h" name="Rood (uur)" stackId="h" fill={COLORS.red} />
                <Line yAxisId="right" type="monotone" dataKey="rhr" name="RHR (bpm)" dot stroke={COLORS.rhr} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-sm text-slate-600">Nog geen gegevens.</div>
        )}
      </div>

      {/* Length — history */}
      <div className="card">
        <h3 className="font-semibold mb-2">Lengte — historie</h3>
        {heightSeries.length ? (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={heightSeries}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="height" name="Lengte (cm)" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-sm text-slate-600">Nog geen lengtemetingen.</div>
        )}
      </div>

      {/* Weight — history */}
      <div className="card">
        <h3 className="font-semibold mb-2">Gewicht — historie</h3>
        {weightSeries.length ? (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={weightSeries}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="weight" name="Gewicht (kg)" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-sm text-slate-600">Nog geen gewichtmetingen.</div>
        )}
      </div>
    </div>
  );
}

export default AllTimeTrends;


