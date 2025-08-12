'use client'
import { useEffect, useState } from 'react';
import { TechniquePlanViewer } from '@/components/TechniquePlanViewer';

export default function CoachPlanPrintPage({
  searchParams,
}: {
  searchParams: { userId?: string };
}) {
  const userId = searchParams?.userId ?? '';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setReady(true);
    setTimeout(() => {
      try { window.print(); } catch {}
    }, 800);
    const handler = () => window.close();
    window.addEventListener('afterprint', handler);
    return () => window.removeEventListener('afterprint', handler);
  }, [userId]);

  if (!userId) return <div className="card">Geen zwemmer opgegeven.</div>;

  return (
    <div className="p-4 print:p-0">
      <div className="print:hidden mb-3 text-sm text-slate-600">
        Dit is een printweergave. De afdrukdialoog zou nu moeten openen.
      </div>
      <TechniquePlanViewer userId={userId} />
    </div>
  );
}
