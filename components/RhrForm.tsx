'use client'
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function RhrForm() {
  const [date, setDate] = useState<string>('');
  const [rhr, setRhr] = useState<number | ''>('');
  const [msg, setMsg] = useState<string>('');

  async function add() {
    setMsg('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg('Niet ingelogd.'); return; }
    if (!date || !rhr) { setMsg('Vul s.v.p. datum en RHR in.'); return; }

    const { error } = await supabase.from('resting_hr_log').insert({
      user_id: user.id,
      entry_date: date,
      resting_heart_rate: rhr
    });

    if (error) setMsg(error.message);
    else { setMsg('Opgeslagen.'); setRhr(''); }
  }

  return (
    <div className="card vstack">
      <h2 className="text-lg font-semibold">Rusthartslag toevoegen</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="label">Datum</div>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <div>
          <div className="label">RHR (bpm)</div>
          <input
            type="number"
            min={30}
            max={150}
            value={rhr}
            onChange={e=>setRhr(e.target.value ? parseInt(e.target.value) : '')}
          />
        </div>
      </div>
      <div className="hstack">
        <button className="btn" onClick={add}>Opslaan</button>
        <div className="text-sm text-slate-600">{msg}</div>
      </div>
    </div>
  );
}
