/**
 * The engine grows with the real share of supply burned (sent to 0x…dEaD).
 * Each class is a real wheel arrangement (Whyte notation: leading-driving-trailing).
 * The thresholds are lore, not tokenomics: tune them here and the whole page follows.
 */
export interface Stage {
  /** 1–5 */
  n: number;
  name: string;
  /** Whyte notation, e.g. 4-6-2 */
  wheels: string;
  lead: number;
  drive: number;
  trail: number;
  /** % of total supply burned where this class starts */
  from: number;
  /** % where the next class starts (Infinity for the last) */
  to: number;
  blurb: string;
}

export const STAGES: Stage[] = [
  { n: 1, name: 'Yard Shunter', wheels: '0-4-0', lead: 0, drive: 2, trail: 0, from: 0, to: 0.5, blurb: 'Four wheels and a small firebox. Shunts wagons round the yard and burns everything it is handed.' },
  { n: 2, name: 'Goods Engine', wheels: '0-6-0', lead: 0, drive: 3, trail: 0, from: 0.5, to: 1, blurb: 'Six coupled wheels for heavy freight. A bigger grate, so a bigger shovel.' },
  { n: 3, name: 'Mainline', wheels: '4-6-0', lead: 2, drive: 3, trail: 0, from: 1, to: 2.5, blurb: 'A leading bogie for speed. Out of the yard and onto the main line, still hungry.' },
  { n: 4, name: 'Pacific Express', wheels: '4-6-2', lead: 2, drive: 3, trail: 1, from: 2.5, to: 5, blurb: 'A trailing axle carries a wide firebox. Built for long runs and a lot of $COAL.' },
  { n: 5, name: 'The Northern', wheels: '4-8-4', lead: 2, drive: 4, trail: 2, from: 5, to: Infinity, blurb: 'Eight driving wheels, the biggest firebox on the line. Five percent of the supply went through it.' },
];

export function stageIndexFor(pct: number) {
  for (let i = STAGES.length - 1; i >= 0; i--) if (pct >= STAGES[i].from) return i;
  return 0;
}

/** How far through its own class the engine is, 0..1. */
export function stageProgress(pct: number, i: number) {
  const s = STAGES[i];
  if (pct >= s.to) return 1;
  if (pct <= s.from) return 0;
  if (!Number.isFinite(s.to)) return 1;
  return (pct - s.from) / (s.to - s.from);
}

export const fmtPct = (p: number) => (p > 0 && p < 0.01 ? '<0.01' : (Math.floor(p * 100) / 100).toFixed(2));

/** What Stoker shouts back when you rap on the firebox door. */
export const STOKER_SAYS = [
  'shovel it in.',
  'nothing comes out of a firebox.',
  'more pressure, more fire.',
  'keep trading. i keep shovelling.',
  'gauge is not full yet.',
  'mind the door, it is hot.',
  'that lump was heavy.',
  'no brakes on this one.',
  'whistle soon.',
];
