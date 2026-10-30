import test from 'node:test';
import assert from 'node:assert/strict';
import { animateStandard, STANDARD_MOTION } from '../core/components.mjs';
import { PROJECT_RUNTIME } from '../tools/doctor.mjs';

test('shared motion uses the same timing for expansion and restoration and is exported to products', () => {
  const calls = [];
  const effect = { finished: Promise.resolve() };
  const element = { animate(frames, options) { calls.push({ frames, options }); return effect; } };
  const opening = [{ height: '0px' }, { height: '200px' }];
  assert.equal(animateStandard(element, opening), effect);
  animateStandard(element, [...opening].reverse(), { fill: 'both' });
  assert.equal(calls[0].options.duration, STANDARD_MOTION.duration);
  assert.equal(calls[1].options.duration, calls[0].options.duration);
  assert.equal(calls[1].options.easing, calls[0].options.easing);
  assert.equal(calls[0].options.delay ?? 0, 0);
  assert.ok(PROJECT_RUNTIME.some(([source]) => source === 'core/motion.mjs'));
});

test('reduced motion and unavailable animation support leave the final layout immediately visible', () => {
  let started = false;
  const element = {
    ownerDocument: { defaultView: { matchMedia: () => ({ matches: true }) } },
    animate() { started = true; },
  };
  assert.equal(animateStandard(element, [{ opacity: 0 }, { opacity: 1 }]), null);
  assert.equal(started, false);
  assert.equal(animateStandard({}, []), null);
});
