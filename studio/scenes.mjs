import {createComponentFactory} from '../core/components.mjs';
import {mountBlogScene,mountShopScene} from './scenes/editorial-commerce.mjs';
import {mountEditorScene,mountOverviewScene} from './scenes/workspaces.mjs';
import {sendDemoTheme} from './demo-theme.mjs';

const CASES = {
  overview: {name:'Overblik', mount:mountOverviewScene},
  blog: {name:'Blog', mount:mountBlogScene},
  shop: {name:'Webshop', mount:mountShopScene},
  editor: {name:'Editor', mount:mountEditorScene},
};
const STUDIES = {
  aureol: {name:'Aureol', demo:'./examples/scenes/aureol.html?embedded=1'},
  obsidian: {name:'Obsidian', demo:'./examples/scenes/obsidian.html?embedded=1'},
};

export const createSceneState = (selected='blog') => ({selected, drafts:{}});

function fitDemoFrame(frame) {
  let observer;
  const onLoad = () => {
    observer?.disconnect();
    const body = frame.contentDocument?.body;
    const Observer = frame.ownerDocument.defaultView?.ResizeObserver;
    if (!body || !Observer) return;
    const fit = () => {
      const height = Math.ceil(body.getBoundingClientRect().height);
      if (height > 0) frame.style.blockSize = Math.max(360, height) + 'px';
    };
    observer = new Observer(fit);
    observer.observe(body);
    fit();
  };
  frame.addEventListener('load', onLoad);
  return () => {
    frame.removeEventListener('load', onLoad);
    observer?.disconnect();
  };
}

/** The gallery owns selection, while each live demo owns its own state. */
export function mountSceneGallery(theme, {
  document=globalThis.document, sceneDemos={}, mode,
  state=createSceneState(sceneDemos.overview?'overview':'blog'), announce=()=>{}, idPrefix='use-scenes',
}={}) {
  let c = createComponentFactory(theme,{document});
  const el = (tag,className) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  };
  const prefix = String(idPrefix).replace(/[^a-zA-Z0-9_-]/g,'-');
  const cases = {...CASES};
  for (const [id,{filename,name}] of Object.entries(sceneDemos)) {
    cases[id] = { name, demo:'./examples/stade-scene/'+filename+'?embedded=1',
      editor:'./examples/stade-scene/index.html?scene='+encodeURIComponent(id) };
  }
  const scenes = {...cases,...STUDIES};
  if (!Object.hasOwn(scenes,state.selected)) state.selected = sceneDemos.overview?'overview':'blog';
  state.drafts ||= {};
  const root = el('div','use-scenes ds-scope');
  const groups = [['Demoer',cases],['Materialestudier',STUDIES]].map(([label,collection])=>({
    tag:'optgroup', attrs:{label},
    children:Object.entries(collection).map(([value,item])=>({tag:'option',attrs:{value},text:item.name})),
  }));
  const header = el('header','use-scene-header');
  const choice = c('choice-field',{
    label:'Demo', hint:'', value:state.selected, controlVariant:'desktop',
    idPrefix:prefix+'-choice', slots:{control:{tag:'select',children:groups}},
  });
  const picker = choice.querySelector('select');
  picker.setAttribute('aria-controls',prefix+'-preview');
  const actions = el('div','use-scene-actions');
  const reset = c('button',{
    variant:'ghost',size:'small',text:'Nulstil demo',attrs:{'data-reset-use-scene':''},
  });
  actions.append(reset);
  header.append(choice,actions);
  const stage = el('section','use-scene-stage');
  stage.setAttribute('id',prefix+'-preview');
  const inline = el('div');
  stage.append(inline);
  root.append(header,stage);

  const frames = new Map();
  let shownFrame, mounted, editorLink, active = false;

  picker.value = state.selected;
  picker.addEventListener('change',()=>{
    const id = picker.value;
    if (state.selected===id || !Object.hasOwn(scenes,id)) return;
    state.selected = id;
    render();
    announce(scenes[id].name+' vises.');
  });
  reset.addEventListener('click',()=>{
    const id = state.selected;
    removeFrame(id);
    state.drafts[id] = {};
    render();
    reset.focus();
    announce(scenes[id].name+' er nulstillet.');
  });

  function previewFrame(id,item) {
    if (!frames.has(id)) {
      const frame = el('iframe','use-scene-frame');
      frame.setAttribute('title',item.name+' · interaktiv demo');
      const stopFitting = fitDemoFrame(frame);
      const inheritTheme = () => sendDemoTheme(frame,theme,mode);
      frame.addEventListener('load',inheritTheme);
      frame.setAttribute('src',item.demo);
      frames.set(id,{frame,stopFitting,inheritTheme});
      stage.append(frame);
    }
    return frames.get(id).frame;
  }
  function removeFrame(id) {
    const entry = frames.get(id);
    if (!entry) return;
    entry.stopFitting();
    entry.frame.removeEventListener('load',entry.inheritTheme);
    entry.frame.remove();
    frames.delete(id);
  }
  function render() {
    const id = state.selected, item = scenes[id];
    editorLink?.remove();
    editorLink = item.editor && c('button',{variant:'secondary',size:'small',href:item.editor,text:'Åbn i Scene'});
    if (editorLink) actions.insertBefore(editorLink,reset);
    stage.setAttribute('aria-label','Demovisning · '+item.name);
    stage.setAttribute('data-case-preview',id);

    shownFrame?.setAttribute('hidden','');
    shownFrame = undefined;
    mounted?.destroy();
    mounted = undefined;
    inline.replaceChildren();
    if (item.demo) {
      shownFrame = previewFrame(id,item);
      shownFrame.removeAttribute('hidden');
      sendDemoTheme(shownFrame,theme,mode);
    } else {
      mounted = item.mount(theme,{document,state:state.drafts[id]||={},idPrefix:prefix+'-'+id,announce});
      inline.append(mounted.element);
      if (active) mounted.activate?.();
    }
  }
  render();
  return {
    element:root,state,
    activate() { if (active) return; active = true; mounted?.activate?.(); },
    setTheme(next, nextMode) {
      theme = next;
      mode = nextMode;
      c = createComponentFactory(theme,{document});
      if (shownFrame) sendDemoTheme(shownFrame,theme,mode);
      else render();
    },
    destroy() {
      active = false;
      mounted?.destroy();
      for (const id of frames.keys()) removeFrame(id);
      root.remove();
    },
  };
}
