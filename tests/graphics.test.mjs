import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GRAPHIC_FAMILIES, GRAPHIC_MOTIFS, GRAPHIC_MOTION, getGraphicFamily, getGraphicParts, renderGraphic, createGraphic, createGraphicRenderer, mountGraphicMotion, createImageExamples } from '../core/components.mjs';
import { resolveThemeMode } from '../core/theme-modes.mjs';
import { dom } from './support/dom.mjs';
import {COMPONENT_LIBRARY} from '../core/library.mjs';

const load = id => JSON.parse(readFileSync(new URL('../packages/' + id + '.json', import.meta.url), 'utf8'));
const theme = (id = 'studio-light', mode = 'light') => resolveThemeMode(load(id), mode);
const ids = source => [...source.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const namespace = 'http://www.w3.org/2000/svg';

function nativeDocument({ reduced = false, cssDuration = '' } = {}) {
  const document = dom(), effects = [], scheduled = new Map(), preferenceListeners = new Set(), documentListeners = new Map();
  let frameId = 0, now = 0;
  const preference = { matches: reduced, addEventListener(type, callback) { preferenceListeners.add(callback); }, removeEventListener(type, callback) { preferenceListeners.delete(callback); } };
  const view = {
    matchMedia: () => preference,
    getComputedStyle: () => ({ getPropertyValue: name => name === '--ds-duration-illustration' ? cssDuration : '' }),
    performance: { now: () => now },
    requestAnimationFrame(callback) { const id = ++frameId; scheduled.set(id, callback); return id; },
    cancelAnimationFrame(id) { scheduled.delete(id); }
  };
  document.defaultView = view;
  document.addEventListener = (type, callback) => { if (!documentListeners.has(type)) documentListeners.set(type, new Set()); documentListeners.get(type).add(callback); };
  document.removeEventListener = (type, callback) => documentListeners.get(type)?.delete(callback);
  document.createElementNS = (ns, tag) => {
    const node = document.createElement(tag); node.namespaceURI = ns;
    // The motion plans use SVG tag/attribute lists and direct-child selectors.
    // Extend this fixture locally so those selections match a browser's DOM.
    const matches=(element,selector)=>{
      const match=/^(\*|[\w-]+)?(\[[^\]]+\])?$/.exec(selector.trim());
      return Boolean(match)&&( !match[1]||match[1]==='*'||element.tagName.toLowerCase()===match[1])&&(!match[2]||element.matches(match[2]));
    };
    node.querySelectorAll=selector=>{
      const descendants=element=>element.children.flatMap(child=>[child,...descendants(child)]);
      const all=descendants(node);
      return [...new Set(selector.split(',').flatMap(branch=>{
        const tokens=branch.trim().split(/\s*>\s*/);
        if(tokens.length===1)return all.filter(element=>matches(element,tokens[0]));
        return all.filter(element=>matches(element,tokens.at(-1))&&(tokens[0]===':scope'?element.parentNode===node:matches(element.parentNode,tokens[0])));
      }))];
    };
    node.querySelector=selector=>node.querySelectorAll(selector)[0]??null;
    node.before = other => node.parentNode.insertBefore(other, node);
    node.animate = (frames, options) => {
      const effect = { target: node, frames, options, currentTime: null, paused: false, cancelled: false, pause() { this.paused = true; }, cancel() { this.cancelled = true; } };
      effects.push(effect); return effect;
    };
    if (['path', 'line', 'rect', 'circle', 'ellipse', 'polyline', 'polygon'].includes(tag)) {
      node.getTotalLength = () => 100;
      node.getPointAtLength = at => ({ x: at * 3, y: 100 + at });
    }
    return node;
  };
  return {
    document, effects, scheduled, preferenceListeners, documentListeners,
    advance(value) { now = value; const callbacks = [...scheduled.values()]; scheduled.clear(); callbacks.forEach(callback => callback(now)); },
    cssDuration(value) { cssDuration = value; },
    systemReduced(value) { preference.matches = value; preferenceListeners.forEach(callback => callback()); }
  };
}

