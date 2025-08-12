'use client'
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type RhrRow = { entry_date: string; resting_heart_rate: number | null; };
type BodyRow = { entry_date: string; height_cm: number | null; weight_kg: number | null; };

export function AllTimeTrends({ userId }: { userId: string }) {
  const [rhr, setRhr] = useState<RhrRow[]>([]);
  const [body, setBody] = useState<BodyRow[]>([]);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      const r = await supabase.from('resting_hr_log')
        .select('entry_date, resting_heart_rate')
        .eq('user_id', userId).order('entry_date', { ascending: true });
      setRhr(r.data ?? []);

      const b = await supabase.from('body_metrics_log')
        .select('entry_date, height_cm, weight_kg')
        .eq('user_id', userId).order('entry_date', { ascending: true });
      setBody(b.data ?? []);
    })();
  }, [userId]);

  const rhrData = useMemo(() => rhr.map(x => ({ date: x.entry_date, rhr: x.resting_heart_rate || null })), [rhr]);
  const heightData = useMemo(() => body.filter(b=>b.height_cm!=null).map(x => ({ date: x.entry_date, height: x.height_cm })), [body]);
  const weightData = useMemo(() => body.filter(b=>b.weight_kg!=null).map(x => ({ date: x.entry_date, weight: x.weight_kg })), [body]);

  return (
    <div className="vstack gap-6">
      <div className="card">
        <h3 className="font-semibold mb-2">All-time Resting HR</h3>
        {rhrData.length ? (
          <div style={{ width:'100%', height:260 }}>
            <ResponsiveContainer>
              <LineChart data={rhrData}>
                <XAxis dataKey="date" /><YAxis /><Tooltip />
                <Line type="monotone" dataKey="rhr" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <div className="text-sm text-slate-600">No RHR data yet.</div>}
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">All-time Height</h3>
        {heightData.length ? (
          <div style={{ width:'100%', height:260 }}>
            <ResponsiveContainer>
              <LineChart data={heightData}>
                <XAxis dataKey="date" /><YAxis /><Tooltip />
                <Line type="monotone" dataKey="height" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <div className="text-sm text-slate-600">No height entries yet.</div>}
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">All-time Weight</h3>
        {weightData.length ? (
          <div style={{ width:'100%', height:260 }}>
            <ResponsiveContainer>
              <LineChart data={weightData}>
                <XAxis dataKey="date" /><YAxis /><Tooltip />
                <Line type="monotone" dataKey="weight" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <div className="text-sm text-slate-600">No weight entries yet.</div>}
      </div>
    </div>
  );
}
