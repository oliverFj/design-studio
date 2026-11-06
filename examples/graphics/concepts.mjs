import {GRAPHIC_FAMILY_IDS,GRAPHIC_TOKEN_BINDINGS} from '../../core/graphic-tokens.mjs';
import {resolveTokens} from '../../core/engine.mjs';
import {part,track,trace,parallax} from '../../core/graphics/motion/primitives.mjs';

export const CONCEPTS=Object.freeze([{id:'house',name:'Hus'},{id:'music',name:'Musik'}]);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paint=role=>'var(--g-'+role+')';
const path=(d,role='subject',extra='')=>`<path d="${d}" fill="${paint(role)}" ${extra}/>`;
const line=(d,role='ink',width='var(--g-line-width)')=>`<path d="${d}" fill="none" stroke="${paint(role)}" stroke-width="${width}"/>`;
const rect=(x,y,w,h,role='plane')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${paint(role)}"/>`;
const circle=(x,y,r,role='subject')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${paint(role)}"/>`;
// Each part has a reason to exist and a normalized interval in the finite story.
const layer=(key,name,purpose,start,end,body)=>({key,name,purpose,start,end,body});
const grid=()=>Array.from({length:9},(_,i)=>line(`M${60+i*60} 60V360`,'context',1)).join('')+Array.from({length:6},(_,i)=>line(`M60 ${60+i*60}H540`,'context',1)).join('');

