'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { usePersistedState } from '@/components/hooks/usePersistedState';
import { WeekControls } from '@/components/WeekControls';

import { Workload8Chart } from '@/components/Workload8Chart';
import { WeeklyTotals } from '@/components/WeeklyTotals';
import { TrainingTypeDistribution } from '@/components/TrainingTypeDistribution';
import { CoachWeekNotes } from '@/components/CoachWeekNotes';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Person = { id: string; username: string | null; email: string | null };

export default function CoachDashboardPage() {
  const [isCoach, setIsCoach] = useState(false);
  const [swimmers, setSwimmers] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string>('');

  // Persist the last-picked swimmer
  const [selected, setSelected] = usePersistedState<string>('coach:lastSwimmer', '');

  // Persisted week controls
  const [dateISO, setDateISO] = usePersistedState<string>('ui:coach:date', new Date().toISOString().slice(0, 10));
  const [show8, setShow8] = usePersistedState<boolean>('ui:coach:show8', true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg('');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      // role check
      const me = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
      const coach = (me.data?.role || '').toLowerCase() === 'coach';
      setIsCoach(coach);
      if (!coach) { setLoading(false); return; }

      // load swimmers
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email')
        .ilike('role', 'swimmer');

      if (error) {
        setMsg(error.message);
        setLoading(false);
        return;
      }

      const sorted = (data ?? []).sort((a, b) => (a.username || a.email || '').localeCompare(b.username || b.email || ''));
      setSwimmers(sorted);

      // if no stored selection yet, default to first
      if (!selected && sorted.length) setSelected(sorted[0].id);

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <h1 className="text-xl font-semibold">Coach dashboard</h1>
        <p className="text-sm text-slate-600">Kies een zwemmer en week om de gegevens te bekijken.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Zwemmer</label>
            <select
              className="w-full"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {swimmers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.username || s.email || s.id}
                </option>
              ))}
            </select>
          </div>

          {/* Week + 8-weeks toggle (persisted) */}
          <WeekControls
            scope="coach"
            onChange={(d, s8) => { setDateISO(d); setShow8(s8); }}
          />
        </div>

        {msg && <div className="mt-2 text-sm text-rose-600">{msg}</div>}
      </div>

      {/* Weekly, for chosen swimmer + date */}
      {selected ? (
        <>
          <WeeklyTotals userId={selected} date={dateISO} />
          <TrainingTypeDistribution userId={selected} date={dateISO} />
          <CoachWeekNotes swimmerId={selected} date={dateISO} />

          {/* 8-week overview */}
          {show8 && <Workload8Chart userId={selected} />}
        </>
      ) : (
        <div className="card">Geen zwemmer geselecteerd.</div>
      )}
    </div>
  );
}
