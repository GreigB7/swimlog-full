'use client'
import clsx from "clsx";

export function WeekControls({ mode, setMode, date, setDate } : {
  mode: 'week'|'8weeks', setMode: (m:'week'|'8weeks')=>void, date: string, setDate: (d:string)=>void
}) {
  return (
    <div className="card">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="hstack">
          <button className={clsx('btn', mode==='week' ? '' : 'bg-slate-600 hover:bg-slate-700')} onClick={()=>setMode('week')}>Week</button>
          <button className={clsx('btn', mode==='8weeks' ? '' : 'bg-slate-600 hover:bg-slate-700')} onClick={()=>setMode('8weeks')}>Last 8 Weeks</button>
        </div>
        {mode==='week' && (
          <div className="hstack">
            <div className="label">Week containing date:</div>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
        )}
      </div>
    </div>
  );
}
