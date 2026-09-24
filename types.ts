
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
  QC_SOLID = 'QC_SOLID',
  STOCK = 'STOCK',
  ONE_POT = 'ONE_POT',
  DILUTION = 'DILUTION',
  CONCENTRATE_TO = 'CONCENTRATE_TO',
  SOLVENT_CREATION = 'SOLVENT_CREATION',
  SOLUBILITY = 'SOLUBILITY'
}

/**
 * Preset mode drives concentrations and solvent matrices from the standard UT
 * Dots formulations; custom mode keeps the free-entry behaviour. Applies to
 * every tab except QC Solid, which is a pure measurement.
 */
export type FormulationMode = 'PRESET' | 'CUSTOM';

export type SolventSystemId = 'IJ' | 'TE';

export interface OnePotState {
  soluteName: string;
  targetMass?: number;
  targetConcentration?: number;
  yieldPercent?: number;
  solvents: SolventComponent[];
  solventSystem: SolventSystemId;
}

/** Stock: use up a fixed amount of solute on hand at a chosen concentration. */
export interface StockState {
  soluteName: string;
  soluteOnHand?: number;
  targetConcentration?: number;
  yieldPercent?: number;
  solvents: SolventComponent[];
  solventSystem: SolventSystemId;
}

export interface SolventCreationState {
  totalTargetMass?: number;
  solvents: SolventComponent[];
  solventSystem: SolventSystemId;
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
  solventSystem: SolventSystemId;
}

export interface QCSolidState {
  tareMass?: number;
  wetMass?: number;
  dryMass?: number;
}

/**
 * One further addition of solute (and optionally solvent) to an existing ink,
 * re-measured after mixing, centrifuging and decanting. Lets solubility be
 * tracked per addition as the solvent approaches saturation.
 */
export interface SolubilityIteration {
  id: string;
  soluteAdded?: number;
  solventAdded?: number;
  solidContent?: number;
}

export interface SolubilityState {
  soluteMass?: number;
  totalSolventMass?: number;
  solvents: SolventComponent[];
  solventSystem: SolventSystemId;
  iterations: SolubilityIteration[];
  solidContent?: number;
  lotNumber: string;
  chemicalName: string;
  date: string;
  producedBy: string;
}
