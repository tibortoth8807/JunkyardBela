/**
 * Junkyard scene, drawn with Canvas 2D paths. The car is an original side-view drawing of a
 * late-90s estate (no logos, no grille artwork); every removable part has its own Path2D,
 * which is used both for drawing and for hit testing.
 */
import type { PartId } from '../game/teardown';

export type Ctx = CanvasRenderingContext2D;

export const W = 960;
export const H = 600;
export const GROUND = 500;
export const SILL = 470;
export const CONTAINER = { x: 760, y: 118, w: 175, h: 96 };

const BODY_TOP = '#3a7a62';
const BODY = '#215443';
const BODY_DARK = '#123327';
const GLASS = '#22323d';
const GLASS_HI = 'rgba(255,255,255,0.13)';

// ------------------------------------------------------------------ helpers

function rr(x: number, y: number, w: number, h: number, r: number): Path2D {
  const p = new Path2D();
  p.roundRect(x, y, w, h, r);
  return p;
}

function poly(points: string): Path2D {
  return new Path2D(points);
}

function fill(ctx: Ctx, path: Path2D, style: string | CanvasGradient): void {
  ctx.fillStyle = style;
  ctx.fill(path);
}

function circle(ctx: Ctx, x: number, y: number, r: number, style: string): void {
  ctx.fillStyle = style;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function paint(ctx: Ctx, top = 284, bottom = 470): CanvasGradient {
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, BODY_TOP);
  g.addColorStop(0.45, BODY);
  g.addColorStop(1, BODY_DARK);
  return g;
}

function outline(ctx: Ctx, path: Path2D, color = 'rgba(0,0,0,0.45)', width = 1.5): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke(path);
}

// ------------------------------------------------------------------ fixed body

export type BodyStyle = 'sedan' | 'touring';

// Late-90s executive saloon/estate proportions: long sloping bonnet, low nose, raked
// windscreen, and the side window ending in a forward kink at the C pillar.
const BODY_PATHS: Record<BodyStyle, Path2D> = {
  sedan: poly(
    'M150,456 L149,420 Q150,402 158,397 Q260,372 372,348 L474,290 Q575,274 680,286 Q740,300 782,333 L858,339 Q873,341 875,352 L880,400 L882,458 Q882,470 870,470 L162,470 Q150,470 150,456 Z',
  ),
  touring: poly(
    'M150,456 L149,420 Q150,402 158,397 Q260,372 372,348 L474,290 Q575,274 690,282 L812,284 Q836,286 846,300 L874,358 L880,400 L882,458 Q882,470 870,470 L162,470 Q150,470 150,456 Z',
  ),
};
const QUARTER_WINDOWS: Record<BodyStyle, Path2D> = {
  sedan: poly('M688,292 Q716,298 736,318 Q748,336 738,352 L688,352 Z'),
  touring: poly('M696,288 L808,289 Q826,291 834,304 L842,330 Q846,346 834,352 L696,352 Z'),
};
let bodyStyle: BodyStyle = 'touring';
const FRONT_OPENING = poly('M380,354 L474,294 Q512,288 566,286 L566,470 L388,470 Q376,420 380,354 Z');
const REAR_OPENING = poly('M566,286 L688,286 L694,352 L690,382 Q664,404 656,470 L566,470 Z');
const BAY = poly('M160,404 Q262,380 373,356 L373,446 L176,446 Z');

export const WHEEL_X = { front: 280, rear: 710 };
export const WHEEL_Y = 453;
const WHEEL_R = 47;

// ------------------------------------------------------------------ removable parts

export interface PartGfx {
  id: PartId;
  path: Path2D;
  center: [number, number];
  draw(ctx: Ctx, broken: boolean): void;
}

function wheelGfx(id: PartId, cx: number): PartGfx {
  const path = new Path2D();
  path.arc(cx, WHEEL_Y, WHEEL_R, 0, Math.PI * 2);
  return {
    id,
    path,
    center: [cx, WHEEL_Y],
    draw(ctx) {
      circle(ctx, cx, WHEEL_Y, WHEEL_R, '#141416');
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, WHEEL_Y, WHEEL_R - 6, 0, Math.PI * 2);
      ctx.stroke();
      circle(ctx, cx, WHEEL_Y, 31, '#b8bec5');
      circle(ctx, cx, WHEEL_Y, 27, '#6d737a');
      ctx.fillStyle = '#c9ced4';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.save();
        ctx.translate(cx, WHEEL_Y);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(-7, -27);
        ctx.lineTo(7, -27);
        ctx.lineTo(4, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      circle(ctx, cx, WHEEL_Y, 7, '#4a4f55');
    },
  };
}

