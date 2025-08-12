'use client'
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function toCSV(rows: any[]) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map(h => esc(r[h])).join(','));
  return lines.join('\n');
}
function download(name: string, text: string) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function ExportCsv({
  userId,
  weekStart, weekEnd, // pass for weekly; omit for all-time
}: { userId: string; weekStart?: string; weekEnd?: string }) {

  async function exportTraining(all = false) {
    let q = supabase.from('training_log')
      .select('training_date,session_type,duration_minutes,heart_rate,effort_color,complexity,details')
      .eq('user_id', userId)
      .order('training_date', { ascending: true });
    if (!all && weekStart && weekEnd) q = q.gte('training_date', weekStart).lte('training_date', weekEnd);
    const { data } = await q;
    download(`training_${all?'all':'week'}.csv`, toCSV(data ?? []));
  }
  async function exportRhr(all = false) {
    let q = supabase.from('resting_hr_log')
      .select('entry_date,resting_heart_rate')
      .eq('user_id', userId)
      .order('entry_date', { ascending: true });
    if (!all && weekStart && weekEnd) q = q.gte('entry_date', weekStart).lte('entry_date', weekEnd);
    const { data } = await q;
    download(`rhr_${all?'all':'week'}.csv`, toCSV(data ?? []));
  }
  async function exportBody(all = false) {
    let q = supabase.from('body_metrics_log')
      .select('entry_date,height_cm,weight_kg')
      .eq('user_id', userId)
      .order('entry_date', { ascending: true });
    if (!all && weekStart && weekEnd) q = q.gte('entry_date', weekStart).lte('entry_date', weekEnd);
    const { data } = await q;
    download(`body_${all?'all':'week'}.csv`, toCSV(data ?? []));
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn" onClick={()=>exportTraining(false)}>CSV: Training (week)</button>
      <button className="btn" onClick={()=>exportRhr(false)}>CSV: RHR (week)</button>
      <button className="btn" onClick={()=>exportBody(false)}>CSV: Lichaam (week)</button>

      <button className="btn bg-slate-600 hover:bg-slate-700" onClick={()=>exportTraining(true)}>CSV: Training (alles)</button>
      <button className="btn bg-slate-600 hover:bg-slate-700" onClick={()=>exportRhr(true)}>CSV: RHR (alles)</button>
      <button className="btn bg-slate-600 hover:bg-slate-700" onClick={()=>exportBody(true)}>CSV: Lichaam (alles)</button>
    </div>
  );
}