test('shared graphics cover every component role and all four editorial motifs in every family', () => {
  const pack = theme(), before = JSON.stringify(pack);
  const renderer=createGraphicRenderer(pack);
  assert.equal(GRAPHIC_FAMILIES.length, 4); assert.equal(GRAPHIC_MOTIFS.length, Object.keys(COMPONENT_LIBRARY).length + 4);
  assert.deepEqual(GRAPHIC_MOTIFS.slice(4).map(item=>item.id).sort(),Object.keys(COMPONENT_LIBRARY).sort());
  assert.doesNotMatch(JSON.stringify(GRAPHIC_FAMILIES), /Agent|konkurrence|review/i);
  for (const family of GRAPHIC_FAMILIES) {
    assert.ok(GRAPHIC_MOTION[family.id].interactionHint);
    for (const motif of GRAPHIC_MOTIFS) {
      const svg = renderer.render(motif.id, { family: family.id, resolved: true });
      assert.match(svg, /viewBox="0 0 600 420"/);
      assert.match(svg, new RegExp(`data-family="${family.id}"`));
      assert.match(svg, new RegExp(`data-motif="${motif.id}"`));
      assert.match(svg, /role="img" aria-labelledby="[^"]+-title"/);
      assert.doesNotMatch(svg, /var\(|<script|onload=|href=|<foreignObject|<image/);
      const identifiers = ids(svg);
      assert.equal(new Set(identifiers).size, identifiers.length, family.id + '/' + motif.id);
      for (const [, reference] of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(identifiers.includes(reference), reference);
      const parts = getGraphicParts(pack, motif.id, { family: family.id });
      assert.ok(parts.length);
      assert.equal(new Set(parts.map(part => part.key)).size, parts.length);
      for (const part of parts) { assert.ok(part.name && part.purpose); assert.ok(svg.includes(`data-part="${part.key}"`)); }
    }
  }
  const first = ids(renderGraphic(pack, 'poster')), second = ids(renderGraphic(pack, 'poster'));
  assert.ok(first.every(id => !second.includes(id)));
  assert.equal(JSON.stringify(pack), before);
});

test('live graphics bind inherited illustration tokens and resolved exports use the actual theme values', () => {
  const pack = theme(); pack.graphics = { family: 'fieldlines' };
  pack.tokens['color.illustration.subject'].$value = '#123456';
  pack.tokens['duration.illustration'].$value = '1.75s';
  const live = renderGraphic(pack, 'focus');
  assert.match(live, /--g-subject:var\(--ds-color-illustration-subject,#123456\)/);
  assert.match(live, /--g-line-width:var\(--ds-illustration-material-lineWidth,/);
  assert.match(live, /--g-depth-opacity:var\(--ds-illustration-material-depthOpacity,/);
  assert.match(live, /data-motion-duration="1750"/);
  const resolved = renderGraphic(pack, 'focus', { resolved: true });
  assert.match(resolved, /stroke="#123456"/); assert.doesNotMatch(resolved, /var\(/);
  const light = renderGraphic(theme('nocturne', 'light'), 'poster', { family: 'lightroom', resolved: true });
  const dark = renderGraphic(theme('nocturne', 'dark'), 'poster', { family: 'lightroom', resolved: true });
  assert.notEqual(light.match(/--g-ground:([^;]+)/)[1], dark.match(/--g-ground:([^;]+)/)[1]);
  delete pack.graphics;
  assert.equal(getGraphicFamily(pack), 'anatomy');
  assert.match(renderGraphic(pack, 'image', { family: 'passage', idPrefix: '"><script>alert(1)</script>' }), /data-family="passage"/);
  assert.doesNotMatch(renderGraphic(pack, 'image', { idPrefix: '"><script>' }), /<script/);
  assert.throws(() => renderGraphic(pack, 'constructor'), /Unknown shared graphic motif/);
  assert.throws(() => renderGraphic(pack, 'image', { family: 'constructor' }), /Unknown shared graphic family/);
  assert.throws(() => getGraphicFamily({ graphics: { family: 'unknown' } }), /Unknown shared graphic family/);
  pack.tokens['color.illustration.subject'].$value = 'red; background:url(unsafe)';
  assert.throws(() => renderGraphic(pack, 'image', { resolved: true }), /Invalid design package/);
});

test('native graphics preserve the SVG namespace, named parts, title policy and clip references without innerHTML', () => {
  const { document } = nativeDocument(), pack = theme();
  const renderer=createGraphicRenderer(pack);
  for (const family of GRAPHIC_FAMILIES) for (const motif of GRAPHIC_MOTIFS) {
    const svg = renderer.create(motif.id, { family: family.id, idPrefix: 'native-' + family.id + '-' + motif.id }, { document });
    assert.equal(svg.namespaceURI, namespace);
    assert.equal(svg.querySelector('title').getAttribute('id'), svg.getAttribute('aria-labelledby'));
    for (const part of getGraphicParts(pack, motif.id, { family: family.id })) assert.ok(svg.querySelector(`[data-part="${part.key}"]`));
    const walk = node => { assert.equal(node.namespaceURI, namespace); node.children.forEach(child => { if (child.tagName !== '#TEXT') walk(child); }); };
    walk(svg);
  }
  const decorative = createGraphic(pack, 'image', { document, decorative: true });
  assert.equal(decorative.getAttribute('aria-hidden'), 'true'); assert.equal(decorative.querySelector('title'), null); assert.equal(decorative.getAttribute('aria-labelledby'), null);
  assert.throws(() => createGraphic(pack, 'focus', {}, { document: {} }), /DOM document/);
});

test('every catalog illustration has finite motion, seeking, reverse playback and clean teardown',()=>{
 const fixture=nativeDocument(),renderer=createGraphicRenderer(theme());
 for(const family of GRAPHIC_FAMILIES)for(const {id} of GRAPHIC_MOTIFS){
  const svg=renderer.create(id,{family:family.id},{document:fixture.document});fixture.document.body.append(svg);
  const controller=mountGraphicMotion(svg),before=fixture.effects.length;
  assert.equal(controller.state.playing,false,family.id+'/'+id+' mounts passively');
  controller.seek(.4);
  assert.ok(fixture.effects.length>before,family.id+'/'+id+' defines animated layers');
  assert.equal(controller.state.progress,.4);
  controller.play(true);
  assert.equal(controller.state.direction,-1);
  controller.settle();
  assert.equal(controller.state.progress,1);
  controller.destroy();
  assert.equal(svg.querySelector('[data-motion-helper]'),null,family.id+'/'+id+' removes helper geometry');
  assert.equal(svg.getAttribute('tabindex'),null);
  svg.remove();
 }
 assert.equal(fixture.scheduled.size,0);
 assert.equal(fixture.preferenceListeners.size,0);
});

test('component image examples use the selected family and resolved offline graphics', () => {
  const pack = theme(); pack.graphics = { family: 'passage' };
  const images = createImageExamples(pack);
  assert.equal(images.length, 4);
  assert.deepEqual(createImageExamples(pack), images, 'isolated image documents keep deterministic URLs');
  assert.deepEqual(images.map(image => image.title), ['Fokus', 'Form og hensigt', 'Relation', 'Rytme']);
  for (const image of images) {
    assert.ok(image.alt); assert.ok(image.src.startsWith('data:image/svg+xml,'));
    const svg = decodeURIComponent(image.src.slice(image.src.indexOf(',') + 1));
    assert.match(svg, /data-family="passage"/); assert.doesNotMatch(svg, /var\(|https?:\/\/(?!www.w3.org)/);
  }
});

test('Passage activity builds concentric layers before drawing its foreground and final inlay',()=>{
 const fixture=nativeDocument(),svg=createGraphic(theme(),'spinner',{family:'passage'},{document:fixture.document});
 fixture.document.body.append(svg);
 const rear=svg.querySelector('[data-part="rear-plane"]').querySelector('circle'),contours=svg.querySelector('[data-part="orbit"]').querySelectorAll('circle');
 for(const circle of [rear,...contours]){
  assert.equal(circle.getAttribute('cx'),'300');assert.equal(circle.getAttribute('cy'),'210');
 }
 const radius=Number(rear.getAttribute('r')),halfMaterial=Number(rear.getAttribute('stroke-width'))/2;
 assert.deepEqual(contours.map(circle=>Number(circle.getAttribute('r'))).sort((a,b)=>a-b),[radius-halfMaterial,radius+halfMaterial]);
 const activity=svg.querySelector('[data-part="activity"]'),arc=activity.querySelector('path'),inlay=svg.querySelector('[data-part="accent"]').querySelector('path');
 assert.equal(arc.getAttribute('stroke-linecap'),'butt');assert.equal(inlay.getAttribute('stroke-linecap'),'butt');
 assert.equal(activity.querySelector('circle'),null,'no detached endpoint disc');
 const controller=mountGraphicMotion(svg);
 controller.seek(0);
 const fade=fixture.effects.find(effect=>effect.target===rear.parentNode);
 const contourDraw=fixture.effects.find(effect=>contours.includes(effect.target)&&effect.frames[0].strokeDasharray);
 const arcDraw=fixture.effects.find(effect=>effect.target===arc&&effect.frames[0].strokeDasharray);
 const inlayDraw=fixture.effects.find(effect=>effect.target===inlay&&effect.frames[0].strokeDasharray);
 assert.ok(fade&&contourDraw&&arcDraw&&inlayDraw);
 assert.deepEqual(fade.frames.map(frame=>frame.opacity),[0,1]);
 assert.ok(fade.options.delay+fade.options.duration<=arcDraw.options.delay,'material arrives before the foreground is drawn');
 assert.ok(contourDraw.options.delay<arcDraw.options.delay,'construction edges lead the foreground');
 assert.ok(arcDraw.options.delay+arcDraw.options.duration<=inlayDraw.options.delay,'the inlay follows the completed arc');
 assert.ok(fixture.effects.every(effect=>effect.frames.every(frame=>!frame.transform||frame.transform==='none')),'no rotation or positional drift');
 assert.equal(svg.querySelector('[data-motion-helper]'),null,'the spinner has no drifting material layers');
 controller.setLoop(true);controller.play();fixture.advance(3360);
 fixture.advance(3520);assert.equal(controller.state.time,3200,'the finished composition rests like the other Passage illustrations');
 controller.setReduced(true);
 assert.equal(controller.state.playing,false);assert.equal(controller.state.progress,1);
 assert.equal(fixture.scheduled.size,0);assert.ok(fixture.effects.every(item=>item.cancelled));
 controller.destroy();
});

test('finite graphic compositions retain their deliberate pause between repetitions',()=>{
 const fixture=nativeDocument(),svg=createGraphic(theme(),'focus',{family:'passage'},{document:fixture.document});
 fixture.document.body.append(svg);
 const controller=mountGraphicMotion(svg);
 controller.setLoop(true);controller.play();fixture.advance(3300);fixture.advance(3500);
 assert.equal(controller.state.time,3200);
 assert.equal(controller.state.playing,true);
 controller.destroy();
});

test('motion mount is passive and supports explicit seeking, reverse, duration overrides and cleanup', () => {
  const fixture = nativeDocument(), { document } = fixture;
  const svg = createGraphic(theme(), 'poster', { family: 'passage' }, { document }); document.body.append(svg);
  svg.setAttribute('tabindex', '4'); svg.setAttribute('aria-describedby', 'product-description');
  const controller = mountGraphicMotion(svg, { duration: '1.8s', hintId: 'graphic-help' });
  assert.equal(fixture.effects.length, 0); assert.equal(fixture.scheduled.size, 0);
  assert.equal(controller.state.playing, false); assert.equal(controller.state.progress, 1); assert.equal(controller.state.duration, 1800);
  assert.equal(svg.getAttribute('aria-describedby'), 'product-description graphic-help');
  controller.seek(.5);
  assert.ok(fixture.effects.length); assert.ok(fixture.effects.every(effect => effect.paused && effect.currentTime === 900));
  assert.ok(svg.querySelector('[data-motion-helper="parallax"]'));
  controller.play(); fixture.advance(1000);
  assert.equal(controller.state.progress, 1); assert.equal(controller.state.playing, false);
  controller.play(true); fixture.advance(1900);
  assert.equal(controller.state.progress, .5); assert.equal(controller.state.direction, -1);
  controller.pause(); assert.equal(fixture.scheduled.size, 0);
  controller.settle(); assert.equal(svg.querySelector('[data-motion-helper="parallax"]'), null);
  assert.ok(fixture.effects.every(effect => effect.cancelled));
  assert.throws(() => controller.seek(NaN), /finite/);
  controller.destroy(); controller.destroy();
  assert.equal(svg.getAttribute('tabindex'), '4'); assert.equal(svg.getAttribute('aria-describedby'), 'product-description');
  assert.equal(svg.getAttribute('focusable'), 'false'); assert.equal(fixture.preferenceListeners.size, 0); assert.equal(fixture.documentListeners.get('visibilitychange').size, 0);
});

test('reduced motion remains static, live duration is read on demand, and no nonexistent hint is added', () => {
  const fixture = nativeDocument({ reduced: true, cssDuration: '2400ms' }), { document } = fixture;
  const svg = createGraphic(theme(), 'focus', { family: 'passage' }, { document }); document.body.append(svg);
  const controller = mountGraphicMotion(svg);
  assert.equal(svg.getAttribute('aria-describedby'), null);
  controller.play(); controller.seek(.2);
  assert.equal(controller.state.progress, 1); assert.equal(fixture.effects.length, 0); assert.equal(fixture.scheduled.size, 0);
  fixture.systemReduced(false); fixture.cssDuration('6s'); controller.seek(.25);
  assert.equal(controller.state.duration, 6000); assert.equal(controller.state.time, 1500);
  assert.ok(fixture.effects.length);
  fixture.systemReduced(true);
  assert.equal(controller.state.progress, 1); assert.ok(fixture.effects.every(effect => effect.cancelled));
  assert.equal(svg.querySelector('[data-motion-helper="parallax"]'), null);
  controller.destroy();
  assert.throws(() => mountGraphicMotion(svg, { duration: 0 }), /positive time/);
});

test('seek restores paused reverse direction so toggle continues backwards', () => {
  const fixture = nativeDocument(), { document } = fixture;
  const svg = createGraphic(theme(), 'focus', { family: 'passage' }, { document }); document.body.append(svg);
  const controller = mountGraphicMotion(svg);
  controller.seek(.5, { direction: -1 });
  assert.equal(controller.state.playing, false); assert.equal(controller.state.direction, -1);
  controller.toggle(); fixture.advance(320);
  assert.equal(controller.state.progress, .4); assert.equal(controller.state.direction, -1);
  controller.seek(.7);
  assert.equal(controller.state.direction, -1, 'ordinary seeking preserves the current direction');
  for (const direction of [0, 2, '-1', NaN]) assert.throws(() => controller.seek(.5, { direction }), /direction must be -1 or 1/);
  assert.equal(controller.state.progress, .7, 'invalid direction does not change the paused state');
  controller.seek(.5, { direction: 1 });
  assert.equal(controller.state.direction, 1);
  controller.destroy();
});

test('graphic renderer validates once and retains an isolated theme snapshot for markup and native SVG', () => {
  const pack = theme(), sourceTokens = pack.tokens;
  pack.graphics = { family: 'passage' };
  const renderer = createGraphicRenderer(pack);
  Object.defineProperty(pack, 'tokens', { configurable: true, enumerable: true, get() { throw new Error('The validated renderer must not reread its source.'); } });
  const options = { resolved: true, idPrefix: 'snapshot-graphic' };
  const original = renderer.render('focus', options);
  for (const motif of ['poster', 'relation', 'rhythm']) renderer.render(motif);
  const { document } = nativeDocument();
  const native = renderer.create('focus', options, { document });
  assert.equal(native.getAttribute('data-family'), 'passage');
  Object.defineProperty(pack, 'tokens', { configurable: true, enumerable: true, writable: true, value: sourceTokens });
  sourceTokens['color.illustration.subject'].$value = 'invalid; background:url(unsafe)';
  pack.graphics.family = 'fieldlines';
  assert.equal(renderer.render('focus', options), original, 'existing renderer owns its validated palette and family');
  assert.equal(renderer.create('focus', { ...options, document }).getAttribute('data-family'), 'passage');
  assert.throws(() => createGraphicRenderer(pack), /Invalid design package/);
  sourceTokens['color.illustration.subject'].$value = '#123456';
  const fresh = createGraphicRenderer(pack).render('focus', options);
  assert.match(fresh, /data-family="fieldlines"/); assert.match(fresh, /stroke="#123456"/);
  assert.equal(renderGraphic(pack, 'focus', options), fresh);
});
