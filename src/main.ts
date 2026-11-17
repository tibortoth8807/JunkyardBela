import './styles.css';
import { Sounds } from './audio';
import { MAX_MONEY, PARTS, PartId, Teardown } from './game/teardown';
import { DICTS, LANGS, Lang, detectLang, saveLang } from './i18n';
import {
  CONTAINER,
  GROUND,
  H,
  HIT_ORDER,
  PART_GFX,
  Particle,
  W,
  drawAirbag,
  drawBela,
  drawCar,
  drawFlyingPart,
  drawParticles,
  drawPress,
  drawYard,
  hitTest,
  nearTest,
  setBodyStyle,
  BodyStyle,
} from './render/draw';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('game');
const ctx = canvas.getContext('2d')!;
const sounds = new Sounds();

let lang: Lang = detectLang();
let T = DICTS[lang];

let game = new Teardown();
let body: BodyStyle = 'touring';
const partName = (id: PartId) => (id === 'tailgate' && body === 'sedan' ? T.trunkLid : T.parts[id]);
let playing = false;
let startedAt = 0;
let finishedAt = 0;
let hover: PartId | null = null;
let shownMoney = 0;
let swing = 0;
let shock = 0;
let airbagStart = 0;
let pressStart = 0;
let lastQuote = -1;
let bubbleTimer = 0;
let toastTimer = 0;

interface Flying {
  id: PartId;
  start: number;
  broken: boolean;
}
interface Floater {
  text: string;
  x: number;
  y: number;
  start: number;
  color: string;
}
const flying: Flying[] = [];
const floaters: Floater[] = [];
const particles: Particle[] = [];

// ------------------------------------------------------------------ setup

function resize(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();

function newGame(): void {
  game = new Teardown();
  flying.length = 0;
  floaters.length = 0;
  particles.length = 0;
  shownMoney = 0;
  airbagStart = 0;
  pressStart = 0;
  finishedAt = 0;
  startedAt = performance.now();
  playing = true;
  hide('title-screen');
  hide('result-screen');
  say(T.quotes.start);
  renderPanel();
}

// ------------------------------------------------------------------ interaction

function partAt(x: number, y: number): PartId | null {
  if (pressStart) return null;
  const candidates = HIT_ORDER.filter((id) => !game.isRemoved(id) && game.isVisible(id));
  return candidates.find((id) => hitTest(id, x, y)) ?? candidates.find((id) => nearTest(id, x, y)) ?? null;
}

function names(ids: PartId[]): string {
  return ids.map(partName).join(', ');
}

function onClick(x: number, y: number): void {
  if (!playing) return;
  const id = partAt(x, y);
  if (!id) return;
  const result = game.click(id, performance.now());
  switch (result.kind) {
    case 'locked':
      sounds.play('nope');
      say(T.quotes.locked(names(result.missing)));
      toast(T.locked(names(result.missing)));
      break;
    case 'progress':
      sounds.play('wrench');
      swing = 1;
      break;
    case 'removed': {
      swing = 1;
      const [cx, cy] = PART_GFX[id].center;
      flying.push({ id, start: performance.now(), broken: result.broken });
      floaters.push({ text: `+${T.money(result.earned)}`, x: cx, y: cy - 20, start: performance.now(), color: result.broken ? '#ff8a65' : '#3ddc5a' });
      if (result.airbag) {
        sounds.play('bang');
        airbagStart = performance.now();
        shock = 1;
        say(T.quotes.airbag);
      } else if (result.broken) {
        sounds.play('glass');
        burst(cx, cy, ['#e9eff3', '#cfe3f0', '#ffffff', '#b3121f'], 26);
        say(T.quotes.broken);
      } else {
        sounds.play('clunk');
        window.setTimeout(() => sounds.play('cash'), 120);
        if (id === 'engine') say(T.quotes.engine);
        else if (id === 'catalyst') say(T.quotes.catalyst);
        else if (Math.random() < 0.45) sayRandom();
      }
      if (game.allRemoved) {
        window.setTimeout(() => say(T.quotes.done), 900);
      }
      renderPanel();
      break;
    }
    default:
      break;
  }
}

function crush(): void {
  if (!game.allRemoved || pressStart) return;
  pressStart = performance.now();
  sounds.play('crush');
  renderPanel();
  window.setTimeout(() => {
    const earned = game.crush();
    floaters.push({ text: `+${T.money(earned)}`, x: 515, y: 420, start: performance.now(), color: '#3ddc5a' });
    sounds.play('cash');
    burst(515, GROUND - 10, ['#6d5f45', '#8b7b5c', '#3a3f45'], 40);
  }, 1500);
  window.setTimeout(finish, 2300);
}

function finish(): void {
  playing = false;
  finishedAt = performance.now();
  sounds.play('win');
  say(T.quotes.crushed);
  const banner = $('banner');
  $('banner-main').textContent = T.doneBanner;
  $('banner-sub').textContent = `${T.respect}`;
  banner.classList.remove('visible');
  void banner.offsetWidth;
  banner.classList.add('visible');
  writeResult();
  window.setTimeout(() => show('result-screen'), 2600);
}

function rating(): string {
  const ratio = game.money / MAX_MONEY;
  return T.ratings[ratio >= 0.98 ? 0 : ratio >= 0.85 ? 1 : 2];
}

function writeResult(): void {
  if (!finishedAt) return;
  const seconds = Math.round((finishedAt - startedAt) / 1000);
  let text = T.resultText(T.money(game.money), fmtTime(seconds), game.brokenCount);
  if (game.airbagFired) text += ` ${T.airbagNote}`;
  $('result-text').textContent = text;
  $('result-rating').textContent = rating();
  $('share-text').textContent = [
    `🔧 ${T.docTitle}`,
    `💰 ${T.money(game.money)} · ⏱️ ${fmtTime(seconds)}`,
    `🏅 ${rating()}`,
    location.href.split('#')[0].split('?')[0],
  ].join('\n');
}

// ------------------------------------------------------------------ HUD

function say(text: string): void {
  const bubble = $('bubble');
  bubble.textContent = text;
  bubble.classList.add('visible');
  window.clearTimeout(bubbleTimer);
  bubbleTimer = window.setTimeout(() => bubble.classList.remove('visible'), 3600);
}

function sayRandom(): void {
  let i = Math.floor(Math.random() * T.quotes.removed.length);
  if (i === lastQuote) i = (i + 1) % T.quotes.removed.length;
  lastQuote = i;
  say(T.quotes.removed[i]);
}

function toast(text: string): void {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('visible'), 2200);
}