function glassWindow(ctx: Ctx, path: Path2D, x: number): void {
  fill(ctx, path, GLASS);
  ctx.save();
  ctx.clip(path);
  ctx.fillStyle = GLASS_HI;
  ctx.beginPath();
  ctx.moveTo(x, 280);
  ctx.lineTo(x + 34, 280);
  ctx.lineTo(x - 30, 390);
  ctx.lineTo(x - 64, 390);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function crack(ctx: Ctx, x: number, y: number, size: number): void {
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * size, y + Math.sin(a) * size);
    ctx.stroke();
  }
}

const TAILGATE_TOURING: PartGfx = (() => {
  const path = poly('M834,288 Q846,292 850,304 L874,358 L862,362 L846,318 Q840,300 828,292 Z');
  return {
    id: 'tailgate' as PartId,
    path,
    center: [854, 330] as [number, number],
    draw(ctx: Ctx) {
      fill(ctx, path, paint(ctx));
      outline(ctx, path);
      fill(ctx, poly('M838,296 Q845,300 848,308 L856,330 L850,331 L842,308 Z'), GLASS);
    },
  };
})();

const TRUNK_LID: PartGfx = (() => {
  const path = poly('M780,332 L858,338 Q873,340 875,352 L876,358 L842,356 L784,342 Z');
  return {
    id: 'tailgate' as PartId,
    path,
    center: [830, 346] as [number, number],
    draw(ctx: Ctx) {
      fill(ctx, path, paint(ctx, 332, 360));
      outline(ctx, path);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(788, 336);
      ctx.lineTo(864, 342);
      ctx.stroke();
    },
  };
})();

/** Switches between saloon and estate (changes the shell, the rear windows and the boot lid). */
export function setBodyStyle(style: BodyStyle): void {
  bodyStyle = style;
  PART_GFX.tailgate = style === 'sedan' ? TRUNK_LID : TAILGATE_TOURING;
}

