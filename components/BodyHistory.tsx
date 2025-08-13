'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export function HeightHistory({ userId }: { userId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { (async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('body_metrics')
      .select('entry_date,height_cm')
      .eq('user_id', userId)
      .not('height_cm', 'is', null)
      .order('entry_date', { ascending: true });
    setRows(data ?? []);
  })(); }, [userId]);

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Lengte — historie</h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows}>
            <XAxis dataKey="entry_date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="height_cm" dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function WeightHistory({ userId }: { userId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { (async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('body_metrics')
      .select('entry_date,weight_kg')
      .eq('user_id', userId)
      .not('weight_kg', 'is', null)
      .order('entry_date', { ascending: true });
    setRows(data ?? []);
  })(); }, [userId]);

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Gewicht — historie</h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows}>
            <XAxis dataKey="entry_date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="weight_kg" dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
