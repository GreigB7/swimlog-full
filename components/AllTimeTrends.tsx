'use client'
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, Legend
} from "recharts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type RhrRow = { entry_date: string; resting_heart_rate: number | null };
type TrainRow = { training_date: string; effort_color: string | null; duration_minutes: number | null };
type BodyRow = { entry_date: string; height_cm: number | null; weight_kg: number | null };

const COLORS = {
  green: '#22c55e',
  white: '#e5e7eb',
  whiteStroke: '#9ca3af',
  red:   '#ef4444',
};

export function AllTimeTrends({ userId }: { userId: string }) {
  const [rhr, setRhr] = useState<RhrRow[]>([]);
  const [train, setTrain] = useState<TrainRow[]>([]);
  const [body, setBody] = useState<BodyRow[]>([]);

  useEffect(() => {
    (async () => {
      if (!userId) return;

      const r = await supabase.from('resting_hr_log')
        .select('entry_date, resting_heart_rate')
        .eq('user_id', userId)
        .order('entry_date', { ascending: true });
      setRhr(r.data ?? []);

      const t = await supabase.from('training_log')
        .select('training_date, effort_color, duration_minutes')
        .eq('user_id', userId)
        .order('training_date', { ascending: true });
      setTrain(t.data ?? []);

      const b = await supabase.from('body_metrics_log')
        .select('entry_date, height_cm, weight_kg')
        .eq('user_id', userId)
        .order('entry_date', { ascending: true });
      setBody(b.data ?? []);
    })();
  }, [userId]);

  // --- Compose daily series: training hours by effort + RHR (bpm) ---
  const dailyCombined = useMemo(() => {
    // aggregate training minutes -> hours by date
    const agg: Record<string, { date: string; green_h: number; white_h: number; red_h: number; rhr: number | null }> = {};
    const ensure = (d: string) => (agg[d] ??= { date: d, green_h: 0, white_h: 0, red_h: 0, rhr: null });

    for (const tr of train) {
      if (!tr.training_date || !tr.duration_minutes) continue;
      const key = tr.training_date;
      const row = ensure(key);
      const hrs = (tr.duration_minutes || 0) / 60;
      const e = (tr.effort_color || 'White').toLowerCase();
      if (e === 'green') row.green_h += hrs;
      else if (e === 'red') row.red_h += hrs;
      else row.white_h += hrs;
    }

    for (const rr of rhr) {
      if (!rr.entry_date) continue;
      const row = ensure(rr.entry_date);
      row.rhr = rr.resting_heart_rate ?? null;
    }

    // sort by date asc
    return Object.values(agg).sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [train, rhr]);

  // Height/weight time series (unchanged)
  const heightData = useMemo(
    () => body.filter(b => b.height_cm != null).map(x => ({ date: x.entry_date, height: x.height_cm })),
    [body]
  );
  const weightData = useMemo(
    () => body.filter(b => b.weight_kg != null).map(x => ({ date: x.entry_date, weight: x.weight_kg })),
    [body]
  );

  return (
    <div className="vstack gap-6">
      {/* RHR + Training Effort (stacked hours) */}
      <div className="card">
        <h3 className="font-semibold mb-2">Rusthartslag — historie (met trainingsuren per dag en inspanning)</h3>
        {dailyCombined.length ? (
          <div style={{ width:'100%', height:320 }}>
            <ResponsiveContainer>
              <ComposedChart data={dailyCombined}>
                <XAxis dataKey="date" />
                {/* Left Y: hours of training */}
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
                    { value: 'Wit (uur)',   type: 'square', color: COLORS.white, id: 'lg-white' },
                    { value: 'Rood (uur)',  type: 'square', color: COLORS.red,   id: 'lg-red' },
                    { value: 'RHR (bpm)',   type: 'line',   color: '#0ea5e9',   id: 'lg-rhr' },
                  ]}
                />
                {/* Stacked bars (hours) */}
                <Bar yAxisId="left" dataKey="green_h" name="Groen (uur)" stackId="h" fill={COLORS.green} />
                <Bar yAxisId="left" dataKey="white_h" name="Wit (uur)"   stackId="h" fill={COLORS.white} stroke={COLORS.whiteStroke} />
                <Bar yAxisId="left" dataKey="red_h"   name="Rood (uur)"  stackId="h" fill={COLORS.red} />
                {/* RHR line (bpm) */}
                <Line yAxisId="right" type="monotone" dataKey="rhr" name="RHR (bpm)" dot stroke="#0ea5e9" />
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
        {heightData.length ? (
          <div style={{ width:'100%', height:260 }}>
            <ResponsiveContainer>
              <LineChart data={heightData}>
                <XAxis dataKey="date" /><YAxis /><Tooltip />
                <Line type="monotone" dataKey="height" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <div className="text-sm text-slate-600">Nog geen lengtemetingen.</div>}
      </div>

      {/* Weight — history */}
      <div className="card">
        <h3 className="font-semibold mb-2">Gewicht — historie</h3>
        {weightData.length ? (
          <div style={{ width:'100%', height:260 }}>
            <ResponsiveContainer>
              <LineChart data={weightData}>
                <XAxis dataKey="date" /><YAxis /><Tooltip />
                <Line type="monotone" dataKey="weight" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <div className="text-sm text-slate-600">Nog geen gewichtmetingen.</div>}
      </div>
    </div>
  );
}

