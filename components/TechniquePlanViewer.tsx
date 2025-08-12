'use client'
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { PlanData } from './TechniquePlanEditor';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function TechniquePlanViewer({ userId }: { userId: string }) {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    (async () => {
      setMsg('');
      if (!userId) return;
      const { data, error } = await supabase
        .from('technique_plans')
        .select('data')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) { setMsg(error.message); return; }
      setPlan(data?.data ?? null);
    })();
  }, [userId]);

  if (!plan) {
    return <div className="card">Nog geen techniekplan beschikbaar.</div>;
  }

  return (
    <div className="vstack gap-6">
      <div className="card">
        <h3 className="font-semibold mb-2">Techniekoefening 1</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Info label="Omschrijving" value={plan.oef1.omschrijving} />
          <Info label="Doel" value={plan.oef1.doel} />
          <Info label="Uitvoeren vanaf" value={plan.oef1.vanaf} />
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Techniekoefening 2</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Info label="Omschrijving" value={plan.oef2.omschrijving} />
          <Info label="Doel" value={plan.oef2.doel} />
          <Info label="Uitvoeren vanaf" value={plan.oef2.vanaf} />
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Belangrijkste techniekaccent per slag</h3>
        <Section title="Vlinderslag" a={[
          ['Omschrijving', plan.vlinderslag.omschrijving],
          ['Focus vanaf',  plan.vlinderslag.vanaf || '']
        ]} />
        <Section title="Rugcrawl" a={[
          ['Omschrijving', plan.rugcrawl.omschrijving],
          ['Focus vanaf',  plan.rugcrawl.vanaf || '']
        ]} />
        <Section title="Schoolslag" a={[]} />
        <div className="vstack gap-2">
          {plan.schoolslag.map((it, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Info label={`Omschrijving ${i+1}`} value={it.omschrijving} />
              <Info label={`Focus vanaf ${i+1}`} value={it.vanaf} />
            </div>
          ))}
        </div>
        <Section title="Borstcrawl" a={[
          ['Omschrijving', plan.borstcrawl.omschrijving],
          ['Focus vanaf',  plan.borstcrawl.vanaf || '']
        ]} />
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Accenten bij starten en keren</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Info label="Omschrijving" value={plan.starten_keren.omschrijving} />
          <Info label="Focus vanaf" value={plan.starten_keren.vanaf} />
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Verbeterpunten raceverdeling</h3>
        <div className="vstack gap-2">
          {plan.raceverdeling.map((it, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Info label={`Omschrijving ${i+1}`} value={it.omschrijving} />
              <Info label={`Geconstateerd bij ${i+1}`} value={it.geconstateerd_bij} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="whitespace-pre-wrap">{value || '—'}</div>
    </div>
  );
}
function Section({ title, a }: { title: string; a: [string, string | undefined][] }) {
  return (
    <div className="mb-4">
      <div className="font-medium mb-1">{title}</div>
      {a.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {a.map(([k,v], i) => <Info key={i} label={k} value={v} />)}
        </div>
      ) : null}
    </div>
  );
}
