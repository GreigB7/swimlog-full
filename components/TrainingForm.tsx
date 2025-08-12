'use client'
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// DB values stay English; UI labels are Dutch
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

    if (error) setMsg(error.message
