
import React, { useMemo } from 'react';
import { SolventComponent, SolventCreationState } from '../types';
import { Plus, Trash2, Calculator, AlertCircle, Droplet, RefreshCw, Eraser, CheckCircle2, Zap } from 'lucide-react';

interface Props {
  state: SolventCreationState;
  setState: React.Dispatch<React.SetStateAction<SolventCreationState>>;
}

const SolventCreationCalculator: React.FC<Props> = ({ state, setState }) => {
  const { totalTargetMass, solvents } = state;

  const addSolvent = () => {
    setState(prev => ({
      ...prev,
      solvents: [...prev.solvents, { id: Date.now().toString(), name: '', weightPercent: undefined, isAuto: true }]
    }));
  };

  const removeSolvent = (id: string) => {
    if (solvents.length <= 1) return;
    setState(prev => ({
      ...prev,
      solvents: prev.solvents.filter(s => s.id !== id)
    }));
  };

  const clearSolventValue = (id: string) => {
    setState(prev => ({
      ...prev,
      solvents: prev.solvents.map(s => (s.id === id ? { ...s, weightPercent: undefined, isAuto: true } : s))
    }));
  };

  const updateSolvent = (id: string, field: keyof SolventComponent, value: any) => {
    setState(prev => ({
      ...prev,
      solvents: prev.solvents.map(s => (s.id === id ? { 
        ...s, 
        [field]: value, 
        isAuto: field === 'weightPercent' ? (value === undefined) : s.isAuto 
      } : s))
    }));
  };

  const calculateMatrix = () => {
    const manualTotal = solvents.reduce((sum, s) => sum + (!s.isAuto && s.weightPercent !== undefined ? s.weightPercent : 0), 0);
    const autoFields = solvents.filter(s => s.isAuto || s.weightPercent === undefined);
    
    if (autoFields.length > 0) {
      const remaining = Math.max(0, 100 - manualTotal);
      const splitValue = parseFloat((remaining / autoFields.length).toFixed(4));
      
      setState(prev => ({
        ...prev,
        solvents: prev.solvents.map(s => {
          if (s.isAuto || s.weightPercent === undefined) {
            return { ...s, weightPercent: splitValue, isAuto: true };
          }
          return s;
        })
      }));
    }
  };

  const preventScroll = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const handleNumInput = (val: string) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? undefined : parsed;
  };

  const solventTotalWt = useMemo(() => solvents.reduce((sum, s) => sum + (s.weightPercent || 0), 0), [solvents]);

  const recipe = useMemo(() => {
    if (totalTargetMass === undefined || totalTargetMass <= 0 || Math.abs(solventTotalWt - 100) > 0.01) {
      return null;
    }
    return solvents.map((s, i) => ({
      name: s.name.trim() || `Component ${String.fromCharCode(65 + i)}`,
      mass: (totalTargetMass * (s.weightPercent || 0)) / 100,
      percent: s.weightPercent || 0
    }));
  }, [totalTargetMass, solvents, solventTotalWt]);

  return (
    <div className="p-6 md:p-8 space-y-8 bg-white dark:bg-slate-800">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6 print:hidden">
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-sky-400 flex items-center gap-2">
              <Zap className="w-5 h-5 text-sky-500" />
              Batch Target
            </h3>
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Total Output (g)</label>
              <div className="relative">
                <input
                  type="number"
                  value={totalTargetMass ?? ''}
                  onWheel={preventScroll}
                  onChange={(e) => setState(prev => ({ ...prev, totalTargetMass: handleNumInput(e.target.value) }))}
                  placeholder="0.00"
                  className="w-full pl-4 pr-10 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all font-bold text-lg text-slate-900"
                />
                <span className="absolute right-4 top-3.5 text-slate-400 font-bold">g</span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-sky-400 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-sky-500" />
                Co-Solvents
              </h3>
              <button
                onClick={addSolvent}
                className="text-xs font-bold bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/60 px-2 py-1 rounded-md"
              >
                <Plus className="w-3 h-3" /> Add solvent
              </button>
            </div>

            <div className="space-y-2">
              {solvents.map((s, i) => (
                <div key={s.id} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) => updateSolvent(s.id, 'name', e.target.value)}
                    className="flex-grow px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-sky-500 text-slate-900 font-bold"
                    placeholder={`Solvent ${String.fromCharCode(65 + i)}`}
                  />
                  <div className="relative w-28">
                    <input
                      type="number"
                      value={s.weightPercent ?? ''}
                      onWheel={preventScroll}
                      onFocus={() => { if (s.isAuto) clearSolventValue(s.id); }}
                      onChange={(e) => updateSolvent(s.id, 'weightPercent', handleNumInput(e.target.value))}
                      placeholder="0.0"
                      className={`w-full pl-3 pr-7 py-1.5 text-sm border rounded-md outline-none focus:ring-1 focus:ring-sky-500 text-right transition-colors bg-white text-slate-900 font-bold ${
                        s.weightPercent === undefined ? 'text-slate-400' : s.isAuto ? 'text-emerald-600 italic' : ''
                      }`}
                    />
                    <span className="absolute right-2 top-1.5 text-slate-400 text-sm">%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => clearSolventValue(s.id)} className="p-1.5 text-slate-400 hover:text-sky-500 transition-colors">
                      <Eraser className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeSolvent(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={calculateMatrix}
              className="w-full flex items-center justify-center gap-2 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-all shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              Fill Remainder
            </button>
          </section>
        </div>

        <div className={`bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col h-full min-h-[450px] ${recipe ? 'print-full-page' : ''}`}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <span className="bg-sky-600 p-2 rounded-lg print:hidden"><Calculator className="w-5 h-5" /></span>
            Manifest
          </h3>
          {!recipe ? (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-500 space-y-4 border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center">
              <Droplet className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Verify matrix totals 100%</p>
            </div>
          ) : (
            <div className="space-y-6 flex-grow animate-in fade-in duration-300">
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">Ingredients</p>
                <div className="space-y-3">
                  {recipe.map((comp, idx) => (
                    <div key={idx} className="flex justify-between items-center group">
                      <div>
                        <span className="text-sm font-medium text-slate-300 block">{comp.name}</span>
                        <span className="text-[10px] text-slate-500">{comp.percent.toFixed(2)}%</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-mono font-bold text-sky-400">{comp.mass.toFixed(3)}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-auto pt-6 border-t border-slate-800 flex justify-between items-end">
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Batch</p>
                  <p className="text-2xl font-bold text-emerald-400">{totalTargetMass?.toFixed(2)}g</p>
                </div>
                <button onClick={() => window.print()} className="bg-white text-slate-900 px-6 py-2 rounded-xl font-bold hover:bg-slate-200 print:hidden shadow-lg">
                  Print
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolventCreationCalculator;
