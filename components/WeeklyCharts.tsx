'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  userId: string;
  /** Any date within the target week (YYYY-MM-DD) */
  date: string;
};

type TrainRow = {
  training_date: string;              // 'YYYY-MM-DD'
  session_type: string | null;        // "Morning Swim" | "Afternoon Swim" | "Land Training" | "Other Activity"
  duration_minutes: number | null;    // minutes
  effort_color: string | null;        // "Green" | "White" | "Red" (or dutch variants previously entered)
};

const COLORS = {
  swim: '#3b82f6',        // blauw
  land: '#a855f7',        // paars
  other: '#64748b',       // grijs
  green: '#22c55e',
  white: '#e5e7eb',
  whiteStroke: '#9ca3af',
  red:   '#ef4444',
};

const DAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']; // Monday → Sunday

function getMondayBounds(dateISO: string) {
  // Force local midnight to avoid TZ drift in SSR
  const d = new Date(dateISO + 'T00:00:00');
  // JS getDay(): Sun=0, Mon=1, ... Sat=6
  const js = d.getDay();              // 0..6
  const offsetToMonday = (js === 0 ? -6 : 1 - js); // if Sun(0), go back 6; else 1 - js
  const start = new Date(d);
  start.setDate(d.getDate() + offsetToMonday); // Monday
  const end = new Date(start);
  end.setDate(start.getDate() + 6);            // Sunday
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return { weekStart: fmt(start), weekEnd: fmt(end) };
}

function effortKey(e: string | null | undefined): 'green' | 'white' | 'red' {
  const s = (e || '').toLowerCase();
  if (s.includes('green') || s.includes('groen')) return 'green';
  if (s.includes('white') || s.includes('wit')) return 'white';
  return 'red';
}

function isSwim(session: string | null | undefined) {
  const s = (session || '').toLowerCase();
  return s.includes('morning swim') || s.includes('afternoon swim');
}
function isLand(session: string | null | undefined) {
  return (session || '').toLowerCase().includes('land');
}

export function WeeklyCharts({ userId, date }: Props) {
  const [{ weekStart, weekEnd }] = useState(() => getMondayBounds(date));
  const [rows, setRows] = useState<TrainRow[]>([]);

  // Refetch when userId or date changes
  useEffect(() => {
    const { weekStart, weekEnd } = getMondayBounds(date);
    (async () => {
      if (!userId) return;
      const { data, error } = await supabase
        .from('training_log')
        .select('training_date,session_type,duration_minutes,effort_color')
        .eq('user_id', userId)
        .gte('training_date', weekStart)
        .lte('training_date', weekEnd)
        .order('training_date', { ascending: true });

      if (!error) setRows(data ?? []);
      else setRows([]);
    })();
  }, [userId, date]);

  // Build empty week skeleton Monday..Sunday
  type DayRow = {
    dayLabel: string;    // Ma, Di, ...
    dateISO: string;     // YYYY-MM-DD
    // training-type totals (hours)
    swim_h: number;
    land_h: number;
    other_h: number;
    // effort totals (hours)
    green_h: number;
    white_h: number;
    red_h: number;
  };

  const perDay = useMemo<DayRow[]>(() => {
    const { weekStart, weekEnd } = getMondayBounds(date);

    const start = new Date(weekStart + 'T00:00:00');
    const days: DayRow[] = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateISO = d.toISOString().slice(0, 10);
      return {
        dayLabel: DAY_LABELS[i],
        dateISO,
        swim_h: 0,
        land_h: 0,
        other_h: 0,
        green_h: 0,
        white_h: 0,
        red_h: 0,
      };
    });

    // index by date for quick fill
    const idx: Record<string, number> = {};
    days.forEach((d, i) => (idx[d.dateISO] = i));

    for (const r of rows) {
      if (!r.training_date || !r.duration_minutes) continue;
      const i = idx[r.training_date];
      if (i == null) continue; // skip out-of-range
      const hrs = (r.duration_minutes || 0) / 60;

      // training-type split
      if (isSwim(r.session_type)) days[i].swim_h += hrs;
      else if (isLand(r.session_type)) days[i].land_h += hrs;
      else days[i].other_h += hrs;

      // effort split
      const ek = effortKey(r.effort_color);
      if (ek === 'green') days[i].green_h += hrs;
      else if (ek === 'red') days[i].red_h += hrs;
      else days[i].white_h += hrs;
    }

    return days;
  }, [rows, date]);

  // Weekly totals text for the first card
  const weeklyTotals = useMemo(() => {
    return perDay.reduce(
      (acc, d) => {
        acc.swim_h += d.swim_h;
        acc.land_h += d.land_h;
        acc.other_h += d.other_h;
        return acc;
      },
      { swim_h: 0, land_h: 0, other_h: 0 }
    );
  }, [perDay]);

  return (
    <div className="vstack gap-6">
      {/* Verdeling trainingstypes (week) — 3 bars per dag */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Verdeling trainingstypes (week)</h3>
          <div className="text-sm text-slate-600">
            Totaal — Zwemmen: <strong>{weeklyTotals.swim_h.toFixed(2)} uur</strong>,
            {' '}Land: <strong>{weeklyTotals.land_h.toFixed(2)} uur</strong>,
            {' '}Overig: <strong>{weeklyTotals.other_h.toFixed(2)} uur</strong>
          </div>
        </div>

        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={perDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dayLabel" />
              <YAxis />
              <Tooltip
                formatter={(v: any, name) => [`${Number(v).toFixed(2)} uur`, name]}
                labelFormatter={(lbl, payload: any) => {
                  const p = payload?.[0]?.payload as DayRow | undefined;
                  return p?.dateISO ? `Datum: ${p.dateISO} (${lbl})` : lbl;
                }}
              />
              <Legend />
              <Bar dataKey="swim_h" name="Zwemmen (uur)" fill={COLORS.swim} />
              <Bar dataKey="land_h" name="Landtraining (uur)" fill={COLORS.land} />
              <Bar dataKey="other_h" name="Overig (uur)" fill={COLORS.other} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inspanning per dag (week) — stacked green/white/red */}
      <div className="card">
        <h3 className="font-semibold mb-2">Inspanning per dag (week)</h3>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={perDay} stackOffset="expand">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dayLabel" />
              <YAxis />
              <Tooltip
                formatter={(v: any, name) => [`${Number(v).toFixed(2)} uur`, name]}
                labelFormatter={(lbl, payload: any) => {
                  const p = payload?.[0]?.payload as DayRow | undefined;
                  return p?.dateISO ? `Datum: ${p.dateISO} (${lbl})` : lbl;
                }}
              />
              <Legend payload={[
                { value: 'Groen (uur)', type: 'square', color: COLORS.green, id: 'lg-green' },
                { value: 'Wit (uur)',   type: 'square', color: COLORS.white, id: 'lg-white' },
                { value: 'Rood (uur)',  type: 'square', color: COLORS.red,   id: 'lg-red' },
              ]} />
              <Bar dataKey="green_h" name="Groen (uur)" stackId="e" fill={COLORS.green} />
              <Bar dataKey="white_h" name="Wit (uur)"   stackId="e" fill={COLORS.white} stroke={COLORS.whiteStroke} />
              <Bar dataKey="red_h"   name="Rood (uur)"  stackId="e" fill={COLORS.red} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default WeeklyCharts;
