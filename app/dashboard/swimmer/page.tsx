'use client'
import { useEffect, useState } from "react";
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ProfileRow = { username: string | null; email: string | null; role?: string | null };

export default function SwimmerPage() {
  const [userId, setUserId] = useState<string>('');
  const [mode, setMode] = useState<'week'|'8weeks'>('week');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));

  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setEmail(session.user.email || '');

        // Try to load username (and possibly email) from profiles
        const { data } = await supabase
          .from('profiles')
          .select('username,email')
          .eq('id', session.user.id)
          .maybeSingle();

        if (data?.username) setUsername(String(data.username));
        if (data?.email) setEmail(String(data.email)); // prefer profiles.email if present
      }
    })();
  }, []);

  return (
    <div className="vstack gap-6">
      {/* Header */}
      <div className="card">
        <h1 className="text-xl font-semibold">Dashboard zwemmer</h1>
        <p className="text-sm text-slate-600">
          Bekijk je gegevens per week of de laatste 8 weken. Je kunt fouten direct corrigeren.
          Log eerst je gegevens hieronder. Bekijk daarna je grafieken en rapporten.
        </p>

        {/* Who is logged in */}
        <div className="mt-3 text-sm">
          Ingelogd als{" "}
          <strong>{username || email || '—'}</strong>
          {username && email ? (
            <> <span className="text-slate-500">({email})</span></>
          ) : null}
          Ingelogd als <strong>{username || email || '—'}</strong>
          {username && email ? <> <span className="text-slate-500">({email})</span></> : null}
        </div>
      </div>

      {/* --- NEW ORDER: logging forms at the top --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TrainingForm />
        <RhrForm />
        <BodyForm />
      </div>

      {/* Controls for charts/reports below */}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TrainingForm />
        <RhrForm />
        <BodyForm />
      </div>
    </div>
  );
}

