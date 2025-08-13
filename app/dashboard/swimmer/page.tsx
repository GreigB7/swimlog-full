'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

import { WeeklyTotals } from '@/WeeklyTotals'; // NOTE: WeeklyTotals is at repo root
import { TrainingTypeDistribution } from '@/components/TrainingTypeDistribution';
import { Workload8Chart } from '@/components/Workload8Chart';
import { WeeklyTables } from '@/components/WeeklyTables';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SwimmerDashboardPage() {
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [dateISO, setDateISO] = useState<string>(new Date().toISOString().slice(0,10));

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
        </div>

        <div className="mt-4">
          <label className="label">Week (datum in die week)</label>
          <input
            type="date"
            className="w-full sm:w-auto"
            value={dateISO}
            onChange={(e)=>setDateISO(e.target.value)}
          />
        </div>
      </div>

      {!userId ? (
        <div className="card">Laden…</div>
      ) : (
        <>
          {/* Weekly summary numbers */}
          <WeeklyTotals userId={userId} date={dateISO} />

          {/* Weekly distribution (bars per day) */}
          <TrainingTypeDistribution userId={userId} date={dateISO} />

          {/* 8-week workload grouped bars */}
          <Workload8Chart userId={userId} />

          {/* Editable weekly history table */}
          <WeeklyTables userId={userId} date={dateISO} canEdit={true} />
        </>
      )}
    </div>
  );
}
