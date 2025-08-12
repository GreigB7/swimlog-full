'use client'
import React from 'react';

type Props = {
  mode: 'week' | '8weeks';
  setMode: (m: 'week' | '8weeks') => void;
  date: string;                // ISO yyyy-mm-dd (valt binnen de gewenste week)
  setDate: (d: string) => void;
};

export function WeekControls({ mode, setMode, date, setDate }: Props) {
  return (
    <div className="card">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm text-slate-600 mb-1">Weergave</div>
          <div className="inline-flex rounded-lg border overflow-hidden">
            <button
              type="button"
              onClick={() => setMode('week')}
              className={`px-3 py-2 text-sm ${mode === 'week' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
              aria-pressed={mode === 'week'}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setMode('8weeks')}
              className={`px-3 py-2 text-sm border-l ${mode === '8weeks' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
              aria-pressed={mode === '8weeks'}
            >
              Laatste 8 weken
            </button>
          </div>
        </div>

        {mode === 'week' && (
          <div>
            <label className="label">Referentiedatum (valt binnen de week)</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
