import { animateStandard } from './motion.mjs';

let panelSequence = 0;

/** Right-hand panel disclosure/resizing. Opt-in collapse commits on release;
 * the toggle also acts as a draggable edge grip. Hosts retain the same content. */
export function mountPanelControls({ container, panel, handle, toggle, minimum = 240, maximum = 560, width = 320, open = true, collapsible = false, collapseThreshold = Math.min(64, minimum / 2), onChange = () => {}, document = container?.ownerDocument ?? globalThis.document } = {}) {
  if (![container, panel, toggle].every(node => node?.setAttribute && node?.addEventListener)
    || (handle && (!handle.setAttribute || !handle.addEventListener))) throw new Error('Panel controls require a container, panel and toggle.');
  if (![minimum, maximum, width, collapseThreshold].every(Number.isFinite) || minimum <= 0 || maximum < minimum || collapseThreshold <= 0 || collapseThreshold >= minimum || typeof collapsible !== 'boolean' || typeof open !== 'boolean' || typeof onChange !== 'function') throw new Error('Invalid panel limits or initial state.');
  let currentWidth = width, isOpen = open, destroyed = false, drag = null, keyboardStart = null, transition = null, suppressClick = false;
  const originalInert = Boolean(panel.inert);
  const listeners = [], pointerTarget = document?.addEventListener ? document : handle;
  const listen = (node, type, handler) => { if (node?.addEventListener) { node.addEventListener(type, handler); listeners.push([node, type, handler]); } };
  const alive = () => { if (destroyed) throw new Error('The panel controls have been destroyed.'); };
  const notify = () => onChange({ width: currentWidth, open: isOpen });
  const hide = (node, hidden) => { if (!node) return; node.hidden = hidden; if (hidden) node.setAttribute('hidden', ''); else node.removeAttribute('hidden'); };
  const property = (name, value) => { if (container.style.setProperty) container.style.setProperty(name, value); else container.style[name] = value; };
  const removeProperty = name => { if (container.style.removeProperty) container.style.removeProperty(name); else delete container.style[name]; };
  const columns = () => document?.defaultView?.getComputedStyle?.(container).gridTemplateColumns;
  if (collapsible) {
    container.setAttribute('data-panel-collapsible', 'true'); toggle.setAttribute('data-panel-grip', '');
    toggle.setAttribute('aria-description', 'Klik for at åbne eller lukke. Træk for at ændre bredden, og slip ved kanten for at lukke. Escape annullerer trækket.');
  }
  if (!panel.getAttribute('id')) {
    let id;
    do { id = 'ds-panel-' + ++panelSequence; } while (document?.getElementById?.(id));
    panel.setAttribute('id', id);
  }
  toggle.setAttribute('aria-controls', panel.getAttribute('id'));
  if (toggle.tagName === 'BUTTON') toggle.setAttribute('type', 'button');
  if (handle) {
    handle.setAttribute('role', 'separator'); handle.setAttribute('aria-orientation', 'vertical'); handle.setAttribute('aria-controls', panel.getAttribute('id'));
    if (!handle.getAttribute('aria-label')) handle.setAttribute('aria-label', 'Juster sidepanelets bredde');
    if (handle.tagName === 'BUTTON') handle.setAttribute('type', 'button');
  }
  function limits() {
    const bounds = container.getBoundingClientRect?.(), available = Number.isFinite(bounds?.width) && bounds.width > 0 ? bounds.width : container.clientWidth;
    const measured = Number.isFinite(available) && available > 0;
    const compact = measured && (available < minimum + 248 || (Number.isFinite(bounds?.height) && bounds.height > 0 && bounds.height < 320));
    container.setAttribute('data-panel-compact', String(compact));
    return { minimum, maximum: Number.isFinite(available) && available > 0 && !compact ? Math.min(maximum, Math.max(minimum, available - 248)) : maximum };
  }
  function applyWidth(value, emit = true) {
    const range = limits(), view = document?.defaultView;
    const unavailable = handle && (!isOpen || container.getAttribute('data-panel-compact') === 'true'
      || view?.matchMedia?.('(max-width: 800px), (max-height: 480px)').matches || view?.getComputedStyle?.(handle).display === 'none');
    if (unavailable) {
      if (drag) { value = drag.width; finishDrag(); }
      keyboardStart = null;
      if (handle.contains(document?.activeElement)) toggle.focus({ preventScroll: true });
    }
    const next = Math.min(range.maximum, Math.max(range.minimum, Math.round(value))), changed = next !== currentWidth;
    currentWidth = next;
    property('--ds-panel-width', next + 'px');
    if (handle) for (const [name, value] of [['aria-valuemin', range.minimum], ['aria-valuemax', range.maximum], ['aria-valuenow', next], ['aria-valuetext', next + ' pixels']]) handle.setAttribute(name, String(value));
    if (emit && changed) notify();
  }
  function finishDrag(cancel = false) {
    if (!drag) return;
    const previous = drag; drag = null; keyboardStart = null;
    if (cancel && previous.moved && previous.target === toggle) suppressClick = true;
    try { previous.target.releasePointerCapture?.(previous.id); } catch { /* Capture may already have ended. */ }
    clearPreview();
    if (!isOpen) hide(panel, true);
    panel.inert = isOpen ? originalInert : collapsible || originalInert;
    if (cancel) applyWidth(previous.width);
  }
  function clearPreview() {
    container.removeAttribute('data-panel-drag'); container.removeAttribute('data-panel-hint');
    container.removeAttribute('data-panel-revealing');
    removeProperty('--ds-panel-drag-offset'); removeProperty('--ds-panel-preview-width');
  }
  function finishTransition() {
    transition?.cancel(); transition = null;
    container.removeAttribute('data-panel-transition');
    hide(panel, !isOpen); hide(handle, !isOpen);
    panel.inert = isOpen ? originalInert : collapsible || originalInert;
  }
  function setOpen(value, fromColumns) {
    alive(); if (typeof value !== 'boolean') throw new Error('Panel open state must be boolean.');
    finishDrag(true); finishTransition();
    const before = fromColumns ?? columns();
    const changed = value !== isOpen;
    if (!value) {
      if (panel.contains(document?.activeElement) || handle?.contains(document?.activeElement)) toggle.focus({ preventScroll: true });
    }
    isOpen = value; container.setAttribute('data-panel-open', String(value)); toggle.setAttribute('aria-expanded', String(value));
    hide(panel, !value); hide(handle, !value); handle?.setAttribute('tabindex', value ? '0' : '-1');
    panel.inert = value ? originalInert : collapsible || originalInert;
    if (collapsible && changed && before && container.getAttribute('data-panel-compact') !== 'true') {
      const after = columns();
      container.setAttribute('data-panel-transition', value ? 'opening' : 'closing');
      hide(panel, false); hide(handle, false);
      const animation = animateStandard(container, [{gridTemplateColumns: before}, {gridTemplateColumns: after}]);
      transition = animation;
      if (animation) animation.finished.then(() => { if (transition === animation) finishTransition(); }).catch(() => {});
      else finishTransition();
    }
    if (changed) notify();
  }
  function setWidth(value) { alive(); if (!Number.isFinite(value)) throw new Error('Panel width must be a finite number.'); applyWidth(value); }
  listen(toggle, 'click', event => {
    if (suppressClick && event.detail !== 0) { suppressClick = false; event.preventDefault(); return; }
    suppressClick = false; setOpen(!isOpen);
  });
  listen(handle, 'focusin', () => { keyboardStart = currentWidth; });
  listen(handle, 'focusout', () => { keyboardStart = null; });
  listen(handle, 'keydown', event => {
    if (!isOpen || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape' && (drag || keyboardStart !== null)) {
      event.preventDefault(); event.stopPropagation();
      if (drag) finishDrag(true); else { const start = keyboardStart; keyboardStart = null; applyWidth(start); }
      return;
    }
    if (drag) return;
    if (collapsible && event.key === 'Enter') { event.preventDefault(); setOpen(false); return; }
    const step = event.shiftKey ? 32 : 16, range = limits();
    const next = event.key === 'ArrowLeft' ? currentWidth + step : event.key === 'ArrowRight' ? currentWidth - step : event.key === 'Home' ? range.minimum : event.key === 'End' ? range.maximum : null;
    if (next === null) return;
    keyboardStart ??= currentWidth; event.preventDefault(); applyWidth(next);
  });
  function beginDrag(target, event) {
    limits();
    const view = document?.defaultView;
    if (drag || (!isOpen && !collapsible) || container.getAttribute('data-panel-compact') === 'true'
      || view?.matchMedia?.('(max-width: 800px), (max-height: 480px)').matches
      || view?.getComputedStyle?.(target).display === 'none'
      || (event.button !== undefined && event.button !== 0) || !Number.isFinite(event.clientX)) return;
    finishTransition(); suppressClick = false;
    event.preventDefault(); target.focus({ preventScroll: true });
    drag = { target, id: event.pointerId, x: event.clientX, width: currentWidth, wasOpen: isOpen, raw: isOpen ? currentWidth : 0, moved: false };
    try { target.setPointerCapture?.(event.pointerId); } catch { /* Document listeners remain available. */ }
  }
  listen(handle, 'pointerdown', event => { if (isOpen) beginDrag(handle, event); });
  if (collapsible) listen(toggle, 'pointerdown', event => beginDrag(toggle, event));
  listen(pointerTarget, 'pointermove', event => {
    if (!drag || event.pointerId !== drag.id || !Number.isFinite(event.clientX)) return;
    event.preventDefault();
    drag.raw = (drag.wasOpen ? drag.width : 0) + drag.x - event.clientX;
    drag.moved ||= Math.abs(drag.x - event.clientX) >= 4;
    if (!drag.moved) return;
    if (!collapsible) { applyWidth(drag.raw); return; }
    const closing = drag.wasOpen && drag.raw < minimum - collapseThreshold;
    container.setAttribute('data-panel-drag', closing ? 'close' : drag.wasOpen ? 'resize' : 'open');
    if (closing || (!drag.wasOpen && drag.raw >= collapseThreshold)) container.setAttribute('data-panel-hint', closing ? 'Slip for at lukke' : 'Slip for at åbne');
    else container.removeAttribute('data-panel-hint');
    if (drag.wasOpen) {
      property('--ds-panel-drag-offset', Math.min(minimum, Math.max(0, minimum - drag.raw)) + 'px');
      applyWidth(drag.raw);
    } else {
      container.setAttribute('data-panel-revealing', 'true');
      property('--ds-panel-preview-width', Math.max(0, Math.min(currentWidth, drag.raw)) + 'px');
      panel.inert = true; hide(panel, false);
    }
  });
  listen(pointerTarget, 'pointerup', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const previous = drag, before = columns();
    finishDrag();
    if (!previous.moved) return;
    suppressClick = previous.target === toggle;
    if (!previous.wasOpen) {
      if (previous.raw >= collapseThreshold) {
        if (previous.raw > minimum) applyWidth(previous.raw, false);
        setOpen(true, before);
      }
    } else if (collapsible && previous.raw < minimum - collapseThreshold) {
      applyWidth(previous.width, false); setOpen(false, before);
    }
  });
  listen(pointerTarget, 'pointercancel', event => { if (drag && event.pointerId === drag.id) finishDrag(true); });
  listen(handle, 'lostpointercapture', event => { if (drag && event.pointerId === drag.id) finishDrag(true); });
  if (collapsible) listen(toggle, 'lostpointercapture', event => { if (drag && event.pointerId === drag.id) finishDrag(true); });
  listen(pointerTarget, 'keydown', event => { if (drag && event.key === 'Escape') { event.preventDefault(); finishDrag(true); } });
  const ViewResizeObserver = document?.defaultView?.ResizeObserver ?? globalThis.ResizeObserver;
  const observer = typeof ViewResizeObserver === 'function' ? new ViewResizeObserver(() => { if (!destroyed) applyWidth(currentWidth); }) : null;
  if (observer) observer.observe(container);
  listen(document?.defaultView, 'resize', () => applyWidth(currentWidth));
  applyWidth(width, false); setOpen(open);
  return {
    setOpen, setWidth,
    destroy() {
      if (destroyed) return;
      finishDrag(true); finishTransition(); destroyed = true; observer?.disconnect();
      for (const [node, type, handler] of listeners) node.removeEventListener(type, handler);
    },
  };
}
