import assert from 'node:assert/strict';
import test from 'node:test';
import { readSceneApp, readSceneContext } from '../collaboration/scene-context.mjs';
import { planSceneMove } from '../collaboration/scene-move.mjs';

const appId = 'oeverum';
const prefix = '\ufeff<!doctype html>\r\n<title>Øverum</title>\r\n<script type="application/json" id="stade-native-app">';
const suffix = '</script>\r\n<script>throw new Error("App scripts are inert here")</script>\r\n';
const box = (id, name, children = []) => ({
  id, name, type: 'container', width: 100, layout: { flow: 'stack', gap: 16, columns: 2, align: 'stretch' }, children,
});
const fretboard = {
  id: 'practice-fretboard', type: 'practice-fretboard',
  props: { title: 'Bogstavelig </script>', showAlternates: false },
};

function fixture() {
  return {
    format: 'stade-native-app', version: 1, id: appId, name: 'Øverum',
    scene: {
      format: 'stade-scene', version: 2, data: {
        template: 'practice', acts: [
          {
            id: 'practice-main', name: 'Øvelse', mode: 'side',
            layout: box('practice', 'Øverum', [
              { id: 'practice-open-act', type: 'act-trigger', props: { label: 'Lyd og værktøjer', targetAct: 'practice-audio' } },
              box('practice-fretboard-area', 'Instrumentområde', [structuredClone(fretboard)]),
              box('practice-notation', 'Nodeområde', [{ id: 'practice-score', type: 'practice-score' }]),
            ]),
          },
          { id: 'practice-audio', name: 'Lyd og værktøjer', mode: 'panel', layout: box('practice-audio-layout', 'Indhold') },
        ],
      },
    },
  };
}

function htmlFor(manifest = fixture()) {
  return prefix + JSON.stringify(manifest).replace(/</g, '\\u003c') + suffix;
}

function move(html, fields = {}) {
  return planSceneMove(html, { appId, blockId: fretboard.id, destinationId: 'practice-notation', ...fields });
}

test('changes the saved fretboard placement while preserving app code and act links', () => {
  const html = htmlFor();
  const plan = move(html);
  const oldContext = readSceneContext(html, appId);
  const preview = readSceneContext(plan.html, appId);

  assert.equal(plan.blockId, fretboard.id);
  assert.deepEqual(plan.before, { actId: 'practice-main', parentId: 'practice-fretboard-area', parentName: 'Instrumentområde', index: 0 });
  assert.deepEqual(plan.after, { actId: 'practice-main', parentId: 'practice-notation', parentName: 'Nodeområde', index: 1 });
  assert.equal(plan.baseRevision, oldContext.revision);
  assert.equal(plan.previewRevision, preview.revision);
  assert.notEqual(plan.previewRevision, plan.baseRevision);
  assert.ok(plan.html.startsWith(prefix));
  assert.ok(plan.html.endsWith(suffix));
  assert.match(plan.html.slice(prefix.length, -suffix.length), /\\u003c\/script>/);
  assert.deepEqual(preview.links, oldContext.links);
  assert.deepEqual(preview.acts[1], oldContext.acts[1]);
  assert.deepEqual(preview.acts[0].blocks.find(block => block.id === fretboard.id), {
    ...fretboard, parentId: plan.after.parentId, index: plan.after.index,
  });
});

test('uses final sibling indexes and leaves no-op moves byte-identical', () => {
  const html = htmlFor();
  const plan = move(html, { blockId: 'practice-open-act', destinationId: 'practice', index: 2 });
  const { acts } = readSceneContext(plan.html, appId);
  assert.deepEqual(acts[0].blocks.filter(block => block.parentId === 'practice').map(block => block.id), [
    'practice-fretboard-area', 'practice-notation', 'practice-open-act',
  ]);
  const append = move(html, { blockId: 'practice-open-act', destinationId: 'practice' });
  assert.equal(append.html, plan.html);
  const noOp = move(html, { destinationId: 'practice-fretboard-area' });
  assert.equal(noOp.html, html);
  assert.equal(noOp.baseRevision, noOp.previewRevision);
  assert.deepEqual(noOp.after, noOp.before);
});

test('rejects illegal tree moves and out-of-range indexes', () => {
  const html = htmlFor();
  const cases = [
    [{ blockId: 'missing' }, /Blokken blev ikke fundet/],
    [{ blockId: 'practice' }, /rodcontainer/],
    [{ destinationId: 'missing' }, /Destinationen skal være en container/],
    [{ destinationId: 'practice-score' }, /Destinationen skal være en container/],
    [{ destinationId: 'practice-audio-layout' }, /samme akt/],
    [{ blockId: 'practice-notation' }, /sig selv eller en underblok/],
    [{ index: -1 }, /heltal fra 0 til 1/],
    [{ index: 0.5 }, /heltal fra 0 til 1/],
    [{ index: null }, /heltal fra 0 til 1/],
    [{ index: 2 }, /heltal fra 0 til 1/],
  ];
  for (const [fields, error] of cases) assert.throws(() => move(html, fields), error);

  const manifest = fixture();
  const source = manifest.scene.data.acts[0].layout.children[1];
  source.children.push(box('nested-destination', 'Underområde'));
  assert.throws(() => move(htmlFor(manifest), { blockId: source.id, destinationId: 'nested-destination' }), /underblok/);
});

test('validates nesting again after a move', () => {
  const manifest = fixture();
  let destination = manifest.scene.data.acts[0].layout;
  for (let depth = 1; depth <= 8; depth++) {
    const child = box(`nested-${depth}`, 'Niveau');
    destination.children.push(child);
    destination = child;
  }

  const html = htmlFor(manifest);
  assert.equal(readSceneContext(html, appId).acts[0].blocks.at(-1).id, destination.id);
  assert.throws(() => move(html, { destinationId: destination.id }), /otte indlejrede niveauer/);
});

test('moves blocks in legacy one-layout scenes while keeping their format', () => {
  const manifest = fixture();
  const { template, acts } = manifest.scene.data;
  const { layout } = acts[0];
  delete layout.children[0].props.targetAct;
  manifest.scene.data = { template, layout };
  const plan = move(htmlFor(manifest), { index: 0 });
  const saved = readSceneApp(plan.html, appId).manifest.scene.data;
  assert.deepEqual(Object.keys(saved), ['template', 'layout']);
  assert.deepEqual(saved.layout.children[2].children[0], fretboard);
  assert.equal(plan.after.index, 0);
});
