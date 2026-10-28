const focusAttributes = ['id', 'data-view', 'data-token', 'data-component', 'data-mode', 'data-action'];
const position = node => ({ top: node.scrollTop || 0, left: node.scrollLeft || 0 });
const scroll = (node, value = { top: 0, left: 0 }) => { if (node) { node.scrollTop = value.top; node.scrollLeft = value.left; } };
const primary = root => root.querySelector('.ds-panel-content') ?? root.querySelector('.ds-app-content');
const compactLayout = root => {
  const layout = root.querySelector('.ds-panel-layout');
  return layout?.getAttribute('data-panel-compact') === 'true' ? layout : null;
};

/** Preserve view scroll and the latest active control across the editor's DOM replacement. */
export function createViewMemory({ document = globalThis.document } = {}) {
  const views = new Map();
  let navigation = { top: 0, left: 0 }, focus = { inside: false, identity: null };
  function available(node, root) {
    if (!node || node.disabled || node.getAttribute('disabled') !== null || node.getAttribute('aria-disabled') === 'true') return false;
    for (let ancestor = node; ancestor; ancestor = ancestor.parentNode) {
      if (ancestor.hidden || ancestor.inert || ancestor.getAttribute?.('hidden') != null || ancestor.getAttribute?.('inert') != null) return false;
      const style = document.defaultView?.getComputedStyle?.(ancestor);
      if (style?.display === 'none' || style?.visibility === 'hidden' || style?.visibility === 'collapse') return false;
      if (ancestor === root) break;
    }
    return true;
  }
  function capture(root, key) {
    const content = primary(root), compact = compactLayout(root), side = root.querySelector('.ds-panel-side'), nav = root.querySelector('.ds-app-navigation');
    const previous = views.get(key);
    views.set(key, {
      content: !compact && content ? position(content) : previous?.content,
      compact: compact ? position(compact) : previous?.compact,
      side: !compact && side && available(side, root) ? position(side) : previous?.side,
    });
    if (nav) navigation = position(nav);
    const active = document.activeElement;
    focus = { inside: Boolean(active && root.contains(active)), identity: null };
    if (focus.inside) for (const attribute of focusAttributes) {
      const value = active.getAttribute(attribute);
      if (value !== null && (attribute !== 'id' || value)) { focus.identity = { attribute, value }; break; }
    }
  }
  function restore(root, key) {
    const content = primary(root), compact = compactLayout(root), saved = views.get(key);
    if (compact) scroll(compact, saved?.compact);
    else { scroll(content, saved?.content); scroll(root.querySelector('.ds-panel-side'), saved?.side); }
    scroll(root.querySelector('.ds-app-navigation'), navigation);
    if (!focus.inside) return;
    const { attribute, value } = focus.identity ?? {};
    const target = attribute && [root, ...root.querySelectorAll('[' + attribute + ']')].find(node => node.getAttribute(attribute) === value);
    const next = available(target, root) ? target : available(content, root) ? content : null;
    next?.focus({ preventScroll: true });
  }
  return { capture, restore };
}
