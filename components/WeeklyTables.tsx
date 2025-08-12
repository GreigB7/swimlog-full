'use client'
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TrainRow = {
  id: string;
  training_date: string;
  session_type: string | null;
  duration_minutes: number | null;
  heart_rate: number | null;
  effort_color: string | null;
  complexity: number | null;
  details: string | null;
};
type RhrRow = { id: string; entry_date: string; resting_heart_rate: number | null; };
type BodyRow = { id: string; entry_date: string; height_cm: number | null; weight_kg: number | null; };

type EditTarget = { kind: 'train' | 'rhr' | 'body', id: string } | null;

// DB values English; UI labels Dutch
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

function toNLType(v?: string | null) {
  const hit = TYPE_OPTIONS.find(o => o.value === v);
  return hit ? hit.label : (v || '');
}
function toNLEffort(v?: string | null) {
  const s = (v || '').toLowerCase();
  if (s === 'green') return 'Groen';
  if (s === 'red') return 'Rood';
  if (s === 'white') return 'Wit';
  return v || '';
}
function effortColor(v?: string | null) {
  const s = (v || '').toLowerCase();
  if (s === 'green') return 'bg-emerald-500';
  if (s === 'red') return 'bg-rose-500';
  return 'bg-slate-300';
}

function weekBounds(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  const day = d.getDay() || 7; // Monday=1...Sunday=7
  const start = new Date(d); start.setDate(d.getDate() - (day - 1));
  const end = new Date(start); end.setDate(start.getDate() + 6);
  const toStr = (x: Date) => x.toISOString().slice(0, 10);
  return { start: toStr(start), end: toStr(end) };
}

