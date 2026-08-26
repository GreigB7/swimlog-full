'use client'
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getCurrentProfile, profileHasRole } from "@/lib/supabase";
import { TrainingForm } from "@/components/TrainingForm";
import { RhrForm } from "@/components/RhrForm";
import { BodyForm } from "@/components/BodyForm";
import { WeekControls } from "@/components/WeekControls";
import { WeeklyTables } from "@/components/WeeklyTables";
import { EightWeekChart } from "@/components/EightWeekChart";
import { WeeklyCharts } from "@/components/WeeklyCharts";
import { AllTimeTrends } from "@/components/AllTimeTrends";
import { WeeklyTotals } from "@/components/WeeklyTotals";
import { ExportCsv } from "@/components/ExportCsv";

type ViewMode = 'week' | '8weeks';

function getWeekBounds(dateISO: string) {
  const d = new Date(dateISO + 'T00:00:00');
  const dow = d.getDay() || 7; // Mon=1..Sun=7
  const start = new Date(d);
  start.setDate(d.getDate() - (dow - 1)); // Monday
  const end = new Date(start);
  end.setDate(start.getDate() + 6);       // Sunday
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return { weekStart: fmt(start), weekEnd: fmt(end) };
}

export default function SwimmerPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [mode, setMode] = useState<ViewMode>('week');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { session, profile } = await getCurrentProfile();
      if (!session?.user) {
        router.replace('/');
        return;
      }

      if (profileHasRole(profile, 'coach')) {
        router.replace('/dashboard/coach');
        return;
      }

      setUserId(session.user.id);
      setEmail(profile?.email || session.user.email || '');
      setUsername(profile?.username || '');
      setLoading(false);
    })();
  }, [router]);

  const { weekStart, weekEnd } = useMemo(() => {
    if (mode === 'week') return getWeekBounds(date);
    // last 8 weeks ending on selected date
    const end = new Date(date + 'T00:00:00');
    const start = new Date(end);
    start.setDate(start.getDate() - (8 * 7 - 1)); // inclusive 56-day window
    const fmt = (x: Date) => x.toISOString().slice(0, 10);
    return { weekStart: fmt(start), weekEnd: fmt(end) };
  }, [mode, date]);

  if (loading) return <div className="card">Laden...</div>;

  return (
    <div className="vstack gap-6 pb-24">
      {/* Header */}
      <div className="card">
        <h1 className="text-xl font-semibold">Dashboard zwemmer</h1>
        <p className="text-sm text-slate-600">
          Bekijk je gegevens per week of de laatste 8 weken. Je kunt fouten direct corrigeren.
          Log eerst je gegevens hieronder. Bekijk daarna je grafieken en rapporten.
        </p>
        <div className="mt-3 text-sm">
          Ingelogd als <strong>{username || email || '—'}</strong>
          {username && email ? <> <span className="text-slate-500">({email})</span></> : null}
        </div>
      </div>

      {/* Forms at the top (ONLY ONCE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TrainingForm />
        <RhrForm />
        <BodyForm />
      </div>

      {/* Controls */}
      <WeekControls mode={mode} setMode={setMode} date={date} setDate={setDate} />

      {mode === 'week' ? (
        <>
          <WeeklyTotals userId={userId} date={date} />
          <WeeklyCharts userId={userId} date={date} />
          <WeeklyTables userId={userId} canEdit={true} date={date} />
        </>
      ) : (
        <EightWeekChart userId={userId} />
      )}

      <AllTimeTrends userId={userId} />

      {/* CSV export at the very bottom */}
      <div className="flex items-center justify-end">
        <ExportCsv userId={userId} weekStart={weekStart} weekEnd={weekEnd} />
      </div>
    </div>
  );
}
