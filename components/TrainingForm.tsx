'use client'
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const EFFORTS = ['Green','White','Red'] as const;
const COMPLEXITIES = [1,2,3] as const;

export function TrainingForm() {
  const [date, setDate] = useState<string>('');
  const [type, setType] = useState('Morning Swim');
  const [dur, setDur] = useState<number | ''>('');
  const [hr, setHr] = useState<number | ''>('');
  const [effort, setEffort] = useState<(typeof EFFORTS)[number]>('Green');
  const [cx, setCx] = useState<(typeof COMPLEXITIES)[number] | ''>('');
  const [details, setDetails] = useState('');
  const [msg, setMsg] = useState<string>('');

  async function add() {
    setMsg('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg('Not signed in'); return; }
    if (!date || !dur || !cx) { setMsg('Please fill date, duration, complexity'); return; }

    const { error } = await supabase.from('training_log').insert({
      user_id: user.id,
      training_date: date,
      session_type: type,
      duration_minutes: dur,
      heart_rate: hr || null,
      effort_color: effort,
      complexity: cx,
      details
    });
    if (error) setMsg(error.message);
    else {
      setMsg('Saved');
      setDur(''); setHr(''); setDetails('');
    }
  }

  return (
    <div className="card vstack">
      <h2 className="text-lg font-semibold">Add Training</h2>
      <div className="grid grid-cols-2 gap-3">
        <div><div className="label">Date</div><input type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
        <div><div className="label">Type</div>
          <select value={type} onChange={e=>setType(e.target.value)}>
            <option>Morning Swim</option>
            <option>Afternoon Swim</option>
            <option>Land Training</option>
            <option>Other Activity</option>
          </select>
        </div>
        <div><div className="label">Duration (min)</div><input type="number" min={1} value={dur} onChange={e=>setDur(e.target.value ? parseInt(e.target.value) : '')} /></div>
        <div><div className="label">Heart Rate</div><input type="number" min={30} max={250} value={hr} onChange={e=>setHr(e.target.value ? parseInt(e.target.value) : '')} /></div>
        <div>
          <div className="label">Effort</div>
          <select value={effort} onChange={e=>setEffort(e.target.value as (typeof EFFORTS)[number])}>
            {EFFORTS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <div className="label">Complexity</div>
          <select value={cx as any} onChange={e=>setCx(e.target.value ? parseInt(e.target.value) as (typeof COMPLEXITIES)[number] : '' as any)}>
            <option value=""></option>
            {COMPLEXITIES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>
      <div><div className="label">Details</div><textarea rows={3} value={details} onChange={e=>setDetails(e.target.value)} /></div>
      <div className="hstack">
        <button className="btn" onClick={add}>Save</button>
        <div className="text-sm text-slate-600">{msg}</div>
      </div>
    </div>
  );
}
