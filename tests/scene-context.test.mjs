import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { readSceneContext } from '../collaboration/scene-context.mjs';

const box = (id, name, children = []) => ({
  id, name, type: 'container', width: 100,
  layout: { flow: 'stack', gap: 16, columns: 2, align: 'stretch' }, children,
});

function fixture() {
  return {
    format: 'stade-native-app', version: 1, id: 'oeverum', name: 'Øverum',
    scene: {
      format: 'stade-scene', version: 2, data: {
        template: 'practice',
        acts: [
          {
            id: 'practice-main', name: 'Øvelse', mode: 'side',
            layout: box('practice', 'Øverum', [
              { id: 'practice-open-act', type: 'act-trigger', props: { label: 'Lyd og værktøjer', targetAct: 'practice-audio' } },
              box('practice-fretboard-area', 'Instrumentområde', [
                { id: 'practice-fretboard', type: 'practice-fretboard', props: { showAlternates: false } },
              ]),
              box('practice-notation', 'Nodeområde', [{ id: 'practice-score', type: 'practice-score' }]),
            ]),
          },
          {
            id: 'practice-audio', name: 'Lyd og værktøjer', mode: 'panel',
            layout: box('practice-audio-layout', 'Indhold', [
              { id: 'practice-audio-instrument', type: 'practice-audio-instrument' },
            ]),
          },
        ],
      },
    },
  };
}

function htmlFor(manifest) {
  const data = JSON.stringify(manifest).replace(/</g, '\\u003c');
  return '<!doctype html><script type="application/json" id="stade-native-app">\n'
    + data + '\n</script><script>throw new Error("App scripts are not read or executed")</script>';
}

function registryHTML(registry) {
  return '<script type="application/json" id="stade-scene-registry">'
    + JSON.stringify(registry).replace(/</g, '\\u003c') + '</script>';
}

function registryFixture() {
  return { version: 1, patterns: [{
    id: 'blog', name: 'Blog', description: 'Et magasin med artikler.',
    parts: [{ type: 'blog-masthead', name: 'Magasinhoved', fields: {
      title: { type: 'text', label: 'Navn', defaultValue: 'Mellemrum', maxLength: 80 },
      alignment: { type: 'enum', label: 'Justering', options: { start: 'Venstre', center: 'Centreret' }, defaultValue: 'start' },
      titleSize: { type: 'number', label: 'Størrelse', defaultValue: 100, min: 80, max: 120, step: 5 },
      showTitle: { type: 'checkbox', label: 'Vis titel', defaultValue: true },
    }, parts: { title: { label: 'Titel', textKey: 'title', sizeKey: 'titleSize', visibleKey: 'showTitle' } } },
    { type: 'blog-stories', name: 'Historier og læser', fields: {}, parts: {} }],
  }] };
}

function read(manifest = fixture()) {
  return readSceneContext(htmlFor(manifest), 'oeverum');
}

test('reads one article card layout and the saved field bindings', () => {
  const manifest = fixture();
  const root = manifest.scene.data.acts[0].layout;
  const title = { id: 'card-title', type: 'heading', bindings: { text: 'title' } };
  const card = box('article-card', 'Kortlayout', [title]);
  root.children.push({ id: 'article-list', type: 'blog-list', children: [card] });
  const blocks = read(manifest).acts[0].blocks;
  assert.deepEqual(blocks.find(block => block.id === title.id), {
    id: title.id, type: 'heading', bindings: { text: 'title' }, index: 0, parentId: card.id,
  });
  root.children.push(card.children.pop());
  assert.throws(() => read(manifest), /Ugyldige databindinger/);
});

test('reads acts, saved properties, placement and act links from the manifest only', () => {
  const manifest = fixture();
  const main = manifest.scene.data.acts[0].layout;
  const board = main.children[1].children[0];
  board.props.title = 'Bogstavelig </script> i en titel';
  const html = htmlFor(manifest);
  const context = readSceneContext(html, 'oeverum');

  assert.equal(context.name, 'Øverum');
  assert.equal(context.template, 'practice');
  assert.equal(context.version, 2);
  assert.equal(Object.hasOwn(context, 'registry'), false);
  assert.equal(context.revision, createHash('sha256').update(html).digest('hex'));
  assert.deepEqual(context.acts.map(({ id, name, mode }) => ({ id, name, mode })), [
    { id: 'practice-main', name: 'Øvelse', mode: 'side' },
    { id: 'practice-audio', name: 'Lyd og værktøjer', mode: 'panel' },
  ]);
  assert.deepEqual(context.acts[0].blocks.map(block => block.id), [
    'practice', 'practice-open-act', 'practice-fretboard-area', 'practice-fretboard', 'practice-notation', 'practice-score',
  ]);
  assert.deepEqual(context.acts[0].blocks.find(block => block.id === board.id), {
    id: board.id, type: board.type, parentId: 'practice-fretboard-area', index: 0,
    props: { title: board.props.title, showAlternates: false },
  });
  assert.deepEqual(context.links, [{
    actId: 'practice-main', blockId: 'practice-open-act', targetActId: 'practice-audio', label: 'Lyd og værktøjer',
  }]);

  main.children[2].children.push(main.children[1].children.pop());
  const updated = read(manifest);
  const moved = updated.acts[0].blocks.find(block => block.id === board.id);
  assert.equal(moved.parentId, 'practice-notation');
  assert.equal(moved.index, 1);
  assert.notEqual(updated.revision, context.revision);
});

