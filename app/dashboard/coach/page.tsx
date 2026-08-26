'use client'
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentProfile, getSupabaseBrowserClient, profileHasRole } from "@/lib/supabase";
import { WeekControls } from "@/components/WeekControls";
import { WeeklyTables } from "@/components/WeeklyTables";
import { EightWeekChart } from "@/components/EightWeekChart";
import { WeeklyCharts } from "@/components/WeeklyCharts";
import { AllTimeTrends } from "@/components/AllTimeTrends";
import { WeeklyTotals } from "@/components/WeeklyTotals";
import { ExportCsv } from "@/components/ExportCsv";

const supabase = getSupabaseBrowserClient();

type Profile = { id: string; email: string | null; username: string | null; role: string | null; };

function getWeekBounds(dateISO: string) {
  const d = new Date(dateISO + 'T00:00:00');
  const dow = d.getDay() || 7;          // Mon=1..Sun=7
  const start = new Date(d);
  start.setDate(d.getDate() - (dow - 1)); // Monday
  const end = new Date(start);
  end.setDate(start.getDate() + 6);       // Sunday
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return { weekStart: fmt(start), weekEnd: fmt(end) };
}

export default function CoachPage() {
  const router = useRouter();
  const [swimmers, setSwimmers] = useState<Profile[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [mode, setMode] = useState<'week'|'8weeks'>('week');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setAccessDenied(false);

      const { session, profile } = await getCurrentProfile();
      if (!session) {
        router.replace('/');
        return;
      }

      if (!profileHasRole(profile, 'coach')) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,username,role')
        .eq('role', 'swimmer');
      if (error) {
        setSwimmers([]);
        setLoading(false);
        return;
      }

      const list = (data ?? []) as Profile[];
      setSwimmers(list);
      if (list[0]) setUserId(list[0].id);
      setLoading(false);
    })();
  }, [router]);

  // Build the range ExportCsv expects
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

  if (accessDenied) {
    return (
      <div className="card">
        <h1 className="text-xl font-semibold">Dashboard coach</h1>
        <p className="text-sm text-slate-600">Alleen toegankelijk voor coaches.</p>
      </div>
    );
  }

  return (
    <div className="vstack gap-6">
      <div className="card">
        <h1 className="text-xl font-semibold">Dashboard coach</h1>
        <p className="text-sm text-slate-600">Alleen lezen. Kies een zwemmer en bekijk per week of de laatste 8 weken.</p>
        <div className="mt-3">
          <label className="label">Zwemmer</label>
          <select value={userId} onChange={e=>setUserId(e.target.value)} className="w-80">
            {swimmers.map(s => <option key={s.id} value={s.id}>{s.username || s.email}</option>)}
          </select>
        </div>
      </div>

      <WeekControls mode={mode} setMode={setMode} date={date} setDate={setDate} />

      {mode === 'week' ? (
        <>
          <WeeklyTotals userId={userId} date={date} />
          <WeeklyCharts userId={userId} date={date} />
          <WeeklyTables userId={userId} canEdit={false} date={date} />
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
