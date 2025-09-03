'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Profile = { id: string; username: string | null; email: string | null; role: string | null };
type GoalRow = { season_year: number; goal_text: string };

const thisYear = () => new Date().getFullYear();

export default function GoalsPage() {
  const [sessionUserId, setSessionUserId] = useState('');
  const [role, setRole] = useState<'swimmer' | 'coach' | 'unknown'>('unknown');

  // Coach can pick swimmer; swimmer views own
  const [swimmers, setSwimmers] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  // Year + goal text
  const [year, setYear] = useState<number>(thisYear());
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Load session + role + swimmers (if coach)
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const id = session?.user?.id || '';
      setSessionUserId(id);
      if (!id) return;

      const { data: me } = await supabase
        .from('profiles')
        .select('id,username,email,role')
        .eq('id', id)
        .maybeSingle();

      const r = (me?.role || 'swimmer') as 'swimmer' | 'coach';
      setRole(r);

      if (r === 'coach') {
        const { data: list } = await supabase
          .from('profiles')
          .select('id,username,email,role')
          .eq('role', 'swimmer')
          .order('username', { ascending: true });

        const arr = (list ?? []) as Profile[];
        setSwimmers(arr);
        if (arr[0]?.id) setSelectedUserId(arr[0].id);
      } else {
        setSelectedUserId(id);
      }
    })();
  }, []);

  const viewingUserId = useMemo(
    () => (role === 'coach' ? selectedUserId : sessionUserId),
    [role, selectedUserId, sessionUserId]
  );

  // Load goal for selected user + year
  useEffect(() => {
    (async () => {
      setGoal('');
      setMsg('');
      if (!viewingUserId || !year) return;

      const { data, error } = await supabase
        .from('goals_yearly')
        .select('season_year, goal_text')
        .eq('user_id', viewingUserId)
        .eq('season_year', year)
        .maybeSingle();

      if (error) {
        console.error(error);
        setGoal('');
        return;
      }
      setGoal((data?.goal_text ?? '') as string);
    })();
  }, [viewingUserId, year]);

  const canEdit = role === 'swimmer' && viewingUserId === sessionUserId;

  async function save() {
    if (!canEdit || !sessionUserId) return;
    setLoading(true);
    setMsg('');
    const { error } = await supabase
      .from('goals_yearly')
      .upsert({ user_id: sessionUserId, season_year: year, goal_text: goal });
    setLoading(false);
    setMsg(error ? `Fout: ${error.message}` : 'Opgeslagen!');
  }

  return (
    <div className="vstack gap-6">
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold">Doelen (jaar)</h1>
            <p className="text-sm text-slate-600">
              {role === 'coach'
                ? 'Selecteer een zwemmer en bekijk het jaardoel.'
                : 'Vul je jaardoel in. Je coach kan dit bekijken.'}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {role === 'coach' && (
            <div>
              <label className="label">Zwemmer</label>
              <select
                className="w-full"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                {swimmers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.username || s.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Jaar</label>
            <input
              type="number"
              className="w-full"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value || String(thisYear()), 10))}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Jaardoel</h3>
        <textarea
          className="w-full min-h-[200px]"
          placeholder="Beschrijf het hoofddoel, subdoelen en meetmomenten."
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          disabled={!canEdit}
        />
        <div className="mt-3 flex items-center gap-2">
          {canEdit ? (
            <button className="btn" onClick={save} disabled={loading}>
              {loading ? 'Opslaan…' : 'Opslaan'}
            </button>
          ) : (
            <span className="text-sm text-slate-500">Alleen-lezen (coachweergave)</span>
          )}
          {msg && <span className="text-sm">{msg}</span>}
        </div>
      </div>
    </div>
  );
}
