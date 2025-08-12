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

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Check coach role
      const me = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
      const coach = (me.data?.role || '').toLowerCase() === 'coach';
      setIsCoach(coach);
      if (!coach) return;

      // Load swimmers
      const { data } = await supabase
        .from('profiles')
        .select('id, username, email')
        .ilike('role', 'swimmer');

      setSwimmers((data ?? []).sort((a, b) =>
        (a.username || a.email || '').localeCompare(b.username || b.email || '')
      ));
      if (data && data.length) setSelected(data[0].id);
    })();
  }, []);
{selected ? (
  <a
    href={`/dashboard/coach/plan/print?userId=${encodeURIComponent(selected)}`}
    target="_blank" rel="noopener"
    className="btn mt-3 inline-block"
  >
    Print / PDF
  </a>
) : null}
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
        <h1 className="text-xl font-semibold">Techniekplan — coach</h1>
        <div className="mt-3">
          <label className="label">Zwemmer</label>
          <select className="w-full sm:w-auto" value={selected} onChange={e=>setSelected(e.target.value)}>
            {swimmers.map(s => (
              <option key={s.id} value={s.id}>
                {s.username || s.email || s.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selected ? <TechniquePlanEditor swimmerId={selected} /> : null}
    </div>
  );
}