const recipes={
 anatomy:{
  house:()=>({label:'Et hus konstrueres fra grundlinje til tag, dør og vindue.',parts:[
   layer('construction','Referenceplan','Et stabilt mål for husets geometri.',0,.18,grid()+line('M105 344H495','edge',1)),
   layer('structure','Husets skal','Tag og facade gør begrebet genkendeligt.',.12,.58,line('M145 326V182L300 85L455 182V326ZM145 182H455M300 85V182')+line('M455 182L484 199V326H455','edge')),
   layer('opening','Åbninger','Døren viser adgang; vinduet viser ophold.',.42,.77,line('M266 326V242H334V326M195 219H235V259H195ZM365 219H405V259H365Z')+circle(300,190,22,'subject')+circle(300,190,11,'ground')),
   layer('details','Optiske mål','Sekundære spor forklarer konstruktionen.',.67,.94,line('M145 362H455M145 355V369M455 355V369M119 182V326M112 182H126M112 326H126','edge',1)+circle(328,284,3,'counter'))
  ]}),
  music:()=>({label:'Fire toner placeres på et nodesystem og forbindes til en frase.',parts:[
   layer('construction','Nodesystem','Et fælles tids- og tonefelt.',0,.22,[160,184,208,232,256].map(y=>line(`M95 ${y}H505`,'context',1)).join('')),
   layer('structure','Rytmisk konstruktion','Stængler og bjælke gør de enkelte toner til en frase.',.15,.65,line('M175 244V116L439 92V220M263 220V108M351 268V100')+line('M175 130L439 106','edge',1)),
   layer('notes','Tonehoveder','En rytme har bestemte hændelser og højder.',.46,.82,[ [162,244],[250,220],[338,268],[426,220] ].map(([x,y],i)=>`<ellipse cx="${x}" cy="${y}" rx="16" ry="11" fill="${paint(i===2?'counter':'subject')}"/>`).join('')),
   layer('details','Frasens spænd','En samlet bue forbinder tonerne uden at efterligne afspilning.',.71,.96,line('M146 300Q300 352 448 278','edge',1)+line('M175 340H439M175 334V346M439 334V346','edge',1))
  ]})
 },
 lightroom:{
  house:()=>({label:'Et roligt hus får dybde og et lysende vindue, mens facaden står stille.',parts:[
   layer('depth','Materialedybde','Huset har et roligt fysisk aftryk.',0,.38,path('M155 325L300 350L472 325L447 190L310 91L155 190Z','depth','opacity="var(--g-depth-opacity)"')),
   layer('structure','Facade og tag','En samlet bolig uden svævende bygningsdele.',.06,.52,path('M145 325V180L295 80L445 180V325Z','plane')+path('M145 180L295 80L445 180L427 193L295 106L163 193Z','context')+line('M145 325V180L295 80L445 180V325Z','edge')),
   layer('recess','Vinduesniche','En lysåbning ligger inde i facaden.',.18,.67,path('M215 273V217a80 80 0 0 1 160 0v56Z','depth')+path('M231 273V217a64 64 0 0 1 128 0v56Z','context')),
   layer('light-field','Lys i boligen','Lyset bærer invitationen inden for en fast åbning.',.3,.88,path('M242 273V219a53 53 0 0 1 106 0v54Z','subject')+circle(295,218,28,'light')+rect(231,273,128,7,'light')),
   layer('details','Adgang','En enkel dør og tærskel gør huset beboeligt.',.55,.96,rect(390,263,27,62,'context')+line('M135 326H455','edge')+circle(411,295,2,'ink'))
  ]}),
  music:()=>({label:'En musikalsk frase får plads i et afgrænset, blødt resonansrum.',parts:[
   layer('depth','Resonansrum','Et samlet rum holder de musikalske dele sammen.',0,.43,`<g opacity="var(--g-depth-opacity)">${rect(106,103,404,224,'depth')}</g>`),
   layer('structure','Ramme','Rummets kanter står stille, mens lyset ankommer.',.05,.56,rect(92,89,404,224,'plane')+rect(109,106,370,190,'context')+line('M92 89H496V313H92Z','edge')),
   layer('light-field','Klanglys','Bløde, koncentriske farvefelter antyder resonans.',.14,.84,circle(294,202,85,'subject')+circle(294,202,65,'plane')+circle(294,202,45,'light')),
   layer('notes','Frase','To sammenbundne toner fastholder motivets betydning.',.36,.87,path('M260 231V153L344 139V214H333V158L271 169V231Z','ink')+`<ellipse cx="251" cy="231" rx="20" ry="14" fill="${paint('ink')}"/><ellipse cx="324" cy="214" rx="20" ry="14" fill="${paint('ink')}"/>`),
   layer('details','Lyskant','Et smalt lys bærer materialets ro.',.55,.96,line('M109 296H479','light',3))
  ]})
 },
 passage:{
  house:()=>({label:'Lag af massive flader bliver til et hus med en reel åbning og en ubrudt adgangsvej.',parts:[
   layer('rear','Bagplaner','To præcise forskydninger etablerer materialets dybde.',0,.3,path('M167 325V183L322 82L477 183V325Z','context')+path('M156 325V194L311 93L466 194V325Z','counter')),
   layer('structure','Facade med gennemgang','En udskæring forbinder ude og inde.',.13,.48,path('M135 325V200L290 100L445 200V325ZM257 325V254a33 33 0 0 1 66 0v71Z','subject','fill-rule="evenodd"')+path('M267 325V255a23 23 0 0 1 46 0v70Z','context')),
   layer('contours','Arkitektonisk register','Lige kanter samler den solide silhuet.',.3,.72,line('M135 325V200L290 100L445 200V325ZM257 325V254a33 33 0 0 1 66 0v71Z')+rect(186,221,38,40,'ground')+rect(356,221,38,40,'ground')),
   layer('route','Adgangsvej','Ruten begynder i dørens åbning og fortsætter mod beskueren.',.55,.87,path('M267 325H313L359 363H298Z','subject')+line('M290 288V352H348')),
   layer('details','Ankomst','En lille modfarve afslutter bevægelsens fortælling.',.84,.97,circle(348,352,7,'counter')+line('M105 326H492','edge',1))
  ]}),
  music:()=>({label:'To præcise toneformer opbygges lag for lag på et fælles nodesystem.',parts:[
   layer('rear','Materialeplan','En afstemt forskydning viser formens vægt.',0,.28,path('M196 277V112H425V253H403V137H218V277Z','context')),
   layer('structure','Frasens masse','En fælles bjælke forbinder de to stængler.',.1,.46,path('M181 274V103H410V250H385V143H206V274Z','subject')+`<ellipse cx="169" cy="274" rx="39" ry="27" fill="${paint('subject')}"/><ellipse cx="373" cy="250" rx="39" ry="27" fill="${paint('subject')}"/>`),
   layer('contours','Konstruktion','Tegningen følger de faste former uden rotation.',.29,.73,line('M181 248V103H410V224M206 253V143H385V229')+line('M181 128H410','ink',1)),
   layer('score','Nodesystem','Tonerne har et fælles felt at høre til i.',.51,.86,[232,256,280,304].map(y=>line(`M98 ${y}H502`,'edge',1)).join('')),
   layer('details','Modstemme','Et lille indlæg bliver synligt efter konstruktionen.',.83,.97,circle(169,274,10,'counter')+circle(373,250,10,'ground'))
  ]})
 },
 fieldlines:{
  house:()=>({label:'En rute fra omgivelserne samler sig og ankommer i husets dør.',route:'M64 300C154 300 160 351 235 351S295 320 295 298',end:[295,298],parts:[
   layer('context','Omgivelsernes spor','Flere mulige veje leder mod et fælles hjem.',0,.38,[0,1,2,3,4].map(i=>line(`M64 ${130+i*32}C160 ${130+i*32} 149 351 235 351S295 320 295 298`,'context',1.5)).join('')),
   layer('structure','Husets adresse','En genkendelig silhuet giver ruten en konkret destination.',.12,.58,line('M190 294V193L295 122L400 193V294H320V243H270V294H190Z','edge',2)+line('M228 210H250V236H228ZM340 210H362V236H340Z','edge',1.5)),
   layer('route','Valgt vej','En sammenhængende rute følges helt til døren.',.25,.83,line('M64 300C154 300 160 351 235 351S295 320 295 298','subject',9)),
   layer('destination','Hjemkomst','Ruten har et tydeligt endepunkt.',.45,.9,circle(295,298,15,'ground')+circle(295,298,9,'counter')),
   layer('details','Adressemarkering','Den afsluttende reference understreger ankomsten.',.78,.97,line('M400 294H470V270','edge',1)+circle(470,270,4,'ink'))
  ]}),
  music:()=>({label:'En melodisk kurve tegnes som en sammenhængende frase mellem tydelige tonepunkter.',route:'M73 240C135 240 134 126 202 126S276 290 346 290S416 175 493 175',end:[493,175],parts:[
   layer('context','Ekko','Beslægtede kurver antyder klang uden at påstå faktiske lyddata.',0,.37,[-40,-20,20,40].map(d=>line(`M73 ${240+d}C135 ${240+d} 134 ${126+d} 202 ${126+d}S276 ${290+d} 346 ${290+d}S416 ${175+d} 493 ${175+d}`,'context',1.5)).join('')),
   layer('structure','Tonefelt','Et let register giver frasen et rum.',.05,.44,line('M73 344H510M202 110V345M346 274V345M493 159V345','edge',1)),
   layer('route','Melodisk frase','Én ubrudt bevægelse bærer den dominerende betydning.',.18,.84,line('M73 240C135 240 134 126 202 126S276 290 346 290S416 175 493 175','subject',8)),
   layer('notes','Tonepunkter','Genkendelige hændelser fastholdes på kurven.',.43,.89,circle(202,126,12,'counter')+circle(346,290,12,'counter')),
   layer('destination','Frasens afslutning','Et klart endepunkt giver plads til stilheden bagefter.',.72,.96,circle(493,175,15,'ground')+circle(493,175,9,'ink'))
  ]})
 }
};

