import {createComponentRenderer,createImageExamples,mountAvatarFallbacks} from '../core/components.mjs';

export function renderContentExample(pack,idPrefix='content-example',render=createComponentRenderer(pack)){
 idPrefix=String(idPrefix).replace(/[^a-zA-Z0-9_-]/g,'-');
 const portrait=createImageExamples(pack)[0].src;
 return '<div data-content-example>'+render('card',{slots:{
  header:'Et fælles arbejdsområde med plads til lange navne og indlejret indhold',
  body:[
   {component:'stack',options:{slots:{root:[
    {component:'text',options:{text:'Deltagere får initialer, mens billeder hentes, eller hvis en billedfil mangler.'}},
    {component:'avatar-group',options:{label:'Deltagere i arbejdsområdet',variant:'overlap',items:[{name:'Anna Larsen',src:portrait},{name:'Mikkel Holm',src:'data:image/png;base64,bm90LWFuLWltYWdl'},{name:'Sara Østergaard'},{name:'王'}]}},
    {component:'card',options:{slots:{header:'En selvstændig flade i en anden flade',body:'EtMegetLangtProjektOgFilnavnUdenNaturligeMellemrumSomStadigSkalVæreIndenForKortetsBredde',footer:[{component:'badge',options:{text:'Klar til gennemgang'}}]}}},
    {component:'toolbar',options:{label:'Visning af arbejdsområdet',slots:{root:[
     {component:'action-button',options:{label:'Vis detaljer',iconName:'eye',pressed:false,attrs:{'data-content-toggle':'true'}}},
     {component:'action-button',options:{label:'Gemmer ændringer',iconName:'device-floppy',loading:true}},
     {component:'action-button',options:{label:'Fjern',iconName:'trash',disabled:true}}
    ]}}},
    {component:'segmented-control',options:{label:'Indholdsvisning',variant:'wrap',slots:{root:[
     {component:'segmented-option',options:{text:'Alle deltagere',iconName:'layout-grid',pressed:true,attrs:{'data-content-toggle':'true'}}},
     {component:'segmented-option',options:{text:'Mine favoritter med længere beskrivelse',iconName:'star',pressed:false,attrs:{'data-content-toggle':'true'}}}
    ]}}},
    {component:'tag',options:{text:'Følg ændringer i dette arbejdsområde',iconName:'check',pressed:false,attrs:{'data-content-toggle':'true'}}}
   ]}}}
  ],footer:[{component:'button',options:{text:'Fortsæt med arbejdsområdet',iconName:'arrow-right'}}]
 }})+'<p role="status" id="'+idPrefix+'-result" data-content-result>Prøv de navngivne valg. Billedfallback og travl tilstand vises samtidig.</p></div>';
}

export function bindContentExamples(root){
 const fallbacks=mountAvatarFallbacks(root),listeners=[];
 for(const example of root.querySelectorAll('[data-content-example]'))for(const button of example.querySelectorAll('[data-content-toggle]')){
  const change=()=>{
   let group=button.parentNode;while(group&&group!==example&&!group.className.split(' ').includes('ds-segmented-control'))group=group.parentNode;
   if(group===example)group=null;
   const pressed=group?true:button.getAttribute('aria-pressed')!=='true';
   if(group)for(const option of group.querySelectorAll('.ds-segmented-option'))if(option!==button){option.setAttribute('aria-pressed','false');option.removeAttribute('data-state');}
   button.setAttribute('aria-pressed',String(pressed));
   if(pressed)button.setAttribute('data-state','pressed');else button.removeAttribute('data-state');
   if(button.className.split(' ').includes('ds-tag'))button.setAttribute('data-variant',pressed?'selected':'default');
   example.querySelector('[data-content-result]').textContent=button.textContent.trim()+(pressed?' · valgt':' · ikke valgt');
  };
  button.addEventListener('click',change);listeners.push([button,change]);
 }
 return {destroy(){fallbacks.destroy();for(const [button,change]of listeners)button.removeEventListener('click',change);}};
}
