'use client'
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ItemStartVanaf = { omschrijving: string; vanaf?: string };
type ItemGeconstateerd = { omschrijving: string; geconstateerd_bij?: string };

export type PlanData = {
  oef1: { omschrijving: string; doel: string; vanaf?: string };
  oef2: { omschrijving: string; doel: string; vanaf?: string };

  // ⬇️ ALL strokes are arrays now
  vlinderslag: ItemStartVanaf[];
  rugcrawl:   ItemStartVanaf[];
  schoolslag: ItemStartVanaf[];
  borstcrawl: ItemStartVanaf[];

  starten_keren: ItemStartVanaf;         // stays single
  raceverdeling: ItemGeconstateerd[];    // multi
};

const emptyPlan: PlanData = {
  oef1: { omschrijving: '', doel: '', vanaf: '' },
  oef2: { omschrijving: '', doel: '', vanaf: '' },

  vlinderslag: [{ omschrijving: '', vanaf: '' }],
  rugcrawl:    [{ omschrijving: '', vanaf: '' }],
  schoolslag:  [{ omschrijving: '', vanaf: '' }],
  borstcrawl:  [{ omschrijving: '', vanaf: '' }],

  starten_keren: { omschrijving: '', vanaf: '' },
  raceverdeling: [{ omschrijving: '', geconstateerd_bij: '' }],
};

// Backward-compatible: turn single objects into arrays
function normStroke(x: any): ItemStartVanaf[] {
  if (Array.isArray(x)) {
    return x.map((it) => ({
      omschrijving: (it?.omschrijving ?? '').toString(),
      vanaf: it?.vanaf ? String(it.vanaf) : '',
    }));
  }
  if (x && typeof x === 'object') {
    return [{ omschrijving: (x.omschrijving ?? '').toString(), vanaf: x.vanaf ? String(x.vanaf) : '' }];
  }
  return [{ omschrijving: '', vanaf: '' }];
}