/** Trusted, editable recipes: this authoring registry is separate from Studio roles. */
export function conceptScene(concept,family){
 if(!GRAPHIC_FAMILY_IDS.includes(family))throw new Error('Unknown concept family: '+family);
 if(!CONCEPTS.some(item=>item.id===concept))throw new Error('Unknown concept: '+concept);
 return {concept,family,...recipes[family][concept]()};
}

/** Resolved export uses exactly the selected theme's illustration tokens. */
export function renderConcept(pack,scene,{idPrefix='study-'+scene.family+'-'+scene.concept,tokens=resolveTokens(pack)}={}){
 const prefix=String(idPrefix).replace(/[^a-zA-Z0-9_-]/g,'-');
 const values=Object.fromEntries(Object.entries(GRAPHIC_TOKEN_BINDINGS).map(([key,id])=>['--g-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),tokens[id]]));
 const style=Object.entries(values).map(([key,value])=>key+':'+esc(value)).join(';');
 const body=scene.parts.map(item=>`<g data-part="${item.key}">${item.body}</g>`).join('');
 const resolved=body.replace(/var\((--g-[\w-]+)\)/g,(_,key)=>{if(values[key]===undefined)throw new Error('Unknown graphic variable: '+key);return esc(values[key]);});
 return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420" role="img" aria-labelledby="${prefix}-title" data-family="${scene.family}" data-motif="${scene.concept}" data-motion-duration="${esc(tokens['duration.illustration'])}" style="${style}"><title id="${prefix}-title">${esc(scene.label)}</title><rect width="600" height="420" fill="${esc(values['--g-ground'])}"/><g fill="none" stroke-linecap="round" stroke-linejoin="round">${resolved}</g></svg>`;
}

/** A plan describes poses; the shared player owns playback and accessibility. */
export function createConceptPlan(svg,scene){
 const tracks=[];
 for(const item of scene.parts){
  const node=part(svg,item.key);
  if(!node)throw new Error('Concept scene is missing part: '+item.key);
  const end=scene.family==='lightroom'?item.end:Math.min(item.end,item.start+.22);
  if(!(scene.family==='fieldlines'&&item.key==='destination'))tracks.push(track(node,[{opacity:0},{opacity:1}],item.start,end));
  for(const shape of scene.family==='lightroom'&&item.key!=='details'?[]:node.querySelectorAll('[stroke]')){
   const drawing=trace(shape,item.start,item.end,{easing:'linear'});
   if(drawing)tracks.push(drawing);
  }
 }
 if(scene.family==='fieldlines'){
  const route=part(svg,'route')?.querySelector('path'),node=part(svg,'destination');
  if(route?.getPointAtLength&&node){
   const length=route.getTotalLength(),[x,y]=scene.end;
   const frames=Array.from({length:33},(_,i)=>{const p=route.getPointAtLength(length*i/32);return {transform:`translate(${p.x-x}px,${p.y-y}px)`};});
   tracks.push(track(node,[{opacity:0},{opacity:1}],.18,.25));
   tracks.push(track(node,frames,scene.concept==='house'?.25:.18,scene.concept==='house'?.83:.84,'linear'));
  }
 }
 const light=scene.family==='lightroom'?parallax(part(svg,'light-field'),{x:2.5,y:1.5}):null;
 return {tracks,interact:input=>light?.update(input),destroy:()=>light?.destroy()};
}
