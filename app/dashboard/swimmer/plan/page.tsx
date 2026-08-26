'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TechniquePlanViewer } from '@/components/TechniquePlanViewer';
import { getCurrentProfile, profileHasRole } from '@/lib/supabase';

export default function SwimmerPlanPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { session, profile } = await getCurrentProfile();
      if (!session?.user?.id) {
        router.replace('/');
        return;
      }
      if (profileHasRole(profile, 'coach')) {
        router.replace('/dashboard/coach/plan');
        return;
      }
      setUserId(session.user.id);
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <div className="card">Laden...</div>;

  return (
    <div className="vstack gap-6">
      <div className="card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Techniekplan</h1>
          <p className="text-sm text-slate-600">Dit is jouw techniekplan zoals ingesteld door de coach.</p>
        </div>
        <a
          href="/dashboard/swimmer/plan/print"
          target="_blank" rel="noopener"
          className="btn"
        >
          Print / PDF
        </a>
      </div>

      {userId ? <TechniquePlanViewer userId={userId} /> : null}
    </div>
  );
}
