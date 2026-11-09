import {createComponentFactory,createLayout,mountPanelControls} from '../core/components.mjs';

export const createResizablePanelState=()=>({panel:{width:310,open:true},name:'Min arbejdsflade'});

/** Reference composition; all panel interaction comes from the shared controller. */
export function mountResizablePanel(theme,{document=globalThis.document,state=createResizablePanelState(),announce=()=>{},onChange=()=>{},idPrefix='resizable-panel'}={}) {
  const c=createComponentFactory(theme,{document});
  const prefix=String(idPrefix).replace(/[^a-zA-Z0-9_-]/g,'-');
  const node=(tag,className)=>{const el=document.createElement(tag);el.className=className;return el;};
  const heading=text=>c('heading',{variant:'panel',slots:{root:{tag:'h4',text}}});
  const root=createLayout('workspace',{document});root.className+=' ds-composition ds-scope';
  root.setAttribute('role','region');root.setAttribute('aria-label','Panel med træk og sammenklapning');
  root.append(c('instruction-note',{text:'Træk skillelinjen mod højre, til lukkezonen vises, og slip. Træk kantgrebet mod venstre for at åbne igen. Escape annullerer. Du kan også bruge piletaster og Enter på skillelinjen.'}));
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
  function update(value) {
    const opening=value.open&&!state.panel.open,changed=value.open!==state.panel.open;
    Object.assign(state.panel,value);
    const label=value.open?'Skjul egenskaber':'Vis egenskaber';
    toggle.setAttribute('aria-label',label);toggle.setAttribute('title',label);
    toggle.querySelector('.ds-button__icon').textContent=value.open?'▶':'◀';
    status.textContent=(value.open?'Panelet er åbent':'Panelet er lukket')+' · '+value.width+' px · Din kladde bevares';
    if(value.open&&(document.activeElement===toggle||(opening&&document.activeElement===document.body))&&document.defaultView?.getComputedStyle?.(handle).display!=='none')handle.focus({preventScroll:true});
    if(changed)announce(value.open?'Egenskabspanelet er åbnet.':'Egenskabspanelet er lukket.');
    onChange(state);
  }
  const controls=mountPanelControls({container:layout,panel,handle,toggle,width:state.panel.width,open:state.panel.open,collapsible:true,maximum:440,document,onChange:update});
  status.textContent=(state.panel.open?'Panelet er åbent':'Panelet er lukket')+' · '+state.panel.width+' px · Din kladde bevares';
  return {element:root,controls,destroy(){input.removeEventListener('input',edit);controls.destroy();}};
}
