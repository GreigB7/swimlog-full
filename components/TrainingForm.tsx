'use client'
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// DB values (English), UI labels (Dutch)
type SessionType = 'Morning Swim' | 'Afternoon Swim' | 'Land Training' | 'Other Activity';
type Effort = 'Green' | 'White' | 'Red';

const TYPE_OPTIONS: { value: SessionType; label: string }[] = [
  { value: 'Morning Swim',   label: 'Zwemmen (ochtend)' },
  { value: 'Afternoon Swim', label: 'Zwemmen (middag)' },
  { value: 'Land Training',  label: 'Landtraining' },
  { value: 'Other Activity', label: 'Overig' },
];

const EFFORT_OPTIONS: { value: Effort; label: string }[] = [
  { value: 'Green', label: 'Groen' },
  { value: 'White', label: 'Wit' },
  { value: 'Red',   label: 'Rood' },
];

const COMPLEXITIES = [1, 2, 3] as const;

export function TrainingForm() {
  const [date, setDate] = useState<string>('');
  const [type, setType] = useState<SessionType>('Morning Swim');
  const [dur, setDur] = useState<number | ''>('');
  const [hr, setHr] = useState<number | ''>('');
  const [effort, setEffort] = useState<Effort>('Green');
  const [cx, setCx] = useState<(typeof COMPLEXITIES)[number] | ''>('');
  const [details, setDetails] = useState('');
  const [msg, setMsg] = useState<string>('');

  async function add() {
    setMsg('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg('Niet ingelogd.'); return; }
    if (!date || !dur || !cx) { setMsg('Vul s.v.p. datum, duur en complexiteit in.'); return; }

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

    if (error) {
      setMsg(error.message);
    } else {
      setMsg('Opgeslagen.');
      setDur('');
      setHr('');
      setDetails('');
    }
  }

  return (
    <div className="card vstack">
      <h2 className="text-lg font-semibold">Training toevoegen</h2>

      {/* 1 col on phones, 2 cols from sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="min-w-0">
          <div className="label">Datum</div>
          <input
            className="w-full min-w-0"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="min-w-0">
          <div className="label">Type</div>
          <select
            className="w-full min-w-0"
            value={type}
            onChange={e => setType(e.target.value as SessionType)}
          >
            {TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <div className="label">Duur (min)</div>
          <input
            className="w-full min-w-0"
            type="number"
            min={1}
            value={dur}
            onChange={e => setDur(e.target.value ? parseInt(e.target.value) : '')}
          />
        </div>

        <div className="min-w-0">
          <div className="label">Hartslag</div>
          <input
            className="w-full min-w-0"
            type="number"
            min={30}
            max={250}
            value={hr}
            onChange={e => setHr(e.target.value ? parseInt(e.target.value) : '')}
          />
        </div>

        <div className="min-w-0">
          <div className="label">Inspanning</div>
          <select
            className="w-full min-w-0"
            value={effort}
            onChange={e => setEffort(e.target.value as Effort)}
          >
            {EFFORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <div className="label">Complexiteit</div>
          <select
            className="w-full min-w-0"
            value={cx as any}
            onChange={e => setCx(e.target.value ? (parseInt(e.target.value) as (typeof COMPLEXITIES)[number]) : '' as any)}
          >
            <option value=""></option>
            {COMPLEXITIES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="min-w-0">
        <div className="label">Details</div>
        <textarea
          className="w-full min-w-0"
          rows={3}
          value={details}
          onChange={e => setDetails(e.target.value)}
        />
      </div>

      <div className="hstack">
        <button className="btn" onClick={add}>Opslaan</button>
        <div className="text-sm text-slate-600">{msg}</div>
      </div>
    </div>
  );
}