test('reads available pattern parts, typed fields and defaults from the optional registry', () => {
  const registry = registryFixture();
  const html = registryHTML(registry) + htmlFor(fixture());
  const context = readSceneContext(html, 'oeverum');
  assert.deepEqual(context.registry, registry);
  assert.equal(context.revision, createHash('sha256').update(html).digest('hex'));
  assert.equal(context.acts[0].blocks.some(block => block.type === 'blog-masthead'), false);
});

test('reads default and explicit action links and locates the act currently holding a target block', () => {
  const manifest = fixture();
  const [main, panel] = manifest.scene.data.acts;
  const header = { id: 'shop-header', type: 'shop-header' };
  const cart = { id: 'cart-area', type: 'shop-cart' };
  main.layout.children.push(header, cart);
  const registry = registryFixture();
  registry.patterns.push({ id: 'shop', name: 'Webshop', description: 'Butik med produkter og kurv.', parts: [
    { type: 'shop-header', name: 'Butikshoved', fields: {}, parts: {}, actions: {
      cart: { label: 'Åbn kurv', defaultBlockType: 'shop-cart' },
    } },
    { type: 'shop-cart', name: 'Kurv', fields: {}, parts: {} },
  ] });
  const current = () => readSceneContext(registryHTML(registry) + htmlFor(manifest), 'oeverum');
  const cartLink = () => current().links.find(link => link.actionId === 'cart');
  const link = { actId: main.id, blockId: header.id, actionId: 'cart', label: 'Åbn kurv' };
  assert.deepEqual(cartLink(), { ...link, targetActId: main.id, targetBlockId: cart.id });

  panel.layout.children.push(main.layout.children.pop());
  assert.deepEqual(cartLink(), { ...link, targetActId: panel.id, targetBlockId: cart.id });
  header.actions = { cart: { kind: 'act', id: panel.id } };
  assert.deepEqual(cartLink(), { ...link, targetActId: panel.id });

  header.actions.cart = { kind: 'block', id: cart.id };
  assert.deepEqual(cartLink(), { ...link, targetActId: panel.id, targetBlockId: cart.id });
  assert.deepEqual(current().acts[0].blocks.find(block => block.id === header.id).actions, header.actions);
  header.actions.cart = null;
  assert.equal(cartLink(), undefined);
  assert.deepEqual(current().acts[0].blocks.find(block => block.id === header.id).actions, { cart: null });

  const trigger = main.layout.children[0];
  trigger.actions = { open: { kind: 'block', id: cart.id } };
  assert.deepEqual(current().links, [{
    actId: main.id, blockId: trigger.id, actionId: 'open', label: trigger.props.label,
    targetActId: panel.id, targetBlockId: cart.id,
  }]);
  trigger.actions.open = null;
  delete header.actions;
  panel.layout.children.pop();
  assert.deepEqual(current().links, []);
});

test('rejects malformed or unreachable explicit action targets', () => {
  const manifest = fixture();
  const source = manifest.scene.data.acts[0].layout.children[0];
  const cases = [
    [{ open: { kind: 'external', id: 'practice-audio' } }, /Ugyldige handlingsmål/],
    [{ unknown: null }, /Ukendt handling/],
    [{ open: { kind: 'block', id: source.id } }, /anden gyldig blok/],
    [{ open: { kind: 'block', id: 'missing' } }, /anden gyldig blok/],
    [{ open: { kind: 'act', id: 'practice-main' } }, /anden gyldig akt/],
    [{ open: { kind: 'act', id: 'missing' } }, /anden gyldig akt/],
  ];
  for (const [actions, error] of cases) {
    source.actions = actions;
    assert.throws(() => read(manifest), error);
  }
});