export const PART_GFX: Record<PartId, PartGfx> = {
  wheelFront: wheelGfx('wheelFront', WHEEL_X.front),
  wheelRear: wheelGfx('wheelRear', WHEEL_X.rear),

  frontDoor: (() => {
    const path = FRONT_OPENING;
    const window = poly('M392,352 L476,300 Q512,294 560,292 L560,352 Z');
    return {
      id: 'frontDoor' as PartId,
      path,
      center: [480, 405] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, paint(ctx));
        glassWindow(ctx, window, 520);
        ctx.strokeStyle = '#0f1513';
        ctx.lineWidth = 2.5;
        ctx.stroke(window);
        outline(ctx, path);
        fill(ctx, rr(530, 366, 26, 5, 2), '#b9c0c6');
        fill(ctx, poly('M388,421 L566,419 L566,425 L389,427 Z'), '#122a20');
      },
    };
  })(),

  rearDoor: (() => {
    const path = REAR_OPENING;
    const window = poly('M572,292 L682,292 L686,352 L572,352 Z');
    return {
      id: 'rearDoor' as PartId,
      path,
      center: [620, 405] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, paint(ctx));
        glassWindow(ctx, window, 640);
        ctx.strokeStyle = '#0f1513';
        ctx.lineWidth = 2.5;
        ctx.stroke(window);
        outline(ctx, path);
        fill(ctx, rr(648, 364, 22, 5, 2), '#b9c0c6');
        fill(ctx, poly('M566,419 L672,417 L668,423 L566,425 Z'), '#122a20');
      },
    };
  })(),

  hood: (() => {
    const path = poly('M158,397 Q260,372 372,348 L374,357 Q262,381 160,405 Z');
    return {
      id: 'hood' as PartId,
      path,
      center: [262, 378] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, paint(ctx, 346, 406));
        outline(ctx, path);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(168, 397);
        ctx.quadraticCurveTo(262, 375, 366, 352);
        ctx.stroke();
      },
    };
  })(),

  tailgate: TAILGATE_TOURING,

  mirror: (() => {
    const path = poly('M382,340 L406,336 L408,355 L386,358 Z');
    return {
      id: 'mirror' as PartId,
      path,
      center: [395, 347] as [number, number],
      draw(ctx: Ctx, broken: boolean) {
        fill(ctx, path, paint(ctx, 336, 358));
        outline(ctx, path);
        fill(ctx, rr(385, 342, 8, 12, 2), '#a9c0cf');
        if (broken) crack(ctx, 389, 348, 7);
      },
    };
  })(),

  headlight: (() => {
    // quad round lamps behind one wide lens, wrapping round the corner
    const path = poly('M152,406 L200,398 L202,412 L156,419 Z');
    return {
      id: 'headlight' as PartId,
      path,
      center: [178, 409] as [number, number],
      draw(ctx: Ctx, broken: boolean) {
        fill(ctx, path, '#1d2125');
        for (const [x, y] of [[163, 412], [178, 409], [193, 406]] as [number, number][]) {
          circle(ctx, x, y, 5, '#e9eff3');
          circle(ctx, x, y, 2.3, '#fff8d6');
        }
        fill(ctx, poly('M154,407 L199,399 L200,402 L155,410 Z'), 'rgba(255,255,255,0.35)');
        fill(ctx, poly('M194,414 L202,412 L202,416 L195,418 Z'), '#e88a1a');
        if (broken) crack(ctx, 178, 409, 12);
      },
    };
  })(),

  taillight: (() => {
    const path = poly('M840,358 L876,356 L879,380 L844,382 Z');
    return {
      id: 'taillight' as PartId,
      path,
      center: [860, 369] as [number, number],
      draw(ctx: Ctx, broken: boolean) {
        fill(ctx, path, '#b3121f');
        fill(ctx, poly('M842,370 L878,368 L879,380 L844,382 Z'), '#8e0d18');
        fill(ctx, poly('M842,360 L874,358 L874,362 L842,363 Z'), 'rgba(255,255,255,0.3)');
        if (broken) crack(ctx, 860, 369, 9);
      },
    };
  })(),

  frontBumper: (() => {
    const path = poly('M148,421 L218,417 L220,470 L156,470 Q146,458 148,421 Z');
    return {
      id: 'frontBumper' as PartId,
      path,
      center: [184, 446] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, paint(ctx, 417, 470));
        fill(ctx, rr(148, 432, 72, 6, 2), '#122a20');
        fill(ctx, rr(158, 452, 50, 9, 3), '#111214');
        fill(ctx, rr(204, 424, 10, 5, 2), '#e88a1a');
        outline(ctx, path);
      },
    };
  })(),

  rearBumper: (() => {
    const path = poly('M834,398 L880,396 L883,470 L846,470 Z');
    return {
      id: 'rearBumper' as PartId,
      path,
      center: [860, 432] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, paint(ctx, 396, 470));
        fill(ctx, rr(836, 418, 47, 6, 2), '#122a20');
        outline(ctx, path);
      },
    };
  })(),

  exhaust: (() => {
    const path = new Path2D();
    path.roundRect(772, 466, 92, 14, 6);
    path.rect(470, 470, 302, 6);
    path.rect(864, 470, 26, 6);
    return {
      id: 'exhaust' as PartId,
      path,
      center: [815, 473] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, rr(470, 470, 302, 6, 3), '#6f6a63');
        fill(ctx, rr(772, 466, 92, 14, 6), '#8a847b');
        fill(ctx, rr(860, 469, 30, 8, 3), '#a8a29a');
        ctx.strokeStyle = 'rgba(120,60,20,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(790, 476);
        ctx.lineTo(840, 476);
        ctx.stroke();
      },
    };
  })(),

  catalyst: (() => {
    const path = rr(394, 465, 76, 16, 7);
    return {
      id: 'catalyst' as PartId,
      path,
      center: [432, 473] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, '#b5b0a6');
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 2;
        for (let x = 406; x < 466; x += 10) {
          ctx.beginPath();
          ctx.moveTo(x, 467);
          ctx.lineTo(x, 479);
          ctx.stroke();
        }
        fill(ctx, rr(370, 469, 26, 6, 3), '#6f6a63');
      },
    };
  })(),

  battery: (() => {
    const path = rr(324, 372, 36, 25, 3);
    return {
      id: 'battery' as PartId,
      path,
      center: [342, 384] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, '#1b1c1f');
        fill(ctx, rr(324, 372, 36, 6, 2), '#2d2f33');
        fill(ctx, rr(328, 368, 7, 5, 1), '#c0392b');
        fill(ctx, rr(349, 368, 7, 5, 1), '#2c3e50');
        fill(ctx, rr(329, 382, 26, 9, 2), '#3a7bd5');
      },
    };
  })(),

  radiator: (() => {
    const path = rr(176, 408, 17, 38, 2);
    return {
      id: 'radiator' as PartId,
      path,
      center: [184, 427] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, '#8f969d');
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1;
        for (let y = 411; y < 445; y += 4) {
          ctx.beginPath();
          ctx.moveTo(177, y);
          ctx.lineTo(192, y);
          ctx.stroke();
        }
      },
    };
  })(),

  engine: (() => {
    const path = new Path2D();
    path.roundRect(205, 402, 108, 44, 6);
    path.roundRect(212, 392, 94, 12, 4);
    return {
      id: 'engine' as PartId,
      path,
      center: [259, 422] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, rr(205, 402, 108, 44, 6), '#5f666d');
        fill(ctx, rr(212, 392, 94, 12, 4), '#b9bfc5');
        ctx.fillStyle = '#3b4046';
        for (let i = 0; i < 6; i++) ctx.fillRect(218 + i * 15, 407, 9, 14);
        fill(ctx, rr(212, 428, 94, 12, 4), '#4a5056');
        circle(ctx, 300, 434, 8, '#2b2f34');
        circle(ctx, 300, 434, 3.5, '#8a9096');
      },
    };
  })(),

  gearbox: (() => {
    const path = poly('M300,412 L362,410 L366,446 L304,446 Z');
    return {
      id: 'gearbox' as PartId,
      path,
      center: [332, 430] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, '#8b8f86');
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 2;
        for (let x = 314; x < 362; x += 10) {
          ctx.beginPath();
          ctx.moveTo(x, 412);
          ctx.lineTo(x + 1, 444);
          ctx.stroke();
        }
      },
    };
  })(),

  steering: (() => {
    const path = new Path2D();
    path.ellipse(456, 340, 9, 24, -0.4, 0, Math.PI * 2);
    return {
      id: 'steering' as PartId,
      path,
      center: [456, 340] as [number, number],
      draw(ctx: Ctx) {
        ctx.strokeStyle = '#2a2b2e';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(456, 340);
        ctx.lineTo(424, 362);
        ctx.stroke();
        ctx.strokeStyle = '#111214';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.ellipse(456, 340, 9, 24, -0.4, 0, Math.PI * 2);
        ctx.stroke();
        circle(ctx, 456, 340, 8, '#2f3135');
      },
    };
  })(),

  frontSeats: (() => {
    const path = new Path2D('M502,316 Q522,312 524,332 L536,440 L508,440 L490,332 Z');
    path.roundRect(440, 420, 92, 22, 6);
    path.roundRect(498, 298, 22, 18, 5);
    return {
      id: 'frontSeats' as PartId,
      path,
      center: [500, 400] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, '#3b3530');
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(508, 340);
        ctx.lineTo(520, 430);
        ctx.stroke();
      },
    };
  })(),

  rearSeat: (() => {
    const path = new Path2D('M652,320 L674,320 L686,440 L662,440 Z');
    path.roundRect(594, 420, 90, 22, 6);
    path.roundRect(650, 304, 20, 16, 5);
    return {
      id: 'rearSeat' as PartId,
      path,
      center: [640, 430] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, '#3b3530');
      },
    };
  })(),
};