function renderPanel(): void {
  $('hint').textContent = game.allRemoved && !game.crushed ? T.hintDone : T.hint;
  const press = $<HTMLButtonElement>('btn-press');
  press.textContent = T.press;
  press.disabled = !playing || !game.allRemoved || pressStart > 0;
  $('btn-restart').textContent = T.restart;
}

function updateTip(clientX: number, clientY: number): void {
  const tip = $('tip');
  if (!hover || !playing) {
    tip.classList.remove('visible');
    return;
  }
  const missing = game.missing(hover);
  const def = PARTS.find((p) => p.id === hover)!;
  tip.innerHTML = '';
  tip.append(`${partName(hover)} · ${T.money(def.price)}`);
  if (missing.length) {
    const small = document.createElement('small');
    small.textContent = T.locked(names(missing));
    tip.append(small);
  }
  tip.classList.toggle('locked', missing.length > 0);
  const rect = $('stage').getBoundingClientRect();
  tip.style.left = `${clientX - rect.left}px`;
  tip.style.top = `${clientY - rect.top}px`;
  tip.classList.add('visible');
}

function burst(x: number, y: number, colors: string[], count: number): void {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 220;
    particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 120, life: 1, color: colors[i % colors.length], size: 3 + Math.random() * 4 });
  }
}

const show = (id: string) => $(id).classList.remove('hidden');
const hide = (id: string) => $(id).classList.add('hidden');
const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// ------------------------------------------------------------------ frame

let lastFrame = performance.now();

