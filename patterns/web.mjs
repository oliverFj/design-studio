import { createComponentFactory, createLayout, createImageExamples } from '../core/components.mjs';

export const WEB_PATTERNS = ['site-header', 'hero', 'site-footer', 'image-gallery'];


export function createWebState(id) {
  if (id === 'site-header') return { selected: 'overblik', menuOpen: false };
  if (id === 'image-gallery') return { selected: null };
  return {};
}

/** Website reference compositions. Replace example content and destinations in the product. */
export function mountWebPattern(theme, id, { document = globalThis.document, state = createWebState(id), idPrefix = 'web-' + id, onChange = () => {} } = {}) {
  const component = createComponentFactory(theme, { document });
  const images = createImageExamples(theme).slice(1);
  const prefix = String(idPrefix).replace(/[^a-zA-Z0-9_-]/g, '-');
  const root = createLayout('split', { document }); root.className += ' ds-composition ds-scope composition-web';
  const node = (tag, className = '') => { const el = document.createElement(tag); el.className = className; return el; };
  const stack = (...children) => { const el = component('stack'); el.replaceChildren(...children); return el; };
  const heading = text => component('heading', { text, variant: 'panel' });
  const text = value => component('text', { text: value });
  const link = (label, target, variant = 'navigation') => component('link', { text: label, href: '#' + prefix + '-' + target, variant });
  const image = (item, options = {}) => component('image', { src: item.src, alt: item.alt, caption: item.title, ...options });
  const cleanups = [];
  const listen = (el, type, fn) => { el.addEventListener(type, fn); cleanups.push(() => el.removeEventListener(type, fn)); };
  const sections = [['overblik', 'Overblik'], ['samling', 'Samling'], ['kontakt', 'Kontakt']];
  function navigation(label, vertical = false) {
    const nav = component('navigation', { ...(vertical ? { variant: 'vertical' } : {}), attrs: { 'aria-label': label } });
    const list = nav.querySelector('ul'); list.replaceChildren(...sections.map(([target, title]) => {
      const item = node('li', 'ds-navigation__item'), anchor = link(title, target);
      anchor.setAttribute('data-destination', target);
      if (state.selected === target) anchor.setAttribute('aria-current', 'location');
      item.append(anchor); return item;
    }));
    return nav;
  }
  const destinations = () => {
    const content = stack(...sections.map(([target, title]) => {
      const section = node('section'); section.id = prefix + '-' + target; section.setAttribute('id', section.id); section.setAttribute('tabindex', '-1');
      section.append(stack(heading(title), text(target === 'kontakt' ? 'Kontaktoplysninger og næste skridt placeres her.' : 'Her vises indholdet for ' + title.toLowerCase() + '.'))); return section;
    })); content.className += ' composition-web-destinations'; return content;
  };
  if (id === 'site-header') {
    const header = node('header', 'composition-site-header');
    const brand = link('Eksempel', 'overblik'); brand.setAttribute('aria-label', 'Eksempel · til overblik');
    const desktop = navigation('Primær navigation'); desktop.className += ' composition-desktop-navigation';
    const mobile = node('details', 'composition-mobile-navigation'); mobile.open = state.menuOpen;
    const summary = node('summary'); summary.textContent = 'Menu';
    mobile.append(summary, navigation('Primær navigation · mobil', true));
    listen(mobile, 'toggle', () => { state.menuOpen = mobile.open; onChange(state); });
    listen(mobile, 'keydown', event => { if (event.key === 'Escape' && mobile.open) { event.preventDefault(); mobile.open = false; summary.focus(); } });
    header.append(brand, desktop, mobile); root.append(stack(header, destinations()));
    listen(root, 'click', event => {
      const target = event.target.getAttribute?.('data-destination'); if (!target) return;
      state.selected = target; mobile.open = false;
      for (const anchor of root.querySelectorAll('[data-destination]')) {
        if (anchor.getAttribute('data-destination') === target) anchor.setAttribute('aria-current', 'location'); else anchor.removeAttribute('aria-current');
      }
      // Native anchors perform scrolling; focus follows the selected in-page destination.
      root.querySelector('#' + prefix + '-' + target)?.focus(); onChange(state);
    });
  }
  if (id === 'hero') {
    const hero = node('section', 'composition-hero'); hero.setAttribute('aria-labelledby', prefix + '-title');
    const title = component('heading', { text: 'Giv idéerne plads til at vokse', variant: 'display', attrs: { id: prefix + '-title' } });
    const actions = node('div', 'composition-actions');
    actions.replaceChildren(component('button',{text:'Udforsk samlingen',href:'#'+prefix+'-samling',variant:'primary',size:'large',iconName:'arrow-right'}),component('button',{text:'Kontakt os',href:'#'+prefix+'-kontakt',variant:'tertiary',size:'large'}));
    hero.append(stack(text('Inspiration og nye perspektiver'), title, text('Et sted at opdage, undersøge og samle det, du vil arbejde videre med.'), actions), image(images[0], { caption: '' }));
    root.append(stack(hero, destinations()));
  }
  if (id === 'site-footer') {
    const footer = node('footer', 'composition-site-footer');
    footer.append(stack(heading('Eksempel'), text('Et fælles sted for idéer og inspiration.')), navigation('Links i sidefoden', true), stack(heading('Kontakt'), text('Find kontaktoplysninger i kontaktsektionen.'), link('Gå til kontakt', 'kontakt')));
    root.append(stack(destinations(), component('divider'), footer, text('© Eksempel · erstat med produktets afsender og rettigheder.')));
  }
  if (id === 'image-gallery') {
    const grid = node('div', 'composition-image-grid');
    const dialog = component('dialog', { idPrefix: prefix + '-viewer', slots: { title: 'Billedvisning', body: { tag: 'div' }, footer: '' } });
    const body = dialog.querySelector('.ds-dialog__body');
    const close = component('button', { text: 'Luk billedvisning', variant: 'tertiary' }); dialog.querySelector('.ds-dialog__footer').replaceChildren(close);
    let opener;
    const restore = () => { state.selected = null; opener?.focus(); onChange(state); };
    listen(close, 'click', () => { dialog.close(); });
    listen(dialog, 'close', restore);
    for (const [index, item] of images.entries()) {
      const open = component('button', { text: 'Se ' + item.title.toLowerCase() + ' i stor størrelse', variant: 'tertiary', attrs: { 'data-image': String(index), 'aria-haspopup': 'dialog' } });
      listen(open, 'click', () => {
        opener = open; state.selected = index;
        dialog.querySelector('.ds-dialog__title').textContent = item.title; body.replaceChildren(image(item));
        dialog.showModal(); close.focus(); onChange(state);
      });
      grid.append(stack(image(item, { variant: 'landscape' }), open));
    }
    root.append(stack(heading('Former og flader'), text('Tre indbyggede illustrationer. Åbn et billede for at se hele motivet.'), grid), dialog);
  }
  return { element: root, state, destroy() { for (const cleanup of cleanups) cleanup(); root.remove(); } };
}
