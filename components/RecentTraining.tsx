'use client'
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Row = {
  training_date: string;
  session_type: string | null;
  duration_minutes: number | null;
  heart_rate: number | null;
  effort_color: string | null;
  complexity: number | null;
  details: string | null;
};

export function RecentTraining() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('training_log')
        .select('training_date, session_type, duration_minutes, heart_rate, effort_color, complexity, details')
        .order('training_date', { ascending: false })
        .limit(10);
      if (error) setErr(error.message);
      else setRows(data ?? []);
    })();
  }, []);

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-2">My Recent Training</h2>
      {err && <div className="text-sm text-red-700">{err}</div>}
      {(!rows || rows.length===0) ? (
        <div className="text-sm text-slate-600">No entries yet.</div>
      ) : (
        <table className="table">
          <thead><tr><th>Date</th><th>Type</th><th>min</th><th>HR</th><th>Effort</th><th>Cx</th><th>Details</th></tr></thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}>
                <td>{r.training_date}</td>
                <td>{r.session_type || ''}</td>
                <td>{r.duration_minutes ?? ''}</td>
                <td>{r.heart_rate ?? ''}</td>
                <td>{r.effort_color || ''}</td>
                <td>{r.complexity ?? ''}</td>
                <td>{r.details || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
