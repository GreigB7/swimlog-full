'use client'
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { WeekControls } from "@/components/WeekControls";
import { WeeklyTables } from "@/components/WeeklyTables";
import { EightWeekChart } from "@/components/EightWeekChart";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Profile = { id: string; email: string | null; username: string | null; role: string | null; };

export default function CoachPage() {
  const [swimmers, setSwimmers] = useState<Profile[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [mode, setMode] = useState<'week'|'8weeks'>('week');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('id,email,username,role');
      const list = (data ?? []).filter((p:any)=>p.role==='swimmer') as Profile[];
      setSwimmers(list);
      if (list[0]) setUserId(list[0].id);
    })();
  }, []);

  return (
    <div className="vstack gap-6">
      <div className="card">
        <h1 className="text-xl font-semibold">Coach Dashboard</h1>
        <p className="text-sm text-slate-600">Read-only. Select a swimmer and view by week or last 8 weeks.</p>
        <div className="mt-3">
          <label className="label">Swimmer</label>
          <select value={userId} onChange={e=>setUserId(e.target.value)} className="w-80">
            {swimmers.map(s => <option key={s.id} value={s.id}>{s.username || s.email}</option>)}
          </select>
        </div>
      </div>
      <WeekControls mode={mode} setMode={setMode} date={date} setDate={setDate} />
      {mode === 'week' ? <WeeklyTables userId={userId} canEdit={false} date={date} /> : <EightWeekChart userId={userId} />}
    </div>
  );
}
