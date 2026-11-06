import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createThemeStorage } from '../studio/theme-storage.mjs';

const theme = JSON.parse(await readFile(new URL('../packages/studio-light.json', import.meta.url), 'utf8'));
const bundled = [{ key: 'studio-light', package: theme }];

test('graphic family is a Studio-only preference and is omitted when reopening or saving older themes',async()=>{
 const oldTheme={...structuredClone(theme),graphics:{family:'passage'}},before=structuredClone(oldTheme),downloads=[];
 const store=createThemeStorage([{key:'old',package:oldTheme}],{download:(...args)=>downloads.push(args)});
 assert.equal((await store.read('old')).package.graphics,undefined);
 const opened=await store.open(oldTheme,'old.json');
 assert.equal((await store.read(opened.key)).package.graphics,undefined);
 await store.save(opened.key,oldTheme);
 assert.equal(JSON.parse(downloads[0][1]).graphics,undefined);
 assert.deepEqual(oldTheme,before);
});

test('offline themes are independent drafts; opening a file preserves the bundled original', async () => {
  const store = createThemeStorage(bundled);
  const draft = await store.read('studio-light');
  draft.package.name = 'Mit tema';
  assert.equal((await store.read('studio-light')).package.name, theme.name);
  const opened = await store.open(draft.package, 'mit-tema.json');
  assert.notEqual(opened.key, 'studio-light');
  assert.equal((await store.read(opened.key)).file, 'mit-tema.json');
  assert.equal((await store.list()).packages.length, 2);
  await assert.rejects(store.open({}), /./);
  assert.equal((await store.list()).packages.length, 2);
});

test('saving downloads a complete round-trippable theme; invalid or failed saves preserve the previous state', async () => {
  const downloads = [];
  let fail = false;
  const store = createThemeStorage(bundled, { download: (...args) => {
    if (fail) throw new Error('Download failed');
    downloads.push(args);
  } });
  const { key } = await store.open(theme, 'projekt.json');
  const draft = structuredClone(theme);
  draft.name = 'Redigeret tema';
  await store.save(key, draft);
  assert.equal(downloads[0][0], 'projekt.json');
  assert.deepEqual(JSON.parse(downloads[0][1]), draft);
  assert.equal(downloads[0][2], 'application/json');
  const reopened = await store.open(JSON.parse(downloads[0][1]), 'projekt.json');
  assert.deepEqual((await store.read(reopened.key)).package, draft);
  await assert.rejects(store.save(key, {}));
  fail = true;
  await assert.rejects(store.save(key, { ...draft, name: 'Må ikke blive gemt' }), /Download failed/);
  assert.deepEqual((await store.read(key)).package, draft);
  assert.equal(downloads.length, 1);
});