/** Topmost first - used for hit testing. */
export const HIT_ORDER: PartId[] = [
  'wheelFront',
  'wheelRear',
  'mirror',
  'headlight',
  'hood',
  'tailgate',
  'taillight',
  'frontBumper',
  'rearBumper',
  'frontDoor',
  'rearDoor',
  'steering',
  'frontSeats',
  'rearSeat',
  'battery',
  'radiator',
  'engine',
  'gearbox',
  'catalyst',
  'exhaust',
];

const hitCtx = document.createElement('canvas').getContext('2d')!;

/** Exact hit inside the part's shape. */
export function hitTest(id: PartId, x: number, y: number): boolean {
  return hitCtx.isPointInPath(PART_GFX[id].path, x, y);
}

/** Forgiving hit near the edge - for thin parts like the hood, only used when nothing is hit exactly. */
export function nearTest(id: PartId, x: number, y: number): boolean {
  hitCtx.lineWidth = 12;
  return hitCtx.isPointInStroke(PART_GFX[id].path, x, y);
}

// ------------------------------------------------------------------ the car

export interface CarView {
  present: (id: PartId) => boolean;
  visible: (id: PartId) => boolean;
  broken: (id: PartId) => boolean;
  hover: PartId | null;
  hoverLocked: boolean;
  progress: (id: PartId) => number;
  squash: number; // 1 = normal, smaller = crushed
}

