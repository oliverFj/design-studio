import test from 'node:test';
import assert from 'node:assert/strict';
import { readJSONFile, openJSONFile, downloadJSON, createProjectFile } from '../core/files.mjs';

const file = (text, name = 'project.json') => ({ name, size: Buffer.byteLength(text), async text() { return text; } });
const validate = data => ({ valid: !!data && Number.isSafeInteger(data.count) && data.count >= 0, errors: ['Tælleren er ugyldig.'] });
function browser(action) {
  const elements = [], downloads = [];
  const document = {
    body: { append(element) { elements.push(element); } },
    createElement(tag) {
      const listeners = {};
      return { tag, files: [], addEventListener(type, callback) { listeners[type] = callback; },
        remove() { this.removed = true; }, click() { action?.(this, listeners); } };
    },
  };
  const url = { createObjectURL(blob) { downloads.push(blob); return 'blob:fixture'; }, revokeObjectURL() {} };
  return { document, url, elements, downloads };
}

test('JSON files accept BOM, validate before returning, and reject malformed or oversized input', async () => {
  assert.deepEqual(await readJSONFile(file('\uFEFF{"count":2}'), { validate }), { count: 2 });
  await assert.rejects(readJSONFile(file('{')), /gyldig JSON/);
  await assert.rejects(readJSONFile(file('{"count":-1}'), { validate }), /Tælleren er ugyldig/);
  let read = false;
  await assert.rejects(readJSONFile({ size: 11, text() { read = true; } }, { maxBytes: 10 }), /for stor/);
  assert.equal(read, false);
});

test('file picker cleans up on cancel, successful read, and invalid JSON', async () => {
  const canceled = browser((_input, listeners) => listeners.cancel());
  assert.equal(await openJSONFile(canceled), null);
  assert.equal(canceled.elements[0].removed, true);
  const selected = browser((input, listeners) => { input.files = [file('{"count":3}')]; listeners.change(); });
  assert.deepEqual(await openJSONFile({ ...selected, validate }), { name: 'project.json', data: { count: 3 } });
  assert.equal(selected.elements[0].removed, true);
  const invalid = browser((input, listeners) => { input.files = [file('{')]; listeners.change(); });
  await assert.rejects(openJSONFile(invalid), /gyldig JSON/);
  assert.equal(invalid.elements[0].removed, true);
});

test('versioned projects round trip; other formats, versions and invalid data are rejected', async () => {
  const format = createProjectFile({ format: 'example-project', version: 1, validate });
  const ui = browser();
  format.save('project.json', { count: 4 }, ui);
  const saved = await ui.downloads[0].text();
  assert.deepEqual(JSON.parse(saved), { format: 'example-project', version: 1, data: { count: 4 } });
  assert.deepEqual(await format.read(file(saved)), { count: 4 });
  for (const version of [0, 2, '1', null]) await assert.rejects(format.read(file(JSON.stringify({ format: 'example-project', version, data: { count: 4 } }))), /Filversionen understøttes ikke/);
  await assert.rejects(format.read(file('{"format":"other","version":1,"data":{"count":1}}')), /andet projektformat/);
  const count = ui.downloads.length;
  assert.throws(() => format.save('bad.json', { count: -1 }, ui), /ugyldig/);
  assert.equal(ui.downloads.length, count);
});

test('invalid downloads do not start and filenames cannot introduce paths', async () => {
  const ui = browser();
  assert.throws(() => downloadJSON('bad.json', { count: -1 }, { ...ui, validate }), /ugyldig/);
  assert.equal(ui.downloads.length, 0);
  downloadJSON('folder/project.json', { count: 1 }, ui);
  assert.equal(ui.elements[0].download, 'folder-project.json');
  assert.equal(ui.elements[0].removed, true);
});
