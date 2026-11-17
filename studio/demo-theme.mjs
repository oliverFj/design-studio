const messageType = 'stade:demo-theme';

export function sendDemoTheme(frame, theme, mode) {
  const location = frame.ownerDocument.defaultView?.location;
  if (!location) return;
  const origin = location.protocol === 'file:' ? '*' : location.origin;
  frame.contentWindow?.postMessage({type:messageType, theme, mode}, origin);
}

/** Only the gallery hosting this demo may change its inherited theme. */
export function receiveDemoTheme(window, apply) {
  if (window.parent === window) return () => {};
  const origin = window.location.protocol === 'file:' ? 'null' : window.location.origin;
  const receive = event => {
    const {data} = event;
    if (event.source !== window.parent || event.origin !== origin || data?.type !== messageType) return;
    if (data.theme?.schemaVersion !== 2) return;
    try { apply(data.theme, data.mode); } catch { /* Keep the last valid theme. */ }
  };
  window.addEventListener('message',receive);
  return () => window.removeEventListener('message',receive);
}
