import {createComponentRenderer,mountDialog,mountDrawer,mountPopover,mountTooltip} from '../core/components.mjs';

/** Interactive examples use the public runtime. They do not define new roles. */
export function renderOverlayExample(pack,role,idPrefix='overlay-example',render=createComponentRenderer(pack),variant){
 const button=(text,attrs={})=>render('button',{text,variant:'tertiary',attrs});
 const controls={id:idPrefix+'-panel',hidden:true,'data-overlay-panel':''};
 if(role==='tooltip')return '<div data-overlay-example="tooltip">'+button('Vis hjælp',{'data-overlay-trigger':''})+render('tooltip',{text:'Hjælpen bliver synlig ved hover eller fokus. Escape lukker den.',idPrefix,variant,attrs:controls})+'</div>';
 const options={idPrefix,variant,title:role==='dialog'?'Gennemgå oplysninger':role==='drawer'?'Projektets detaljer':'Supplerende indstillinger',describeBody:false,attrs:controls,
  slots:{body:[{component:'field',options:{idPrefix:idPrefix+'-field',label:'Navn',value:'En bevaret kladde',hint:'Indholdet bevares, når panelet lukkes.'}}],footer:[{component:'button',options:{text:'Luk',variant:'tertiary',attrs:{'data-ds-close':''}}}]}};
 const panel=render(role,options);
 const title=role==='dialog'?'Åbn dialog':role==='drawer'?'Åbn sidepanel':'Vis indstillinger';
 let html='<div data-overlay-example="'+role+'">'+button(title,{'data-overlay-trigger':''})+panel+'</div>';
 if(role==='drawer')html+='<div data-overlay-example="drawer" data-overlay-modal="false">'+button('Åbn uden blokering',{'data-overlay-trigger':''})+render(role,{...options,idPrefix:idPrefix+'-modeless',attrs:{...controls,id:idPrefix+'-modeless-panel'},slots:{...options.slots,body:[{component:'field',options:{idPrefix:idPrefix+'-modeless-field',label:'Notat',value:'Arbejdsfladen er stadig tilgængelig',hint:'Panelet er ikke modalt.'}}]}})+'</div>';
 return html;
}

export function bindOverlayExamples(root){
 const controls=[];
 for(const example of root.querySelectorAll('[data-overlay-example]')){
  const role=example.getAttribute('data-overlay-example'),trigger=example.querySelector('[data-overlay-trigger]'),panel=example.querySelector('[data-overlay-panel]');
  if(!trigger||!panel)continue;
  if(role==='tooltip')controls.push(mountTooltip(trigger,panel));
  else if(role==='popover')controls.push(mountPopover(trigger,panel));
  else {panel.removeAttribute('hidden');controls.push((role==='drawer'?mountDrawer:mountDialog)(panel,{trigger,modal:example.getAttribute('data-overlay-modal')!=='false'}));}
 }
 return {destroy(){for(const control of controls)control.destroy();}};
}
