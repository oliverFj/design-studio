// Decorative fallback shared by component and pattern thumbnails.
const style = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-height:5rem;aspect-ratio:10/7;box-sizing:border-box;padding:.75rem;border:1px dashed var(--ds-color-border-default,#9a9a9a);border-radius:var(--ds-radius-control,6px);background:var(--ds-color-background-subtle,#eee);color:var(--ds-color-text-secondary,#555);font:inherit;font-size:.75rem;line-height:1.4;text-align:center';
const label = 'Ingen illustration';

export function renderCatalogPlaceholder() {
  return '<span data-catalog-placeholder aria-hidden="true" style="'+style+'">'+label+'</span>';
}

export function createCatalogPlaceholder({document=globalThis.document}={}) {
  const node=document.createElement('span');
  node.setAttribute('data-catalog-placeholder','');node.setAttribute('aria-hidden','true');node.setAttribute('style',style);node.textContent=label;
  return node;
}
