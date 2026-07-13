
import React, { useMemo } from 'react';
import { SolventComponent, OnePotState } from '../types';
import { Plus, Trash2, Calculator, AlertCircle, Droplet, RefreshCw, Eraser, CheckCircle2 } from 'lucide-react';

interface Props {
  state: OnePotState;
  setState: React.Dispatch<React.SetStateAction<OnePotState>>;
}

const OnePotCalculator: React.FC<Props> = ({ state, setState }) => {
  const { soluteName, targetMass, targetConcentration, yieldPercent, solvents } = state;

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
    const base = "w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all font-bold text-slate-900 ";
    if (val === undefined) return base + "bg-white border-slate-300 text-slate-400 placeholder-slate-300 focus:ring-sky-500";
    if (isAuto) return base + "bg-emerald-50 border-emerald-200 text-emerald-700 italic";
    return base + "bg-white border-slate-400 focus:ring-sky-500";
  };

  const solventTotalWt = useMemo(() => solvents.reduce((sum, s) => sum + (s.weightPercent || 0), 0), [solvents]);

  const results = useMemo(() => {
    if (targetMass === undefined || targetConcentration === undefined || yieldPercent === undefined || solventTotalWt === 0) {
      return { isReady: false as const };
    }
    let error: string | null = null;
    if (targetMass <= 0) error = "Target mass must be greater than 0.";
    else if (yieldPercent <= 0 || yieldPercent > 100) error = "Solubility must be between 0 and 100%.";
    else if (targetConcentration < 0 || targetConcentration >= 100) error = "Concentration must be between 0 and 100%.";
    if (error) return { isReady: true as const, error };

    const concentrationDecimal = targetConcentration / 100;
    const activeSoluteNeeded = targetMass * concentrationDecimal;
    const bulkSoluteNeeded = activeSoluteNeeded / (yieldPercent / 100);
    const inactiveMass = bulkSoluteNeeded - activeSoluteNeeded;
    // Process mass balance (SOP F056: mix -> centrifuge -> decant):
    // the insoluble fraction of the bulk solid leaves with the pellet at
    // centrifugation, so the decanted ink = dissolved solute + all solvent.
    // Solvent therefore tops up the FINAL ink mass, not the pot charge.
    const totalSolventMass = targetMass - activeSoluteNeeded;
    const potMass = bulkSoluteNeeded + totalSolventMass;
    const normalizationFactor = 100 / solventTotalWt;
    const solventBreakdown = solvents.map((s, i) => ({
      name: s.name.trim() || String.fromCharCode(65 + i),
      mass: totalSolventMass * (((s.weightPercent || 0) * normalizationFactor) / 100)
    }));
    const yieldLoss = yieldPercent < 100;
    return { isReady: true as const, error: null, activeSoluteNeeded, bulkSoluteNeeded, inactiveMass, totalSolventMass, potMass, solventBreakdown, yieldLoss };
  }, [targetMass, targetConcentration, yieldPercent, solvents, solventTotalWt]);

  return (
    <div className="p-6 md:p-8 space-y-8 bg-white dark:bg-slate-800">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6 print:hidden">
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-sky-400 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-sky-500" />
              Primary Parameters
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Solute Name</label>
                <input
                  type="text"
                  value={soluteName}
                  onChange={(e) => setState(prev => ({ ...prev, soluteName: e.target.value }))}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all text-slate-900 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Target Mass (g)</label>
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
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Concentration (%)</label>
                <input
                  type="number"
                  value={targetConcentration ?? ''}
                  onWheel={preventScroll}
                  onChange={(e) => setState(prev => ({ ...prev, targetConcentration: handleNumInput(e.target.value) }))}
                  placeholder="0.00"
                  className={getInputClass(targetConcentration)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Solubility / Yield (%)</label>
                <input
                  type="number"
                  value={yieldPercent ?? ''}
                  onWheel={preventScroll}
                  onChange={(e) => setState(prev => ({ ...prev, yieldPercent: handleNumInput(e.target.value) }))}
                  placeholder="85"
                  className={getInputClass(yieldPercent)}
                />
              </div>
            </div>
            <div className="flex gap-2 items-start p-3 bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
              <p className="text-xs text-sky-800 dark:text-sky-300">
                One-pot process per SOP F056: mix &rarr; centrifuge &rarr; decant. The insoluble fraction
                of the nano is removed with the pellet, so the decanted ink hits your target mass and
                concentration.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-sky-400 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-sky-500" />
                Solvent Matrix (wt%)
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

            <div className="flex flex-col gap-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Matrix</span>
                  <span className={`text-sm font-bold ${Math.abs(solventTotalWt - 100) < 0.01 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {solventTotalWt.toFixed(2)}%
                  </span>
                </div>
                <button
                  onClick={calculateMatrix}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white text-xs font-bold rounded-lg hover:bg-sky-600 transition-all shadow-sm active:scale-95"
                >
                  <RefreshCw className="w-3 h-3" />
                  Fill Remainder
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className={`bg-slate-900 rounded-2xl p-6 text-white shadow-inner flex flex-col h-full min-h-[400px] ${results.isReady && !results.error ? 'print-full-page' : ''}`}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <span className="bg-sky-600 p-2 rounded-lg print:hidden"><Calculator className="w-5 h-5" /></span>
            Recipe Card
          </h3>
          
          {!results.isReady ? (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-500 space-y-4 border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center">
              <Calculator className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Input recipe parameters</p>
            </div>
          ) : results.error ? (
            <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl text-red-200 text-sm flex gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{results.error}</span>
            </div>
          ) : (
            <div className="space-y-6 flex-grow animate-in fade-in duration-500">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Solute Addition</p>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{soluteName}</h4>
                      <p className="text-xs text-slate-400">Bulk Mass to Weigh Out</p>
                    </div>
                    <div className="text-2xl font-mono font-bold text-sky-400">
                      {results.bulkSoluteNeeded?.toFixed(3)}g
                    </div>
                  </div>
                  {results.yieldLoss && (
                    <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-2 text-xs">
                      <div className="text-slate-400">
                        <span className="block text-[10px] uppercase tracking-widest font-bold mb-0.5">Dissolves (Soluble)</span>
                        <span className="font-mono text-emerald-400">{results.activeSoluteNeeded?.toFixed(3)}g</span>
                      </div>
                      <div className="text-slate-400">
                        <span className="block text-[10px] uppercase tracking-widest font-bold mb-0.5">Insoluble (Removed)</span>
                        <span className="font-mono text-amber-400">{results.inactiveMass?.toFixed(3)}g</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Solvent System</p>
                <div className="space-y-2">
                  {results.solventBreakdown?.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center px-4 py-3 bg-slate-800 rounded-lg border border-slate-700">
                      <span className="text-sm font-medium">{s.name}</span>
                      <span className="font-mono text-slate-200">{s.mass.toFixed(3)}g</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Process Mass Balance</p>
                <div className="bg-slate-800 rounded-xl border border-slate-700 divide-y divide-slate-700/60 text-sm">
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-slate-400">1. Pot charge (mix)</span>
                    <span className="font-mono text-slate-200">{results.potMass?.toFixed(3)}g</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-slate-400">2. Centrifuge &amp; decant (insoluble out)</span>
                    <span className="font-mono text-amber-400">&minus;{results.inactiveMass?.toFixed(3)}g</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-slate-300 font-semibold">3. Final decanted ink</span>
                    <span className="font-mono text-emerald-400 font-bold">{targetMass?.toFixed(3)}g @ {targetConcentration?.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800 flex justify-between items-end mt-auto">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Final Ink Mass</p>
                  <p className="text-lg font-semibold">{targetMass?.toFixed(2)}g</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Final Conc</p>
                  <p className="text-lg font-semibold text-emerald-400">{targetConcentration?.toFixed(2)}%</p>
                </div>
              </div>
            </div>
          )}

          <button
            disabled={!results.isReady || !!results.error}
            onClick={() => window.print()}
            className={`mt-8 w-full py-3 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 print:hidden ${
              results.isReady && !results.error ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            Print Recipe
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnePotCalculator;
