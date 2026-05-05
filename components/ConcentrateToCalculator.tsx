
import React, { useMemo } from 'react';
import { SolventComponent, ConcentrateToState } from '../types';
import { Plus, Trash2, Calculator, AlertCircle, Droplet, Target, ArrowRight, Info, RefreshCw, Eraser, CheckCircle2 } from 'lucide-react';

interface Props {
  state: ConcentrateToState;
  setState: React.Dispatch<React.SetStateAction<ConcentrateToState>>;
}

const ConcentrateToCalculator: React.FC<Props> = ({ state, setState }) => {
  const { initialMass, initialConcentration, targetMass, targetConcentration, yieldPercent, solvents } = state;

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

  const getInputClass = (val: number | undefined, isAuto?: boolean) => {
    const base = "w-full px-3 py-1.5 border rounded-lg text-sm outline-none transition-all focus:ring-1 focus:ring-sky-500 font-bold text-slate-900 ";
    if (val === undefined) return base + "bg-white border-slate-300 text-slate-400 placeholder-slate-300";
    if (isAuto) return base + "bg-emerald-50 border-emerald-200 text-emerald-700 italic";
    return base + "bg-white border-slate-400";
  };

  const solventTotalWt = useMemo(() => solvents.reduce((sum, s) => sum + (s.weightPercent || 0), 0), [solvents]);

  const results = useMemo(() => {
    if (initialMass === undefined || initialConcentration === undefined || targetMass === undefined || targetConcentration === undefined || yieldPercent === undefined || solventTotalWt === 0) {
      return { isReady: false };
    }
    const im = initialMass as number;
    const ic = initialConcentration as number;
    const tm = targetMass as number;
    const tc = targetConcentration as number;
    const yp = yieldPercent as number;

    const initialActive = im * (ic / 100);
    const finalActiveNeeded = tm * (tc / 100);
    const activeToAdd = finalActiveNeeded - initialActive;
    const bulkToAdd = activeToAdd / (yp / 100);
    const inactiveMass = bulkToAdd - activeToAdd;
    const totalMassIncrease = tm - im;
    // Solvent fills the remainder after weighing out the full bulk solid.
    // Subtracting only activeToAdd would overshoot the target mass when yield < 100%.
    const solventToAdd = totalMassIncrease - bulkToAdd;

    let error: string | null = null;
    if (activeToAdd < 0) error = "Final state lower than initial. Use Dilution tab.";
    else if (solventToAdd < 0) error = "Insufficient mass growth for this yield/concentration increase. Increase target mass or lower concentration.";

    const normalizationFactor = 100 / solventTotalWt;
    const solventBreakdown = solvents.map((s, i) => ({
      name: s.name.trim() || String.fromCharCode(65 + i),
      mass: solventToAdd * (((s.weightPercent || 0) * normalizationFactor) / 100)
    }));
    const yieldLoss = yp < 100;
    return { isReady: true, activeToAdd, bulkToAdd, inactiveMass, solventToAdd, solventBreakdown, yieldLoss, error };
  }, [initialMass, initialConcentration, targetMass, targetConcentration, yieldPercent, solvents, solventTotalWt]);

  return (
    <div className="p-6 md:p-8 space-y-8 bg-white dark:bg-slate-800">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6 print:hidden">
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-sky-400 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-sky-500" />
              State Mapping
            </h3>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start State</p>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mass (g)</label>
                  <input
                    type="number"
                    value={initialMass ?? ''}
                    onWheel={preventScroll}
                    onChange={(e) => setState(prev => ({ ...prev, initialMass: handleNumInput(e.target.value) }))}
                    placeholder="0.00"
                    className={getInputClass(initialMass)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Conc (%)</label>
                  <input
                    type="number"
                    value={initialConcentration ?? ''}
                    onWheel={preventScroll}
                    onChange={(e) => setState(prev => ({ ...prev, initialConcentration: handleNumInput(e.target.value) }))}
                    placeholder="0.00"
                    className={getInputClass(initialConcentration)}
                  />
                </div>
              </div>

              <div className="bg-sky-50 dark:bg-sky-900/10 p-4 rounded-xl border border-sky-200 dark:border-sky-800 space-y-3">
                <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Goal State</p>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mass (g)</label>
                  <input
                    type="number"
                    value={targetMass ?? ''}
                    onWheel={preventScroll}
                    onChange={(e) => setState(prev => ({ ...prev, targetMass: handleNumInput(e.target.value) }))}
                    placeholder="0.00"
                    className={getInputClass(targetMass)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Conc (%)</label>
                  <input
                    type="number"
                    value={targetConcentration ?? ''}
                    onWheel={preventScroll}
                    onChange={(e) => setState(prev => ({ ...prev, targetConcentration: handleNumInput(e.target.value) }))}
                    placeholder="0.00"
                    className={getInputClass(targetConcentration)}
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Solute Yield (%)</label>
                <input
                  type="number"
                  value={yieldPercent ?? ''}
                  onWheel={preventScroll}
                  onChange={(e) => setState(prev => ({ ...prev, yieldPercent: handleNumInput(e.target.value) }))}
                  placeholder="100"
                  className={getInputClass(yieldPercent)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-sky-400 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-sky-500" />
                Additional Matrix
              </h3>
              <button
                onClick={addSolvent}
                className="text-xs font-bold bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/60 px-2 py-1 rounded-md"
              >
                <Plus className="w-3 h-3" /> Add Solvent
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
              Recalculate Proportions
            </button>
          </section>
        </div>

        <div className={`bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col h-full min-h-[450px] ${results.isReady && !results.error ? 'print-full-page' : ''}`}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <span className="bg-sky-600 p-2 rounded-lg print:hidden"><Target className="w-5 h-5" /></span>
            Recipe
          </h3>

          {!results.isReady ? (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-500 space-y-4 border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center">
              <Target className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Map your batch transformation</p>
            </div>
          ) : results.error ? (
            <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl text-red-200 text-sm flex gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{results.error}</span>
            </div>
          ) : (
            <div className="space-y-6 flex-grow animate-in fade-in duration-500">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-sky-400">Solute Mass</h4>
                    <p className="text-xs text-slate-400">Bulk to Weigh Out</p>
                  </div>
                  <div className="text-2xl font-mono font-bold">
                    {results.bulkToAdd?.toFixed(3)}g
                  </div>
                </div>
                {results.yieldLoss && (
                  <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-0.5">Active Fraction</span>
                      <span className="font-mono text-emerald-400">{results.activeToAdd?.toFixed(3)}g</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-0.5">Inactive / Lost</span>
                      <span className="font-mono text-amber-400">{results.inactiveMass?.toFixed(3)}g</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h4 className="font-semibold text-emerald-400 mb-2">Solvent System: {results.solventToAdd?.toFixed(3)}g</h4>
                <div className="space-y-2 pt-2 border-t border-slate-700">
                  {results.solventBreakdown?.map((s, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-400">{s.name}</span>
                      <span className="font-mono">{s.mass.toFixed(3)}g</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800 mt-auto flex justify-between">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Final Total</p>
                  <p className="text-xl font-bold text-emerald-400">{targetMass}g</p>
                </div>
                <button onClick={() => window.print()} className="bg-white text-slate-900 px-6 py-2 rounded-xl font-bold hover:bg-slate-200 print:hidden">
                  Print Label
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConcentrateToCalculator;
