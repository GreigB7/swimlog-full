'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { LineChartSvg, TrainingRhrChartSvg } from '@/components/NativeCharts';

const supabase = getSupabaseBrowserClient();

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
  if (s.includes('green') || s.includes('groen')) return 'green';
  if (s.includes('white') || s.includes('wit')) return 'white';
  return 'red';
}

export function AllTimeTrends({ userId }: Props) {
  const [rhr, setRhr] = useState<RhrRow[]>([]);
  const [train, setTrain] = useState<TrainRow[]>([]);
  const [body, setBody] = useState<BodyRow[]>([]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      // RHR
      const { data: rData } = await supabase
        .from('resting_hr_log')
        .select('entry_date,resting_heart_rate')
        .eq('user_id', userId)
        .order('entry_date', { ascending: true });
      setRhr(rData ?? []);

      // Training
      const { data: tData } = await supabase
        .from('training_log')
        .select('training_date,effort_color,duration_minutes')
        .eq('user_id', userId)
        .order('training_date', { ascending: true });
      setTrain(tData ?? []);

      // Body metrics
      const { data: bData } = await supabase
        .from('body_metrics_log')
        .select('entry_date,height_cm,weight_kg')
        .eq('user_id', userId)
        .order('entry_date', { ascending: true });
      setBody(bData ?? []);
    })();
  }, [userId]);

  // RHR line series
  const rhrSeries = useMemo(
    () =>
      rhr
        .map((x) => ({ date: x.entry_date, rhr: x.resting_heart_rate ?? null }))
        .filter((d) => d.rhr != null) as { date: string; rhr: number }[],
    [rhr]
  );

  // Compose daily series: training hours by effort + RHR (bpm)
  const dailyCombined = useMemo(() => {
    const agg: Record<
      string,
      { date: string; green_h: number; white_h: number; red_h: number; rhr: number | null }
    > = {};
    const ensure = (d: string) =>
      (agg[d] ??= { date: d, green_h: 0, white_h: 0, red_h: 0, rhr: null });

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
    () =>
      body
        .filter((b) => b.height_cm != null)
        .map((x) => ({ date: x.entry_date, height: Number(x.height_cm) })),
    [body]
  );

  const weightSeries = useMemo(
    () =>
      body
        .filter((b) => b.weight_kg != null)
        .map((x) => ({ date: x.entry_date, weight: Number(x.weight_kg) })),
    [body]
  );

  return (
    <div className="vstack gap-6">
      {/* RHR + Training Effort (stacked hours) */}
      <div className="card">
        <h3 className="font-semibold mb-2">
          Rusthartslag — historie (met trainingsuren per dag en inspanning)
        </h3>
        {dailyCombined.length ? (
          <TrainingRhrChartSvg
            data={dailyCombined}
            xKey="date"
            rhrKey="rhr"
            height={320}
            barSeries={[
              { key: 'green_h', label: 'Groen (uur)', color: COLORS.green },
              { key: 'white_h', label: 'Wit (uur)', color: COLORS.white, stroke: COLORS.whiteStroke },
              { key: 'red_h', label: 'Rood (uur)', color: COLORS.red },
            ]}
          />
        ) : (
          <div className="text-sm text-slate-600">Nog geen gegevens.</div>
        )}
      </div>

      {/* Lengte — historie */}
      <div className="card">
        <h3 className="font-semibold mb-2">Lengte — historie</h3>
        {heightSeries.length ? (
          <LineChartSvg
            data={heightSeries}
            xKey="date"
            yKey="height"
            label="Lengte (cm)"
            color="#64748b"
            height={260}
            unit="cm"
          />
        ) : (
          <div className="text-sm text-slate-600">Nog geen lengtemetingen.</div>
        )}
      </div>

      {/* Gewicht — historie */}
      <div className="card">
        <h3 className="font-semibold mb-2">Gewicht — historie</h3>
        {weightSeries.length ? (
          <LineChartSvg
            data={weightSeries}
            xKey="date"
            yKey="weight"
            label="Gewicht (kg)"
            color="#14b8a6"
            height={260}
            unit="kg"
          />
        ) : (
          <div className="text-sm text-slate-600">Nog geen gewichtmetingen.</div>
        )}
      </div>
    </div>
  );
}

export default AllTimeTrends;
