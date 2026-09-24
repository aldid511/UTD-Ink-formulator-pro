
import React, { useMemo } from 'react';
import { SolventComponent, SolubilityState, SolubilityIteration, FormulationMode } from '../types';
import { presetSolvents } from '../presets';
import { SolventSystemPicker } from './PresetControls';
import { Plus, Trash2, Calculator, Beaker, Droplet, RefreshCw, Eraser, FileText, Calendar, Tag, User, Hash, Zap, Layers } from 'lucide-react';

interface Props {
  state: SolubilityState;
  setState: React.Dispatch<React.SetStateAction<SolubilityState>>;
  mode: FormulationMode;
}

const SolubilityCalculator: React.FC<Props> = ({ state, setState, mode }) => {
  const {
    soluteMass,
    totalSolventMass,
    solvents,
    solventSystem,
    iterations,
    solidContent,
    lotNumber,
    chemicalName,
    date,
    producedBy
  } = state;
  const isPreset = mode === 'PRESET';

  const preventScroll = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const addIteration = () => {
    setState(prev => ({
      ...prev,
      iterations: [
        ...prev.iterations,
        { id: Date.now().toString(), soluteAdded: undefined, solventAdded: undefined, solidContent: undefined }
      ]
    }));
  };

  const removeIteration = (id: string) => {
    setState(prev => ({ ...prev, iterations: prev.iterations.filter(it => it.id !== id) }));
  };

  const updateIteration = (id: string, field: keyof SolubilityIteration, value: number | undefined) => {
    setState(prev => ({
      ...prev,
      iterations: prev.iterations.map(it => (it.id === id ? { ...it, [field]: value } : it))
    }));
  };

  const handleNumInput = (val: string) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? undefined : parsed;
  };

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

  // In preset mode the matrix is fixed by the chosen solvent system.
  const activeSolvents = isPreset ? presetSolvents(solventSystem) : solvents;
  const solventTotalWt = useMemo(
    () => activeSolvents.reduce((sum, s) => sum + (s.weightPercent || 0), 0),
    [activeSolvents]
  );

  const results = useMemo(() => {
    const isReady = soluteMass !== undefined && totalSolventMass !== undefined && solventTotalWt > 0;
    if (!isReady) return { isReady: false };

    const totalMass = soluteMass + totalSolventMass;
    const theoreticalSolidContent = (soluteMass / totalMass) * 100;
    
    const normalizationFactor = 100 / solventTotalWt;
    const solventBreakdown = activeSolvents.map((s, i) => ({
      name: s.name.trim() || `Solvent ${String.fromCharCode(65 + i)}`,
      mass: totalSolventMass * (((s.weightPercent || 0) * normalizationFactor) / 100),
      percent: (s.weightPercent || 0) * normalizationFactor
    }));
    // Back-calculate the soluble fraction from the measured solid content of the
    // decanted ink (post mix -> centrifuge -> decant, insolubles removed with pellet):
    //   measured SC = s*B / (s*B + S)   =>   s = SC*S / (B*(100 - SC))
    const solubilityYield = (solidContent !== undefined && soluteMass > 0 && solidContent < 100)
      ? ((solidContent * totalSolventMass) / (soluteMass * (100 - solidContent))) * 100
      : undefined;

    return { 
      isReady: true, 
      totalMass, 
      theoreticalSolidContent, 
      solventBreakdown,
      measuredSolidContent: solidContent,
      deviation: solidContent !== undefined ? solidContent - theoreticalSolidContent : undefined,
      solubilityYield
    };
  }, [soluteMass, totalSolventMass, activeSolvents, solventTotalWt, solidContent]);

  /**
   * Solubility per addition.
   *
   * After each mix -> centrifuge -> decant the insolubles leave with the
   * pellet, so the measured solid content reflects dissolved solute against
   * ALL solvent present:  SC = D / (D + S)  =>  D = SC*S / (100 - SC).
   *
   * "This addition" compares the rise in dissolved mass against the solute
   * added since the previous measurement; "cumulative" is total dissolved
   * against total solute charged. A falling per-addition figure means the
   * solvent is approaching saturation.
   */
  const iterationResults = useMemo(() => {
    if (soluteMass === undefined || totalSolventMass === undefined) return [];

    const steps = [
      { label: 'Base', soluteAdded: soluteMass, solventAdded: totalSolventMass, sc: solidContent },
      ...iterations.map((it, i) => ({
        label: `Addition ${i + 1}`,
        soluteAdded: it.soluteAdded,
        solventAdded: it.solventAdded,
        sc: it.solidContent,
      })),
    ];

    let cumulativeSolute = 0;
    let cumulativeSolvent = 0;
    // Dissolved mass and solute charge at the last step that was measured.
    let lastDissolved = 0;
    let lastSolute = 0;

    return steps.map(step => {
      cumulativeSolute += step.soluteAdded ?? 0;
      cumulativeSolvent += step.solventAdded ?? 0;

      const row = {
        label: step.label,
        soluteAdded: step.soluteAdded,
        solventAdded: step.solventAdded,
        sc: step.sc,
        cumulativeSolute,
        cumulativeSolvent,
        dissolved: undefined as number | undefined,
        stepSolubility: undefined as number | undefined,
        cumulativeSolubility: undefined as number | undefined,
      };

      const measurable =
        step.sc !== undefined && step.sc > 0 && step.sc < 100 && cumulativeSolvent > 0 && cumulativeSolute > 0;
      if (!measurable) return row;

      const dissolved = (step.sc! * cumulativeSolvent) / (100 - step.sc!);
      row.dissolved = dissolved;
      row.cumulativeSolubility = (dissolved / cumulativeSolute) * 100;

      const soluteSinceLast = cumulativeSolute - lastSolute;
      if (soluteSinceLast > 0) {
        row.stepSolubility = ((dissolved - lastDissolved) / soluteSinceLast) * 100;
      }

      lastDissolved = dissolved;
      lastSolute = cumulativeSolute;
      return row;
    });
  }, [soluteMass, totalSolventMass, solidContent, iterations]);

  const getInputClass = (val: any, isManual: boolean = true) => {
    const base = "w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all font-bold text-slate-900 ";
    if (val === undefined || val === '') return base + "bg-white border-slate-300 text-slate-400 placeholder-slate-300 focus:ring-sky-500";
    if (isManual) return base + "bg-yellow-100 border-yellow-400 focus:ring-yellow-500";
    return base + "bg-emerald-100 border-emerald-400 focus:ring-emerald-500";
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-white dark:bg-slate-800">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6 print:hidden">
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-sky-400 flex items-center gap-2">
              <Beaker className="w-5 h-5 text-sky-500" />
              Solubility Formulation
            </h3>
            
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Lot# / Batch ID</label>
                <input
                  type="text"
                  value={lotNumber}
                  onChange={(e) => setState(prev => ({ ...prev, lotNumber: e.target.value }))}
                  placeholder="Lot 12345"
                  className={getInputClass(lotNumber)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Chemical Name</label>
                <input
                  type="text"
                  value={chemicalName}
                  onChange={(e) => setState(prev => ({ ...prev, chemicalName: e.target.value }))}
                  placeholder="Solute Chemical Name"
                  className={getInputClass(chemicalName)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Solute Mass (g)</label>
                <input
                  type="number"
                  value={soluteMass ?? ''}
                  onWheel={preventScroll}
                  onChange={(e) => setState(prev => ({ ...prev, soluteMass: handleNumInput(e.target.value) }))}
                  placeholder="0.000"
                  className={getInputClass(soluteMass)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Measured Solid (%)</label>
                <input
                  type="number"
                  value={solidContent ?? ''}
                  onWheel={preventScroll}
                  onChange={(e) => setState(prev => ({ ...prev, solidContent: handleNumInput(e.target.value) }))}
                  placeholder="Export from QC"
                  className={getInputClass(solidContent, false)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-500 dark:text-sky-400 uppercase tracking-widest flex items-center gap-2">
                <Droplet className="w-4 h-4 text-sky-500" />
                Solvent Matrix
              </h3>
              {!isPreset && (
                <button
                  onClick={addSolvent}
                  className="text-xs font-bold bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/60 px-2 py-1 rounded-md"
                >
                  <Plus className="w-3 h-3" /> Add solvent
                </button>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
               <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Initial Solvent Mass (g)</label>
                  <input
                    type="number"
                    value={totalSolventMass ?? ''}
                    onWheel={preventScroll}
                    onChange={(e) => setState(prev => ({ ...prev, totalSolventMass: handleNumInput(e.target.value) }))}
                    placeholder="0.000"
                    className={getInputClass(totalSolventMass)}
                  />
               </div>

               {isPreset ? (
                 <SolventSystemPicker
                   value={solventSystem}
                   onChange={(v) => setState(prev => ({ ...prev, solventSystem: v }))}
                   title="Solvent System"
                 />
               ) : (
               <>
               <div className="space-y-2">
                {solvents.map((s, i) => (
                  <div key={s.id} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) => updateSolvent(s.id, 'name', e.target.value)}
                      className="flex-grow px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md outline-none text-slate-900 font-bold"
                      placeholder={`Component ${String.fromCharCode(65 + i)}`}
                    />
                    <div className="relative w-24">
                      <input
                        type="number"
                        value={s.weightPercent ?? ''}
                        onWheel={preventScroll}
                        onFocus={() => { if (s.isAuto) clearSolventValue(s.id); }}
                        onChange={(e) => updateSolvent(s.id, 'weightPercent', handleNumInput(e.target.value))}
                        placeholder="0.0"
                        className={`w-full px-2 py-1.5 text-xs border rounded-md outline-none text-right bg-white text-slate-900 font-bold ${
                          s.isAuto ? 'text-emerald-600 italic' : ''
                        }`}
                      />
                      <span className="absolute right-1.5 top-1.5 text-[10px] text-slate-400">%</span>
                    </div>
                    <button onClick={() => removeSolvent(s.id)} className="p-1 text-slate-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                 <span className={`text-xs font-bold ${Math.abs(solventTotalWt - 100) < 0.01 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {solventTotalWt.toFixed(2)}%
                 </span>
                 <button
                    onClick={calculateMatrix}
                    className="px-3 py-1.5 bg-sky-500 text-white text-[10px] font-bold rounded-lg hover:bg-sky-600"
                  >
                    Auto-Fill Proportions
                  </button>
              </div>
              </>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-500 dark:text-sky-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-500" />
                Iterative Additions
              </h3>
              <button
                onClick={addIteration}
                className="flex items-center gap-1 text-xs font-bold bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/60 px-2.5 py-1.5 rounded-md transition-all active:scale-95"
              >
                <Plus className="w-3 h-3" /> Iteration
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Add more solute (and solvent, if any), re-measure solid content after
              centrifuge &amp; decant, and solubility is reported for each addition.
            </p>

            {iterations.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_1.75rem] gap-2 px-1">
                  {['#', 'Solute +(g)', 'Solvent +(g)', 'Solid (%)', ''].map((h, i) => (
                    <span key={i} className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{h}</span>
                  ))}
                </div>
                {iterations.map((it, i) => (
                  <div key={it.id} className="grid grid-cols-[1.5rem_1fr_1fr_1fr_1.75rem] gap-2 items-center">
                    <span className="text-xs font-bold text-slate-400">{i + 1}</span>
                    {(['soluteAdded', 'solventAdded', 'solidContent'] as const).map(field => (
                      <input
                        key={field}
                        type="number"
                        value={it[field] ?? ''}
                        onWheel={preventScroll}
                        onChange={e => updateIteration(it.id, field, handleNumInput(e.target.value))}
                        placeholder="0.000"
                        className={`w-full px-2 py-1.5 text-xs border rounded-md outline-none focus:ring-1 focus:ring-sky-500 text-right font-bold text-slate-900 ${
                          it[field] === undefined ? 'bg-white border-slate-300 placeholder-slate-300' : 'bg-yellow-100 border-yellow-400'
                        }`}
                      />
                    ))}
                    <button
                      onClick={() => removeIteration(it.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      aria-label={`Remove iteration ${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Produced By</label>
              <input
                type="text"
                value={producedBy}
                onChange={(e) => setState(prev => ({ ...prev, producedBy: e.target.value }))}
                placeholder="Name"
                className={getInputClass(producedBy)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setState(prev => ({ ...prev, date: e.target.value }))}
                className={getInputClass(date)}
              />
            </div>
          </section>
        </div>

        {/* --- RESULT PANEL (SOLUBILITY CARD) --- */}
        <div className={`bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col h-full min-h-[500px] ${results.isReady ? 'print-full-page' : ''}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <span className="bg-sky-600 p-2 rounded-lg print:hidden"><Beaker className="w-5 h-5" /></span>
              Solubility Analysis Card
            </h3>
            <span className="hidden print:block text-[10px] text-slate-500">UT Dots Pro System</span>
          </div>

          {!results.isReady ? (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-700 space-y-4 border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center">
              <Calculator className="w-12 h-12 opacity-10" />
              <p className="text-sm font-medium">Define formulation to generate analysis</p>
            </div>
          ) : (
            <div className="space-y-6 flex-grow animate-in fade-in duration-300">
              {/* Meta Info for Print */}
              <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Chemical</span>
                  <span className="text-sm font-bold text-sky-400">{chemicalName || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Lot Number</span>
                  <span className="text-sm font-bold text-sky-400">{lotNumber || 'N/A'}</span>
                </div>
              </div>

              {/* Main Metric */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Theoretical Solid</p>
                    <div className="text-2xl font-mono font-bold text-emerald-400">
                      {results.theoreticalSolidContent.toFixed(3)}%
                    </div>
                 </div>
                 <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Measured Solid</p>
                    <div className="text-2xl font-mono font-bold text-sky-400">
                      {results.measuredSolidContent?.toFixed(3) || '--'}%
                    </div>
                 </div>
              </div>

              {/* Composition Breakdown */}
              <div className="space-y-4">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800 pb-1">Final Composition Breakdown</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-slate-800/40 px-3 py-2 rounded-lg">
                    <span className="text-xs font-bold">Total Mass</span>
                    <span className="font-mono text-emerald-400">{results.totalMass.toFixed(3)}g</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-800/40 px-3 py-2 rounded-lg">
                    <span className="text-xs">Initial Solute</span>
                    <span className="font-mono">{soluteMass?.toFixed(3)}g</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-800/40 px-3 py-2 rounded-lg">
                    <span className="text-xs">Solvent System</span>
                    <span className="font-mono">{totalSolventMass?.toFixed(3)}g</span>
                  </div>
                  <div className="pl-4 space-y-1">
                    {results.solventBreakdown.map((s, i) => (
                      <div key={i} className="flex justify-between text-[11px] text-slate-400">
                        <span>• {s.name} ({s.percent.toFixed(2)}%)</span>
                        <span className="font-mono">{s.mass.toFixed(3)}g</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results Comparison (Deviation & Yield) */}
              {results.deviation !== undefined && (
                <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
                  Math.abs(results.deviation) < 0.1 ? 'bg-emerald-900/20 border-emerald-800' : 'bg-amber-900/20 border-amber-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold uppercase tracking-widest">Deviation</span>
                    </div>
                    <span className="font-mono font-bold">{results.deviation > 0 ? '+' : ''}{results.deviation.toFixed(3)}%</span>
                  </div>
                  
                  {results.solubilityYield !== undefined && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold uppercase tracking-widest">Solubility (use in One Pot)</span>
                      </div>
                      <span className="font-mono font-bold text-sky-400">{results.solubilityYield.toFixed(2)}%</span>
                    </div>
                  )}
                </div>
              )}

              {/* Per-addition solubility */}
              {iterations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800 pb-1">
                    Solubility By Addition
                  </p>
                  <div className="grid grid-cols-[4.5rem_1fr_1fr_1fr] gap-x-2 px-2 pb-1">
                    {['Step', 'Cum. Solute', 'This Add', 'Cumulative'].map(h => (
                      <span key={h} className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{h}</span>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {iterationResults.map((row, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[4.5rem_1fr_1fr_1fr] gap-x-2 items-center bg-slate-800/40 px-2 py-2 rounded-lg"
                      >
                        <span className="text-[11px] font-bold text-slate-300">{row.label}</span>
                        <span className="text-[11px] font-mono text-slate-400">{row.cumulativeSolute.toFixed(3)}g</span>
                        <span className={`text-[11px] font-mono font-bold ${row.stepSolubility === undefined ? 'text-slate-600' : 'text-sky-400'}`}>
                          {row.stepSolubility === undefined ? '—' : `${row.stepSolubility.toFixed(2)}%`}
                        </span>
                        <span className={`text-[11px] font-mono ${row.cumulativeSolubility === undefined ? 'text-slate-600' : 'text-emerald-400'}`}>
                          {row.cumulativeSolubility === undefined ? '—' : `${row.cumulativeSolubility.toFixed(2)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
                    A dash means that step has no usable solid-content measurement yet (or added no
                    solute). A falling <span className="text-sky-400 font-bold">This Add</span> value
                    indicates the solvent is approaching saturation.
                  </p>
                </div>
              )}

              {/* Report Footer Metadata */}
              <div className="mt-auto grid grid-cols-2 gap-4 pt-6 border-t border-slate-800">
                 <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <User className="w-3 h-3" />
                    <span>By: <span className="text-slate-300 font-bold">{producedBy || '--'}</span></span>
                 </div>
                 <div className="flex items-center gap-2 text-[10px] text-slate-500 justify-end">
                    <Calendar className="w-3 h-3" />
                    <span>Date: <span className="text-slate-300 font-bold">{date || '--'}</span></span>
                 </div>
              </div>

              <button 
                onClick={() => window.print()}
                className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 print:hidden shadow-lg mt-4"
              >
                <FileText className="w-4 h-4" />
                Print Solubility Report
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolubilityCalculator;
