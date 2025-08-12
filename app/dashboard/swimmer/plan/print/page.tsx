'use client'
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TechniquePlanViewer } from '@/components/TechniquePlanViewer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SwimmerPlanPrintPage() {
  const [userId, setUserId] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) setUserId(session.user.id);
      // give the page a moment to render, then print
      setTimeout(() => {
        try { window.print(); } catch {}
      }, 800);
      // close the tab after printing (best-effort)
      const handler = () => window.close();
      window.addEventListener('afterprint', handler);
      return () => window.removeEventListener('afterprint', handler);
    })();
  }, []);

  return (
    <div className="p-4 print:p-0">
      <div className="print:hidden mb-3 text-sm text-slate-600">
        Dit is een printweergave. De afdrukdialoog zou nu moeten openen.
      </div>
      {userId ? <TechniquePlanViewer userId={userId} /> : <div className="card">Laden…</div>}
    </div>
  );
}
