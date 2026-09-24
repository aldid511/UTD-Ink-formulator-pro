import { SolventComponent, SolventSystemId } from './types';

export interface SolventSystemPreset {
  id: SolventSystemId;
  name: string;
  ratio: string;
  components: { name: string; weightPercent: number }[];
}

/** The two standard UT Dots solvent systems. */
export const SOLVENT_SYSTEMS: Record<SolventSystemId, SolventSystemPreset> = {
  IJ: {
    id: 'IJ',
    name: 'Solvent IJ',
    ratio: '4:1 Longifolene : Eucalyptol',
    components: [
      { name: 'Longifolene', weightPercent: 80 },
      { name: 'Eucalyptol', weightPercent: 20 },
    ],
  },
  TE: {
    id: 'TE',
    name: 'Solvent TE',
    ratio: '1:1 TEB : Eucalyptol',
    components: [
      { name: 'TEB', weightPercent: 50 },
      { name: 'Eucalyptol', weightPercent: 50 },
    ],
  },
};

export const SOLVENT_SYSTEM_IDS: SolventSystemId[] = ['IJ', 'TE'];

/** Standard ink concentrations (wt% solute in the finished ink). */
export const PRESET_CONCENTRATIONS = [27, 36, 45];

/** Product names by concentration + solvent system. */
export const INK_PRODUCTS: { concentration: number; system: SolventSystemId; name: string }[] = [
  { concentration: 27, system: 'IJ', name: 'UTD25IJ' },
  { concentration: 27, system: 'TE', name: 'UTD25TE' },
  { concentration: 36, system: 'IJ', name: 'UTD40IJ' },
  { concentration: 36, system: 'TE', name: 'UTD40TE' },
  { concentration: 45, system: 'IJ', name: 'UTD60PA' },
  { concentration: 45, system: 'TE', name: 'UTD60TE' },
];

/** Product name for a concentration + solvent system, if one exists. */
export const getInkName = (
  concentration?: number,
  system?: SolventSystemId
): string | undefined =>
  INK_PRODUCTS.find(p => p.concentration === concentration && p.system === system)?.name;

/**
 * A preset system expressed as the SolventComponent[] the calculators already
 * consume, so preset mode needs no changes to any mass-balance code.
 */
export const presetSolvents = (system: SolventSystemId): SolventComponent[] =>
  SOLVENT_SYSTEMS[system].components.map((c, i) => ({
    id: `preset-${system}-${i}`,
    name: c.name,
    weightPercent: c.weightPercent,
    isAuto: false,
  }));
