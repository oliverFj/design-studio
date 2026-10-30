import {createComponentRenderer, mountMenuControls, createIcon} from '../core/components.mjs';

// Product composition: placement and commands stay outside the shared controller.
export function renderMenuExample(pack, idPrefix='menu-example', render=createComponentRenderer(pack)) {
 const id=suffix=>idPrefix+'-'+suffix;
 const trigger=(name,target)=>({tag:'button',part:'item',text:name,attrs:{role:'menuitem','aria-haspopup':'menu','aria-controls':id(target),tabindex:'-1'}});
 const indicator=name=>({tag:'span',iconName:name,attrs:{'aria-hidden':'true'}});
 const item=(name,attrs={})=>({component:'menu-item',options:{slots:{label:name,indicator:attrs['aria-haspopup']?[indicator('chevron-right')]:attrs.role==='menuitemcheckbox'?[indicator('circle')]:''},attrs}});
 const panel=(suffix,label,content)=>render('menu',{attrs:{id:id(suffix),'aria-label':label,hidden:true},slots:{root:content}});
 return '<div data-menu-example>'+render('menubar',{slots:{root:[trigger('Filer','files'),trigger('Vis','view')]}})
  +panel('files','Filer',[item('Ny'),item('Gem',{'aria-disabled':'true'}),item('Eksportér',{'aria-haspopup':'menu','aria-controls':id('export')})])
  +panel('export','Eksportér',[item('Som billede'),item('Som tekst')])
  +panel('view','Vis',[item('Vis detaljer',{role:'menuitemcheckbox','aria-checked':'false'}),item('Standardvisning')])
  +'<p role="status" data-menu-result>Afprøv med klik eller tastatur.</p></div>';
}

export function bindMenuExamples(root) {
 const controls=[...root.querySelectorAll('[data-menu-example]')].map(example=>mountMenuControls(example,{onAction(item){
  const label=item.querySelector('.ds-menu-item__label').textContent;
  if(item.getAttribute('role')==='menuitemcheckbox'){
   const checked=item.getAttribute('aria-checked')!=='true';item.setAttribute('aria-checked',String(checked));
   item.querySelector('.ds-menu-item__indicator').replaceChildren(createIcon(checked?'check':'circle',{size:'small'},{document:item.ownerDocument}));
  }
  example.querySelector('[data-menu-result]').textContent=label+(item.getAttribute('aria-checked')!==null?' · '+(item.getAttribute('aria-checked')==='true'?'til':'fra'):' · valgt');
 }}));
 return {destroy(){for(const control of controls)control.destroy();}};
}
