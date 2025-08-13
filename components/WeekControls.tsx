'use client'
import { useEffect } from 'react';
import { usePersistedState } from '@/components/hooks/usePersistedState';

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function WeekControls({
  scope,                // e.g. 'swimmer' or 'coach'
  onChange,             // (dateISO, show8) => void
  className = '',
}: {
  scope: 'swimmer' | 'coach';
  onChange: (dateISO: string, show8: boolean) => void;
  className?: string;
}) {
  const [date, setDate]   = usePersistedState<string>(`ui:${scope}:date`, todayISO());
  const [show8, setShow8] = usePersistedState<boolean>(`ui:${scope}:show8`, true);

  useEffect(() => { onChange(date, show8); }, [date, show8, onChange]);

  return (
    <div className={`card flex flex-col sm:flex-row items-start sm:items-end gap-3 ${className}`}>
      <div>
        <label className="label">Week (datum in die week)</label>
        <input type="date" className="w-full" value={date} onChange={(e)=>setDate(e.target.value)} />
      </div>
      <label className="inline-flex items-center gap-2 select-none">
        <input
          type="checkbox"
          checked={show8}
          onChange={(e)=>setShow8(e.target.checked)}
        />
        <span>Toon 8 weken overzicht</span>
      </label>
    </div>
  );
}

