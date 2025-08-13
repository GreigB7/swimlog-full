'use client'
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get Monday (ISO yyyy-mm-dd) for any date in that week
function weekStartISO(isoDate: string) {
  const d = new Date(isoDate + 'T00:00:00');
  const day = d.getDay() || 7; // Mon=1..Sun=7
  const start = new Date(d);
  start.setDate(d.getDate() - (day - 1));
  return start.toISOString().slice(0, 10);
}

export function SwimmerWeekNotes({ userId, date }: { userId: string; date: string }) {
  const start = useMemo(() => weekStartISO(date), [date]);
  const [text, setText] = useState<string>('');
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    (async () => {
      setMsg('');
      if (!userId) return;
      const { data, error } = await supabase
        .from('weekly_comments')
        .select('comment')
        .eq('swimmer_id', userId)
        .eq('week_start', start)
        .maybeSingle();

      if (error) { setMsg(error.message); return; }
      setText(data?.comment ?? '');
    })();
  }, [userId, start]);

  if (msg) return <div className="card">{msg}</div>;

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Coach-opmerkingen (week {start})</h3>
      <div className="whitespace-pre-wrap text-sm">{text || '—'}</div>
    </div>
  );
}
