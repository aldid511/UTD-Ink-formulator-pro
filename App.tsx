
import React, { useState, useEffect } from 'react';
import OnePotCalculator from './components/OnePotCalculator';
import StockCalculator from './components/StockCalculator';
import DilutionCalculator from './components/DilutionCalculator';
import ConcentrateToCalculator from './components/ConcentrateToCalculator';
import QCSolidCalculator from './components/QCSolidCalculator';
import SolventCreationCalculator from './components/SolventCreationCalculator';
import SolubilityCalculator from './components/SolubilityCalculator';
import { CalculationMode, FormulationMode, OnePotState, StockState, SolventCreationState, DilutionState, ConcentrateToState, QCSolidState, SolubilityState } from './types';
import { FlaskConical, Droplet, Info, Target, Scale, Zap, Sun, Moon, VolumeX, Volume2, Beaker, Package } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CalculationMode>(CalculationMode.QC_SOLID);
  const [formulationMode, setFormulationMode] = useState<FormulationMode>('PRESET');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Persistence States
  const [onePotData, setOnePotData] = useState<OnePotState>({
    soluteName: 'Active Solute',
    targetMass: undefined,
    targetConcentration: undefined,
    yieldPercent: 85, // SOP F056: AgN solubility/yield assumed 85%
    solvents: [
      { id: '1', name: '', weightPercent: undefined, isAuto: true },
      { id: '2', name: '', weightPercent: undefined, isAuto: true },
    ],
    solventSystem: 'IJ'
  });

  const [stockData, setStockData] = useState<StockState>({
    soluteName: 'Active Solute',
    soluteOnHand: undefined,
    targetConcentration: undefined,
    yieldPercent: 85, // SOP F056: AgN solubility/yield assumed 85%
    solvents: [
      { id: '1', name: '', weightPercent: undefined, isAuto: true },
      { id: '2', name: '', weightPercent: undefined, isAuto: true },
    ],
    solventSystem: 'IJ'
  });

  const [solventCreationData, setSolventCreationData] = useState<SolventCreationState>({
    totalTargetMass: undefined,
    solvents: [
      { id: '1', name: '', weightPercent: undefined, isAuto: true },
      { id: '2', name: '', weightPercent: undefined, isAuto: true },
    ],
    solventSystem: 'IJ'
  });

  const [dilutionData, setDilutionData] = useState<DilutionState>({
    calcMode: 'FORWARD',
    initialMass: undefined,
    initialConcentration: undefined,
    adjustMode: 'ADD_SOLID',
    addedSolidMass: undefined,
    solidYield: 85, // SOP F056: AgN solubility/yield assumed 85%
    addedSolutionMass: undefined,
    addedSolutionConcentration: undefined,
    targetConcentration: undefined,
    backwardManualField: 'ADDED_CONC',
    targetMass: undefined,
    backwardConcInput: undefined,
  });

  const [concentrateToData, setConcentrateToData] = useState<ConcentrateToState>({
    initialMass: undefined,
    initialConcentration: undefined,
    targetMass: undefined,
    targetConcentration: undefined,
    yieldPercent: 85, // SOP F056: AgN solubility/yield assumed 85%
    solvents: [{ id: '1', name: '', weightPercent: undefined, isAuto: true }],
    solventSystem: 'IJ'
  });

  const [qcSolidData, setQCSolidData] = useState<QCSolidState>({
    tareMass: undefined,
    wetMass: undefined,
    dryMass: undefined,
  });

  const [solubilityData, setSolubilityData] = useState<SolubilityState>({
    soluteMass: undefined,
    totalSolventMass: undefined,
    solvents: [
      { id: '1', name: '', weightPercent: undefined, isAuto: true },
      { id: '2', name: '', weightPercent: undefined, isAuto: true },
    ],
    solventSystem: 'IJ',
    iterations: [],
    solidContent: undefined,
    lotNumber: '',
    chemicalName: '',
    date: new Date().toISOString().split('T')[0],
    producedBy: ''
  });

  const handleExportToSolubility = (content: number) => {
    setSolubilityData(prev => ({ ...prev, solidContent: content }));
    setActiveTab(CalculationMode.SOLUBILITY);
  };

  const handleExportToDilution = (content: number) => {
    setDilutionData(prev => ({ ...prev, initialConcentration: content }));
    setActiveTab(CalculationMode.DILUTION);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col items-center py-8 px-4 print:p-0 print:bg-white`}>
      <header className="max-w-4xl w-full mb-8 flex items-start justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <FlaskConical className={`w-8 h-8 ${isDarkMode ? 'text-sky-400' : 'text-blue-600'}`} />
          <div className="text-left">
            <h1 className="text-2xl font-bold tracking-tight">UT Dots InkFormulator Pro</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Precision chemical formulation & dilution</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-2">
          {/* Music Toggle */}
          <button
            onClick={() => setIsMusicPlaying(!isMusicPlaying)}
            className={`p-2.5 rounded-xl border shadow-sm transition-all active:scale-95 flex items-center justify-center ${
              isMusicPlaying 
                ? 'bg-sky-500 border-sky-600 text-white' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            title={isMusicPlaying ? "Stop Music" : "Play Background Music"}
          >
            {isMusicPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all active:scale-95"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
          </button>
        </div>

        {/* Preset / Custom selector — drives every tab except QC Solid */}
        <div
          role="radiogroup"
          aria-label="Formulation mode"
          className="flex flex-col gap-1 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm min-w-[210px]"
        >
          {([
            { id: 'PRESET' as FormulationMode, line1: 'Preset', line2: 'Standard UTD formulations' },
            { id: 'CUSTOM' as FormulationMode, line1: 'Custom', line2: 'Enter your own values' },
          ]).map(opt => {
            const selected = formulationMode === opt.id;
            return (
              <button
                key={opt.id}
                role="radio"
                aria-checked={selected}
                onClick={() => setFormulationMode(opt.id)}
                className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-all ${
                  selected ? 'bg-sky-50 dark:bg-sky-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                    selected ? 'border-sky-500' : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {selected && <span className="w-2 h-2 rounded-full bg-sky-500" />}
                </span>
                <span className="leading-tight">
                  <span className={`block text-xs font-bold ${selected ? 'text-sky-600 dark:text-sky-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {opt.line1}
                  </span>
                  <span className="block text-[11px] text-slate-600 dark:text-slate-400">{opt.line2}</span>
                </span>
              </button>
            );
          })}
        </div>
        </div>
      </header>

      {/* Hidden Music Player */}
      {isMusicPlaying && (
        <div className="hidden">
          <iframe 
            width="0" 
            height="0" 
            src="https://www.youtube.com/embed/f--UUHGg_Mc?autoplay=1&loop=1&playlist=f--UUHGg_Mc" 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      )}

      <main className="max-w-5xl w-full">
        <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 gap-1 overflow-x-auto scrollbar-hide print:hidden">
          {[
            { mode: CalculationMode.QC_SOLID, label: 'QC Solid', icon: Scale },
            { mode: CalculationMode.STOCK, label: 'Stock', icon: Package },
            { mode: CalculationMode.ONE_POT, label: 'One Pot', icon: Droplet },
            { mode: CalculationMode.SOLVENT_CREATION, label: 'Solvents', icon: Zap },
            { mode: CalculationMode.DILUTION, label: 'Dilution/Conc', icon: FlaskConical },
            { mode: CalculationMode.CONCENTRATE_TO, label: 'Conc To', icon: Target },
            { mode: CalculationMode.SOLUBILITY, label: 'Solubility', icon: Beaker },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.mode;
            return (
              <button
                key={tab.mode}
                onClick={() => setActiveTab(tab.mode)}
                className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  isActive 
                    ? 'bg-sky-500 text-white shadow-md dark:bg-sky-500' 
                    : 'text-slate-600 dark:text-sky-200 hover:bg-slate-100 dark:bg-sky-900/40 dark:hover:bg-sky-900/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden print:border-none print:shadow-none print:rounded-none">
          {activeTab === CalculationMode.STOCK && (
            <StockCalculator state={stockData} setState={setStockData} mode={formulationMode} />
          )}
          {activeTab === CalculationMode.ONE_POT && (
            <OnePotCalculator state={onePotData} setState={setOnePotData} mode={formulationMode} />
          )}
          {activeTab === CalculationMode.SOLVENT_CREATION && (
            <SolventCreationCalculator state={solventCreationData} setState={setSolventCreationData} mode={formulationMode} />
          )}
          {activeTab === CalculationMode.DILUTION && (
            <DilutionCalculator state={dilutionData} setState={setDilutionData} mode={formulationMode} />
          )}
          {activeTab === CalculationMode.CONCENTRATE_TO && (
            <ConcentrateToCalculator state={concentrateToData} setState={setConcentrateToData} mode={formulationMode} />
          )}
          {activeTab === CalculationMode.QC_SOLID && (
            <QCSolidCalculator state={qcSolidData} setState={setQCSolidData} onExportToSolubility={handleExportToSolubility} onExportToDilution={handleExportToDilution} />
          )}
          {activeTab === CalculationMode.SOLUBILITY && (
            <SolubilityCalculator state={solubilityData} setState={setSolubilityData} mode={formulationMode} />
          )}
        </div>

        <footer className="mt-8 p-4 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl flex gap-3 items-start print:hidden">
          <Info className="w-5 h-5 text-blue-600 dark:text-sky-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-slate-300 leading-relaxed">
            <p><strong>System Status:</strong> Formulation Engine Active.</p>
            <p className="mt-1 opacity-80 text-xs">All calculations adhere to gravimetric mass-balance principles.</p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
