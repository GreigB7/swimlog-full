'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TechniquePlanEditor } from '@/components/TechniquePlanEditor';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Person = { id: string; username: string | null; email: string | null };

export default function CoachPlanPage() {
  const [isCoach, setIsCoach] = useState<boolean>(false);
  const [swimmers, setSwimmers] = useState<Person[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string>('');

  // helper to persist the last-picked swimmer without importing extra hooks
  const STORAGE_KEY = 'coach:lastSwimmer';

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg('');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      // check role
      const me = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      const coach = (me.data?.role || '').toLowerCase() === 'coach';
      setIsCoach(coach);
      if (!coach) { setLoading(false); return; }

      // load swimmers
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email')
        .eq('role', 'swimmer');

      if (error) {
        setMsg(error.message);
        setLoading(false);
        return;
      }

      const sorted = (data ?? []).sort((a, b) =>
        (a.username || a.email || '').localeCompare(b.username || b.email || '')
      );
      setSwimmers(sorted);

      // pick initial selection (persisted if possible)
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      const storedId = stored ? JSON.parse(stored) as string : '';
      const exists = sorted.find(s => s.id === storedId);

      const firstId = exists ? storedId : (sorted[0]?.id || '');
      setSelected(firstId);
      if (firstId) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(firstId)); } catch {}
      }

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onChangeSwimmer(id: string) {
    setSelected(id);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(id)); } catch {}
  }

  if (loading) {
    return <div className="card">Laden…</div>;
  }

  if (!isCoach) {
    return (
      <div className="card">
        <h1 className="text-xl font-semibold">Techniekplan — coach</h1>
        <p className="text-sm text-slate-600">Alleen toegankelijk voor coaches.</p>
      </div>
    );
  }

  return (
    <div className="vstack gap-6">
      <div className="card">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold">Techniekplan — coach</h1>
            <p className="text-sm text-slate-600">Selecteer een zwemmer om het plan te bewerken.</p>
          </div>

          {/* Print / PDF button opens the dedicated print page in a new tab */}
          {selected ? (
            <a
              href={`/dashboard/coach/plan/print?userId=${encodeURIComponent(selected)}`}
              target="_blank"
              rel="noopener"
              className="btn"
            >
              Print / PDF
            </a>
          ) : null}
        </div>

        <div className="mt-4">
          <label className="label">Zwemmer</label>
          <select
            className="w-full sm:w-auto"
            value={selected}
            onChange={(e) => onChangeSwimmer(e.target.value)}
          >
            {swimmers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.username || s.email || s.id}
              </option>
            ))}
          </select>
        </div>

        {msg && <div className="mt-2 text-sm text-rose-600">{msg}</div>}
      </div>

      {selected ? <TechniquePlanEditor swimmerId={selected} /> : (
        <div className="card">Geen zwemmer geselecteerd.</div>
      )}
    </div>
  );
}

