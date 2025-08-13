'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = { userId: string };

type RhrRow = { entry_date: string; rhr_bpm?: number | null; rhr?: number | null; heart_rate?: number | null };
type BodyRow = { entry_date: string; height_cm?: number | null; weight_kg?: number | null };

function coalesceRhr(row: RhrRow): number | null {
  if (row.rhr_bpm != null) return Number(row.rhr_bpm);
  if (row.rhr != null) return Number(row.rhr);
  if (row.heart_rate != null) return Number(row.heart_rate);
  return null;
}

export function AllTimeTrends({ userId }: Props) {
  const [rhr, setRhr] = useState<{ x: string; y: number }[]>([]);
  const [height, setHeight] = useState<{ x: string; y: number }[]>([]);
  const [weight, setWeight] = useState<{ x: string; y: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    (async () => {
      setLoading(true);

      // --- Resting HR ---
      const rhrRes = await supabase
        .from('resting_hr')
        .select('entry_date,rhr_bpm,rhr,heart_rate')
        .eq('user_id', userId)
        .order('entry_date', { ascending: true });

      const rhrData =
        (rhrRes.data || [])
          .map((row: RhrRow) => ({ x: row.entry_date, y: coalesceRhr(row) }))
          .filter(d => d.y != null) as { x: string; y: number }[];

      setRhr(rhrData);

      // --- Body metrics (height & weight) ---
      const bodyRes = await supabase
        .from('body_metrics')
        .select('entry_date,height_cm,weight_kg')
        .eq('user_id', userId)
        .order('entry_date', { ascending: true });

      const body = (bodyRes.data || []) as BodyRow[];

      setHeight(body.filter(b => b.height_cm != null).map(b => ({ x: b.entry_date, y: Number(b.height_cm) })));
      setWeight(body.filter(b => b.weight_kg != null).map(b => ({ x: b.entry_date, y: Number(b.weight_kg) })));

      setLoading(false);
    })();
  }, [userId]);

  return (
    <div className="vstack gap-6">
      {/* RHR history */}
      <div className="card">
        <h3 className="font-semibold mb-2">Rusthartslag — historie</h3>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rhr}>
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="y" name="RHR (bpm)" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {(!loading && rhr.length === 0) && <p className="text-xs text-slate-500 mt-2">Geen RHR-gegevens gevonden.</p>}
      </div>

      {/* Height + Weight histories */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h3 className="font-semibold mb-2">Lengte — historie</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={height}>
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="y" name="Lengte (cm)" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {(!loading && height.length === 0) && <p className="text-xs text-slate-500 mt-2">Geen lengtegegevens.</p>}
        </div>

        <div className="card">
          <h3 className="font-semibold mb-2">Gewicht — historie</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weight}>
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="y" name="Gewicht (kg)" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {(!loading && weight.length === 0) && <p className="text-xs text-slate-500 mt-2">Geen gewichtgegevens.</p>}
        </div>
      </div>
    </div>
  );
}

export default AllTimeTrends;


