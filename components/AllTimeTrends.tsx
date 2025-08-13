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

// Flexible row types (support multiple column names)
type RhrRow =
  | { entry_date: string; rhr_bpm?: number | null; rhr?: number | null; resting_heart_rate?: number | null }
  | { entry_date: string; [k: string]: any };

type BodyRow = { entry_date: string; height_cm?: number | null; weight_kg?: number | null };

type TrainRow = { training_date: string; effort_color: string | null; duration_minutes: number | null };

const COLORS = {
  green: '#22c55e',
  white: '#e5e7eb',
  whiteStroke: '#9ca3af',
  red: '#ef4444',
  rhr: '#0ea5e9',
};

function coalesceRhr(row: RhrRow): number | null {
  if (row.rhr_bpm != null) return Number(row.rhr_bpm);
  if (row.resting_heart_rate != null) return Number(row.resting_heart_rate);
  if (row.rhr != null) return Number(row.rhr);
  return null;
}

function normEffort(e: string | null | undefined): 'green' | 'white' | 'red' {
  const s = (e || '').toLowerCase();
  if (/(groen|green)/.test(s)) return 'green';
  if (/(wit|white)/.test(s)) return 'white';
  return 'red';
}

export default function AllTimeTrends({ userId }: Props) {
  const [rhrRows, setRhrRows] = useState<RhrRow[]>([]);
  const [bodyRows, setBodyRows] = useState<BodyRow[]>([]);
  const [trainRows, setTrainRows] = useState<TrainRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    (async () => {
      setLoading(true);

      // --- Resting HR: try 'resting_hr' then fallback to 'resting_hr_log'
      let rhrRes = await supabase
        .from('resting_hr')
        .select('entry_date,rhr_bpm,rhr,resting_heart_rate')
        .eq('user_id', userId)
        .order('entry_date', { ascending: true });

      if (rhrRes.error && rhrRes.status !== 406) {
        // table may not exist; ignore and try alt
        rhrRes = { data: null, error: null, status: 200, statusText: 'ok', count: null } as any;
      }

      if (!rhrRes.data || rhrRes.data.length === 0) {
        const alt = await supabase
          .from('resting_hr_log')
          .select('entry_date,resting_heart_rate')
          .eq('user_id', userId)
          .order('entry_date', { ascending: true });
        if (!alt.error && alt.data) setRhrRows(alt.data as RhrRow[]);
        else setRhrRows([]);
      } else {
        setRhrRows(rhrRes.data as RhrRow[]);
      }

      // --- Body metrics: try 'body_metrics' then fallback to 'body_metrics_log'
      let bodyRes = await supabase
        .from('body_metrics')
        .select('entry_date,height_cm,weight_kg')
        .eq('user_id', userId)
        .order('entry_date', { ascending: true });

      if (bodyRes.error && bodyRes.status !== 406) {
        bodyRes = { data: null, error: null, status: 200, statusText: 'ok', count: null } as any;
      }

      if (!bodyRes.data || bodyRes.data.length === 0) {
        const alt = await supabase
          .from('body_metrics_log')
          .select('entry_date,height_cm,weight_kg')
          .eq('user_id', userId)
          .order('entry_date', { ascending: true });
        if (!alt.error && alt.data) setBodyRows(alt.data as BodyRow[]);
        else setBodyRows([]);
      } else {
        setBodyRows(bodyRes.data as BodyRow[]);
      }

      // --- Training (all-time)
      const trainRes = await supabase
        .from('training_log')
        .select('training_date,effort_color,duration_minutes')
        .eq('user_id', userId)
        .order('training_date', { ascending: true });

      setTrainRows(trainRes.data ?? []);
      setLoading(false);
    })();
  }, [userId]);

  // RHR line series
  const rhrSeries = useMemo(
    () =>
      (rhrRows || [])
        .map((row) => ({ date: row.entry_date, rhr: coalesceRhr(row) }))
        .filter((d) => d.rhr != null) as { date: string; rhr: number }[],
    [rhrRows]
  );

  // Aggregate daily training hours by effort
  const dailyCombined = useMemo(() => {
    const agg = new Map<string, { date: string; green_h: number; white_h: number; red_h: number; rhr: number | null }>();

    const ensure = (date: string) => {
      if (!agg.has(date)) agg.set(date, { date, green_h: 0, white_h: 0, red_h: 0, rhr: null });
      return agg.get(date)!;
    };

    for (const tr of trainRows) {
      if (!tr.training_date || !tr.duration_minutes) continue;
      const row = ensure(tr.training_date);
      const hrs = (tr.duration_minutes || 0) / 60;
      const e = normEffort(tr.effort_color);
      if (e === 'green') row.green_h += hrs;
      else if (e === 'red') row.red_h += hrs;
      else row.white_h += hrs;
    }

    for (const rr of rhrRows) {
      const d = rr.entry_date;
      const val = coalesceRhr(rr);
      if (d && val != null) ensure(d).rhr = val;
    }

    return Array.from(agg.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [trainRows, rhrRows]);

  const heightSeries = useMemo(
    () =>
      (bodyRows || [])
        .filter((b) => b.height_cm != null)
        .map((b) => ({ date: b.entry_date, height: Number(b.height_cm) })),
    [bodyRows]
  );
  const weightSeries = useMemo(
    () =>
      (bodyRows || [])
        .filter((b) => b.weight_kg != null)
        .map((b) => ({ date: b.entry_date, weight: Number(b.weight_kg) })),
    [bodyRows]
  );

  return (
    <div className="vstack gap-6">
      {/* RHR + training hours (stacked) */}
      <div className="card">
        <h3 className="font-semibold mb-2">Rusthartslag — historie (met trainingsuren per dag en inspanning)</h3>
        {dailyCombined.length ? (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={dailyCombined}>
                <XAxis dataKey="date" />
                {/* Left Y: training hours */}
                <YAxis yAxisId="left" />
                {/* Right Y: bpm */}
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
                <Bar
                  yAxisId="left"
                  dataKey="white_h"
                  name="Wit (uur)"
                  stackId="h"
                  fill={COLORS.white}
                  stroke={COLORS.whiteStroke}
                />
                <Bar yAxisId="left" dataKey="red_h" name="Rood (uur)" stackId="h" fill={COLORS.red} />
                <Line yAxisId="right" type="monotone" dataKey="rhr" name="RHR (bpm)" dot stroke={COLORS.rhr} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-slate-600">Nog geen gegevens.</p>
        )}
      </div>

      {/* Lengte — historie */}
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
          <p className="text-sm text-slate-600">Nog geen lengtemetingen.</p>
        )}
      </div>

      {/* Gewicht — historie */}
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
          <p className="text-sm text-slate-600">Nog geen gewichtmetingen.</p>
        )}
      </div>
    </div>
  );
}