export function drawCar(ctx: Ctx, view: CarView): void {
  ctx.save();
  if (view.squash < 1) {
    ctx.translate(515, GROUND);
    ctx.scale(1 + (1 - view.squash) * 0.06, view.squash);
    ctx.translate(-515, -GROUND);
  }

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(515, GROUND + 4, 380, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // wooden blocks under removed wheels
  for (const [id, x] of [['wheelFront', WHEEL_X.front], ['wheelRear', WHEEL_X.rear]] as [PartId, number][]) {
    if (!view.present(id)) {
      fill(ctx, rr(x - 34, SILL + 2, 68, GROUND - SILL - 2, 3), '#8a5a2b');
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 34, SILL + 17);
      ctx.lineTo(x + 34, SILL + 17);
      ctx.stroke();
    }
  }

  // shell
  const BODY_PATH = BODY_PATHS[bodyStyle];
  fill(ctx, BODY_PATH, paint(ctx));
  ctx.save();
  ctx.clip(BODY_PATH);
  for (const x of [WHEEL_X.front, WHEEL_X.rear]) circle(ctx, x, WHEEL_Y, 56, '#0b0b0c');
  // rust spots - it is an old car after all
  ctx.fillStyle = 'rgba(140, 70, 25, 0.55)';
  for (const [x, y, r] of [[350, 458, 7], [662, 446, 5], [214, 446, 4], [770, 455, 6]] as [number, number, number][]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  glassWindow(ctx, QUARTER_WINDOWS[bodyStyle], 735);
  if (bodyStyle === 'sedan') {
    // raked rear window seen almost edge-on
    fill(ctx, poly('M684,287 Q738,301 782,333 L770,333 Q728,305 680,292 Z'), GLASS);
  } else {
    // roof rails
    fill(ctx, rr(586, 274, 236, 6, 3), '#16181a');
    fill(ctx, rr(600, 279, 8, 5, 1), '#16181a');
    fill(ctx, rr(800, 280, 8, 5, 1), '#16181a');
  }
  // B pillar and window surround (satin black)
  fill(ctx, poly('M560,288 L572,288 L572,352 L560,352 Z'), '#0f1513');
  ctx.strokeStyle = '#0f1513';
  ctx.lineWidth = 2.5;
  ctx.stroke(QUARTER_WINDOWS[bodyStyle]);
  // shoulder line, lower crease and the strip on the wings
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(200, 398);
  ctx.quadraticCurveTo(520, 382, 876, 376);
  ctx.stroke();
  fill(ctx, poly('M334,422 L388,421 L389,427 L336,428 Z'), '#122a20');
  fill(ctx, poly('M764,417 L836,415 L836,421 L766,423 Z'), '#122a20');
  // fuel flap
  outline(ctx, rr(744, 362, 20, 18, 3), 'rgba(0,0,0,0.35)', 1.2);
  outline(ctx, BODY_PATH, 'rgba(0,0,0,0.5)', 2);

  // engine bay cut-away once the hood is gone
  if (!view.present('hood')) {
    fill(ctx, BAY, '#151618');
    ctx.save();
    ctx.clip(BAY);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(170, 380, 200, 20);
    ctx.restore();
  }
  // interior once a door is gone
  if (!view.present('frontDoor')) {
    fill(ctx, FRONT_OPENING, '#141518');
    fill(ctx, poly('M380,356 L434,346 L444,392 L388,402 Z'), '#24262a');
    fill(ctx, rr(440, 442, 130, 20, 3), '#1d1f22');
  }
  if (!view.present('rearDoor')) {
    fill(ctx, REAR_OPENING, '#141518');
    fill(ctx, rr(580, 442, 100, 20, 3), '#1d1f22');
  }

  const draw = (id: PartId) => {
    if (!view.present(id) || !view.visible(id)) return;
    PART_GFX[id].draw(ctx, view.broken(id));
  };
  // back to front
  for (const id of ['gearbox', 'engine', 'radiator', 'battery', 'rearSeat', 'frontSeats', 'steering'] as PartId[]) draw(id);
  for (const id of ['exhaust', 'catalyst', 'frontDoor', 'rearDoor', 'frontBumper', 'rearBumper', 'taillight', 'tailgate', 'hood', 'headlight', 'mirror'] as PartId[]) draw(id);

  // hubs where wheels used to be
  for (const [id, x] of [['wheelFront', WHEEL_X.front], ['wheelRear', WHEEL_X.rear]] as [PartId, number][]) {
    if (view.present(id)) {
      draw(id);
    } else {
      circle(ctx, x, WHEEL_Y, 28, '#7a7f86');
      circle(ctx, x, WHEEL_Y, 26, '#5c6168');
      fill(ctx, rr(x - 24, WHEEL_Y - 26, 18, 22, 4), '#b8232f');
      circle(ctx, x, WHEEL_Y, 8, '#3a3e44');
    }
  }

  // hover highlight
  if (view.hover && view.present(view.hover) && view.visible(view.hover)) {
    const gfx = PART_GFX[view.hover];
    ctx.save();
    ctx.fillStyle = view.hoverLocked ? 'rgba(239, 68, 68, 0.25)' : 'rgba(250, 204, 21, 0.25)';
    ctx.fill(gfx.path);
    ctx.strokeStyle = view.hoverLocked ? '#ef4444' : '#facc15';
    ctx.lineWidth = 3;
    ctx.stroke(gfx.path);
    ctx.restore();
  }
  // unbolting progress rings
  for (const id of HIT_ORDER) {
    const p = view.progress(id);
    if (p <= 0 || p >= 1 || !view.present(id)) continue;
    const [cx, cy] = PART_GFX[id].center;
    circle(ctx, cx, cy, 15, 'rgba(0,0,0,0.6)');
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 11, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** A removed part flying into the container. t: 0..1 */
export function drawFlyingPart(ctx: Ctx, id: PartId, t: number, broken: boolean): void {
  const gfx = PART_GFX[id];
  const [cx, cy] = gfx.center;
  const tx = CONTAINER.x + CONTAINER.w / 2;
  const ty = CONTAINER.y + 20;
  const e = 1 - (1 - t) * (1 - t);
  const x = cx + (tx - cx) * e;
  const y = cy + (ty - cy) * e - Math.sin(Math.PI * t) * 140;
  const scale = 1 - 0.65 * t;
  ctx.save();
  ctx.globalAlpha = t > 0.85 ? (1 - t) / 0.15 : 1;
  ctx.translate(x, y);
  ctx.rotate(t * (cx < 500 ? 4 : -4));
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  gfx.draw(ctx, broken);
  ctx.restore();
}

// ------------------------------------------------------------------ the junkyard

export function drawYard(ctx: Ctx, time: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, '#8fb9d6');
  sky.addColorStop(1, '#efe0bd');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, GROUND);

  // sun and drifting clouds
  circle(ctx, 120, 80, 34, 'rgba(255, 244, 200, 0.9)');
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 3; i++) {
    const x = ((time / 120 + i * 360) % (W + 300)) - 150;
    const y = 60 + i * 28;
    ctx.beginPath();
    ctx.ellipse(x, y, 60, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 40, y - 8, 40, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // stacks of scrapped cars behind the fence
  const colors = ['#7a4b3a', '#5c6b7a', '#8a8a6a', '#6b4f6b', '#4f6b5a', '#9a7a4a'];
  for (let s = 0; s < 5; s++) {
    const baseX = 180 + s * 150;
    for (let k = 0; k < 3 + (s % 2); k++) {
      const y = 330 - k * 34;
      ctx.fillStyle = colors[(s * 3 + k) % colors.length];
      ctx.beginPath();
      ctx.roundRect(baseX + (k % 2) * 10, y, 120, 30, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(20, 30, 40, 0.5)';
      ctx.fillRect(baseX + 30 + (k % 2) * 10, y + 4, 50, 10);
    }
  }

  // crane in the distance
  ctx.strokeStyle = '#d9a527';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(60, 340);
  ctx.lineTo(60, 150);
  ctx.lineTo(260, 170);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(240, 168);
  ctx.lineTo(240, 230);
  ctx.stroke();
  ctx.fillStyle = '#3d3d3d';
  ctx.fillRect(228, 230, 24, 10);

  // corrugated fence
  ctx.fillStyle = '#8c8577';
  ctx.fillRect(0, 340, W, GROUND - 340);
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  for (let x = 0; x < W; x += 16) ctx.fillRect(x, 340, 7, GROUND - 340);
  ctx.fillStyle = 'rgba(140, 70, 25, 0.35)';
  ctx.fillRect(300, 420, 60, 30);
  ctx.fillRect(640, 360, 40, 50);

  // container for the parts
  const c = CONTAINER;
  ctx.fillStyle = '#2f5f8f';
  ctx.beginPath();
  ctx.moveTo(c.x, c.y);
  ctx.lineTo(c.x + c.w, c.y);
  ctx.lineTo(c.x + c.w - 14, c.y + c.h);
  ctx.lineTo(c.x + 14, c.y + c.h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let x = c.x + 22; x < c.x + c.w - 16; x += 22) ctx.fillRect(x, c.y + 6, 8, c.h - 12);
  ctx.fillStyle = '#244a70';
  ctx.fillRect(c.x - 4, c.y - 6, c.w + 8, 9);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('♻', c.x + c.w / 2, c.y + c.h / 2 + 2);
  // container legs
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(c.x + 20, c.y + c.h, 8, 126);
  ctx.fillRect(c.x + c.w - 28, c.y + c.h, 8, 126);

  // ground: gravel and oil
  const ground = ctx.createLinearGradient(0, GROUND, 0, H);
  ground.addColorStop(0, '#8b7b5c');
  ground.addColorStop(1, '#6d5f45');
  ctx.fillStyle = ground;
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let i = 0; i < 140; i++) {
    const x = (i * 97) % W;
    const y = GROUND + 6 + ((i * 53) % (H - GROUND - 8));
    ctx.fillRect(x, y, 3, 2);
  }
  ctx.fillStyle = 'rgba(25, 20, 10, 0.4)';
  ctx.beginPath();
  ctx.ellipse(620, 560, 70, 12, 0, 0, Math.PI * 2);
  ctx.ellipse(160, 575, 40, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // old tyre lying around
  ctx.strokeStyle = '#1c1c1c';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.ellipse(880, 560, 34, 12, 0, 0, Math.PI * 2);
  ctx.stroke();
}

// ------------------------------------------------------------------ Béla

/** The junkyard owner. swing: 0..1 wrench animation. */
export function drawBela(ctx: Ctx, time: number, swing: number, shock: number): void {
  const x = 78;
  const feet = GROUND + 8;
  ctx.save();
  if (shock > 0) ctx.translate(Math.sin(time / 20) * 3 * shock, 0);

  // legs + boots
  fill(ctx, rr(x - 22, feet - 92, 19, 86, 6), '#2d4f8a');
  fill(ctx, rr(x + 3, feet - 92, 19, 86, 6), '#2d4f8a');
  fill(ctx, rr(x - 26, feet - 12, 26, 12, 4), '#1d1a17');
  fill(ctx, rr(x + 1, feet - 12, 26, 12, 4), '#1d1a17');

  // left arm (behind)
  ctx.save();
  ctx.translate(x - 26, feet - 168);
  ctx.rotate(0.25);
  fill(ctx, rr(-8, 0, 16, 60, 7), '#b33a3a');
  circle(ctx, 0, 64, 8, '#e0b08a');
  ctx.restore();

  // torso: checked shirt + overall bib + beer belly
  fill(ctx, rr(x - 30, feet - 180, 60, 96, 16), '#b33a3a');
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 30 + i * 11, feet - 178);
    ctx.lineTo(x - 30 + i * 11, feet - 86);
    ctx.stroke();
  }
  ctx.fillStyle = '#2d4f8a';
  ctx.beginPath();
  ctx.ellipse(x + 4, feet - 112, 34, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  fill(ctx, rr(x - 18, feet - 160, 36, 46, 6), '#2d4f8a');
  fill(ctx, rr(x - 18, feet - 172, 7, 20, 3), '#2d4f8a');
  fill(ctx, rr(x + 11, feet - 172, 7, 20, 3), '#2d4f8a');
  circle(ctx, x - 14, feet - 152, 3, '#d9a527');
  circle(ctx, x + 14, feet - 152, 3, '#d9a527');
  fill(ctx, rr(x - 10, feet - 140, 20, 14, 3), 'rgba(0,0,0,0.18)'); // pocket
  ctx.fillStyle = 'rgba(30, 20, 10, 0.35)'; // grease stain
  ctx.beginPath();
  ctx.ellipse(x + 16, feet - 100, 8, 5, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // head
  const hx = x + 2;
  const hy = feet - 204;
  fill(ctx, rr(hx - 7, hy + 18, 14, 10, 3), '#d9a37f'); // neck
  circle(ctx, hx, hy, 25, '#e0b08a');
  circle(ctx, hx - 24, hy + 2, 6, '#d9a37f'); // ear
  // stubble
  ctx.fillStyle = 'rgba(60, 40, 30, 0.25)';
  ctx.beginPath();
  ctx.arc(hx + 2, hy + 6, 21, 0.1, Math.PI - 0.4);
  ctx.fill();
  // cap
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.arc(hx, hy - 4, 26, Math.PI, 0);
  ctx.fill();
  fill(ctx, rr(hx + 4, hy - 8, 34, 7, 3), '#a93226');
  // face
  const blink = Math.sin(time / 1700) > 0.97;
  if (blink || shock > 0.5) {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx + 6, hy + 2);
    ctx.lineTo(hx + 14, hy + 2);
    ctx.stroke();
  } else {
    circle(ctx, hx + 10, hy + 2, 3, '#222');
  }
  // bushy brow
  fill(ctx, rr(hx + 3, hy - 5, 15, 4, 2), '#4a3020');
  // nose
  ctx.fillStyle = '#d18f6a';
  ctx.beginPath();
  ctx.ellipse(hx + 22, hy + 8, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // moustache
  ctx.fillStyle = '#4a3020';
  ctx.beginPath();
  ctx.ellipse(hx + 16, hy + 15, 12, 5, 0.1, 0, Math.PI * 2);
  ctx.fill();
  // cigarette with ember
  ctx.strokeStyle = '#f4f1ea';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hx + 20, hy + 20);
  ctx.lineTo(hx + 34, hy + 22);
  ctx.stroke();
  ctx.lineCap = 'butt';
  circle(ctx, hx + 35, hy + 22, 2.2, Math.sin(time / 300) > 0 ? '#ff7a1a' : '#e0451a');
  // smoke
  for (let i = 0; i < 5; i++) {
    const t = ((time / 2200 + i / 5) % 1);
    ctx.fillStyle = `rgba(230, 230, 230, ${0.5 * (1 - t)})`;
    ctx.beginPath();
    ctx.arc(hx + 36 + Math.sin(t * 6 + i) * 6, hy + 18 - t * 60, 3 + t * 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // right arm with a wrench (in front), swinging while you work
  ctx.save();
  ctx.translate(x + 24, feet - 168);
  ctx.rotate(-0.5 - Math.sin(swing * Math.PI) * 0.9);
  fill(ctx, rr(-8, 0, 16, 58, 7), '#b33a3a');
  circle(ctx, 0, 62, 8, '#e0b08a');
  ctx.translate(0, 62);
  ctx.rotate(0.4);
  fill(ctx, rr(-3, -4, 6, 46, 2), '#9aa3ab');
  ctx.fillStyle = '#9aa3ab';
  ctx.beginPath();
  ctx.arc(0, 46, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e0b08a';
  ctx.fillRect(-3, 48, 6, 10);
  ctx.restore();

  ctx.restore();
}

// ------------------------------------------------------------------ effects

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export function drawParticles(ctx: Ctx, particles: Particle[]): void {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

/** The airbag going off: a white balloon that inflates and sags. */
export function drawAirbag(ctx: Ctx, t: number): void {
  if (t <= 0 || t >= 1) return;
  const grow = Math.min(1, t * 6);
  const sag = Math.max(0, (t - 0.4) / 0.6);
  ctx.save();
  ctx.globalAlpha = 1 - sag * 0.9;
  ctx.fillStyle = '#f4f4f0';
  ctx.beginPath();
  ctx.ellipse(458, 352 + sag * 30, 46 * grow, 38 * grow * (1 - sag * 0.6), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // powder cloud
  ctx.fillStyle = `rgba(230, 230, 225, ${0.6 * (1 - t)})`;
  ctx.beginPath();
  ctx.arc(470, 330 - t * 40, 60 * t + 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Hydraulic press plate coming down. y: bottom edge of the plate. */
export function drawPress(ctx: Ctx, y: number): void {
  ctx.fillStyle = '#4a4f55';
  ctx.fillRect(250, 0, 22, y - 70);
  ctx.fillRect(758, 0, 22, y - 70);
  ctx.fillStyle = '#c9ced3';
  ctx.fillRect(254, 0, 6, y - 70);
  ctx.fillRect(762, 0, 6, y - 70);
  ctx.fillStyle = '#3a3f45';
  ctx.fillRect(120, y - 70, 790, 70);
  ctx.save();
  ctx.beginPath();
  ctx.rect(120, y - 22, 790, 22);
  ctx.clip();
  for (let x = 100; x < 940; x += 40) {
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 20, y);
    ctx.lineTo(x + 42, y - 22);
    ctx.lineTo(x + 22, y - 22);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
