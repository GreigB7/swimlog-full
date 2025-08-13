'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// If WeeklyTotals is a default export, use: import WeeklyTotals from '@/components/WeeklyTotals';
import { WeeklyTotals } from '@/components/WeeklyTotals';
import { Workload8Chart } from '@/components/Workload8Chart';

import TrainingTypePieWeek from '@/components/TrainingTypePieWeek';
import TrainingEffortPerDay from '@/components/TrainingEffortPerDay';
import RhrWeekLine from '@/components/RhrWeekLine';
import RhrHistoryWithTraining from '@/components/RhrHistoryWithTraining';
import { HeightHistory, WeightHistory } from '@/components/BodyHistory';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
type Person = { id: string; username: string | null; email: string | null };
type ViewMode = 'week' | '8weeks';

export default function CoachDashboardPage() {
  const [isCoach, setIsCoach] = useState(false);
  const [swimmers, setSwimmers] = useState<Person[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [dateISO, setDateISO] = useState<string>(new Date().toISOString().slice(0,10));
  const [mode, setMode] = useState<ViewMode>('week');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    (async () => {
      setLoading(true); setMsg('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      const me = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
      const coach = (me.data?.role || '').toLowerCase() === 'coach';
      setIsCoach(coach);
      if (!coach) { setLoading(false); return; }

      const { data, error } = await supabase.from('profiles').select('id,username,email').eq('role','swimmer');
      if (error) { setMsg(error.message); setLoading(false); return; }
      const sorted = (data ?? []).sort((a,b)=>(a.username||a.email||'').localeCompare(b.username||b.email||''));
      setSwimmers(sorted); setSelected(sorted[0]?.id || '');
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="card">Laden…</div>;
  if (!isCoach) return (
    <div className="card">
      <h1 className="text-xl font-semibold">Coach dashboard</h1>
      <p className="text-sm text-slate-600">Alleen toegankelijk voor coaches.</p>
    </div>
  );

  return (
    <div className="vstack gap-6">
      <div className="card">
        <p className="text-sm text-slate-600 mb-3">Alleen lezen. Kies een zwemmer en bekijk per week of de laatste 8 weken.</p>
        <div className="grid gap-3 sm:grid-cols-2 items-end">
          <div>
            <label className="label">Zwemmer</label>
            <select className="w-full" value={selected} onChange={(e)=>setSelected(e.target.value)}>
              {swimmers.map(s => <option key={s.id} value={s.id}>{s.username || s.email || s.id}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button className={`btn ${mode==='week'?'bg-slate-900 text-white':''}`} onClick={()=>setMode('week')}>Week</button>
            <button className={`btn ${mode==='8weeks'?'bg-slate-900 text-white':''}`} onClick={()=>setMode('8weeks')}>Laatste 8 weken</button>
          </div>
        </div>

        {mode==='week' && (
          <div className="mt-4">
            <label className="label">Referentiedatum (valt binnen de week)</label>
            <input type="date" className="w-full sm:w-auto" value={dateISO} onChange={(e)=>setDateISO(e.target.value)} />
          </div>
        )}
        {msg && <div className="mt-2 text-sm text-rose-600">{msg}</div>}
      </div>

      {!selected ? (
        <div className="card">Geen zwemmer geselecteerd.</div>
      ) : mode==='week' ? (
        <>
          <WeeklyTotals userId={selected} date={dateISO} />

          <div className="grid gap-6 md:grid-cols-2">
            <TrainingTypePieWeek userId={selected} date={dateISO} />
            <TrainingEffortPerDay userId={selected} date={dateISO} />
          </div>

          <RhrWeekLine userId={selected} date={dateISO} />

          <RhrHistoryWithTraining userId={selected} endDateISO={dateISO} />

          <HeightHistory userId={selected} />
          <WeightHistory userId={selected} />
        </>
      ) : (
        <>
          <Workload8Chart userId={selected} />
        </>
      )}
    </div>
  );
}



