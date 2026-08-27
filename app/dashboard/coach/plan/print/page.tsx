'use client'
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TechniquePlanViewer } from '@/components/TechniquePlanViewer';
import { getCurrentProfile, profileHasRole } from '@/lib/supabase';

export default function CoachPlanPrintPage() {
  return (
    <Suspense fallback={<div className="card">Laden...</div>}>
      <CoachPlanPrintContent />
    </Suspense>
  );
}

function CoachPlanPrintContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') ?? '';
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const handler = () => window.close();

    (async () => {
      if (!userId) {
        if (mounted) setLoading(false);
        return;
      }

      const { session, profile } = await getCurrentProfile();
      if (!mounted) return;

      const isCoach = Boolean(session?.user && profileHasRole(profile, 'coach'));
      setAuthorized(isCoach);
      setLoading(false);

      if (isCoach) {
        timeoutId = setTimeout(() => {
          try { window.print(); } catch {}
        }, 800);
        window.addEventListener('afterprint', handler);
      }
    })();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('afterprint', handler);
    };
  }, [userId]);

  if (!userId) return <div className="card">Geen zwemmer opgegeven.</div>;
  if (loading) return <div className="card">Laden...</div>;
  if (!authorized) return <div className="card">Alleen toegankelijk voor coaches.</div>;

  return (
    <div className="p-4 print:p-0">
      <div className="print:hidden mb-3 text-sm text-slate-600">
        Dit is een printweergave. De afdrukdialoog zou nu moeten openen.
      </div>
      <TechniquePlanViewer userId={userId} />
    </div>
  );
}