test('rejects ambiguous, invalid and oversized pattern registries', () => {
  const app = htmlFor(fixture());
  const registry = registryFixture();
  const registryTag = registryHTML(registry);
  assert.throws(() => readSceneContext(registryTag + registryTag + app, 'oeverum'), /ét komplet Scene-register/);
  assert.throws(() => readSceneContext(registryTag.replace('"version":1', 'version:1') + app, 'oeverum'), /gyldig JSON/);
  const invalid = [
    data => { data.version = 2; },
    data => { data.patterns.push({ ...data.patterns[0] }); },
    data => { data.patterns.push({ ...data.patterns[0], id: 'editor' }); },
    data => { data.patterns[0].parts.length = 0; },
    data => { data.patterns[0].parts[0].fields.alignment.defaultValue = 'missing'; },
    data => { data.patterns[0].parts[0].parts.title.textKey = 'showTitle'; },
    data => { data.patterns[0].parts[0].actions = { open: { label: 'Åbn mål', defaultBlockType: 'missing' } }; },
  ];
  for (const mutate of invalid) {
    const data = registryFixture();
    mutate(data);
    assert.throws(() => readSceneContext(registryHTML(data) + app, 'oeverum'), /ugyldig version eller mønsterdefinition/);
  }
  registry.patterns[0].description = 'x'.repeat(256 * 1024);
  assert.throws(() => readSceneContext(registryHTML(registry) + app, 'oeverum'), /256 KB/);
});

test('reads the canonical act type and label for the legacy button', () => {
  const manifest = fixture();
  const button = manifest.scene.data.acts[0].layout.children[0];
  button.type = 'practice-open-act';
  delete button.props.label;
  const context = read(manifest);
  assert.equal(context.acts[0].blocks[1].type, 'act-trigger');
  assert.equal(context.links[0].label, 'Lyd og værktøjer');
});

test('reads legacy single-layout scenes without changing their original block ids', () => {
  const manifest = fixture();
  const { layout } = manifest.scene.data.acts[0];
  layout.children[0].props = { label: 'Åbn værktøjer' };
  manifest.scene.data = { template: 'practice', layout };
  const context = read(manifest);
  assert.equal(context.acts.length, 1);
  assert.equal(context.acts[0].id, 'practice-main');
  assert.equal(context.acts[0].blocks[0].id, layout.id);
  assert.deepEqual(context.links, []);
});

test('rejects absent, ambiguous, broken or incompatible manifests', () => {
  const html = htmlFor(fixture());
  assert.throws(() => readSceneContext('<!doctype html><p>Øverum</p>', 'oeverum'), /mangler et Stade-manifest/);
  assert.throws(() => readSceneContext(html + html, 'oeverum'), /ét komplet Stade-manifest/);
  assert.throws(() => readSceneContext(html.replaceAll('</script>', ''), 'oeverum'), /ét komplet Stade-manifest/);
  assert.throws(() => readSceneContext(html.replace('"version":1', '"version":"one'), 'oeverum'), /gyldig JSON/);
  assert.throws(() => readSceneContext(html, 'another-app'), /registrerede app/);
  assert.throws(() => read({ ...fixture(), version: 2 }), /format, version eller navn/);
  const unsupported = fixture();
  unsupported.scene.version = 3;
  assert.throws(() => read(unsupported), /Stade-scene i version 2/);
});

test('rejects invalid roots, recursive shapes, repeated ids and broken links', () => {
  const cases = [
    [acts => { acts[0].mode = 'panel'; }, /første akt skal være en side/],
    [acts => { acts[1].id = acts[0].id; }, /Flere akter/],
    [acts => { acts[1].layout.children[0].id = 'practice-score'; }, /Flere blokke/],
    [acts => { acts[0].layout.width = 50; }, /fuld bredde/],
    [acts => { acts[0].layout.children[1].layout.flow = 'unsupported'; }, /Ugyldigt layout/],
    [acts => { acts[0].layout.children[0].children = []; }, /Kun containere/],
    [acts => { acts[0].layout.children[0].props.targetAct = 'practice-main'; }, /anden gyldig akt/],
    [acts => { acts[0].layout.children[0].props.targetAct = 'missing'; }, /anden gyldig akt/],
    [acts => { acts[0].layout.children[0].props.targetAct = true; }, /ugyldig tekst eller aktforbindelse/],
    [acts => { acts[1].layout.children[0].props = { bad: { recursive: true } }; }, /Ugyldige gemte egenskaber/],
    [acts => { acts[1].layout.children[0].sizing = { mode: 'fixed', basis: 1 }; }, /Ugyldig fleksibel bredde/],
  ];
  for (const [mutate, error] of cases) {
    const manifest = fixture();
    mutate(manifest.scene.data.acts);
    assert.throws(() => read(manifest), error);
  }
});

test('bounds app size, result size and nesting', () => {
  const html = htmlFor(fixture());
  assert.throws(() => readSceneContext(html + ' '.repeat(10 * 1024 * 1024), 'oeverum'), /10 MB/);
  const huge = fixture();
  huge.scene.data.acts[1].layout.children[0].props = { label: 'x'.repeat(256 * 1024) };
  assert.throws(() => read(huge), /256 KB/);
  const deep = fixture();
  let current = deep.scene.data.acts[0].layout;
  for (let index = 0; index < 9; index++) {
    const next = box('nested-' + index, 'Niveau');
    current.children.push(next);
    current = next;
  }
  assert.throws(() => read(deep), /otte indlejrede niveauer/);
});
