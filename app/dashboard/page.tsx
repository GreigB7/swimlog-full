'use client'
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [userId, setUserId] = useState<string>('');
  const [mode, setMode] = useState<ViewMode>('week');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setEmail(session.user.email || '');
        const { data } = await supabase
          .from('profiles')
          .select('username,email')
          .eq('id', session.user.id)
          .maybeSingle();
        if (data?.username) setUsername(String(data.username));
        if (data?.email) setEmail(String(data.email));
      }
    })();
  }, []);

  // Date range for ExportCsv
  const { weekStart, weekEnd } = useMemo(() => {
    if (mode === 'week') return getWeekBounds(date);
    // last 8 weeks ending on selected date
    const end = new Date(date + 'T00:00:00');
    const start = new Date(end);
    start.setDate(start.getDate() - (8 * 7 - 1)); // inclusive 56-day window
    const fmt = (x: Date) => x.toISOString().slice(0, 10);
    return { weekStart: fmt(start), weekEnd: fmt(end) };
  }, [mode, date]);

  return (
    <div className="vstack gap-6">
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

      {/* Forms at the top (only once) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TrainingForm />
        <RhrForm />
        <BodyForm />
      </div>

      {/* Controls for charts/reports */}
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
      <div className="flex items-center justify-end pb-4">
        <ExportCsv userId={userId} weekStart={weekStart} weekEnd={weekEnd} />
      </div>
    </div>
  );
}