export function WeeklyTables({ userId, canEdit, date }: { userId: string, canEdit: boolean, date: string }) {
  const [train, setTrain] = useState<TrainRow[]>([]);
  const [rhr, setRhr] = useState<RhrRow[]>([]);
  const [body, setBody] = useState<BodyRow[]>([]);
  const [edit, setEdit] = useState<EditTarget>(null);
  const [vals, setVals] = useState<any>({});

  const { start, end } = useMemo(() => weekBounds(date), [date]);

  async function loadAll() {
    if (!userId) return;
    const t = await supabase.from('training_log')
      .select('id, training_date, session_type, duration_minutes, heart_rate, effort_color, complexity, details')
      .eq('user_id', userId).gte('training_date', start).lte('training_date', end)
      .order('training_date', { ascending: true });
    setTrain(t.data ?? []);

    const r = await supabase.from('resting_hr_log')
      .select('id, entry_date, resting_heart_rate')
      .eq('user_id', userId).gte('entry_date', start).lte('entry_date', end)
      .order('entry_date', { ascending: true });
    setRhr(r.data ?? []);

    const b = await supabase.from('body_metrics_log')
      .select('id, entry_date, height_cm, weight_kg')
      .eq('user_id', userId).gte('entry_date', start).lte('entry_date', end)
      .order('entry_date', { ascending: true });
    setBody(b.data ?? []);
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [userId, start, end]);

  async function save() {
    if (!edit) return;
    const table = edit.kind === 'train' ? 'training_log' : edit.kind === 'rhr' ? 'resting_hr_log' : 'body_metrics_log';
    const payload = { ...vals };
    const { error } = await supabase.from(table).update(payload).eq('id', edit.id);
    if (!error) { setEdit(null); setVals({}); await loadAll(); }
  }

  // ---------- TRAINING ----------
  const TrainingTableDesktop = () => (
    <div className="hidden md:block">
      <div className="overflow-x-auto">
        <table className="table min-w-[900px]">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Type</th>
              <th>Min</th>
              <th>Hartslag</th>
              <th>Inspanning</th>
              <th>Cx</th>
              <th>Details</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {train.map(r => {
              const isEdit = edit?.kind === 'train' && edit.id === r.id;
              return (
                <tr key={r.id}>
                  <td>{r.training_date}</td>
                  <td>
                    {isEdit ? (
                      <select
                        className="w-full min-w-0"
                        value={(vals.session_type ?? r.session_type) || ''}
                        onChange={e => setVals({ ...vals, session_type: e.target.value as SessionType })}
                      >
                        <option value=""></option>
                        {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : toNLType(r.session_type)}
                  </td>
                  <td>
                    {isEdit ? (
                      <input
                        className="w-full min-w-0"
                        type="number"
                        value={(vals.duration_minutes ?? r.duration_minutes) ?? ''}
                        onChange={e => setVals({ ...vals, duration_minutes: e.target.value ? parseInt(e.target.value) : null })}
                      />
                    ) : (r.duration_minutes ?? '')}
                  </td>
                  <td>
                    {isEdit ? (
                      <input
                        className="w-full min-w-0"
                        type="number"
                        value={(vals.heart_rate ?? r.heart_rate) ?? ''}
                        onChange={e => setVals({ ...vals, heart_rate: e.target.value ? parseInt(e.target.value) : null })}
                      />
                    ) : (r.heart_rate ?? '')}
                  </td>
                  <td>
                    {isEdit ? (
                      <select
                        className="w-full min-w-0"
                        value={(vals.effort_color ?? r.effort_color) || ''}
                        onChange={e => setVals({ ...vals, effort_color: e.target.value as Effort })}
                      >
                        <option value=""></option>
                        {EFFORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-2`}>
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${effortColor(r.effort_color)}`} />
                        {toNLEffort(r.effort_color)}
                      </span>
                    )}
                  </td>
                  <td>
                    {isEdit ? (
                      <select
                        className="w-full min-w-0"
                        value={(vals.complexity ?? r.complexity) ?? ''}
                        onChange={e => setVals({ ...vals, complexity: e.target.value ? parseInt(e.target.value) : null })}
                      >
                        <option value=""></option>
                        {COMPLEXITIES.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    ) : (r.complexity ?? '')}
                  </td>
                  <td>
                    {isEdit ? (
                      <input
                        className="w-full min-w-0"
                        value={(vals.details ?? r.details) || ''}
                        onChange={e => setVals({ ...vals, details: e.target.value })}
                      />
                    ) : (r.details || '')}
                  </td>
                  <td className="text-right">
                    {canEdit ? (
                      isEdit ? (
                        <div className="hstack">
                          <button className="btn" onClick={save}>Opslaan</button>
                          <button className="btn bg-slate-600 hover:bg-slate-700" onClick={() => { setEdit(null); setVals({}); }}>Annuleren</button>
                        </div>
                      ) : (
                        <button className="btn" onClick={() => { setEdit({ kind: 'train', id: r.id }); setVals({}); }}>Bewerken</button>
                      )
                    ) : <span className="badge">alleen-lezen</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const TrainingCardsMobile = () => (
    <div className="md:hidden vstack gap-3">
      {!train.length ? <div className="text-sm text-slate-600">Geen gegevens deze week.</div> : null}
      {train.map(r => {
        const isEdit = edit?.kind === 'train' && edit.id === r.id;
        return (
          <div key={r.id} className="rounded-xl border p-3 bg-white shadow-sm">
            <div className="text-xs text-slate-500 mb-1">Datum</div>
            <div className="mb-2">{r.training_date}</div>

            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <div className="text-xs text-slate-500 mb-1">Type</div>
                {isEdit ? (
                  <select
                    className="w-full min-w-0"
                    value={(vals.session_type ?? r.session_type) || ''}
                    onChange={e => setVals({ ...vals, session_type: e.target.value as SessionType })}
                  >
                    <option value=""></option>
                    {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : <div>{toNLType(r.session_type)}</div>}
              </div>

              <div className="min-w-0">
                <div className="text-xs text-slate-500 mb-1">Duur (min)</div>
                {isEdit ? (
                  <input
                    className="w-full min-w-0"
                    type="number"
                    value={(vals.duration_minutes ?? r.duration_minutes) ?? ''}
                    onChange={e => setVals({ ...vals, duration_minutes: e.target.value ? parseInt(e.target.value) : null })}
                  />
                ) : <div>{r.duration_minutes ?? ''}</div>}
              </div>

              <div className="min-w-0">
                <div className="text-xs text-slate-500 mb-1">Hartslag</div>
                {isEdit ? (
                  <input
                    className="w-full min-w-0"
                    type="number"
                    value={(vals.heart_rate ?? r.heart_rate) ?? ''}
                    onChange={e => setVals({ ...vals, heart_rate: e.target.value ? parseInt(e.target.value) : null })}
                  />
                ) : <div>{r.heart_rate ?? ''}</div>}
              </div>

              <div className="min-w-0">
                <div className="text-xs text-slate-500 mb-1">Inspanning</div>
                {isEdit ? (
                  <select
                    className="w-full min-w-0"
                    value={(vals.effort_color ?? r.effort_color) || ''}
                    onChange={e => setVals({ ...vals, effort_color: e.target.value as Effort })}
                  >
                    <option value=""></option>
                    {EFFORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <div className="inline-flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${effortColor(r.effort_color)}`} />
                    {toNLEffort(r.effort_color)}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="text-xs text-slate-500 mb-1">Complexiteit</div>
                {isEdit ? (
                  <select
                    className="w-full min-w-0"
                    value={(vals.complexity ?? r.complexity) ?? ''}
                    onChange={e => setVals({ ...vals, complexity: e.target.value ? parseInt(e.target.value) : null })}
                  >
                    <option value=""></option>
                    {COMPLEXITIES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : <div>{r.complexity ?? ''}</div>}
              </div>

              <div className="col-span-2 min-w-0">
                <div className="text-xs text-slate-500 mb-1">Details</div>
                {isEdit ? (
                  <input
                    className="w-full min-w-0"
                    value={(vals.details ?? r.details) || ''}
                    onChange={e => setVals({ ...vals, details: e.target.value })}
                  />
                ) : <div className="break-words">{r.details || ''}</div>}
              </div>
            </div>

            <div className="mt-3 text-right">
              {canEdit ? (
                isEdit ? (
                  <div className="hstack justify-end">
                    <button className="btn" onClick={save}>Opslaan</button>
                    <button className="btn bg-slate-600 hover:bg-slate-700" onClick={() => { setEdit(null); setVals({}); }}>Annuleren</button>
                  </div>
                ) : (
                  <button className="btn" onClick={() => { setEdit({ kind: 'train', id: r.id }); setVals({}); }}>Bewerken</button>
                )
              ) : <span className="badge">alleen-lezen</span>}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ---------- RHR ----------
  const RhrTableDesktop = () => (
    <div className="hidden md:block">
      <div className="overflow-x-auto">
        <table className="table min-w-[500px]">
          <thead><tr><th>Datum</th><th>RHR</th><th></th></tr></thead>
          <tbody>
            {rhr.map(r => {
              const isEdit = edit?.kind === 'rhr' && edit.id === r.id;
              return (
                <tr key={r.id}>
                  <td>{r.entry_date}</td>
                  <td>
                    {isEdit ? (
                      <input
                        className="w-full min-w-0"
                        type="number"
                        value={(vals.resting_heart_rate ?? r.resting_heart_rate) ?? ''}
                        onChange={e => setVals({ ...vals, resting_heart_rate: e.target.value ? parseInt(e.target.value) : null })}
                      />
                    ) : (r.resting_heart_rate ?? '')}
                  </td>
                  <td className="text-right">
                    {canEdit ? (
                      isEdit ? (
                        <div className="hstack">
                          <button className="btn" onClick={save}>Opslaan</button>
                          <button className="btn bg-slate-600 hover:bg-slate-700" onClick={() => { setEdit(null); setVals({}); }}>Annuleren</button>
                        </div>
                      ) : (
                        <button className="btn" onClick={() => setEdit({ kind: 'rhr', id: r.id })}>Bewerken</button>
                      )
                    ) : <span className="badge">alleen-lezen</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const RhrCardsMobile = () => (
    <div className="md:hidden vstack gap-3">
      {!rhr.length ? <div className="text-sm text-slate-600">Geen gegevens deze week.</div> : null}
      {rhr.map(r => {
        const isEdit = edit?.kind === 'rhr' && edit.id === r.id;
        return (
          <div key={r.id} className="rounded-xl border p-3 bg-white shadow-sm">
            <div className="text-xs text-slate-500 mb-1">Datum</div>
            <div className="mb-2">{r.entry_date}</div>

            <div className="min-w-0">
              <div className="text-xs text-slate-500 mb-1">RHR</div>
              {isEdit ? (
                <input
                  className="w-full min-w-0"
                  type="number"
                  value={(vals.resting_heart_rate ?? r.resting_heart_rate) ?? ''}
                  onChange={e => setVals({ ...vals, resting_heart_rate: e.target.value ? parseInt(e.target.value) : null })}
                />
              ) : <div>{r.resting_heart_rate ?? ''}</div>}
            </div>

            <div className="mt-3 text-right">
              {canEdit ? (
                isEdit ? (
                  <div className="hstack justify-end">
                    <button className="btn" onClick={save}>Opslaan</button>
                    <button className="btn bg-slate-600 hover:bg-slate-700" onClick={() => { setEdit(null); setVals({}); }}>Annuleren</button>
                  </div>
                ) : (
                  <button className="btn" onClick={() => setEdit({ kind: 'rhr', id: r.id })}>Bewerken</button>
                )
              ) : <span className="badge">alleen-lezen</span>}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ---------- BODY ----------
  const BodyTableDesktop = () => (
    <div className="hidden md:block">
      <div className="overflow-x-auto">
        <table className="table min-w-[650px]">
          <thead><tr><th>Datum</th><th>Lengte (cm)</th><th>Gewicht (kg)</th><th></th></tr></thead>
          <tbody>
            {body.map(r => {
              const isEdit = edit?.kind === 'body' && edit.id === r.id;
              return (
                <tr key={r.id}>
                  <td>{r.entry_date}</td>
                  <td>
                    {isEdit ? (
                      <input
                        className="w-full min-w-0"
                        type="number"
                        value={(vals.height_cm ?? r.height_cm) ?? ''}
                        onChange={e => setVals({ ...vals, height_cm: e.target.value ? parseFloat(e.target.value) : null })}
                      />
                    ) : (r.height_cm ?? '')}
                  </td>
                  <td>
                    {isEdit ? (
                      <input
                        className="w-full min-w-0"
                        type="number"
                        value={(vals.weight_kg ?? r.weight_kg) ?? ''}
                        onChange={e => setVals({ ...vals, weight_kg: e.target.value ? parseFloat(e.target.value) : null })}
                      />
                    ) : (r.weight_kg ?? '')}
                  </td>
                  <td className="text-right">
                    {canEdit ? (
                      isEdit ? (
                        <div className="hstack">
                          <button className="btn" onClick={save}>Opslaan</button>
                          <button className="btn bg-slate-600 hover:bg-slate-700" onClick={() => { setEdit(null); setVals({}); }}>Annuleren</button>
                        </div>
                      ) : (
                        <button className="btn" onClick={() => { setEdit({ kind: 'body', id: r.id }); setVals({}); }}>Bewerken</button>
                      )
                    ) : <span className="badge">alleen-lezen</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const BodyCardsMobile = () => (
    <div className="md:hidden vstack gap-3">
      {!body.length ? <div className="text-sm text-slate-600">Geen gegevens deze week.</div> : null}
      {body.map(r => {
        const isEdit = edit?.kind === 'body' && edit.id === r.id;
        return (
          <div key={r.id} className="rounded-xl border p-3 bg-white shadow-sm">
            <div className="text-xs text-slate-500 mb-1">Datum</div>
            <div className="mb-2">{r.entry_date}</div>

            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <div className="text-xs text-slate-500 mb-1">Lengte (cm)</div>
                {isEdit ? (
                  <input
                    className="w-full min-w-0"
                    type="number"
                    value={(vals.height_cm ?? r.height_cm) ?? ''}
                    onChange={e => setVals({ ...vals, height_cm: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                ) : <div>{r.height_cm ?? ''}</div>}
              </div>

              <div className="min-w-0">
                <div className="text-xs text-slate-500 mb-1">Gewicht (kg)</div>
                {isEdit ? (
                  <input
                    className="w-full min-w-0"
                    type="number"
                    value={(vals.weight_kg ?? r.weight_kg) ?? ''}
                    onChange={e => setVals({ ...vals, weight_kg: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                ) : <div>{r.weight_kg ?? ''}</div>}
              </div>
            </div>

            <div className="mt-3 text-right">
              {canEdit ? (
                isEdit ? (
                  <div className="hstack justify-end">
                    <button className="btn" onClick={save}>Opslaan</button>
                    <button className="btn bg-slate-600 hover:bg-slate-700" onClick={() => { setEdit(null); setVals({}); }}>Annuleren</button>
                  </div>
                ) : (
                  <button className="btn" onClick={() => { setEdit({ kind: 'body', id: r.id }); setVals({}); }}>Bewerken</button>
                )
              ) : <span className="badge">alleen-lezen</span>}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="vstack gap-6">
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Training ({start} → {end})</h2>
        {/* Mobile cards */}
        <TrainingCardsMobile />
        {/* Desktop table */}
        <TrainingTableDesktop />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Rusthartslag ({start} → {end})</h2>
        <RhrCardsMobile />
        <RhrTableDesktop />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Lichaamsmaten ({start} → {end})</h2>
        <BodyCardsMobile />
        <BodyTableDesktop />
      </div>
    </div>
  );
}

