import {createComponentRenderer} from '../core/components.mjs';

const notes=[
 ['Forberedelse','Saml de oplysninger, der skal bruges, før gennemgangen begynder.'],
 ['Formål','Aftal, hvad resultatet skal gøre lettere for den næste bruger.'],
 ['Indhold','Gennemgå titler, forklaringer og de vigtigste oplysninger i deres sammenhæng.'],
 ['Handlinger','Kontrollér, at det næste relevante skridt er tydeligt.'],
 ['Valg','Afprøv flere poster, og se, om den aktuelle kontekst er let at genkende.'],
 ['Feedback','Gennemgå bekræftelser og fejl med realistisk tekst.'],
 ['Tastatur','Brug Tab til fokus og piletaster eller Page Down til at rulle dette område.'],
 ['Afrunding','Saml de åbne spørgsmål, og aftal næste skridt.'],
];

/** The host allocates height; the shared viewport owns scrolling and focus. */
export function renderScrollExample(pack,idPrefix='scroll-example',render=createComponentRenderer(pack),variant='default',state){
 const sections=notes.map(([title,text],index)=>({component:'stack',options:{variant:'compact',slots:{root:[
  {component:'label',options:{text:String(index+1).padStart(2,'0')+' · '+title}},
  {component:'text',options:{text}},
 ]}}}));
 const content={component:'stack',options:{slots:{root:sections}}};
 const card=body=>({component:'card',options:{slots:{root:{tag:'section',children:[
  {tag:'h3',part:'header',text:'Noter fra gennemgangen'},
  {tag:'div',part:'body',children:[body]},
 ]}}}});
 const inner=variant==='contained'?{...card(content),part:'surface'}:content;
 const scrollOptions={idPrefix,variant,...(state&&state!=='normal'?{state}:{}),slots:{
  viewport:{tag:'div',attrs:{role:'region','aria-label':variant==='body'?'Gennemgangsnoter under fast overskrift':'Gennemgangsnoter',tabindex:'0'},children:[{tag:'div',part:'content'}]},
  content:[inner],
 }};
 const html=variant==='body'?render('card',card({component:'scroll-area',options:scrollOptions}).options):render('scroll-area',scrollOptions);
 return '<div data-scroll-example="'+(variant==='contained'?'contained':variant==='body'?'body':'default')+'">'+html+'</div>';
}
