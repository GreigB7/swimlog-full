'use client'

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { WeekControls } from '@/components/WeekControls';
import { usePersistedState } from '@/components/hooks/usePersistedState';

import { Workload8Chart } from '@/components/Workload8Chart';
import { WeeklyTotals } from '@/components/WeeklyTotals';
import { TrainingTypeDistribution } from '@/components/TrainingTypeDistribution';
import { SwimmerWeekNotes } from '@/components/SwimmerWeekNotes';
import { WeeklyTables } from '@/components/WeeklyTables'; // editable history

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SwimmerDashboardPage() {
  const [userId, setUserId] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // Persisted week controls
  const [dateISO, setDateISO] = usePersistedState<string>('ui:swimmer:date', new Date().toISOString().slice(0, 10));
  const [show8, setShow8] = usePersistedState<boolean>('ui:swimmer:show8', true);

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

        {/* Week + 8-weeks toggle (persisted) */}
        <div className="mt-4">
          <WeekControls
            scope="swimmer"
            onChange={(d, s8) => { setDateISO(d); setShow8(s8); }}
          />
        </div>
      </div>

      {/* Weekly blocks */}
      {userId ? (
        <>
          <WeeklyTotals userId={userId} date={dateISO} />
          <TrainingTypeDistribution userId={userId} date={dateISO} />
          <SwimmerWeekNotes userId={userId} date={dateISO} />

          {/* Editable weekly history (table) */}
          <WeeklyTables userId={userId} date={dateISO} />

          {/* 8-week overview */}
          {show8 && <Workload8Chart userId={userId} />}
        </>
      ) : (
        <div className="card">Laden…</div>
      )}
    </div>
  );
}