function frame(now: number): void {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  swing = Math.max(0, swing - dt * 3.5);
  shock = Math.max(0, shock - dt * 0.7);

  drawYard(ctx, now);

  // the press squashes the bare shell
  let squash = 1;
  let plateY = -40;
  if (pressStart) {
    const t = Math.min(1, (now - pressStart) / 1500);
    const down = t < 0.75 ? t / 0.75 : 1;
    plateY = -40 + (GROUND - 46 + 40) * down;
    squash = Math.max(0.2, Math.min(1, (GROUND - plateY) / (GROUND - 284)));
    if (t >= 1) {
      const up = Math.min(1, (now - pressStart - 1500) / 800);
      plateY = GROUND - 46 - up * (GROUND + 40);
      squash = 0.22;
    }
  }

  drawCar(ctx, {
    present: (id) => !game.isRemoved(id),
    visible: (id) => game.isVisible(id),
    broken: (id) => game.isBroken(id),
    hover,
    hoverLocked: hover ? game.missing(hover).length > 0 : false,
    progress: (id) => game.progress(id),
    squash,
  });
  if (airbagStart) drawAirbag(ctx, (now - airbagStart) / 1600);

  // parts flying into the container (drawn above the car, below the container lip)
  for (let i = flying.length - 1; i >= 0; i--) {
    const f = flying[i];
    const t = (now - f.start) / 750;
    if (t >= 1) {
      flying.splice(i, 1);
      continue;
    }
    drawFlyingPart(ctx, f.id, t, f.broken);
  }
  ctx.fillStyle = '#244a70';
  ctx.fillRect(CONTAINER.x - 4, CONTAINER.y - 6, CONTAINER.w + 8, 9);

  if (pressStart) drawPress(ctx, plateY);

  // particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vy += 600 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt * 1.2;
    if (p.life <= 0 || p.y > H) particles.splice(i, 1);
  }
  drawParticles(ctx, particles);

  drawBela(ctx, now, swing, shock);

  // money floaters
  ctx.textAlign = 'center';
  ctx.font = '900 24px "Arial Black", Impact, sans-serif';
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#000';
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    const t = (now - f.start) / 1300;
    if (t >= 1) {
      floaters.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = 1 - t * t;
    ctx.strokeText(f.text, f.x, f.y - t * 60);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y - t * 60);
  }
  ctx.globalAlpha = 1;

  // rolling GTA-style counter
  if (shownMoney < game.money) {
    const step = Math.max(37, (game.money - shownMoney) * dt * 4);
    shownMoney = Math.min(game.money, shownMoney + step);
    $('money').classList.add('bump');
  } else {
    $('money').classList.remove('bump');
  }
  $('money').textContent = T.counter(shownMoney);
  const elapsed = playing ? (now - startedAt) / 1000 : finishedAt ? (finishedAt - startedAt) / 1000 : 0;
  $('timer').textContent = fmtTime(Math.floor(elapsed));
  $('count').textContent = `${T.partsLabel}: ${game.removedCount}/${PARTS.length}`;

  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ input

function canvasPoint(e: PointerEvent | MouseEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
}

canvas.addEventListener('pointerdown', (e) => {
  sounds.unlock();
  const { x, y } = canvasPoint(e);
  onClick(x, y);
  if (e.pointerType === 'mouse') {
    hover = partAt(x, y);
    updateTip(e.clientX, e.clientY);
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  const { x, y } = canvasPoint(e);
  hover = partAt(x, y);
  canvas.style.cursor = hover ? 'pointer' : 'default';
  updateTip(e.clientX, e.clientY);
});
canvas.addEventListener('pointerleave', () => {
  hover = null;
  $('tip').classList.remove('visible');
});

window.addEventListener('resize', resize);

$('btn-start').addEventListener('click', () => {
  sounds.unlock();
  sounds.play('click');
  newGame();
});
$('btn-press').addEventListener('click', crush);
/** Back to the title card, where the body style can be changed for the next car. */
function toTitle(): void {
  sounds.play('click');
  playing = false;
  game = new Teardown();
  pressStart = 0;
  airbagStart = 0;
  shownMoney = 0;
  flying.length = 0;
  floaters.length = 0;
  hide('result-screen');
  show('title-screen');
  renderPanel();
}
$('btn-restart').addEventListener('click', toTitle);
$('btn-again').addEventListener('click', toTitle);
$('btn-share').addEventListener('click', async () => {
  const text = $('share-text').textContent ?? '';
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
  } catch {
    // fall back to the clipboard
  }
  try {
    await navigator.clipboard.writeText(text);
    toast(T.copied);
  } catch {
    toast(T.shareFailed);
  }
});
$('btn-sound').addEventListener('click', () => {
  sounds.muted = !sounds.muted;
  $('btn-sound').textContent = sounds.muted ? '🔇' : '🔊';
});

function applyLang(next: Lang): void {
  lang = next;
  T = DICTS[lang];
  saveLang(lang);
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = T[el.dataset.i18n as 'title'];
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-body]').forEach((el) => {
    el.textContent = T.bodies[el.dataset.i18nBody as BodyStyle];
  });
  document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.lang === lang);
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  });
  $('btn-sound').title = T.soundTitle;
  $('bubble').classList.remove('visible');
  writeResult();
  renderPanel();
}

document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach((button) =>
  button.addEventListener('click', () => {
    if (LANGS.includes(button.dataset.lang as Lang)) applyLang(button.dataset.lang as Lang);
  }),
);

function applyBody(next: BodyStyle): void {
  body = next;
  setBodyStyle(body);
  document.querySelectorAll<HTMLButtonElement>('.body-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.body === body);
    b.setAttribute('aria-checked', String(b.dataset.body === body));
  });
}
document.querySelectorAll<HTMLButtonElement>('.body-btn').forEach((button) =>
  button.addEventListener('click', () => {
    sounds.play('click');
    applyBody(button.dataset.body as BodyStyle);
  }),
);

applyBody(body);
applyLang(lang);
requestAnimationFrame(frame);

// read-only hook for automated browser tests
(window as unknown as { __bela: unknown }).__bela = { game: () => game, gfx: PART_GFX, body: () => body };
