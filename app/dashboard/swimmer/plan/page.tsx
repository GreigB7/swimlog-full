'use client'
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TechniquePlanViewer } from '@/components/TechniquePlanViewer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SwimmerPlanPage() {
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) setUserId(session.user.id);
    })();
  }, []);

  return (
    <div className="vstack gap-6">
      <div className="card">
        <h1 className="text-xl font-semibold">Techniekplan</h1>
        <p className="text-sm text-slate-600">Dit is jouw techniekplan zoals ingesteld door de coach.</p>
      </div>

      {userId ? <TechniquePlanViewer userId={userId} /> : null}
    </div>
  );
}
