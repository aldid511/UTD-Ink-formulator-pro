import React from 'react';
import { SolventSystemId } from '../types';
import { SOLVENT_SYSTEMS, SOLVENT_SYSTEM_IDS, PRESET_CONCENTRATIONS, getInkName } from '../presets';
import { Droplet, Tag } from 'lucide-react';

/** Pick one of the two standard solvent systems; shows its fixed composition. */
export const SolventSystemPicker: React.FC<{
  value: SolventSystemId;
  onChange: (v: SolventSystemId) => void;
  title?: string;
}> = ({ value, onChange, title = 'Solvent System' }) => {
  const sys = SOLVENT_SYSTEMS[value];
  return (
    <section className="space-y-3">
      <h3 className="text-lg font-bold text-slate-800 dark:text-sky-400 flex items-center gap-2">
        <Droplet className="w-5 h-5 text-sky-500" />
        {title}
      </h3>
      <div className="flex gap-2">
        {SOLVENT_SYSTEM_IDS.map(id => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold border transition-all ${
              value === id
                ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-sky-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {SOLVENT_SYSTEMS[id].name}
          </button>
        ))}
      </div>
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sys.ratio}</p>
        {sys.components.map(c => (
          <div key={c.name} className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-300 font-medium">{c.name}</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{c.weightPercent.toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </section>
  );
};

/** Preset concentration dropdown, replacing the free-entry concentration field. */
export const ConcentrationPicker: React.FC<{
  value?: number;
  onChange: (v: number | undefined) => void;
  system?: SolventSystemId;
  label?: string;
}> = ({ value, onChange, system, label = 'Concentration' }) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{label}</label>
    {/* The select keeps dark text even when unset: the native popup list
        inherits the control's colour, so greying it greys every option. */}
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all font-bold bg-white text-slate-900 ${
        value === undefined ? 'border-slate-300' : 'border-slate-400'
      }`}
    >
      {/* Options carry their own colour: without it they inherit the grey
          placeholder text colour from the select and render washed out. */}
      <option value="" className="text-slate-900">Select…</option>
      {PRESET_CONCENTRATIONS.map(c => {
        const name = system ? getInkName(c, system) : undefined;
        return (
          <option key={c} value={c} className="text-slate-900">
            {c}%{name ? ` — ${name}` : ''}
          </option>
        );
      })}
    </select>
  </div>
);

/** Product name badge for the recipe card. */
export const InkNameBadge: React.FC<{ concentration?: number; system?: SolventSystemId }> = ({
  concentration,
  system,
}) => {
  const name = getInkName(concentration, system);
  if (!name) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-sky-900/30 border border-sky-700/50 rounded-xl">
      <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <Tag className="w-3.5 h-3.5" />
        Ink Formulation
      </span>
      <span className="text-xl font-bold font-mono text-sky-300">{name}</span>
    </div>
  );
};
