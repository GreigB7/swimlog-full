'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

import { WeeklyTotals } from '@/components/WeeklyTotals';
import { TrainingTypeDistribution } from '@/components/TrainingTypeDistribution';
import { Workload8Chart } from '@/components/Workload8Chart';
import { WeeklyTables } from '@/components/WeeklyTables';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ViewMode = 'week' | '8weeks';

export default function SwimmerDashboardPage() {
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [dateISO, setDateISO] = useState<string>(new Date().toISOString().slice(0,10));
  const [mode, setMode] = useState<ViewMode>('week');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setUserId(session.user.id);
      setEmail(session.user.email || '');
      const { data } = await supabase.from('profiles').select('username').eq('id', session.user.id).maybeSingle();
      setUsername(data?.username || '');
    })();
  }, []);

  return (
    <div className="vstack gap-6">
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold">Zwemmer dashboard</h1>
            <p className="text-sm text-slate-600">Welkom {username || email}.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className={`btn ${mode==='week' ? 'bg-slate-900 text-white' : ''}`} onClick={()=>setMode('week')}>Week</button>
            <button className={`btn ${mode==='8weeks' ? 'bg-slate-900 text-white' : ''}`} onClick={()=>setMode('8weeks')}>Laatste 8 weken</button>
          </div>
        </div>

        {/* Week selector */}
        {mode === 'week' && (
          <div className="mt-4">
            <label className="label">Week (datum in die week)</label>
            <input type="date" className="w-full sm:w-auto" value={dateISO} onChange={(e)=>setDateISO(e.target.value)} />
          </div>
        )}
      </div>

      {!userId ? (
        <div className="card">Laden…</div>
      ) : mode === 'week' ? (
        <>
          <WeeklyTotals userId={userId} date={dateISO} />
          <TrainingTypeDistribution userId={userId} date={dateISO} />

          {/* Editable weekly history */}
          <WeeklyTables userId={userId} date={dateISO} canEdit={true} />
        </>
      ) : (
        <>
          <Workload8Chart userId={userId} />
        </>
      )}
    </div>
  );
}
