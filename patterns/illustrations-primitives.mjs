// Trusted SVG descriptions only. Each family owns its geometry and material recipes.
export const paint = role => `var(--g-${role})`;
export const node = (tag, attrs = {}, children = [], text) => ({ tag, attrs, children: children.flat(Infinity), text });
export const part = (key, name, purpose, ...shapes) => ({ key, name, purpose, shapes: shapes.flat(Infinity) });
