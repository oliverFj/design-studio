import {createComponentRenderer,mountTabs} from '../core/components.mjs';

export function renderNavigationExample(pack,idPrefix='navigation-example',render=createComponentRenderer(pack),{variant}={}){
 return '<div data-navigation-example>'+render('tabs',{idPrefix,variant,label:'Eksempel på indholdsfaner',items:[
  {id:'overview',label:'Overblik',content:'Fanerne skifter indhold uden at erstatte felter eller deres kladder.'},
  {id:'details',label:'Detaljer med en længere overskrift',content:[{component:'field',options:{idPrefix:idPrefix+'-draft',label:'En kladde, der bliver bevaret',hint:'Skift fane og tilbage igen.',value:'Mine noter'}}]},
  {id:'unavailable',label:'Ikke tilgængelig endnu',content:'Dette indhold kan ikke vælges.',disabled:true},
 ]})+'<p role="status" data-navigation-result>Prøv piletaster, Home og End.</p>'+'</div>';
}

export function bindNavigationExamples(root){
 const controllers=[...root.querySelectorAll('[data-navigation-example]')].map(host=>mountTabs(host,{onChange(id){const result=host.querySelector('[data-navigation-result]');if(result)result.textContent='Aktiv fane: '+id;}}));
 return {destroy(){for(const controller of controllers)controller.destroy();}};
}
