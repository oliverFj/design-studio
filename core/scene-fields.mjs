const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isLabel = value => typeof value === 'string' && value.trim().length > 0;
const identifier = /^[a-z][a-zA-Z0-9-]*$/;
const fieldProperties = {
  text: ['maxLength', 'slot'],
  enum: ['options'],
  number: ['min', 'max', 'step'],
  checkbox: [],
};
const partFields = { textKey: 'text', sizeKey: 'number', visibleKey: 'checkbox' };

export function isSceneFieldValue(field, value) {
  if (field.type === 'text') return isLabel(value) && value.length <= field.maxLength;
  if (field.type === 'checkbox') return typeof value === 'boolean';
  if (field.type === 'enum') return typeof value === 'string' && Object.hasOwn(field.options, value);
  if (field.type !== 'number' || !Number.isFinite(value) || value < field.min || value > field.max) return false;
  const steps = (value - field.min) / field.step;
  return Math.abs(steps - Math.round(steps)) < 1e-8;
}

/** Validate an optional contract in a component or pattern definition. */
export function validateSceneContract(scene, { parts, variants } = {}) {
  if (!isRecord(scene) || !isRecord(scene.fields) || !Object.keys(scene.fields).length
    || Object.keys(scene).some(key => key !== 'fields' && key !== 'parts')) {
    return 'forventede redigerbare felter og eventuelle dele.';
  }
  for (const [key, field] of Object.entries(scene.fields)) {
    if (!identifier.test(key) || !isRecord(field) || typeof field.type !== 'string'
      || !Object.hasOwn(fieldProperties, field.type) || !isLabel(field.label)) return 'ugyldig feltbeskrivelse for ' + key + '.';
    const allowed = ['type', 'label', 'defaultValue', ...fieldProperties[field.type]];
    if (Object.keys(field).some(property => !allowed.includes(property))) return 'ukendt egenskab for ' + key + '.';
    if (field.type === 'text' && (!Number.isSafeInteger(field.maxLength) || field.maxLength <= 0)) {
      return 'ugyldig tekstgrænse for ' + key + '.';
    }
    if (field.type === 'enum' && (!isRecord(field.options) || !Object.keys(field.options).length
      || Object.entries(field.options).some(([name, label]) => !identifier.test(name) || !isLabel(label)))) {
      return 'ugyldige valgmuligheder for ' + key + '.';
    }
    if (field.type === 'number' && (![field.min, field.max, field.step].every(Number.isFinite)
      || field.min >= field.max || field.step <= 0)) return 'ugyldig talgrænse for ' + key + '.';
    if (field.slot !== undefined && (typeof field.slot !== 'string' || !parts || !Object.hasOwn(parts, field.slot))) {
      return 'ukendt indholdsplads for ' + key + '.';
    }
    if (variants && key === 'variant' && (field.type !== 'enum'
      || Object.keys(field.options).some(name => !Object.hasOwn(variants, name)))) return 'ukendt variant.';
    if (!isSceneFieldValue(field, field.defaultValue)) return 'ugyldig standardværdi for ' + key + '.';
  }
  if (scene.parts !== undefined) {
    if (!isRecord(scene.parts)) return 'forventede navngivne redigerbare dele.';
    for (const [key, part] of Object.entries(scene.parts)) {
      if (!identifier.test(key) || (parts && !Object.hasOwn(parts, key)) || !isRecord(part) || !isLabel(part.label)) {
        return 'ugyldig redigerbar del ' + key + '.';
      }
      const references = Object.keys(part).filter(name => name !== 'label');
      if (!references.length || references.some(name => !Object.hasOwn(partFields, name)
        || typeof part[name] !== 'string' || !Object.hasOwn(scene.fields, part[name])
        || scene.fields[part[name]].type !== partFields[name])) return 'ugyldig felthenvisning fra ' + key + '.';
    }
  }
  return '';
}

/** Validate overrides on one scene instance. An omitted value inherits the definition's default. */
export function validateSceneValues(scene, props = {}) {
  if (!isRecord(scene?.fields)) return 'Definitionen har ingen redigerbare felter.';
  if (!isRecord(props)) return 'Redigerbare værdier skal være et objekt.';
  for (const [key, value] of Object.entries(props)) {
    if (!Object.hasOwn(scene.fields, key)) return 'Ukendt redigerbart felt ' + key + '.';
    const field = scene.fields[key];
    if (!isSceneFieldValue(field, value)) return 'Ugyldig værdi for ' + field.label + '.';
  }
  return '';
}

export function resolveSceneFields(scene, props = {}) {
  const error = validateSceneValues(scene, props);
  if (error) throw new Error(error);
  return Object.fromEntries(Object.entries(scene.fields).map(([key, field]) => [
    key, Object.hasOwn(props, key) ? props[key] : field.defaultValue,
  ]));
}
