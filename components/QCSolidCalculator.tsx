
import React, { useMemo } from 'react';
import { QCSolidState } from '../types';
import { Scale, Beaker, AlertCircle, Info, FileText, ArrowRight, Eraser, FlaskConical } from 'lucide-react';

interface Props {
  state: QCSolidState;
  setState: React.Dispatch<React.SetStateAction<QCSolidState>>;
  onExportToSolubility?: (content: number) => void;
  onExportToDilution?: (content: number) => void;
}

const QCSolidCalculator: React.FC<Props> = ({ state, setState, onExportToSolubility, onExportToDilution }) => {
  const { tareMass, wetMass, dryMass } = state;

  const resetFields = () => {
    setState({ tareMass: undefined, wetMass: undefined, dryMass: undefined });
  };

  const preventScroll = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  const results = useMemo(() => {
    if (tareMass === undefined || wetMass === undefined || dryMass === undefined) {
      return { isReady: false };
    }
    const netWet = wetMass - tareMass;
    const netDry = dryMass - tareMass;
    let error: string | null = null;
    let solidContent = 0;
    
    if (tareMass < 0 || wetMass < 0 || dryMass < 0) error = "Mass values cannot be negative.";
    else if (wetMass <= tareMass) error = "Wet sample weight must be greater than tare.";
    else if (dryMass < tareMass) error = "Dry mass cannot be less than tare.";
    else if (dryMass > wetMass) error = "Dry mass cannot exceed wet mass.";
    else solidContent = (netDry / netWet) * 100;

    return { 
      isReady: true, 
      netWet, 
      netDry, 
      solidContent, 
      error,
      inputs: { tare: tareMass, wet: wetMass, dry: dryMass }
    };
  }, [tareMass, wetMass, dryMass]);

  const getInputClass = (val: number | undefined) => {
    const base = "w-full pl-4 pr-10 py-2.5 border rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all font-mono bg-white text-slate-900 font-bold ";
    return base + (val === undefined ? "border-slate-300 text-slate-400 placeholder-slate-300" : "border-slate-400");
  };

  const handleNumInput = (val: string) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? undefined : parsed;
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-white dark:bg-slate-800">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6 print:hidden">
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-sky-400 flex items-center gap-2">
                <Scale className="w-5 h-5 text-sky-500" />
                Gravimetric Inputs
              </h3>
              <button
                onClick={resetFields}
                disabled={tareMass === undefined && wetMass === undefined && dryMass === undefined}
                className="flex items-center gap-1.5 text-xs font-bold bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/60 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-md transition-all active:scale-95"
                title="Clear all fields for a new sample"
              >
                <Eraser className="w-3.5 h-3.5" />
                New Sample
              </button>
            </div>
            
            <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Tare Mass (g)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={tareMass ?? ''}
                    onWheel={preventScroll}
                    onChange={(e) => setState(prev => ({ ...prev, tareMass: handleNumInput(e.target.value) }))}
                    placeholder="0.0000"
                    step="0.0001"
                    className={getInputClass(tareMass)}
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">g</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Wet Sample + Tare (g)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={wetMass ?? ''}
                    onWheel={preventScroll}
                    onChange={(e) => setState(prev => ({ ...prev, wetMass: handleNumInput(e.target.value) }))}
                    placeholder="0.0000"
                    step="0.0001"
                    className={getInputClass(wetMass)}
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">g</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Dry Sample + Tare (g)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={dryMass ?? ''}
                    onWheel={preventScroll}
                    onChange={(e) => setState(prev => ({ ...prev, dryMass: handleNumInput(e.target.value) }))}
                    placeholder="0.0000"
                    step="0.0001"
                    className={getInputClass(dryMass)}
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">g</span>
                </div>
              </div>
            </div>
          </section>

          <div className="p-4 bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800 rounded-xl flex gap-3 items-start">
            <Info className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
            <p className="text-xs text-sky-800 dark:text-sky-300">
              Solid content is calculated as: <code>(Dry Mass - Tare) / (Wet Mass - Tare) * 100</code>. Ensure samples are weighed precisely on a calibrated analytical balance.
            </p>
          </div>
        </div>

        {/* --- ANALYSIS REPORT (PRINTABLE) --- */}
        <div className={`bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col h-full min-h-[450px] ${results.isReady && !results.error ? 'print-full-page' : ''}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <span className="bg-emerald-600 p-2 rounded-lg print:hidden"><Beaker className="w-5 h-5" /></span>
              Gravimetric Analysis Report
            </h3>
            <span className="hidden print:block text-[10px] text-slate-400 font-mono">
              Generated: {new Date().toLocaleString()}
            </span>
          </div>

          {!results.isReady ? (
            <div className="flex-grow flex flex-col items-center justify-center text-slate-600 space-y-4 border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center">
              <Scale className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Input gravimetric measurements to generate analysis</p>
            </div>
          ) : results.error ? (
            <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl text-red-200 text-sm flex gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{results.error}</span>
            </div>
          ) : (
            <div className="space-y-6 flex-grow animate-in fade-in duration-300">
              {/* Main Analysis Result */}
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Non-Volatile (Solid) Content</p>
                <div className="text-5xl font-mono font-bold text-emerald-400">
                  {results.solidContent?.toFixed(3)}%
                </div>
              </div>

              {/* Measurement Summary Section (Crucial for the report) */}
              <div className="space-y-4">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800 pb-1">Measurements Summary</p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between items-center bg-slate-800/50 px-4 py-2 rounded-lg">
                    <span className="text-xs text-slate-400">Tare Weight</span>
                    <span className="font-mono text-slate-200">{results.inputs?.tare.toFixed(4)}g</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-800/50 px-4 py-2 rounded-lg">
                    <span className="text-xs text-slate-400">Net Wet Sample</span>
                    <span className="font-mono text-slate-200">{results.netWet?.toFixed(4)}g</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-800/50 px-4 py-2 rounded-lg">
                    <span className="text-xs text-slate-400">Net Dry Residue</span>
                    <span className="font-mono text-slate-200">{results.netDry?.toFixed(4)}g</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-auto">
                 <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Detailed Gravimetrics</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                       <span className="text-slate-500">Wet + Tare:</span>
                       <span className="text-right font-mono">{results.inputs?.wet.toFixed(4)}g</span>
                       <span className="text-slate-500">Dry + Tare:</span>
                       <span className="text-right font-mono">{results.inputs?.dry.toFixed(4)}g</span>
                    </div>
                 </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-slate-800 print:hidden">
                  <button
                    onClick={() => onExportToSolubility?.(results.solidContent)}
                    className="w-full py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Export to Solubility Tab
                  </button>
                  <button
                    onClick={() => onExportToDilution?.(results.solidContent)}
                    className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-lg"
                    title="Use this solid content as the stock concentration in Dilution/Conc"
                  >
                    <FlaskConical className="w-4 h-4" />
                    Export to Dilution/Conc Tab
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <FileText className="w-4 h-4" />
                    Print / Export PDF Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QCSolidCalculator;
