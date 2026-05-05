
import React, { useMemo } from 'react';
import { DilutionState } from '../types';
import { FlaskConical, Plus, Beaker, Info, ArrowRight, Target, RefreshCw, AlertCircle, Layers } from 'lucide-react';

interface Props {
  state: DilutionState;
  setState: React.Dispatch<React.SetStateAction<DilutionState>>;
}

const DilutionCalculator: React.FC<Props> = ({ state, setState }) => {
  const { 
    calcMode,
    initialMass, 
    initialConcentration, 
    adjustMode, 
    addedSolidMass, 
    solidYield, 
    addedSolutionMass, 
    addedSolutionConcentration,
    targetConcentration,
    backwardManualField,
    targetMass,
    backwardConcInput
  } = state;

  const preventScroll = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const handleNumInput = (val: string) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? undefined : parsed;
  };

  const getInputClass = (val: number | undefined, isManual: boolean = false, hasError: boolean = false) => {
    const base = "w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all font-bold text-slate-900 ";
    if (hasError) return base + "bg-red-100 border-red-500 focus:ring-red-500";
    if (val === undefined) return base + "bg-white border-slate-300 text-slate-400 placeholder-slate-300 focus:ring-sky-500";
    if (isManual) return base + "bg-yellow-100 border-yellow-400 text-slate-900 focus:ring-yellow-500";
    return base + "bg-emerald-100 border-emerald-400 text-slate-900 focus:ring-emerald-500";
  };

  const results = useMemo(() => {
    const isBasicReady = initialMass !== undefined && initialConcentration !== undefined;
    if (!isBasicReady) return { isReady: false };

    const im = initialMass as number;
    const ic = initialConcentration as number;
    const initialActive = im * (ic / 100);

    // --- MULTIBATCH MODE ---
    if (adjustMode === 'MULTIBATCH') {
      if (targetConcentration === undefined || targetMass === undefined) return { isReady: false };
      const tc = targetConcentration as number;
      const tm = targetMass as number;

      if (ic === 0) return { isReady: true, error: "Initial concentration cannot be 0% for dilution." };
      if (tc > ic) return { isReady: true, error: "Target concentration cannot be higher than initial for dilution." };

      const massUsed = (tm * tc) / ic;
      const diluentNeeded = tm - massUsed;

      if (massUsed > im) {
        return { 
          isReady: true, 
          error: `Insufficient stock. Need ${massUsed.toFixed(2)}g of stock ink, but only ${im.toFixed(2)}g is available.` 
        };
      }

      return { 
        isReady: true, 
        initialMass: im, 
        initialConcentration: ic, 
        additionDesc: `Dilute ${massUsed.toFixed(2)}g of stock`, 
        massUsed, 
        diluentNeeded, 
        finalMass: tm, 
        finalConcentration: tc, 
        remainingStock: im - massUsed,
        error: null 
      };
    }

    // --- FORWARD MODE ---
    if (calcMode === 'FORWARD') {
      let isMethodReady = false;
      if (adjustMode === 'ADD_SOLID') {
        isMethodReady = addedSolidMass !== undefined && solidYield !== undefined;
      } else {
        isMethodReady = addedSolutionMass !== undefined && addedSolutionConcentration !== undefined;
      }
      if (!isMethodReady) return { isReady: false };

      let finalMass = im;
      let finalActive = initialActive;
      let additionDesc = "";
      let additionMassVal = 0;

      if (adjustMode === 'ADD_SOLID') {
        const asm = addedSolidMass as number;
        const sy = solidYield as number;
        const activePart = asm * (sy / 100);
        finalMass += asm; 
        finalActive += activePart;
        additionMassVal = asm;
        additionDesc = `Added ${asm}g solid (${sy}% yield)`;
      } else {
        const asom = addedSolutionMass as number;
        const asoc = addedSolutionConcentration as number;
        finalMass += asom;
        finalActive += asom * (asoc / 100);
        additionMassVal = asom;
        additionDesc = `Added ${asom}g solution (${asoc}% concentration)`;
      }
      const finalConcentration = finalMass > 0 ? (finalActive / finalMass) * 100 : 0;
      return { isReady: true, initialMass: im, initialConcentration: ic, additionDesc, additionMass: additionMassVal, finalMass, finalConcentration, error: null };
    }

    // --- BACKWARD MODE ---
    if (calcMode === 'BACKWARD') {
      if (targetConcentration === undefined) return { isReady: false };
      const tc = targetConcentration as number;
      if (adjustMode === 'ADD_SOLID') {
        if (solidYield === undefined || solidYield === 0) return { isReady: false };
        const sy = solidYield as number;
        if (sy <= tc) return { isReady: true, error: `Solid yield (${sy}%) must be higher than goal (${tc}%).` };
        const ma = im * (tc - ic) / (sy - tc);
        if (ma < 0) return { isReady: true, error: "Transformation impossible with this solid." };
        return { isReady: true, initialMass: im, initialConcentration: ic, additionDesc: `Add ${ma.toFixed(3)}g Solid`, additionMass: ma, finalMass: im + ma, finalConcentration: tc, error: null };
      } else {
        if (backwardManualField === 'TARGET_MASS') {
          if (targetMass === undefined || targetMass <= im) return { isReady: true, error: "Target mass must exceed initial mass." };
          const fm = targetMass as number;
          const ma = fm - im;
          const ca = (fm * tc - im * ic) / ma;
          if (ca < 0) return { isReady: true, error: "Requires negative concentration addition." };
          if (ca > 100) return { isReady: true, error: `Required concentration (${ca.toFixed(2)}%) > 100%.` };
          return { isReady: true, initialMass: im, initialConcentration: ic, additionDesc: `Add ${ma.toFixed(2)}g of ${ca.toFixed(3)}% solution`, additionMass: ma, additionConc: ca, finalMass: fm, finalConcentration: tc, error: null };
        } else {
          if (backwardConcInput === undefined) return { isReady: false };
          const ca = backwardConcInput as number;
          if (Math.abs(ca - tc) < 0.00001) return { isReady: true, error: "Addition cannot equal target concentration." };
          const ma = im * (tc - ic) / (ca - tc);
          if (ma < 0) return { isReady: true, error: "Requires negative mass addition." };
          return { isReady: true, initialMass: im, initialConcentration: ic, additionDesc: `Add ${ma.toFixed(3)}g of ${ca}% solution`, additionMass: ma, additionConc: ca, finalMass: im + ma, finalConcentration: tc, error: null };
        }
      }
    }
    return { isReady: false };
  }, [calcMode, initialMass, initialConcentration, adjustMode, addedSolidMass, solidYield, addedSolutionMass, addedSolutionConcentration, targetConcentration, backwardManualField, targetMass, backwardConcInput]);

  return (
    <div className="p-6 md:p-8 space-y-8 bg-white dark:bg-slate-800">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6 print:hidden">
          <div className={`flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl transition-all ${adjustMode === 'MULTIBATCH' ? 'opacity-50 pointer-events-none' : ''}`}>
            <button
              onClick={() => setState(prev => ({ ...prev, calcMode: 'FORWARD' }))}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                calcMode === 'FORWARD' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 dark:text-sky-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Adjust Existing
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, calcMode: 'BACKWARD' }))}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                calcMode === 'BACKWARD' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 dark:text-sky-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              Reach Target
            </button>
          </div>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-sky-400 uppercase tracking-widest flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-sky-500" />
              1. Initial Ink (Stock)
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Available Mass (g)</label>
                <input
                  type="number"
                  value={initialMass ?? ''}
                  onWheel={preventScroll}
                  onChange={(e) => setState(prev => ({ ...prev, initialMass: handleNumInput(e.target.value) }))}
                  placeholder="0.00"
                  className={getInputClass(initialMass, true)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Stock Conc (%)</label>
                <input
                  type="number"
                  value={initialConcentration ?? ''}
                  onWheel={preventScroll}
                  onChange={(e) => setState(prev => ({ ...prev, initialConcentration: handleNumInput(e.target.value) }))}
                  placeholder="0.00"
                  className={getInputClass(initialConcentration, true)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-sky-400 uppercase tracking-widest flex items-center gap-2">
              {adjustMode === 'MULTIBATCH' ? <Layers className="w-4 h-4 text-sky-500" /> : (calcMode === 'FORWARD' ? <Plus className="w-4 h-4 text-sky-500" /> : <Target className="w-4 h-4 text-sky-500" />)}
              2. Addition / Goal
            </h3>

            <div className="flex gap-1 mb-4">
              {[
                { id: 'ADD_SOLID', label: 'Solid Solute' },
                { id: 'ADD_SOLUTION', label: 'Solution Mix' },
                { id: 'MULTIBATCH', label: 'MultiBatch' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setState(prev => ({ ...prev, adjustMode: m.id as any }))}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all border ${
                    adjustMode === m.id
                      ? 'bg-sky-500 text-white border-sky-600'
                      : 'bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 space-y-4">
              {adjustMode === 'MULTIBATCH' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Goal Mass (g)</label>
                    <input
                      type="number"
                      value={targetMass ?? ''}
                      onWheel={preventScroll}
                      onChange={(e) => setState(prev => ({ ...prev, targetMass: handleNumInput(e.target.value) }))}
                      placeholder="0.00"
                      className={getInputClass(targetMass, true)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Goal Conc (%)</label>
                    <input
                      type="number"
                      value={targetConcentration ?? ''}
                      onWheel={preventScroll}
                      onChange={(e) => setState(prev => ({ ...prev, targetConcentration: handleNumInput(e.target.value) }))}
                      placeholder="0.00"
                      className={getInputClass(targetConcentration, true)}
                    />
                  </div>
                </div>
              ) : calcMode === 'FORWARD' ? (
                <div className="grid grid-cols-2 gap-4">
                  {adjustMode === 'ADD_SOLID' ? (
                    <>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Solid to Add (g)</label>
                        <input
                          type="number"
                          value={addedSolidMass ?? ''}
                          onWheel={preventScroll}
                          onChange={(e) => setState(prev => ({ ...prev, addedSolidMass: handleNumInput(e.target.value) }))}
                          placeholder="0.00"
                          className={getInputClass(addedSolidMass, true)}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Solid Yield (%)</label>
                        <input
                          type="number"
                          value={solidYield ?? ''}
                          onWheel={preventScroll}
                          onChange={(e) => setState(prev => ({ ...prev, solidYield: handleNumInput(e.target.value) }))}
                          placeholder="100"
                          className={getInputClass(solidYield, true)}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Mix Mass (g)</label>
                        <input
                          type="number"
                          value={addedSolutionMass ?? ''}
                          onWheel={preventScroll}
                          onChange={(e) => setState(prev => ({ ...prev, addedSolutionMass: handleNumInput(e.target.value) }))}
                          placeholder="0.00"
                          className={getInputClass(addedSolutionMass, true)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Mix Conc (%)</label>
                        <input
                          type="number"
                          value={addedSolutionConcentration ?? ''}
                          onWheel={preventScroll}
                          onChange={(e) => setState(prev => ({ ...prev, addedSolutionConcentration: handleNumInput(e.target.value) }))}
                          placeholder="0.00"
                          className={getInputClass(addedSolutionConcentration, true)}
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Goal Concentration (%)</label>
                    <input
                      type="number"
                      value={targetConcentration ?? ''}
                      onWheel={preventScroll}
                      onChange={(e) => setState(prev => ({ ...prev, targetConcentration: handleNumInput(e.target.value) }))}
                      placeholder="0.00"
                      className={getInputClass(targetConcentration, true)}
                    />
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
                  {adjustMode === 'ADD_SOLID' ? (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Solid Solute Yield (%)</label>
                      <input
                        type="number"
                        value={solidYield ?? ''}
                        onWheel={preventScroll}
                        onChange={(e) => setState(prev => ({ ...prev, solidYield: handleNumInput(e.target.value) }))}
                        placeholder="100"
                        className={getInputClass(solidYield, true)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase text-center">Linked Calculation</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-[10px] font-bold uppercase mb-1 ${backwardManualField === 'TARGET_MASS' ? 'text-yellow-600 dark:text-yellow-500 font-black' : 'text-slate-400'}`}>
                            Goal Total Mass (g)
                          </label>
                          <input
                            type="number"
                            value={backwardManualField === 'TARGET_MASS' ? (targetMass ?? '') : (results.finalMass ?? '')}
                            onWheel={preventScroll}
                            onChange={(e) => setState(prev => ({ ...prev, backwardManualField: 'TARGET_MASS', targetMass: handleNumInput(e.target.value) }))}
                            placeholder="0.00"
                            className={getInputClass(backwardManualField === 'TARGET_MASS' ? targetMass : results.finalMass, backwardManualField === 'TARGET_MASS')}
                          />
                        </div>
                        <div>
                          <label className={`block text-[10px] font-bold uppercase mb-1 ${backwardManualField === 'ADDED_CONC' ? 'text-yellow-600 dark:text-yellow-500 font-black' : 'text-slate-400'}`}>
                            Mix Conc to Add (%)
                          </label>
                          <input
                            type="number"
                            value={backwardManualField === 'ADDED_CONC' ? (backwardConcInput ?? '') : (results.additionConc ?? '')}
                            onWheel={preventScroll}
                            onChange={(e) => setState(prev => ({ ...prev, backwardManualField: 'ADDED_CONC', backwardConcInput: handleNumInput(e.target.value) }))}
                            placeholder="0.00"
                            className={getInputClass(backwardManualField === 'ADDED_CONC' ? backwardConcInput : results.additionConc, backwardManualField === 'ADDED_CONC')}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className={`bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col gap-6 ${results.isReady && !results.error ? 'print-full-page' : ''}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-sky-600 p-2 rounded-lg print:hidden"><Beaker className="w-5 h-5" /></span>
            <h3 className="text-xl font-bold">
              {adjustMode === 'MULTIBATCH' ? 'MultiBatch Recipe' : 'Batch Transformation Label'}
            </h3>
          </div>

          {!results.isReady ? (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-600 space-y-4 border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center">
              <RefreshCw className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Input initial batch data to generate specs</p>
            </div>
          ) : results.error ? (
            <div className="bg-red-900/40 border border-red-500/50 p-4 rounded-xl text-red-200 text-sm flex gap-3 items-start animate-in zoom-in-95">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="leading-relaxed">{results.error}</span>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-full">
              {/* Top Stock Section */}
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                   Stock Ink Reference
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <p className="text-[10px] text-slate-500 font-bold mb-1">Available Mass</p>
                      <p className="text-lg font-mono text-slate-200">{results.initialMass?.toFixed(2)}g</p>
                   </div>
                   <div>
                      <p className="text-[10px] text-slate-500 font-bold mb-1">Stock Conc</p>
                      <p className="text-lg font-mono text-slate-200">{results.initialConcentration?.toFixed(2)}%</p>
                   </div>
                </div>
              </div>

              {/* Action Section */}
              <div className="relative">
                <div className="absolute -left-3 top-0 bottom-0 w-px bg-slate-700 print:hidden"></div>
                <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                   Instructions
                </div>
                
                {adjustMode === 'MULTIBATCH' ? (
                  <div className="space-y-3">
                    <div className="bg-sky-900/20 border border-sky-800/50 p-4 rounded-xl shadow-inner">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Layers className="w-5 h-5 text-sky-400 shrink-0" />
                          <span className="text-sm font-bold text-sky-100">Take Stock Ink</span>
                        </div>
                        <span className="text-xl font-mono font-bold text-sky-400">{results.massUsed?.toFixed(2)}g</span>
                      </div>
                    </div>
                    <div className="bg-emerald-900/20 border border-emerald-800/50 p-4 rounded-xl shadow-inner">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Plus className="w-5 h-5 text-emerald-400 shrink-0" />
                          <span className="text-sm font-bold text-emerald-100">Add Diluent / Solvent</span>
                        </div>
                        <span className="text-xl font-mono font-bold text-emerald-400">{results.diluentNeeded?.toFixed(2)}g</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-sky-900/20 border border-sky-800/50 p-4 rounded-xl shadow-inner">
                     <div className="flex items-center gap-3">
                        <Plus className="w-5 h-5 text-sky-400 shrink-0" />
                        <span className="text-sm font-bold text-sky-100">{results.additionDesc}</span>
                     </div>
                  </div>
                )}
              </div>

              {/* Goal Section */}
              <div>
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                   Produced Result
                </div>
                <div className="bg-emerald-900/20 p-5 rounded-2xl border border-emerald-800/50 relative overflow-hidden">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Batch Concentration</p>
                      <p className="text-3xl font-mono font-bold text-emerald-400">{results.finalConcentration?.toFixed(3)}%</p>
                    </div>
                    <div className="text-right">
                       <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Batch Total Mass</p>
                       <p className="text-xl font-mono font-bold">{results.finalMass?.toFixed(2)}g</p>
                    </div>
                  </div>
                </div>
                {adjustMode === 'MULTIBATCH' && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <Info className="w-3.5 h-3.5" />
                    <span>Stock Left: <span className="text-slate-300 font-bold font-mono">{results.remainingStock?.toFixed(2)}g</span></span>
                  </div>
                )}
              </div>

              {/* Print Button */}
              <div className="mt-auto pt-6 border-t border-slate-800/50">
                <button 
                  onClick={() => window.print()}
                  className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-all shadow-lg print:hidden flex items-center justify-center gap-2"
                >
                  <FlaskConical className="w-4 h-4" />
                  Print Batch Label
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DilutionCalculator;
