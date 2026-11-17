import {createComponentFactory,createLayout,mountPanelControls} from '../core/components.mjs';
import {resolveSceneFields} from '../core/scene-fields.mjs';
import {COMPOSITIONS} from './catalog.mjs';

const scene = COMPOSITIONS['resizable-panel'].scene;
const widthField = scene.fields.width;
export const createResizablePanelState=()=>({panel:{width:widthField.defaultValue,open:true},name:'Min arbejdsflade'});

/** Reference composition; all panel interaction comes from the shared controller. */
export function mountResizablePanel(theme,{document=globalThis.document,state=createResizablePanelState(),configuration={},announce=()=>{},onChange=()=>{},idPrefix='resizable-panel'}={}) {
  const initial = resolveSceneFields(scene, configuration);
  let side = initial.side;
  let authoredWidth = configuration.width;
  let destroyed = false;
  const c=createComponentFactory(theme,{document});
  const prefix=String(idPrefix).replace(/[^a-zA-Z0-9_-]/g,'-');
  const node=(tag,className)=>{const el=document.createElement(tag);el.className=className;return el;};
  const heading=text=>c('heading',{variant:'panel',slots:{root:{tag:'h4',text}}});
  const root=createLayout('workspace',{document});root.className+=' ds-composition ds-scope';
  root.setAttribute('role','region');root.setAttribute('aria-label','Panel med træk og sammenklapning');
  root.append(c('instruction-note',{text:'Træk skillelinjen mod sidepanelets kant, til lukkezonen vises, og slip. Træk kantgrebet ind mod arbejdsfladen for at åbne igen. Escape annullerer. Du kan også bruge piletaster og Enter på skillelinjen.'}));
  const layout=node('div','ds-panel-layout composition-panel-layout');
  const main=node('section','ds-panel-content');
  const preview=c('text',{text:state.name});
  main.append(heading('Plads til dit arbejde'),c('text',{text:'Tilpas panelets bredde og mærk, hvordan arbejdsfladen følger med. Skriv i feltet og luk panelet; din tekst bliver bevaret.',variant:'secondary'}),preview);
  const handle=node('button','ds-panel-resize');handle.setAttribute('aria-label','Tilpas egenskabspanelets bredde');
  const panel=node('aside','ds-panel-side');panel.setAttribute('id',prefix+'-properties');panel.setAttribute('aria-label','Egenskaber');
  const name=c('field',{idPrefix:prefix+'-name',label:'Navn',value:state.name,controlVariant:'desktop',hint:'Kladde og bredde bevares, når panelet lukkes.'});
  panel.append(heading('Egenskaber'),name);
  const toggle=c('button',{variant:'ghost',size:'small',iconOnly:true,icon:'◀',label:'Vis egenskaber',attrs:{'data-panel-demo-toggle':''}});
  const status=c('text',{text:'',variant:'small',attrs:{'data-panel-demo-status':''}});
  layout.append(main,handle,panel,toggle);root.append(layout,status);
  const input=name.querySelector('input');
  const edit=()=>{state.name=input.value;preview.textContent=state.name;onChange(state);};
  input.addEventListener('input',edit);
  function paint() {
    const {width,open} = state.panel;
    const label=open?'Skjul egenskaber':'Vis egenskaber';
    toggle.setAttribute('aria-label',label);toggle.setAttribute('title',label);
    toggle.querySelector('.ds-button__icon').textContent=(side==='right')===open?'▶':'◀';
    status.textContent=(open?'Panelet er åbent':'Panelet er lukket')+' · '+width+' px · Din kladde bevares';
  }
  function update(value) {
    const opening=value.open&&!state.panel.open,changed=value.open!==state.panel.open;
    Object.assign(state.panel,value);
    paint();
    if(value.open&&(document.activeElement===toggle||(opening&&document.activeElement===document.body))&&document.defaultView?.getComputedStyle?.(handle).display!=='none')handle.focus({preventScroll:true});
    if(changed)announce(value.open?'Egenskabspanelet er åbnet.':'Egenskabspanelet er lukket.');
    onChange(state);
  }
  function bind(width) {
    const controls = mountPanelControls({
      container:layout,panel,handle,toggle,width,side,open:state.panel.open,
      collapsible:true,minimum:widthField.min,maximum:widthField.max,document,onChange:update,
    });
    state.panel.width=Number(handle.getAttribute('aria-valuenow'));
    paint();
    return controls;
  }
  let controls=bind(authoredWidth===undefined?state.panel.width:initial.width);

  function setConfiguration(patch = {}) {
    if(destroyed)throw new Error('Panelet er afmonteret.');
    const next = resolveSceneFields(scene, patch);
    const nextSide = Object.hasOwn(patch,'side')?next.side:side;
    const widthChanged = Object.hasOwn(patch,'width')&&next.width!==authoredWidth;
    if(widthChanged)authoredWidth=next.width;
    if(nextSide!==side){
      controls.destroy();
      // The new controller should restore the panel's own inert state when it opens.
      panel.inert=false;
      side=nextSide;
      const previousWidth=state.panel.width;
      controls=bind(widthChanged?next.width:previousWidth);
      if(state.panel.width!==previousWidth)onChange(state);
    }else if(widthChanged){
      controls.setWidth(next.width);
    }
  }
  return {
    element:root,
    get controls(){return controls;},
    setConfiguration,
    destroy(){destroyed=true;input.removeEventListener('input',edit);controls.destroy();},
  };
}
