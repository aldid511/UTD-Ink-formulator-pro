
import React, { useMemo } from 'react';
import { SolventComponent, SolubilityState } from '../types';
import { Plus, Trash2, Calculator, Beaker, Droplet, RefreshCw, Eraser, FileText, Calendar, Tag, User, Hash, Zap } from 'lucide-react';

interface Props {
  state: SolubilityState;
  setState: React.Dispatch<React.SetStateAction<SolubilityState>>;
}

const SolubilityCalculator: React.FC<Props> = ({ state, setState }) => {
  const { 
    soluteMass, 
    totalSolventMass, 
    solvents, 
    solidContent, 
    lotNumber, 
    chemicalName, 
    date, 
    producedBy 
  } = state;

  const preventScroll = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
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

  const solventTotalWt = useMemo(() => solvents.reduce((sum, s) => sum + (s.weightPercent || 0), 0), [solvents]);

  const results = useMemo(() => {
    const isReady = soluteMass !== undefined && totalSolventMass !== undefined && solventTotalWt > 0;
    if (!isReady) return { isReady: false };

    const totalMass = soluteMass + totalSolventMass;
    const theoreticalSolidContent = (soluteMass / totalMass) * 100;
    
    const normalizationFactor = 100 / solventTotalWt;
    const solventBreakdown = solvents.map((s, i) => ({
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
  }, [soluteMass, totalSolventMass, solvents, solventTotalWt, solidContent]);

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
              <button
                onClick={addSolvent}
                className="text-xs font-bold bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/60 px-2 py-1 rounded-md"
              >
                <Plus className="w-3 h-3" /> Add solvent
              </button>
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
            </div>
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
