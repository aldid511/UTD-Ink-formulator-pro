
export interface SolventComponent {
  id: string;
  name: string;
  weightPercent?: number;
  isAuto?: boolean;
}

export interface FormulationResult {
  soluteBulkMass: number;
  soluteActiveMass: number;
  totalSolventMass: number;
  solventBreakdown: {
    name: string;
    mass: number;
  }[];
}

export enum CalculationMode {
  ONE_POT = 'ONE_POT',
  DILUTION = 'DILUTION',
  CONCENTRATE_TO = 'CONCENTRATE_TO',
  QC_SOLID = 'QC_SOLID',
  SOLVENT_CREATION = 'SOLVENT_CREATION',
  SOLUBILITY = 'SOLUBILITY'
}

export interface OnePotState {
  soluteName: string;
  targetMass?: number;
  targetConcentration?: number;
  yieldPercent?: number;
  solvents: SolventComponent[];
}

export interface SolventCreationState {
  totalTargetMass?: number;
  solvents: SolventComponent[];
}

export interface DilutionState {
  calcMode: 'FORWARD' | 'BACKWARD';
  initialMass?: number;
  initialConcentration?: number;
  adjustMode: 'ADD_SOLID' | 'ADD_SOLUTION' | 'MULTIBATCH';
  // Forward Inputs
  addedSolidMass?: number;
  solidYield?: number;
  addedSolutionMass?: number;
  addedSolutionConcentration?: number;
  // Backward (Target) Inputs
  targetConcentration?: number;
  // Backward Solution Mix Linkage
  backwardManualField: 'TARGET_MASS' | 'ADDED_CONC';
  targetMass?: number; 
  backwardConcInput?: number;
}

export interface ConcentrateToState {
  initialMass?: number;
  initialConcentration?: number;
  targetMass?: number;
  targetConcentration?: number;
  yieldPercent?: number;
  solvents: SolventComponent[];
}

export interface QCSolidState {
  tareMass?: number;
  wetMass?: number;
  dryMass?: number;
}

export interface SolubilityState {
  soluteMass?: number;
  totalSolventMass?: number;
  solvents: SolventComponent[];
  solidContent?: number;
  lotNumber: string;
  chemicalName: string;
  date: string;
  producedBy: string;
}
