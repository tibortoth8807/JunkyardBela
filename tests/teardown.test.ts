import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AIRBAG_FIRED_PRICE, BROKEN_FACTOR, MAX_MONEY, PARTS, PART_BY_ID, PartId, SCRAP_PRICE, Teardown } from '../src/game/teardown';

/** Clicks a part slowly until it comes off. */
function strip(t: Teardown, id: PartId, clock: { now: number }) {
  let result = t.click(id, (clock.now += 1000));
  while (result.kind === 'progress') result = t.click(id, (clock.now += 1000));
  return result;
}

test('a part needs all of its bolts before it comes off and pays its price', () => {
  const t = new Teardown();
  const clock = { now: 0 };
  for (let i = 1; i < PART_BY_ID.wheelFront.clicks; i++) {
    assert.equal(t.click('wheelFront', (clock.now += 1000)).kind, 'progress');
  }
  const result = t.click('wheelFront', (clock.now += 1000));
  assert.deepEqual(result, { kind: 'removed', earned: 25_000, broken: false, airbag: false });
  assert.equal(t.money, 25_000);
  assert.equal(t.click('wheelFront', (clock.now += 1000)).kind, 'done');
});

test('hidden parts cannot be clicked until their cover is off', () => {
  const t = new Teardown();
  const clock = { now: 0 };
  assert.equal(t.click('engine', 0).kind, 'hidden');
  assert.equal(t.isVisible('engine'), false);
  strip(t, 'hood', clock);
  assert.equal(t.isVisible('engine'), true);
});

test('locked parts report what has to come off first', () => {
  const t = new Teardown();
  const clock = { now: 0 };
  strip(t, 'hood', clock);
  assert.deepEqual(t.click('radiator', (clock.now += 1000)), { kind: 'locked', missing: ['frontBumper'] });
  assert.deepEqual(t.click('engine', (clock.now += 1000)), { kind: 'locked', missing: ['radiator'] });
  assert.deepEqual(t.click('frontDoor', (clock.now += 1000)), { kind: 'locked', missing: ['mirror'] });
  strip(t, 'frontBumper', clock);
  assert.equal(strip(t, 'radiator', clock).kind, 'removed');
  assert.equal(strip(t, 'engine', clock).kind, 'removed');
  assert.equal(t.isVisible('gearbox'), true);
});

test('rushing a fragile part cracks it and pays only a fraction', () => {
  const t = new Teardown();
  t.click('headlight', 1000);
  const result = t.click('headlight', 1100);
  assert.deepEqual(result, { kind: 'removed', earned: Math.round(22_000 * BROKEN_FACTOR), broken: true, airbag: false });
  assert.equal(t.isBroken('headlight'), true);
  assert.equal(t.brokenCount, 1);
});

test('slow clicks keep fragile parts intact; sturdy parts do not care about speed', () => {
  const t = new Teardown();
  t.click('mirror', 1000);
  assert.equal((t.click('mirror', 1400) as { broken: boolean }).broken, false);
  for (let i = 0; i < 4; i++) t.click('frontBumper', 2000 + i * 10);
  assert.equal(t.isBroken('frontBumper'), false);
  assert.equal(t.isRemoved('frontBumper'), true);
});

test('pulling the steering wheel with the battery connected fires the airbag', () => {
  const t = new Teardown();
  const clock = { now: 0 };
  strip(t, 'mirror', clock);
  strip(t, 'frontDoor', clock);
  const result = strip(t, 'steering', clock);
  assert.deepEqual(result, { kind: 'removed', earned: AIRBAG_FIRED_PRICE, broken: true, airbag: true });
  assert.equal(t.airbagFired, true);
});

test('with the battery out first, the steering wheel keeps its value', () => {
  const t = new Teardown();
  const clock = { now: 0 };
  for (const id of ['hood', 'battery', 'mirror', 'frontDoor'] as PartId[]) strip(t, id, clock);
  const result = strip(t, 'steering', clock);
  assert.deepEqual(result, { kind: 'removed', earned: 25_000, broken: false, airbag: false });
});

test('the press only takes the bare shell, once, and a perfect teardown earns the maximum', () => {
  const t = new Teardown();
  const clock = { now: 0 };
  assert.equal(t.crush(), 0);
  // remove everything in a valid order: keep going until nothing is left
  let guard = 0;
  while (!t.allRemoved && guard++ < 100) {
    for (const p of PARTS) {
      if (t.isRemoved(p.id) || !t.isVisible(p.id) || t.missing(p.id).length) continue;
      if (p.id === 'steering' && !t.isRemoved('battery')) continue;
      strip(t, p.id, clock);
    }
  }
  assert.equal(t.allRemoved, true);
  assert.equal(t.crush(), SCRAP_PRICE);
  assert.equal(t.crush(), 0);
  assert.equal(t.money, MAX_MONEY);
});

test('every prerequisite and cover refers to a real part, with no cycles', () => {
  const ids = new Set(PARTS.map((p) => p.id));
  for (const p of PARTS) for (const r of [...p.requires, ...p.hiddenBy]) assert.ok(ids.has(r), `${p.id} -> ${r}`);
  const visiting = new Set<PartId>();
  const visit = (id: PartId) => {
    assert.ok(!visiting.has(id), `cycle at ${id}`);
    visiting.add(id);
    for (const r of [...PART_BY_ID[id].requires, ...PART_BY_ID[id].hiddenBy]) visit(r);
    visiting.delete(id);
  };
  for (const p of PARTS) visit(p.id);
});
