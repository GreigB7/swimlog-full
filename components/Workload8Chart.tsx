'use client'
import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function monday(d: Date) { const x = new Date(d); const day = x.getDay()||7; x.setDate(x.getDate()-day+1); x.setHours(0,0,0,0); return x; }
function label(weekStart: Date) {
  const w = new Date(weekStart); const y = w.getFullYear();
  const tmp = new Date(Date.UTC(w.getFullYear(), w.getMonth(), w.getDate()));
  const dow = tmp.getUTCDay()||7; tmp.setUTCDate(tmp.getUTCDate()+4-dow);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((tmp as any) - (yearStart as any)) / 86400000 + 1)/7);
  return `W${weekNo} '${String(y).slice(-2)}`;
}

export function Workload8Chart({ userId }: { userId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      if (!userId) return;
      const since = new Date(); since.setDate(since.getDate() - 7 * 8);
      const { data } = await supabase
        .from('training_log')
        .select('training_date,session_type,duration_minutes')
        .eq('user_id', userId)
        .gte('training_date', since.toISOString().slice(0,10));
      setRows(data ?? []);
    })();
  }, [userId]);

  const data = useMemo(() => {
    const map = new Map<number, { label: string; Zwemmen: number; Landtraining: number; Overig: number }>();
    for (const r of rows) {
      const dstr = r.training_date as string;
      const dur = Number(r.duration_minutes) || 0;
      if (!dstr || !dur) continue;

      const d = new Date(dstr + 'T00:00:00');
      const m = +monday(d);
      if (!map.has(m)) map.set(m, { label: label(new Date(m)), Zwemmen: 0, Landtraining: 0, Overig: 0 });
      const obj = map.get(m)!;

      const t = (r.session_type || '').toLowerCase();
      if (t.includes('swim')) obj.Zwemmen += dur;
      else if (t.includes('land')) obj.Landtraining += dur;
      else obj.Overig += dur;
    }
    return Array.from(map.entries()).sort((a,b)=>a[0]-b[0]).map(([,v])=>v);
  }, [rows]);

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Werkbelasting (8 weken)</h3>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Zwemmen"     name="Zwemmen"     fill="#10b981" />
            <Bar dataKey="Landtraining" name="Landtraining" fill="#8b5cf6" />
            <Bar dataKey="Overig"       name="Overig"       fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
