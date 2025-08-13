'use client'
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function weekStartISO(isoDate: string) {
  const d = new Date(isoDate + 'T00:00:00');
  const day = d.getDay() || 7;
  const start = new Date(d);
  start.setDate(d.getDate() - (day - 1));
  return start.toISOString().slice(0, 10);
}

export function CoachWeekNotes({ swimmerId, date }: { swimmerId: string; date: string }) {
  const start = useMemo(() => weekStartISO(date), [date]);
  const [text, setText] = useState<string>('');
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    (async () => {
      setMsg('');
      if (!swimmerId) return;
      const { data, error } = await supabase
        .from('weekly_comments')
        .select('comment')
        .eq('swimmer_id', swimmerId)
        .eq('week_start', start)
        .maybeSingle();
      if (error) { setMsg(error.message); return; }
      setText(data?.comment ?? '');
    })();
  }, [swimmerId, start]);

  async function save() {
    setMsg('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg('Niet ingelogd.'); return; }

    const { error } = await supabase.from('weekly_comments').upsert({
      swimmer_id: swimmerId,
      coach_id: user.id,
      week_start: start,
      comment: text
    }, { onConflict: 'swimmer_id,week_start' });

    setMsg(error ? error.message : 'Opgeslagen.');
  }

  return (
    <div className="card vstack gap-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Coach-opmerkingen (week {start})</h3>
        <button className="btn" onClick={save}>Opslaan</button>
      </div>
      <textarea
        className="w-full min-h-[100px]"
        value={text}
        onChange={(e)=>setText(e.target.value)}
        placeholder="Opmerkingen, aandachtspunten, feedback..."
      />
      <div className="text-sm text-slate-600">{msg}</div>
    </div>
  );
}
