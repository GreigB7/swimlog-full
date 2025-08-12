'use client'
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type TrainRow = { id: string; training_date: string; session_type: string | null; duration_minutes: number | null; heart_rate: number | null; effort_color: string | null; complexity: number | null; details: string | null; };
type RhrRow = { id: string; entry_date: string; resting_heart_rate: number | null; };
type BodyRow = { id: string; entry_date: string; height_cm: number | null; weight_kg: number | null; };

type EditTarget = { kind: 'train'|'rhr'|'body', id: string } | null;

const EFFORTS = ['Green','White','Red'] as const;
const COMPLEXITIES = [1,2,3] as const;

function weekBounds(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  const day = d.getDay() || 7;
  const start = new Date(d); start.setDate(d.getDate() - (day - 1));
  const end = new Date(start); end.setDate(start.getDate() + 6);
  const toStr = (x: Date) => x.toISOString().slice(0,10);
  return { start: toStr(start), end: toStr(end) };
}

export function WeeklyTables({ userId, canEdit, date } : { userId: string, canEdit: boolean, date: string }) {
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
    const { error } = await supabase.from(table).update(vals).eq('id', edit.id);
    if (!error) { setEdit(null); setVals({}); await loadAll(); }
  }

  return (
    <div className="vstack gap-6">
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Training ({start} → {end})</h2>
        {!train.length ? <div className="text-sm text-slate-600">Geen gegevens deze week.</div> : (
          <table className="table">
            <thead>
              <tr><th>Datum</th><th>Type</th><th>Min</th><th>Hartslag</th><th>Inspanning</th><th>Cx</th><th>Details</th><th></th></tr>
            </thead>
            <tbody>
              {train.map(r=> {
                const isEdit = edit?.kind==='train' && edit.id===r.id;
                return (
                <tr key={r.id}>
                  <td>{r.training_date}</td>
                  <td>{isEdit ? <input value={(vals.session_type ?? r.session_type) || ''} onChange={e=>setVals({...vals, session_type:e.target.value})} /> : (r.session_type || '')}</td>
                  <td>{isEdit ? <input type="number" value={(vals.duration_minutes ?? r.duration_minutes) ?? ''} onChange={e=>setVals({...vals, duration_minutes:e.target.value?parseInt(e.target.value):null})} /> : (r.duration_minutes ?? '')}</td>
                  <td>{isEdit ? <input type="number" value={(vals.heart_rate ?? r.heart_rate) ?? ''} onChange={e=>setVals({...vals, heart_rate:e.target.value?parseInt(e.target.value):null})} /> : (r.heart_rate ?? '')}</td>
                  <td>
                    {isEdit ? (
                      <select value={(vals.effort_color ?? r.effort_color) || ''} onChange={e=>setVals({...vals, effort_color:e.target.value})}>
                        <option value=""></option>
                        {EFFORTS.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    ) : (r.effort_color || '')}
                  </td>
                  <td>
                    {isEdit ? (
                      <select value={(vals.complexity ?? r.complexity) ?? ''} onChange={e=>setVals({...vals, complexity:e.target.value?parseInt(e.target.value):null})}>
                        <option value=""></option>
                        {COMPLEXITIES.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    ) : (r.complexity ?? '')}
                  </td>
                  <td>{isEdit ? <input value={(vals.details ?? r.details) || ''} onChange={e=>setVals({...vals, details:e.target.value})} /> : (r.details || '')}</td>
                  <td className="text-right">
                    {canEdit ? (
                      isEdit ? (
                        <div className="hstack">
                          <button className="btn" onClick={save}>Opslaan</button>
                          <button className="btn bg-slate-600 hover:bg-slate-700" onClick={()=>{setEdit(null); setVals({});}}>Annuleren</button>
                        </div>
                      ) : (
                        <button className="btn" onClick={()=>{setEdit({kind:'train', id:r.id}); setVals({});}}>Bewerken</button>
                      )
                    ) : <span className="badge">alleen-lezen</span>}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Rusthartslag ({start} → {end})</h2>
        {!rhr.length ? <div className="text-sm text-slate-600">Geen gegevens deze week.</div> : (
          <table className="table">
            <thead><tr><th>Datum</th><th>RHR</th><th></th></tr></thead>
            <tbody>
              {rhr.map(r=> {
                const isEdit = edit?.kind==='rhr' && edit.id===r.id;
                return (
                <tr key={r.id}>
                  <td>{r.entry_date}</td>
                  <td>{isEdit ? <input type="number" value={(vals.resting_heart_rate ?? r.resting_heart_rate) ?? ''} onChange={e=>setVals({...vals, resting_heart_rate:e.target.value?parseInt(e.target.value):null})} /> : (r.resting_heart_rate ?? '')}</td>
                  <td className="text-right">
                    {canEdit ? (
                      isEdit ? (
                        <div className="hstack">
                          <button className="btn" onClick={save}>Opslaan</button>
                          <button className="btn bg-slate-600 hover:bg-slate-700" onClick={()=>{setEdit(null); setVals({});}}>Annuleren</button>
                        </div>
                      ) : (
                        <button className="btn" onClick={()=>setEdit({kind:'rhr', id:r.id})}>Bewerken</button>
                      )
                    ) : <span className="badge">alleen-lezen</span>}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Lichaamsmaten ({start} → {end})</h2>
        {!body.length ? <div className="text-sm text-slate-600">Geen gegevens deze week.</div> : (
          <table className="table">
            <thead><tr><th>Datum</th><th>Lengte (cm)</th><th>Gewicht (kg)</th><th></th></tr></thead>
            <tbody>
              {body.map(r=> {
                const isEdit = edit?.kind==='body' && edit.id===r.id;
                return (
                <tr key={r.id}>
                  <td>{r.entry_date}</td>
                  <td>{isEdit ? <input type="number" value={(vals.height_cm ?? r.height_cm) ?? ''} onChange={e=>setVals({...vals, height_cm:e.target.value?parseFloat(e.target.value):null})} /> : (r.height_cm ?? '')}</td>
                  <td>{isEdit ? <input type="number" value={(vals.weight_kg ?? r.weight_kg) ?? ''} onChange={e=>setVals({...vals, weight_kg:e.target.value?parseFloat(e.target.value):null})} /> : (r.weight_kg ?? '')}</td>
                  <td className="text-right">
                    {canEdit ? (
                      isEdit ? (
                        <div className="hstack">
                          <button className="btn" onClick={save}>Opslaan</button>
                          <button className="btn bg-slate-600 hover:bg-slate-700" onClick={()=>{setEdit(null); setVals({});}}>Annuleren</button>
                        </div>
                      ) : (
                        <button className="btn" onClick={()=>{setEdit({kind:'body', id:r.id}); setVals({});}}>Bewerken</button>
                      )
                    ) : <span className="badge">alleen-lezen</span>}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
