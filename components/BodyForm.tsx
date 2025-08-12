'use client'
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export function BodyForm() {
  const [date, setDate] = useState<string>('');
  const [h, setH] = useState<number | ''>('');
  const [w, setW] = useState<number | ''>('');
  const [msg, setMsg] = useState<string>('');

  async function add() {
    setMsg('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg('Not signed in'); return; }
    if (!date || (!h && !w)) { setMsg('Fill date and at least one measurement'); return; }
    const { error } = await supabase.from('body_metrics_log').insert({
  user_id: user.id,
  entry_date: date,
  height_cm: h || null,   // ← make sure it's "|| null"
  weight_kg: w || null    // ← make sure it's "|| null"
});
    if (error) setMsg(error.message);
    else { setMsg('Saved'); }
  }

  return (
    <div className="card vstack">
      <h2 className="text-lg font-semibold">Log Body Metrics</h2>
      <div className="grid grid-cols-3 gap-3">
        <div><div className="label">Date</div><input type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
        <div><div className="label">Height (cm)</div><input type="number" min={50} max={250} value={h} onChange={e=>setH(e.target.value ? parseInt(e.target.value) : '')} /></div>
        <div><div className="label">Weight (kg)</div><input type="number" min={10} max={200} value={w} onChange={e=>setW(e.target.value ? parseFloat(e.target.value) : '')} /></div>
      </div>
      <div className="hstack">
        <button className="btn" onClick={add}>Save</button>
        <div className="text-sm text-slate-600">{msg}</div>
      </div>
    </div>
  );
}
