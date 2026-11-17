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
export const SILL = 466;
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
    'M150,458 L148,430 Q148,416 158,411 Q210,397 367,382 L472,304 Q530,284 610,282 L650,282 Q690,284 718,300 L784,366 L860,370 Q876,372 878,386 L881,458 Q881,466 871,466 L160,466 Q150,466 150,458 Z',
  ),
  touring: poly(
    'M150,458 L148,430 Q148,416 158,411 Q210,397 367,382 L472,304 Q530,284 610,282 L812,284 Q846,288 858,304 L878,384 L881,458 Q881,466 871,466 L160,466 Q150,466 150,458 Z',
  ),
};
const QUARTER_WINDOWS: Record<BodyStyle, Path2D> = {
  sedan: poly('M692,306 L712,306 Q736,330 748,360 L736,384 L692,384 Z'),
  touring: poly('M692,306 L808,292 Q832,294 840,310 L850,362 L836,384 L692,384 Z'),
};
let bodyStyle: BodyStyle = 'touring';
const FRONT_OPENING = poly('M372,386 L470,306 L574,302 L576,464 L380,464 Q372,430 372,386 Z');
const REAR_OPENING = poly('M578,302 L686,302 L690,384 L684,404 Q656,420 652,464 L578,464 Z');
const BAY = poly('M160,412 Q214,404 369,393 L369,446 L176,446 Z');

export const WHEEL_X = { front: 280, rear: 710 };
export const WHEEL_Y = 452;
const WHEEL_R = 50;

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
      circle(ctx, cx, WHEEL_Y, 32, '#b8bec5');
      circle(ctx, cx, WHEEL_Y, 28, '#6d737a');
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
  const path = poly('M846,292 Q858,296 864,310 L880,386 L866,388 L852,322 Q848,304 840,298 Z');
  return {
    id: 'tailgate' as PartId,
    path,
    center: [862, 345] as [number, number],
    draw(ctx: Ctx) {
      fill(ctx, path, paint(ctx));
      outline(ctx, path);
      fill(ctx, poly('M850,300 Q858,304 861,314 L866,340 L858,340 L852,312 Z'), GLASS);
    },
  };
})();

