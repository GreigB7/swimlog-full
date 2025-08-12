'use client'
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Row = {
  training_date: string;
  session_type: string | null;
  duration_minutes: number | null;
  effort_color: string | null;
};

function isoWeekStart(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  if (day !== 1) date.setUTCDate(date.getUTCDate() - day + 1);
  return date;
}
function weekLabel(d: Date) {
  const start = isoWeekStart(d);
  const onejan = new Date(Date.UTC(start.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((start.getTime() - onejan.getTime()) / 86400000) + 1) / 7);
  return `W${week} '${String(start.getUTCFullYear()).slice(-2)}`;
}

export function EightWeekChart({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [mode, setMode] = useState<'effort' | 'type'>('effort'); // toggle

  useEffect(() => {
    (async () => {
      if (!userId) return;
      const since = new Date(); since.setDate(since.getDate() - 56);
      const sinceStr = since.toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('training_log')
        .select('training_date, session_type, duration_minutes, effort_color')
        .eq('user_id', userId)
        .gte('training_date', sinceStr)
        .order('training_date', { ascending: true });
      if (!error) setRows((data ?? []) as Row[]);
    })();
  }, [userId]);

  // Modus 1: gestapeld per Inspanning (Groen / Wit / Rood)
  const byEffort = useMemo(() => {
    const map = new Map<string, { week: string; green: number; white: number; red: number; total: number }>();
    for (const r of rows) {
      if (!r.training_date || !r.duration_minutes) continue;
      const d = new Date(r.training_date + "T00:00:00");
      const label = weekLabel(d);
      if (!map.has(label)) map.set(label, { week: label, green: 0, white: 0, red: 0, total: 0 });
      const bucket = map.get(label)!;

      const e = (r.effort_color || 'white').toLowerCase();
      if (e === 'green') bucket.green += r.duration_minutes;
      else if (e === 'red') bucket.red += r.duration_minutes;
      else bucket.white += r.duration_minutes;

      bucket.total += r.duration_minutes;
    }
    return Array.from(map.values());
  }, [rows]);

  // Modus 2: gegroepeerd per Type (Zwemmen / Land / Overig)
  const byType = useMemo(() => {
    const map = new Map<string, { week: string; swim: number; land: number; other: number; total: number }>();
    for (const r of rows) {
      if (!r.training_date || !r.duration_minutes) continue;
      const d = new Date(r.training_date + "T00:00:00");
      const label = weekLabel(d);
      if (!map.has(label)) map.set(label, { week: label, swim: 0, land: 0, other: 0, total: 0 });
      const bucket = map.get(label)!;

      const t = (r.session_type || '').toLowerCase();
      if (t === 'morning swim' || t === 'afternoon swim') bucket.swim += r.duration_minutes;
      else if (t === 'land training') bucket.land += r.duration_minutes;
      else bucket.other += r.duration_minutes;

      bucket.total += r.duration_minutes;
    }
    return Array.from(map.values());
  }, [rows]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Overzicht laatste 8 weken</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Weergave:</span>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value as 'effort' | 'type')}
          >
            <option value="effort">Op inspanning (gestapeld Groen/Wit/Rood)</option>
            <option value="type">Op type (Zwemmen/Land/Overig)</option>
          </select>
        </div>
      </div>

      {mode === 'effort' ? (
        !byEffort.length ? (
          <div className="text-sm text-slate-600">Nog geen gegevens.</div>
        ) : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={byEffort}>
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip formatter={(v: any) => [`${v} min`, 'Minuten']} />
                <Legend
                  payload={[
                    { value: 'Groen (inspanning)', type: 'square', color: '#22c55e', id: 'green' },
                    { value: 'Wit (inspanning)',   type: 'square', color: '#e5e7eb', id: 'white' },
                    { value: 'Rood (inspanning)',  type: 'square', color: '#ef4444', id: 'red'   },
                  ]}
                />
                <Bar dataKey="green" stackId="effort" fill="#22c55e" name="Groen (inspanning)" />
                <Bar dataKey="white" stackId="effort" fill="#e5e7eb" stroke="#9ca3af" name="Wit (inspanning)" />
                <Bar dataKey="red"   stackId="effort" fill="#ef4444" name="Rood (inspanning)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      ) : (
        !byType.length ? (
          <div className="text-sm text-slate-600">Nog geen gegevens.</div>
        ) : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={byType}>
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip formatter={(v: any) => [`${v} min`, 'Minuten']} />
                <Legend />
                <Bar dataKey="swim"  name="Zwemmen (min)" fill="#3b82f6" />
                <Bar dataKey="land"  name="Land (min)"    fill="#f59e0b" />
                <Bar dataKey="other" name="Overig (min)"  fill="#94a3b8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      )}
    </div>
  );
}


