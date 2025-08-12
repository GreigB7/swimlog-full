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
  vlinderslag: ItemStartVanaf;
  rugcrawl:   ItemStartVanaf;
  schoolslag: ItemStartVanaf[];       // allow multiple
  borstcrawl: ItemStartVanaf;
  starten_keren: ItemStartVanaf;
  raceverdeling: ItemGeconstateerd[]; // allow multiple
};

const emptyPlan: PlanData = {
  oef1: { omschrijving: '', doel: '', vanaf: '' },
  oef2: { omschrijving: '', doel: '', vanaf: '' },
  vlinderslag: { omschrijving: '', vanaf: '' },
  rugcrawl: { omschrijving: '', vanaf: '' },
  schoolslag: [{ omschrijving: '', vanaf: '' }],
  borstcrawl: { omschrijving: '', vanaf: '' },
  starten_keren: { omschrijving: '', vanaf: '' },
  raceverdeling: [{ omschrijving: '', geconstateerd_bij: '' }],
};

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
      if (data?.data) setPlan({ ...emptyPlan, ...data.data });
      else setPlan(emptyPlan);
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

  const set = <K extends keyof PlanData>(k: K, v: PlanData[K]) => setPlan(p => ({ ...p, [k]: v }));

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
              onChange={e=>set('oef1', { ...plan.oef1, omschrijving: e.target.value })} />
          </div>
          <div>
            <div className="label">Doel</div>
            <textarea className="w-full" rows={3}
              value={plan.oef1.doel}
              onChange={e=>set('oef1', { ...plan.oef1, doel: e.target.value })} />
          </div>
          <div>
            <div className="label">Uitvoeren vanaf</div>
            <input className="w-full" type="date"
              value={plan.oef1.vanaf || ''}
              onChange={e=>set('oef1', { ...plan.oef1, vanaf: e.target.value })} />
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
              onChange={e=>set('oef2', { ...plan.oef2, omschrijving: e.target.value })} />
          </div>
          <div>
            <div className="label">Doel</div>
            <textarea className="w-full" rows={3}
              value={plan.oef2.doel}
              onChange={e=>set('oef2', { ...plan.oef2, doel: e.target.value })} />
          </div>
          <div>
            <div className="label">Uitvoeren vanaf</div>
            <input className="w-full" type="date"
              value={plan.oef2.vanaf || ''}
              onChange={e=>set('oef2', { ...plan.oef2, vanaf: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Belangrijkste techniekaccent per slag */}
      <div className="card">
        <h3 className="font-semibold mb-2">Belangrijkste techniekaccent per slag</h3>

        {/* Vlinderslag */}
        <div className="mb-4">
          <div className="font-medium">Vlinderslag</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="label">Omschrijving</div>
              <textarea className="w-full" rows={2}
                value={plan.vlinderslag.omschrijving}
                onChange={e=>set('vlinderslag', { ...plan.vlinderslag, omschrijving: e.target.value })} />
            </div>
            <div>
              <div className="label">Focus vanaf</div>
              <input className="w-full" type="date"
                value={plan.vlinderslag.vanaf || ''}
                onChange={e=>set('vlinderslag', { ...plan.vlinderslag, vanaf: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Rugcrawl */}
        <div className="mb-4">
          <div className="font-medium">Rugcrawl</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="label">Omschrijving</div>
              <textarea className="w-full" rows={2}
                value={plan.rugcrawl.omschrijving}
                onChange={e=>set('rugcrawl', { ...plan.rugcrawl, omschrijving: e.target.value })} />
            </div>
            <div>
              <div className="label">Focus vanaf</div>
              <input className="w-full" type="date"
                value={plan.rugcrawl.vanaf || ''}
                onChange={e=>set('rugcrawl', { ...plan.rugcrawl, vanaf: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Schoolslag (meerdere items) */}
        <div className="mb-4">
          <div className="font-medium">Schoolslag</div>
          <div className="vstack gap-3">
            {plan.schoolslag.map((it, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="label">Omschrijving</div>
                  <textarea className="w-full" rows={2}
                    value={it.omschrijving}
                    onChange={e=>{
                      const arr = [...plan.schoolslag]; arr[idx] = { ...it, omschrijving: e.target.value };
                      set('schoolslag', arr);
                    }} />
                </div>
                <div>
                  <div className="label">Focus vanaf</div>
                  <input className="w-full" type="date"
                    value={it.vanaf || ''}
                    onChange={e=>{
                      const arr = [...plan.schoolslag]; arr[idx] = { ...it, vanaf: e.target.value };
                      set('schoolslag', arr);
                    }} />
                </div>
              </div>
            ))}
            <div>
              <button className="btn" type="button"
                onClick={()=>set('schoolslag', [...plan.schoolslag, { omschrijving: '', vanaf: '' }])}>
                + Regel toevoegen
              </button>
            </div>
          </div>
        </div>

        {/* Borstcrawl */}
        <div className="mb-2">
          <div className="font-medium">Borstcrawl</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="label">Omschrijving</div>
              <textarea className="w-full" rows={2}
                value={plan.borstcrawl.omschrijving}
                onChange={e=>set('borstcrawl', { ...plan.borstcrawl, omschrijving: e.target.value })} />
            </div>
            <div>
              <div className="label">Focus vanaf</div>
              <input className="w-full" type="date"
                value={plan.borstcrawl.vanaf || ''}
                onChange={e=>set('borstcrawl', { ...plan.borstcrawl, vanaf: e.target.value })} />
            </div>
          </div>
        </div>
      </div>

      {/* Starten & keren */}
      <div className="card">
        <h3 className="font-semibold mb-2">Accenten bij starten en keren</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="label">Omschrijving</div>
            <textarea className="w-full" rows={3}
              value={plan.starten_keren.omschrijving}
              onChange={e=>set('starten_keren', { ...plan.starten_keren, omschrijving: e.target.value })} />
          </div>
          <div>
            <div className="label">Focus vanaf</div>
            <input className="w-full" type="date"
              value={plan.starten_keren.vanaf || ''}
              onChange={e=>set('starten_keren', { ...plan.starten_keren, vanaf: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Raceverdeling */}
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
                    const a = [...plan.raceverdeling]; a[idx] = { ...it, omschrijving: e.target.value }; set('raceverdeling', a);
                  }} />
              </div>
              <div>
                <div className="label">Geconstateerd bij</div>
                <input className="w-full" type="text"
                  value={it.geconstateerd_bij || ''}
                  onChange={e=>{
                    const a = [...plan.raceverdeling]; a[idx] = { ...it, geconstateerd_bij: e.target.value }; set('raceverdeling', a);
                  }} />
              </div>
            </div>
          ))}
          <div>
            <button className="btn" type="button"
              onClick={()=>set('raceverdeling', [...plan.raceverdeling, { omschrijving: '', geconstateerd_bij: '' }])}>
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
