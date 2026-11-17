/**
 * Junkyard teardown rules: which parts exist, what they are worth, how many bolts hold them,
 * what has to come off first, and the two ways to lose money (rushing fragile parts, and
 * pulling the steering wheel while the battery is still connected). Pure logic, no DOM.
 */

export type PartId =
  | 'wheelFront'
  | 'wheelRear'
  | 'mirror'
  | 'headlight'
  | 'taillight'
  | 'frontBumper'
  | 'rearBumper'
  | 'hood'
  | 'tailgate'
  | 'frontDoor'
  | 'rearDoor'
  | 'battery'
  | 'radiator'
  | 'engine'
  | 'gearbox'
  | 'frontSeats'
  | 'rearSeat'
  | 'steering'
  | 'catalyst'
  | 'exhaust';

export interface PartDef {
  id: PartId;
  /** Price in HUF when it comes off intact. */
  price: number;
  /** Clicks (bolts) needed. */
  clicks: number;
  /** Parts that must be removed before this one can be unbolted. */
  requires: PartId[];
  /** Parts that hide this one (it cannot even be clicked until they are gone). */
  hiddenBy: PartId[];
  /** Glass/plastic that cracks if you hammer it with clicks. */
  fragile?: boolean;
}

const part = (
  id: PartId,
  price: number,
  clicks: number,
  requires: PartId[] = [],
  hiddenBy: PartId[] = [],
  fragile = false,
): PartDef => ({ id, price, clicks, requires, hiddenBy, fragile });

export const PARTS: PartDef[] = [
  part('wheelFront', 25_000, 5),
  part('wheelRear', 25_000, 5),
  part('mirror', 7_000, 2, [], [], true),
  part('headlight', 22_000, 3, [], [], true),
  part('taillight', 8_000, 2, [], [], true),
  part('frontBumper', 12_000, 4),
  part('rearBumper', 10_000, 4),
  part('hood', 18_000, 4),
  part('tailgate', 20_000, 5),
  part('frontDoor', 15_000, 4, ['mirror']),
  part('rearDoor', 15_000, 4),
  part('battery', 9_000, 2, [], ['hood']),
  part('radiator', 10_000, 3, ['frontBumper'], ['hood']),
  part('engine', 180_000, 8, ['radiator'], ['hood']),
  part('gearbox', 70_000, 6, [], ['engine']),
  part('frontSeats', 30_000, 4, [], ['frontDoor']),
  part('rearSeat', 15_000, 3, [], ['rearDoor']),
  part('steering', 25_000, 3, [], ['frontDoor']),
  part('catalyst', 45_000, 4),
  part('exhaust', 5_000, 3),
];

export const PART_BY_ID = Object.fromEntries(PARTS.map((p) => [p.id, p])) as Record<PartId, PartDef>;

/** Two clicks on a fragile part closer than this (ms) crack it. */
export const FRAGILE_MS = 170;
/** Value left from a cracked fragile part. */
export const BROKEN_FACTOR = 0.15;
/** What a steering wheel is worth after its airbag went off. */
export const AIRBAG_FIRED_PRICE = 2_000;
/** Scrap value of the bare shell in the press. */
export const SCRAP_PRICE = 40_000;

export const MAX_MONEY = PARTS.reduce((sum, p) => sum + p.price, 0) + SCRAP_PRICE;

export type ClickResult =
  | { kind: 'hidden' }
  | { kind: 'done' }
  | { kind: 'locked'; missing: PartId[] }
  | { kind: 'progress'; progress: number }
  | { kind: 'removed'; earned: number; broken: boolean; airbag: boolean };

interface PartState {
  removed: boolean;
  bolts: number;
  broken: boolean;
  lastClick: number;
}

export class Teardown {
  money = 0;
  crushed = false;
  airbagFired = false;
  private readonly state = new Map<PartId, PartState>();

  constructor() {
    for (const p of PARTS) this.state.set(p.id, { removed: false, bolts: 0, broken: false, lastClick: -Infinity });
  }

  isRemoved(id: PartId): boolean {
    return this.state.get(id)!.removed;
  }

  isBroken(id: PartId): boolean {
    return this.state.get(id)!.broken;
  }

  /** 0..1 unbolting progress. */
  progress(id: PartId): number {
    return this.state.get(id)!.bolts / PART_BY_ID[id].clicks;
  }

  isVisible(id: PartId): boolean {
    return PART_BY_ID[id].hiddenBy.every((h) => this.isRemoved(h));
  }

  missing(id: PartId): PartId[] {
    return PART_BY_ID[id].requires.filter((r) => !this.isRemoved(r));
  }

  get removedCount(): number {
    return PARTS.filter((p) => this.isRemoved(p.id)).length;
  }

  get brokenCount(): number {
    return PARTS.filter((p) => this.isBroken(p.id)).length;
  }

  get allRemoved(): boolean {
    return this.removedCount === PARTS.length;
  }

  /** One click (one bolt) on a part. `now` is in ms. */
  click(id: PartId, now: number): ClickResult {
    const s = this.state.get(id)!;
    const def = PART_BY_ID[id];
    if (s.removed) return { kind: 'done' };
    if (!this.isVisible(id)) return { kind: 'hidden' };
    const missing = this.missing(id);
    if (missing.length > 0) return { kind: 'locked', missing };

    if (def.fragile && now - s.lastClick < FRAGILE_MS) {
      // rushed it: the glass cracks and the part comes off in pieces
      s.broken = true;
      return this.remove(id, Math.round(def.price * BROKEN_FACTOR), true, false);
    }
    s.lastClick = now;
    s.bolts++;
    if (s.bolts < def.clicks) return { kind: 'progress', progress: s.bolts / def.clicks };

    if (id === 'steering' && !this.isRemoved('battery')) {
      this.airbagFired = true;
      s.broken = true;
      return this.remove(id, AIRBAG_FIRED_PRICE, true, true);
    }
    return this.remove(id, def.price, false, false);
  }

  /** Sends the bare shell to the press (only once everything else is off). */
  crush(): number {
    if (!this.allRemoved || this.crushed) return 0;
    this.crushed = true;
    this.money += SCRAP_PRICE;
    return SCRAP_PRICE;
  }

  private remove(id: PartId, earned: number, broken: boolean, airbag: boolean): ClickResult {
    const s = this.state.get(id)!;
    s.removed = true;
    s.bolts = PART_BY_ID[id].clicks;
    this.money += earned;
    return { kind: 'removed', earned, broken, airbag };
  }
}