export function TechniquePlanEditor({ swimmerId }: { swimmerId: string }) {
  const [plan, setPlan] = useState<PlanData>(emptyPlan);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    (async () => {
      setMsg('');
      if (!swimmerId) return;
      const { data, error } = await supabase
        .from('technique_plans')
        .select('data')
        .eq('user_id', swimmerId)
        .maybeSingle();

      if (error) { setMsg(error.message); return; }

      const d = (data?.data ?? {}) as Partial<PlanData>;

      // normalize strokes to arrays
      const normalized: PlanData = {
        oef1: { ...(d.oef1 ?? emptyPlan.oef1) },
        oef2: { ...(d.oef2 ?? emptyPlan.oef2) },

        vlinderslag: normStroke(d.vlinderslag),
        rugcrawl:    normStroke(d.rugcrawl),
        schoolslag:  normStroke(d.schoolslag),
        borstcrawl:  normStroke(d.borstcrawl),

        starten_keren: { ...(d.starten_keren ?? emptyPlan.starten_keren) },
        raceverdeling: Array.isArray(d.raceverdeling)
          ? d.raceverdeling.map(it => ({ omschrijving: it?.omschrijving ?? '', geconstateerd_bij: it?.geconstateerd_bij ?? '' }))
          : emptyPlan.raceverdeling,
      };

      setPlan(normalized);
    })();
  }, [swimmerId]);

  async function save() {
    if (!swimmerId) return;
    setSaving(true); setMsg('');
    const { error } = await supabase
      .from('technique_plans')
      .upsert({ user_id: swimmerId, data: plan }, { onConflict: 'user_id' });

    setSaving(false);
    setMsg(error ? error.message : 'Opgeslagen.');
  }

  const setField = <K extends keyof PlanData>(k: K, v: PlanData[K]) => setPlan(p => ({ ...p, [k]: v }));

  // helpers for stroke arrays
  function updateStroke(key: 'vlinderslag'|'rugcrawl'|'schoolslag'|'borstcrawl', idx: number, patch: Partial<ItemStartVanaf>) {
    const arr = [...plan[key]];
    arr[idx] = { ...arr[idx], ...patch };
    setField(key, arr as any);
  }
  function addRow(key: 'vlinderslag'|'rugcrawl'|'schoolslag'|'borstcrawl') {
    setField(key, [...plan[key], { omschrijving: '', vanaf: '' }] as any);
  }
  function removeRow(key: 'vlinderslag'|'rugcrawl'|'schoolslag'|'borstcrawl', idx: number) {
    const arr = [...plan[key]];
    if (arr.length <= 1) { // keep at least one row
      arr[0] = { omschrijving: '', vanaf: '' };
    } else {
      arr.splice(idx, 1);
    }
    setField(key, arr as any);
  }

  return (
    <div className="vstack gap-6">
      {/* Techniekoefening 1 */}
      <div className="card">
        <h3 className="font-semibold mb-2">Techniekoefening 1</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="label">Omschrijving</div>
            <textarea className="w-full" rows={3}
              value={plan.oef1.omschrijving}
              onChange={e=>setField('oef1', { ...plan.oef1, omschrijving: e.target.value })} />
          </div>
          <div>
            <div className="label">Doel</div>
            <textarea className="w-full" rows={3}
              value={plan.oef1.doel}
              onChange={e=>setField('oef1', { ...plan.oef1, doel: e.target.value })} />
          </div>
          <div>
            <div className="label">Uitvoeren vanaf</div>
            <input className="w-full" type="date"
              value={plan.oef1.vanaf || ''}
              onChange={e=>setField('oef1', { ...plan.oef1, vanaf: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Techniekoefening 2 */}
      <div className="card">
        <h3 className="font-semibold mb-2">Techniekoefening 2</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="label">Omschrijving</div>
            <textarea className="w-full" rows={3}
              value={plan.oef2.omschrijving}
              onChange={e=>setField('oef2', { ...plan.oef2, omschrijving: e.target.value })} />
          </div>
          <div>
            <div className="label">Doel</div>
            <textarea className="w-full" rows={3}
              value={plan.oef2.doel}
              onChange={e=>setField('oef2', { ...plan.oef2, doel: e.target.value })} />
          </div>
          <div>
            <div className="label">Uitvoeren vanaf</div>
            <input className="w-full" type="date"
              value={plan.oef2.vanaf || ''}
              onChange={e=>setField('oef2', { ...plan.oef2, vanaf: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Belangrijkste techniekaccent per slag */}
      <div className="card">
        <h3 className="font-semibold mb-2">Belangrijkste techniekaccent per slag</h3>

        {/* Vlinderslag */}
        <div className="mb-4">
          <div className="font-medium">Vlinderslag</div>
          <div className="vstack gap-3">
            {plan.vlinderslag.map((it, idx) => (
              <div key={`vl-${idx}`} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="label">Omschrijving</div>
                  <textarea className="w-full" rows={2}
                    value={it.omschrijving}
                    onChange={e=>updateStroke('vlinderslag', idx, { omschrijving: e.target.value })} />
                </div>
                <div>
                  <div className="label">Focus vanaf</div>
                  <input className="w-full" type="date"
                    value={it.vanaf || ''}
                    onChange={e=>updateStroke('vlinderslag', idx, { vanaf: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <button className="btn bg-slate-600 hover:bg-slate-700 mr-2" type="button" onClick={()=>removeRow('vlinderslag', idx)}>Regel verwijderen</button>
                </div>
              </div>
            ))}
            <div>
              <button className="btn" type="button" onClick={()=>addRow('vlinderslag')}>+ Regel toevoegen</button>
            </div>
          </div>
        </div>

        {/* Rugcrawl */}
        <div className="mb-4">
          <div className="font-medium">Rugcrawl</div>
          <div className="vstack gap-3">
            {plan.rugcrawl.map((it, idx) => (
              <div key={`rc-${idx}`} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="label">Omschrijving</div>
                  <textarea className="w-full" rows={2}
                    value={it.omschrijving}
                    onChange={e=>updateStroke('rugcrawl', idx, { omschrijving: e.target.value })} />
                </div>
                <div>
                  <div className="label">Focus vanaf</div>
                  <input className="w-full" type="date"
                    value={it.vanaf || ''}
                    onChange={e=>updateStroke('rugcrawl', idx, { vanaf: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <button className="btn bg-slate-600 hover:bg-slate-700 mr-2" type="button" onClick={()=>removeRow('rugcrawl', idx)}>Regel verwijderen</button>
                </div>
              </div>
            ))}
            <div>
              <button className="btn" type="button" onClick={()=>addRow('rugcrawl')}>+ Regel toevoegen</button>
            </div>
          </div>
        </div>

        {/* Schoolslag (al bestaand, nu zelfde patroon) */}
        <div className="mb-4">
          <div className="font-medium">Schoolslag</div>
          <div className="vstack gap-3">
            {plan.schoolslag.map((it, idx) => (
              <div key={`ss-${idx}`} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="label">Omschrijving</div>
                  <textarea className="w-full" rows={2}
                    value={it.omschrijving}
                    onChange={e=>updateStroke('schoolslag', idx, { omschrijving: e.target.value })} />
                </div>
                <div>
                  <div className="label">Focus vanaf</div>
                  <input className="w-full" type="date"
                    value={it.vanaf || ''}
                    onChange={e=>updateStroke('schoolslag', idx, { vanaf: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <button className="btn bg-slate-600 hover:bg-slate-700 mr-2" type="button" onClick={()=>removeRow('schoolslag', idx)}>Regel verwijderen</button>
                </div>
              </div>
            ))}
            <div>
              <button className="btn" type="button" onClick={()=>addRow('schoolslag')}>+ Regel toevoegen</button>
            </div>
          </div>
        </div>

        {/* Borstcrawl */}
        <div className="mb-2">
          <div className="font-medium">Borstcrawl</div>
          <div className="vstack gap-3">
            {plan.borstcrawl.map((it, idx) => (
              <div key={`bc-${idx}`} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="label">Omschrijving</div>
                  <textarea className="w-full" rows={2}
                    value={it.omschrijving}
                    onChange={e=>updateStroke('borstcrawl', idx, { omschrijving: e.target.value })} />
                </div>
                <div>
                  <div className="label">Focus vanaf</div>
                  <input className="w-full" type="date"
                    value={it.vanaf || ''}
                    onChange={e=>updateStroke('borstcrawl', idx, { vanaf: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <button className="btn bg-slate-600 hover:bg-slate-700 mr-2" type="button" onClick={()=>removeRow('borstcrawl', idx)}>Regel verwijderen</button>
                </div>
              </div>
            ))}
            <div>
              <button className="btn" type="button" onClick={()=>addRow('borstcrawl')}>+ Regel toevoegen</button>
            </div>
          </div>
        </div>
      </div>

      {/* Starten & keren (single) */}
      <div className="card">
        <h3 className="font-semibold mb-2">Accenten bij starten en keren</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="label">Omschrijving</div>
            <textarea className="w-full" rows={3}
              value={plan.starten_keren.omschrijving}
              onChange={e=>setField('starten_keren', { ...plan.starten_keren, omschrijving: e.target.value })} />
          </div>
          <div>
            <div className="label">Focus vanaf</div>
            <input className="w-full" type="date"
              value={plan.starten_keren.vanaf || ''}
              onChange={e=>setField('starten_keren', { ...plan.starten_keren, vanaf: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Raceverdeling (multi) */}
      <div className="card">
        <h3 className="font-semibold mb-2">Verbeterpunten raceverdeling</h3>
        <div className="vstack gap-3">
          {plan.raceverdeling.map((it, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="label">Omschrijving</div>
                <textarea className="w-full" rows={2}
                  value={it.omschrijving}
                  onChange={e=>{
                    const a = [...plan.raceverdeling]; a[idx] = { ...it, omschrijving: e.target.value };
                    setField('raceverdeling', a);
                  }} />
              </div>
              <div>
                <div className="label">Geconstateerd bij</div>
                <input className="w-full" type="text"
                  value={it.geconstateerd_bij || ''}
                  onChange={e=>{
                    const a = [...plan.raceverdeling]; a[idx] = { ...it, geconstateerd_bij: e.target.value };
                    setField('raceverdeling', a);
                  }} />
              </div>
              <div className="sm:col-span-2">
                <button className="btn bg-slate-600 hover:bg-slate-700 mr-2" type="button"
                        onClick={()=>{
                          const a = [...plan.raceverdeling];
                          if (a.length <= 1) a[0] = { omschrijving: '', geconstateerd_bij: '' };
                          else a.splice(idx,1);
                          setField('raceverdeling', a);
                        }}>
                  Regel verwijderen
                </button>
              </div>
            </div>
          ))}
          <div>
            <button className="btn" type="button"
              onClick={()=>setField('raceverdeling', [...plan.raceverdeling, { omschrijving: '', geconstateerd_bij: '' }])}>
              + Regel toevoegen
            </button>
          </div>
        </div>
      </div>

      <div className="hstack">
        <button className="btn" onClick={save} disabled={saving}>{saving ? 'Opslaan…' : 'Opslaan'}</button>
        <div className="text-sm text-slate-600">{msg}</div>
      </div>
    </div>
  );
}

