/**
 * Shared dropdown options for plant forms.
 * Used by: /plants/new (create), /plants/[id] (edit), /plants (filter)
 * Single source of truth — add new values here, not inline.
 */

// Croat & Sheffer (1983) sections + recent revisions (Carlsen & Croat 2019, Delannay & Croat 2025)
// Sorted alphabetically. See: https://annals.mobot.org/index.php/annals/article/view/215
export const SECTIONS = [
  'Andiphilum',
  'Belolonchium',
  'Calomystrium',
  'Cardiolonchium',
  'Chamaerepium',
  'Cordatopunctatum',
  'Dactylophyllium',
  'Decurrentia',
  'Digitinervium',
  'Gymnopodium',
  'Leptanthurium',
  'Pachyneurium',
  'Polyphyllium',
  'Polyneurium',
  'Porphyrochitonium',
  'Schizoplacium',
  'Semaeophyllium',
  'Stipitata',
  'Tetraspermium',
  'Urospadix',
  'Xialophyllum',
  'cross-section hybrid',
] as const

export const BREEDER_CODES = [
  'RA',
  'OG',
  'NSE',
  'TZ',
  'SKG',
  'Wu',
  'EPP',
  'SC',
  'DF',
  'FP',
] as const

export const HEALTH_STATUSES = [
  { value: 'healthy', label: 'Healthy' },
  { value: 'recovering', label: 'Recovering' },
  { value: 'struggling', label: 'Struggling' },
  { value: 'critical', label: 'Critical' },
  { value: 'diseased', label: 'Diseased' },
] as const

export const PROPAGATION_TYPES = [
  { value: 'seed', label: 'Seed - Grown from seed' },
  { value: 'cutting', label: 'Cutting - Stem/leaf cutting' },
  { value: 'tissue_culture', label: 'Tissue Culture - Lab propagated' },
  { value: 'division', label: 'Division - Offset/clone from mother plant' },
  { value: 'purchase', label: 'Purchase - Acquired as established plant' },
] as const

export const GENERATIONS = {
  cross: [
    { value: 'F1', label: 'F1 - First filial generation' },
    { value: 'F2', label: 'F2 - Second filial generation' },
    { value: 'F3', label: 'F3 - Third filial generation' },
    { value: 'F4', label: 'F4 - Fourth filial generation' },
    { value: 'F5', label: 'F5 - Fifth filial generation' },
    { value: 'F6', label: 'F6 - Sixth filial generation' },
  ],
  selfed: [
    { value: 'S1', label: 'S1 - First selfed generation' },
    { value: 'S2', label: 'S2 - Second selfed generation' },
    { value: 'S3', label: 'S3 - Third selfed generation' },
    { value: 'S4', label: 'S4 - Fourth selfed generation' },
    { value: 'S5', label: 'S5 - Fifth selfed generation' },
  ],
  other: [
    { value: 'P1', label: 'P1 - Parent/Foundation' },
    { value: 'BC1', label: 'BC1 - Backcross' },
    { value: 'Clone', label: 'Clone/Division (same as parent)' },
  ],
} as const

export const POT_TYPES = [
  { value: 'plastic', label: 'Plastic' },
  { value: 'terracotta', label: 'Terracotta' },
  { value: 'ceramic', label: 'Ceramic' },
  { value: 'net_pot', label: 'Net Pot' },
  { value: 'fabric', label: 'Fabric Pot' },
] as const
