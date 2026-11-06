import { validatePackage } from '../core/engine.mjs';

/** Keep independent theme copies in this session and download edited files. */
export function createThemeStorage(themes, { download } = {}) {
  // Earlier Studio exports included this UI choice. Read them without carrying
  // the obsolete field into editable theme data or subsequent downloads.
  const themeCopy=pack=>{const copy=structuredClone(pack);delete copy.graphics;return copy;};
  const entries = new Map(themes.map(({ key, package: pack }) => [key, { key, package: themeCopy(pack), file: key + '.json' }]));
  let nextKey = 0;
  const checked = pack => {
    const result = validatePackage(pack);
    if (!result.valid) throw new Error(result.errors.join('\n'));
  };
  const read = key => {
    if (!entries.has(key)) throw new Error('Temaet findes ikke i denne session. Åbn temafilen igen.');
    return structuredClone(entries.get(key));
  };
  return {
    async list() {
      return { packages: [...entries.values()].map(({ key, package: pack }) => ({ key, id: pack.id, name: pack.name, description: pack.description })) };
    },
    async read(key) { return read(key); },
    async open(pack, filename) {
      checked(pack);
      const key = '@file-' + ++nextKey;
      entries.set(key, { key, package: themeCopy(pack), file: filename || pack.id + '.json' });
      return { key };
    },
    async save(key, pack) {
      checked(pack);
      pack=themeCopy(pack);
      const entry = read(key);
      download(entry.file, JSON.stringify(pack, null, 2) + '\n', 'application/json');
      entry.package = structuredClone(pack);
      entries.set(key, entry);
      return read(key);
    },
  };
}
