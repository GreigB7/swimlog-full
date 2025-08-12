'use client'
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Profile = { id: string; email: string | null; username: string | null; role: string | null; };
type TRow = { training_date: string; session_type: string | null; duration_minutes: number | null; };

export function CoachPanel() {
  const [swimmers, setSwimmers] = useState<Profile[]>([]);
  const [sel, setSel] = useState<string>('');
  const [rows, setRows] = useState<TRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('id, email, username, role');
      const swimmersOnly = (data ?? []).filter((p: any) => p.role === 'swimmer');
      setSwimmers(swimmersOnly);
      if (swimmersOnly[0]) setSel(swimmersOnly[0].id);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!sel) return;
      const { data } = await supabase
        .from('training_log')
        .select('training_date, session_type, duration_minutes')
        .eq('user_id', sel)
        .order('training_date', { ascending: false })
        .limit(12);
      setRows(data ?? []);
    })();
  }, [sel]);

  return (
    <div className="vstack gap-3">
      <div className="hstack justify-between">
        <h2 className="text-lg font-semibold">Coach: View a swimmer</h2>
        <select className="w-64" value={sel} onChange={e=>setSel(e.target.value)}>
          {swimmers.map(s => (
            <option key={s.id} value={s.id}>{s.username || s.email}</option>
          ))}
        </select>
      </div>
      <div className="card">
        {rows.length === 0 ? (
          <div className="text-sm text-slate-600">No entries for this swimmer.</div>
        ) : (
          <table className="table">
            <thead><tr><th>Date</th><th>Type</th><th>min</th></tr></thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i}><td>{r.training_date}</td><td>{r.session_type || ''}</td><td>{r.duration_minutes ?? ''}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
