'use client'
import { useEffect, useMemo, useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { TrainingForm } from "@/components/TrainingForm";
import { RhrForm } from "@/components/RhrForm";
import { BodyForm } from "@/components/BodyForm";
import { RecentTraining } from "@/components/RecentTraining";
import { WeeklyTotals } from "@/components/WeeklyTotals";
import { CoachPanel } from "@/components/CoachPanel";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { sub.subscription.unsubscribe(); };
  }, []);

export default function DashboardIndex() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      if (!session) return;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (!error) setProfile(data);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/'); return; }
      const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      const r = (data?.role || 'swimmer') as string;
      router.replace(r === 'coach' ? '/dashboard/coach' : '/dashboard/swimmer');
    })();
  }, [session]);

  if (!session) return <div className="p-4">Please sign in.</div>;

  const isCoach = profile?.role === 'coach';

  return (
    <div className="vstack gap-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="text-sm text-slate-600">Signed in as <b>{session.user.email}</b> ({profile?.role || 'role unknown'})</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="vstack gap-6">
          <TrainingForm />
          <RhrForm />
          <BodyForm />
        </div>
        <div className="vstack gap-6">
          <RecentTraining />
          <WeeklyTotals />
        </div>
      </div>

      {isCoach && (
        <div className="card">
          <CoachPanel />
        </div>
      )}
    </div>
  );
  }, [router]);
  return <div className="p-4">Loading dashboard…</div>;
}
