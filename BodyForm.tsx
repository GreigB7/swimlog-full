'use client'
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function BodyForm() {
  const [date, setDate] = useState<string>('');
  const [height, setHeight] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [msg, setMsg] = useState<string>('');

  async function add() {
    setMsg('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg('Niet ingelogd.'); return; }
    if (!date || (!height && !weight)) { setMsg('Vul s.v.p. datum en minimaal één meting (lengte of gewicht) in.'); return; }

    const { error } = await supabase.from('body_metrics_log').insert({
      user_id: user.id,
      entry_date: date,
      height_cm: height || null,
      weight_kg: weight || null
    });
    setMsg(error ? error.message : 'Opgeslagen.');
    if (!error) { setHeight(''); setWeight(''); }
  }

  return (
    <div className="card vstack">
      <h2 className="text-lg font-semibold">Lichaamsmaten toevoegen</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="label">Datum</div>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <div>
          <div className="label">Lengte (cm)</div>
          <input type="number" min={50} max={250} value={height} onChange={e=>setHeight(e.target.value ? parseFloat(e.target.value) : '')} />
        </div>
        <div>
          <div className="label">Gewicht (kg)</div>
          <input type="number" min={10} max={200} value={weight} onChange={e=>setWeight(e.target.value ? parseFloat(e.target.value) : '')} />
        </div>
      </div>
      <div className="hstack">
        <button className="btn" onClick={add}>Opslaan</button>
        <div className="text-sm text-slate-600">{msg}</div>
      </div>
    </div>
  );
}
