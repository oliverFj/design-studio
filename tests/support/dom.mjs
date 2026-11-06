// Focused native-DOM model for composition behavior, without a browser dependency.
class Element {
  constructor(tag, document) { this.tagName = tag.toUpperCase(); this.ownerDocument = document; this.attributes = new Map(); this.childNodes = []; this.listeners = new Map(); this.style = {}; this.value = ''; this._text = ''; }
  get children() { return this.childNodes.filter(node => node.tagName !== '#TEXT'); }
  get lastElementChild() { return this.children.at(-1); }
  get firstChild() { return this.childNodes[0] || null; }
  get nextSibling() { const nodes = this.parentNode?.childNodes || []; return nodes[nodes.indexOf(this) + 1] || null; }
  get className() { return this.getAttribute('class') || ''; }
  set className(value) { this.setAttribute('class', value); }
  get textContent() { return this._text + this.childNodes.map(node => node.textContent).join(''); }
  set textContent(value) { this.replaceChildren(); this._text = String(value); }
  setAttribute(key, value) { this.attributes.set(key, String(value)); if (key === 'id') this.id = String(value); }
  getAttribute(key) { return this.attributes.get(key) ?? null; }
  removeAttribute(key) { this.attributes.delete(key); }
  contains(node) { return this === node || this.childNodes.some(child => child.contains(node)); }
  appendChild(node) { return this.insertBefore(node, null); }
  insertBefore(node, before) { node.parentNode?.removeChild(node); this.childNodes.splice(before ? this.childNodes.indexOf(before) : this.childNodes.length, 0, node); node.parentNode = this; return node; }
  append(...nodes) { nodes.forEach(node => this.appendChild(node)); }
  removeChild(node) { this.childNodes.splice(this.childNodes.indexOf(node), 1); node.parentNode = null; if (node.contains(this.ownerDocument.activeElement)) this.ownerDocument.activeElement = this.ownerDocument.body; return node; }
  replaceChildren(...nodes) { [...this.childNodes].forEach(node => this.removeChild(node)); this._text = ''; this.append(...nodes); }
  remove() { this.parentNode?.removeChild(this); }
  matches(selector) {
    if (selector.startsWith('.')) return this.className.split(' ').includes(selector.slice(1));
    if (selector.startsWith('#')) return this.getAttribute('id') === selector.slice(1);
    const attribute = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if (attribute) return attribute[2] === undefined ? this.attributes.has(attribute[1]) : this.getAttribute(attribute[1]) === attribute[2];
    return this.tagName.toLowerCase() === selector;
  }
  querySelectorAll(selector) { return this.children.flatMap(node => [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  addEventListener(type, callback) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(callback); }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
  focus() { this.ownerDocument.activeElement = this; fire(this, 'focusin'); }
  getBoundingClientRect() { return { top: 0, height: 32 }; }
}
export function dom() {
  const document = { createElement(tag) { return new Element(tag, document); }, createElementNS(namespace, tag) { const node = new Element(tag, document); node.namespaceURI = namespace; return node; }, createTextNode(text) { const node = new Element('#text', document); node.textContent = text; return node; } };
  document.body = document.createElement('body'); document.activeElement = document.body; return document;
}
export function fire(target, type, values = {}) {
  const event = { target, type, key: '', preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.stopped = true; }, ...values };
  for (let node = target; node; node = node.parentNode) {
    for (const callback of [...(node.listeners.get(type) || [])]) callback(event);
    if (event.stopped) break;
  }
  return event;
}
