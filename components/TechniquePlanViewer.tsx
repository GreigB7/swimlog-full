'use client'
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { PlanData } from './TechniquePlanEditor';
import { PrintButton } from '@/components/PrintButton';

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
      if (!data?.data) { setPlan(null); return; }

      // quick normalize for viewing
      const d = data.data as any;
      const toArr = (x:any) => Array.isArray(x) ? x : x ? [x] : [];
      setPlan({
        oef1: d.oef1,
        oef2: d.oef2,
        vlinderslag: toArr(d.vlinderslag),
        rugcrawl:    toArr(d.rugcrawl),
        schoolslag:  toArr(d.schoolslag),
        borstcrawl:  toArr(d.borstcrawl),
        starten_keren: d.starten_keren,
        raceverdeling: Array.isArray(d.raceverdeling) ? d.raceverdeling : [],
      });
    })();
  }, [userId]);

  <div className="card print:hidden">
  <div className="flex items-center justify-between">
    <h1 className="text-xl font-semibold">Techniekplan</h1>
    <PrintButton />
  </div>
  <p className="text-sm text-slate-600">Dit is jouw techniekplan zoals ingesteld door de coach.</p>
</div>


  if (msg) return <div className="card">{msg}</div>;
  if (!plan) return <div className="card">Nog geen techniekplan beschikbaar.</div>;

  return (
    <div className="vstack gap-6">
      <div className="card">
        <h3 className="font-semibold mb-2">Techniekoefening 1</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Info label="Omschrijving" value={plan.oef1?.omschrijving} />
          <Info label="Doel" value={plan.oef1?.doel} />
          <Info label="Uitvoeren vanaf" value={plan.oef1?.vanaf} />
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Techniekoefening 2</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Info label="Omschrijving" value={plan.oef2?.omschrijving} />
          <Info label="Doel" value={plan.oef2?.doel} />
          <Info label="Uitvoeren vanaf" value={plan.oef2?.vanaf} />
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Belangrijkste techniekaccent per slag</h3>

        <StrokeSection title="Vlinderslag" rows={plan.vlinderslag} />
        <StrokeSection title="Rugcrawl" rows={plan.rugcrawl} />
        <StrokeSection title="Schoolslag" rows={plan.schoolslag} />
        <StrokeSection title="Borstcrawl" rows={plan.borstcrawl} />
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Accenten bij starten en keren</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Info label="Omschrijving" value={plan.starten_keren?.omschrijving} />
          <Info label="Focus vanaf" value={plan.starten_keren?.vanaf} />
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
          {!plan.raceverdeling.length && <div className="text-sm text-slate-600">—</div>}
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

function StrokeSection({ title, rows }: { title: string; rows: { omschrijving: string; vanaf?: string }[] }) {
  if (!rows?.length) return (
    <div className="mb-4">
      <div className="font-medium mb-1">{title}</div>
      <div className="text-sm text-slate-600">—</div>
    </div>
  );

  return (
    <div className="mb-4">
      <div className="font-medium mb-1">{title}</div>
      <div className="vstack gap-2">
        {rows.map((it, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Info label={`Omschrijving ${i+1}`} value={it.omschrijving} />
            <Info label={`Focus vanaf ${i+1}`} value={it.vanaf} />
          </div>
        ))}
      </div>
    </div>
  );
}