const TRUNK_LID: PartGfx = (() => {
  const path = poly('M778,362 L860,366 Q876,368 878,384 L876,390 L784,386 Z');
  return {
    id: 'tailgate' as PartId,
    path,
    center: [830, 377] as [number, number],
    draw(ctx: Ctx) {
      fill(ctx, path, paint(ctx, 362, 392));
      outline(ctx, path);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(786, 366);
      ctx.lineTo(866, 370);
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
    const window = poly('M386,384 L470,312 L566,308 L566,384 Z');
    return {
      id: 'frontDoor' as PartId,
      path,
      center: [480, 400] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, paint(ctx));
        glassWindow(ctx, window, 520);
        outline(ctx, path);
        fill(ctx, rr(536, 396, 24, 5, 2), '#b9c0c6');
        fill(ctx, poly('M380,424 L576,423 L576,431 L382,432 Z'), '#141617');
      },
    };
  })(),

  rearDoor: (() => {
    const path = REAR_OPENING;
    const window = poly('M586,308 L684,306 L686,384 L586,384 Z');
    return {
      id: 'rearDoor' as PartId,
      path,
      center: [625, 400] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, paint(ctx));
        glassWindow(ctx, window, 650);
        outline(ctx, path);
        fill(ctx, rr(648, 396, 22, 5, 2), '#b9c0c6');
        fill(ctx, poly('M578,423 L668,422 L662,430 L578,431 Z'), '#141617');
      },
    };
  })(),

  hood: (() => {
    const path = poly('M158,409 Q210,397 367,382 L369,393 Q214,404 160,412 Z');
    return {
      id: 'hood' as PartId,
      path,
      center: [262, 398] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, paint(ctx, 380, 422));
        outline(ctx, path);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(166, 410);
        ctx.quadraticCurveTo(220, 399, 360, 385);
        ctx.stroke();
      },
    };
  })(),

  tailgate: TAILGATE_TOURING,

  mirror: (() => {
    const path = poly('M374,366 L400,362 L402,381 L378,384 Z');
    return {
      id: 'mirror' as PartId,
      path,
      center: [388, 373] as [number, number],
      draw(ctx: Ctx, broken: boolean) {
        fill(ctx, path, paint(ctx, 362, 384));
        outline(ctx, path);
        fill(ctx, rr(377, 368, 8, 12, 2), '#a9c0cf');
        if (broken) crack(ctx, 381, 374, 7);
      },
    };
  })(),

  headlight: (() => {
    // the typical quad round lamps behind one wide lens, wrapping round the corner
    const path = poly('M152,417 L204,408 L206,421 L156,428 Z');
    return {
      id: 'headlight' as PartId,
      path,
      center: [178, 419] as [number, number],
      draw(ctx: Ctx, broken: boolean) {
        fill(ctx, path, '#1d2125');
        for (const [x, y] of [[164, 421], [180, 419], [195, 416]] as [number, number][]) {
          circle(ctx, x, y, 5.2, '#e9eff3');
          circle(ctx, x, y, 2.4, '#fff8d6');
        }
        fill(ctx, poly('M154,418 L203,409 L204,412 L155,421 Z'), 'rgba(255,255,255,0.35)');
        fill(ctx, poly('M196,424 L205,422 L205,426 L197,428 Z'), '#e88a1a');
        if (broken) crack(ctx, 178, 419, 12);
      },
    };
  })(),

  taillight: (() => {
    const path = poly('M826,384 L876,382 L878,400 L830,402 Z');
    return {
      id: 'taillight' as PartId,
      path,
      center: [852, 392] as [number, number],
      draw(ctx: Ctx, broken: boolean) {
        fill(ctx, path, '#b3121f');
        fill(ctx, poly('M850,383 L863,383 L864,401 L851,401 Z'), '#e88a1a');
        fill(ctx, poly('M828,385 L874,384 L874,388 L829,389 Z'), 'rgba(255,255,255,0.3)');
        if (broken) crack(ctx, 852, 392, 9);
      },
    };
  })(),

  frontBumper: (() => {
    const path = poly('M148,431 L216,426 L218,470 L156,470 Q146,458 148,431 Z');
    return {
      id: 'frontBumper' as PartId,
      path,
      center: [182, 448] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, paint(ctx, 424, 470));
        fill(ctx, rr(148, 437, 70, 7, 2), '#141617');
        fill(ctx, rr(160, 454, 46, 8, 3), '#111214');
        outline(ctx, path);
      },
    };
  })(),

  rearBumper: (() => {
    const path = poly('M834,418 L880,416 L883,470 L844,470 Z');
    return {
      id: 'rearBumper' as PartId,
      path,
      center: [860, 444] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, paint(ctx, 416, 470));
        fill(ctx, rr(836, 428, 47, 7, 2), '#141617');
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
    const path = rr(320, 398, 36, 25, 3);
    return {
      id: 'battery' as PartId,
      path,
      center: [338, 410] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, '#1b1c1f');
        fill(ctx, rr(320, 398, 36, 6, 2), '#2d2f33');
        fill(ctx, rr(324, 394, 7, 5, 1), '#c0392b');
        fill(ctx, rr(345, 394, 7, 5, 1), '#2c3e50');
        fill(ctx, rr(325, 408, 26, 9, 2), '#3a7bd5');
      },
    };
  })(),

  radiator: (() => {
    const path = rr(176, 418, 17, 28, 2);
    return {
      id: 'radiator' as PartId,
      path,
      center: [184, 432] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, '#8f969d');
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1;
        for (let y = 421; y < 445; y += 4) {
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
    path.roundRect(205, 412, 108, 34, 6);
    path.roundRect(212, 404, 94, 10, 4);
    return {
      id: 'engine' as PartId,
      path,
      center: [259, 428] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, rr(205, 412, 108, 34, 6), '#5f666d');
        fill(ctx, rr(212, 404, 94, 10, 4), '#b9bfc5');
        ctx.fillStyle = '#3b4046';
        for (let i = 0; i < 6; i++) ctx.fillRect(218 + i * 15, 416, 9, 12);
        fill(ctx, rr(212, 432, 94, 10, 4), '#4a5056');
        circle(ctx, 300, 437, 7, '#2b2f34');
        circle(ctx, 300, 437, 3, '#8a9096');
      },
    };
  })(),

  gearbox: (() => {
    const path = poly('M298,422 L358,420 L362,446 L302,446 Z');
    return {
      id: 'gearbox' as PartId,
      path,
      center: [330, 434] as [number, number],
      draw(ctx: Ctx) {
        fill(ctx, path, '#8b8f86');
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 2;
        for (let x = 312; x < 358; x += 10) {
          ctx.beginPath();
          ctx.moveTo(x, 422);
          ctx.lineTo(x + 1, 444);
          ctx.stroke();
        }
      },
    };
  })(),

  steering: (() => {
    const path = new Path2D();
    path.ellipse(448, 356, 9, 26, -0.4, 0, Math.PI * 2);
    return {
      id: 'steering' as PartId,
      path,
      center: [448, 356] as [number, number],
      draw(ctx: Ctx) {
        ctx.strokeStyle = '#2a2b2e';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(448, 356);
        ctx.lineTo(418, 376);
        ctx.stroke();
        ctx.strokeStyle = '#111214';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.ellipse(448, 356, 9, 26, -0.4, 0, Math.PI * 2);
        ctx.stroke();
        circle(ctx, 448, 356, 8, '#2f3135');
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
  for (const x of [WHEEL_X.front, WHEEL_X.rear]) circle(ctx, x, WHEEL_Y, 60, '#0b0b0c');
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
    // raked rear window seen edge-on, and the short boot deck behind it
    fill(ctx, poly('M712,298 Q716,296 720,300 L784,365 L772,364 L708,302 Z'), GLASS);
  }
  // window surrounds and B pillar (satin black)
  fill(ctx, poly('M570,302 L582,302 L582,384 L570,384 Z'), '#0f1513');
  ctx.strokeStyle = '#0f1513';
  ctx.lineWidth = 2.5;
  ctx.stroke(QUARTER_WINDOWS[bodyStyle]);
  // shoulder line and the black side rubbing strip
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(214, 408);
  ctx.lineTo(878, 392);
  ctx.stroke();
  fill(ctx, poly('M340,425 L380,424 L382,432 L342,433 Z'), '#141617');
  fill(ctx, poly('M768,422 L836,420 L836,428 L770,429 Z'), '#141617');
  // fuel flap
  outline(ctx, rr(744, 396, 20, 18, 3), 'rgba(0,0,0,0.35)', 1.2);
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
    fill(ctx, poly('M372,386 L428,366 L438,406 L380,414 Z'), '#24262a');
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
