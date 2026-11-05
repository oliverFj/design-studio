import test from 'node:test';
import assert from 'node:assert/strict';
import { animateStandard, animateThemed, STANDARD_MOTION } from '../core/components.mjs';
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
  assert.equal(animateThemed(element, []), null);
  assert.equal(animateThemed({}, []), null);
});

test('opt-in theme motion reads inherited timing, accepts overshoot, and leaves standard motion unchanged',()=>{
 const values={'--ds-duration-expressive':'.29s','--ds-motion-curve-x1':'.2','--ds-motion-curve-y1':'.8','--ds-motion-curve-x2':'.3','--ds-motion-curve-y2':'1.12'};
 const calls=[];
 const element={ownerDocument:{defaultView:{getComputedStyle:()=>({getPropertyValue:key=>values[key]??''})}},animate(frames,options){calls.push(options);return options;}};
 assert.deepEqual(animateThemed(element,[]),{duration:290,easing:'cubic-bezier(0.2,0.8,0.3,1.12)'});
 assert.deepEqual(animateStandard(element,[]),STANDARD_MOTION);
 values['--ds-duration-expressive']='bad';values['--ds-motion-curve-x1']='3';
 assert.deepEqual(animateThemed(element,[]),STANDARD_MOTION);
 values['--ds-duration-expressive']='50s';
 assert.equal(animateThemed(element,[]).duration,1000);
});
