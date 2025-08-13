'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

import { WeeklyTotals } from '@/components/WeeklyTotals';
import { TrainingTypeDistribution } from '@/components/TrainingTypeDistribution';
import { Workload8Chart } from '@/components/Workload8Chart';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Person = { id: string; username: string | null; email: string | null };

export default function CoachDashboardPage() {
  const [isCoach, setIsCoach] = useState(false);
  const [swimmers, setSwimmers] = useState<Person[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [dateISO, setDateISO] = useState<string>(new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg('');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      const me = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
      const coach = (me.data?.role || '').toLowerCase() === 'coach';
      setIsCoach(coach);
      if (!coach) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email')
        .eq('role', 'swimmer');

      if (error) { setMsg(error.message); setLoading(false); return; }

      const sorted = (data ?? []).sort((a, b) => (a.username || a.email || '').localeCompare(b.username || b.email || ''));
      setSwimmers(sorted);
      setSelected(sorted[0]?.id || '');
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="card">Laden…</div>;
  if (!isCoach) {
    return (
      <div className="card">
        <h1 className="text-xl font-semibold">Coach dashboard</h1>
        <p className="text-sm text-slate-600">Alleen toegankelijk voor coaches.</p>
      </div>
    );
  }

  return (
    <div className="vstack gap-6">
      <div className="card">
        <div className="grid gap-3 sm:grid-cols-2 items-end">
          <div>
            <h1 className="text-xl font-semibold">Coach dashboard</h1>
            <p className="text-sm text-slate-600">Kies een zwemmer en bekijk de gegevens.</p>
          </div>
          <div>
            <label className="label">Zwemmer</label>
            <select className="w-full" value={selected} onChange={(e)=>setSelected(e.target.value)}>
              {swimmers.map((s) => (
                <option key={s.id} value={s.id}>{s.username || s.email || s.id}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Week (datum in die week)</label>
            <input
              type="date"
              className="w-full sm:w-auto"
              value={dateISO}
              onChange={(e)=>setDateISO(e.target.value)}
            />
          </div>
        </div>

        {msg && <div className="mt-2 text-sm text-rose-600">{msg}</div>}
      </div>

      {!selected ? (
        <div className="card">Geen zwemmer geselecteerd.</div>
      ) : (
        <>
          {/* Weekly summary numbers */}
          <WeeklyTotals userId={selected} date={dateISO} />

          {/* Weekly distribution (bars per day) */}
          <TrainingTypeDistribution userId={selected} date={dateISO} />

          {/* 8-week workload grouped bars */}
          <Workload8Chart userId={selected} />
        </>
      )}
    </div>
  );
}


