'use client'
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { PlanData } from './TechniquePlanEditor';

const supabase = getSupabaseBrowserClient();

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function textValue(value: unknown) {
  return value == null ? '' : String(value);
}

function normExercise(value: unknown): PlanData['oef1'] {
  if (!isRecord(value)) return { omschrijving: '', doel: '', vanaf: '' };
  return {
    omschrijving: textValue(value.omschrijving),
    doel: textValue(value.doel),
    vanaf: textValue(value.vanaf),
  };
}

function normStartVanaf(value: unknown): PlanData['vlinderslag'][number] {
  if (!isRecord(value)) return { omschrijving: '', vanaf: '' };
  return {
    omschrijving: textValue(value.omschrijving),
    vanaf: textValue(value.vanaf),
  };
}

function normStartVanafList(value: unknown) {
  if (Array.isArray(value)) return value.map(normStartVanaf);
  return value ? [normStartVanaf(value)] : [];
}

function normRaceverdeling(value: unknown): PlanData['raceverdeling'] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (!isRecord(item)) return { omschrijving: '', geconstateerd_bij: '' };
    return {
      omschrijving: textValue(item.omschrijving),
      geconstateerd_bij: textValue(item.geconstateerd_bij),
    };
  });
}

function normPlan(value: unknown): PlanData | null {
  if (!isRecord(value)) return null;
  return {
    oef1: normExercise(value.oef1),
    oef2: normExercise(value.oef2),
    vlinderslag: normStartVanafList(value.vlinderslag),
    rugcrawl: normStartVanafList(value.rugcrawl),
    schoolslag: normStartVanafList(value.schoolslag),
    borstcrawl: normStartVanafList(value.borstcrawl),
    starten_keren: normStartVanaf(value.starten_keren),
    raceverdeling: normRaceverdeling(value.raceverdeling),
  };
}

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
      setPlan(normPlan(data.data));
    })();
  }, [userId]);

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
