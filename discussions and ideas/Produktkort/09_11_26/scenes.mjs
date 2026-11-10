// Local product studies. Family geometry is authored here, outside the shared catalogue.
export const families={anatomy:'Tegnets anatomi',lightroom:'Lysrum',passage:'Passage',fieldlines:'Feltlinjer'};
export const products=[
 {id:'formlab',name:'FormLab',tag:'Arkitektur / parametrisk konstruktion',intro:'Fra en enkelt sten til middelalderens store former.',ideas:[['Bue som parameter','En romansk rundbue og en gotisk spidsbue viser, hvordan geometrien ændrer arkitekturen.'],['Borgen bygges','Tårne, mur og port bliver til en samlet borg. Modulerne er selve fortællingen.'],['Sten for sten','Et forskudt murforbandt viser produktets blik for murværkets konstruktion.']]},
 {id:'tonerum',name:'Tonerum',tag:'Musik / det synlige greb',intro:'Et øverum, hvor tonerne får en konkret plads under fingrene.',ideas:[['Et D under fingrene','Et åbent D-dur-greb på et vandret gribebræt med høj E øverst: D-strengen er åben, G2, B/H3 og høj E2 er grebet.'],['Violinens første position','På A-strengen ligger H, Cis og D ved første, anden og tredje finger. Afstandene bliver mindre op ad strengen.'],['Fra tone til greb','Tonen E forbindes til anden fingerposition på guitarens D-streng, andet bånd.']]},
 {id:'formationsstudio',name:'Formationsstudio',tag:'Historie / formationsprototype',intro:'Musketerer og pikerer undersøgt som rum, rytme og bevægelse.',ideas:[['Kerne og fløje','En pikenerblok med musketerer på begge fløje. Et stiliseret formationsprincip, ikke en historisk rekonstruktion.'],['Skud og tilbage','En række musketerer afløses via en returvej. Animationen forklarer princippet i kontramarch.'],['Samme styrke, ny front','24 markører i to opstillinger: dyb blok og bred linje. Geometrien gør forsøget synligt.']]},
 {id:'ringsmith',name:'Ringsmith',tag:'Guldsmed / parametrisk form',intro:'Kontrolleret geometri til plane ringe og signetringe.',ideas:[['Den plane ring','En ring med flad yderside møder sit tværsnit: flad overside, runde skuldre og en afrundet underside mod fingeren.'],['Signetens ansigt','En ringkrop bærer en klar signetflade. Fladen er udekoreret og klar til guldsmedens arbejde.'],['Profil bliver ring','To forskellige profilsnit forbindes til ringformen. Tykkelse og bredde bliver synlige valg.']]}
];
const c=k=>`var(--g-${k})`;
const L=(d,k='ink',w='var(--g-line-width)',extra='')=>`<path d="${d}" fill="none" stroke="${c(k)}" stroke-width="${w}" ${extra}/>`;
const P=(d,k='subject',extra='')=>`<path d="${d}" fill="${c(k)}" ${extra}/>`;
const R=(x,y,w,h,k='plane',extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c(k)}" ${extra}/>`;
const O=(x,y,r,k='subject',extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c(k)}" ${extra}/>`;
const T=(x,y,s,size=14)=>`<text x="${x}" y="${y}" fill="${c('ink')}" font-family="ui-monospace,monospace" font-size="${size}" text-anchor="middle">${s}</text>`;
const dim=(x,y,w)=>L(`M${x} ${y}h${w}M${x} ${y-6}v12M${x+w} ${y-6}v12`,'edge',1);
const flow=d=>L(d,'ground',17)+L(d,'subject',10)+L(d,'ink',1.1);
const ring=(x,y,r,t,k='subject')=>P(`M${x-r} ${y}a${r} ${r} 0 1 0 ${r*2} 0a${r} ${r} 0 1 0 -${r*2} 0M${x-r+t} ${y}a${r-t} ${r-t} 0 1 0 ${(r-t)*2} 0a${r-t} ${r-t} 0 1 0 -${(r-t)*2} 0`,k,'fill-rule="evenodd"');
const arch=(x,y,w,h,gothic=false)=>`M${x} ${y+h}V${y+w/2}${gothic?`Q${x} ${y+20} ${x+w/2} ${y}Q${x+w} ${y+20} ${x+w} ${y+w/2}`:`a${w/2} ${w/2} 0 0 1 ${w} 0`}V${y+h}Z`;
// Flat outer face, softly rounded shoulders and a deeper finger-facing underside.
const section=(x,y,w=110,h=55)=>`M${x+w*.25} ${y}H${x+w*.75}Q${x+w} ${y} ${x+w} ${y+h*.35}V${y+h*.45}C${x+w} ${y+h*.78} ${x+w*.75} ${y+h} ${x+w*.5} ${y+h}S${x} ${y+h*.78} ${x} ${y+h*.45}V${y+h*.35}Q${x} ${y} ${x+w*.25} ${y}Z`;
// Joints share the exact outer/inner curves of each arch, including the pointed rise.
function archJoints(x,y,w,h,pointed=false,inset=10,rise=inset){
 const inner=[x+inset,y+rise,w-2*inset,h-rise],r=w/2,cx=x+r,cy=y+r;
 const q=(a,b,t)=>{const [xx,yy,ww]=a,rr=ww/2;return b===0?[xx+rr*t*t, (1-t)**2*(yy+rr)+2*(1-t)*t*(yy+20)+t*t*yy]:[xx+rr+2*(1-t)*t*rr+t*t*rr,(1-t)**2*yy+2*(1-t)*t*(yy+20)+t*t*(yy+rr)];};
 let result='';
 if(pointed){for(const side of [0,1])for(const t of [.25,.5,.75]){const a=q([x,y,w],side,t),b=q(inner,side,t);result+=L(`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`,'edge',1);}}
 else for(let i=1;i<8;i++){const angle=Math.PI+i*Math.PI/8;result+=L(`M${cx+r*Math.cos(angle)} ${cy+r*Math.sin(angle)}L${cx+(r-inset)*Math.cos(angle)} ${cy+(r-inset)*Math.sin(angle)}`,'edge',1);}
 for(let yy=cy+22;yy<y+h-10;yy+=27)result+=L(`M${x} ${yy}h${inset}M${x+w-inset} ${yy}h${inset}`,'edge',1);
 return result;
}
function guitarStudy(family,id){
 // Screenshot orientation: high E first; B (Danish H), G, D, A, low E below.
 const ys=[135,163,191,219,247,275],frets=[153,246,334,417,495];
 const boardShape=L('M123 115H521V294H123Z','edge')+ys.map(y=>L(`M123 ${y}H521`,'ink',1)).join('')+frets.map((x,i)=>L(`M${x} 115V294`,'edge',i===0?3:1)).join('')+O(375.5,205,3,'context');
 const positions=[[290,191],[290,135],[375.5,163]];
 const dot=(x,y,i)=>O(x,y,12,'plane',`stroke="${c('edge')}" stroke-width="1.8"`)+O(x,y,4,family==='anatomy'?'subject':'counter')+T(x+19,y-10,i+1,11);
 let base=boardShape,form='',focus=positions.map(([x,y],i)=>dot(x,y,i)).join('');
 if(family==='lightroom'){base=ledge(id,108,100,428,209);form=boardShape;focus=positions.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="14" fill="url(#${id}-glow)"/>`+O(x,y,5,'plane')+T(x+20,y-10,i+1,11)).join('');}
 if(family==='passage'){base=R(121,113,428,209,'context');form=P('M108 100H536V309H108ZM123 115H521V294H123Z','subject','fill-rule="evenodd"')+boardShape;}
 if(family==='fieldlines'){form=flow('M290 191V135H363.5Q375.5 135 375.5 147V163');}
 const labels=['E','B','G','D','A','E'].map((s,i)=>T(85,ys[i]+5,s,15)).join('')+[133,199.5,290,375.5,456].map((x,i)=>T(x,87,i,13)).join('');
 const details=labels+T(317,53,'D-DUR · GUITAR',20)+O(133,219,5,'plane',`stroke="${c('ink')}" stroke-width="1.5"`)+T(133,252,'×')+T(133,280,'×')+T(320,345,'HØJ E ØVERST · BÅND 0–4',12);
 return [base,form,focus,details];
}
function ledge(id,x,y,w,h){return `<g opacity="var(--g-depth-opacity)">${R(x+4,y+7,w,h,'depth','rx="7"')}</g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="url(#${id}-wall)"/>`+R(x+10,y+10,w-20,h-20,'plane','rx="3"')+L(`M${x+10} ${y+10}H${x+w-10}`,'light')+L(`M${x} ${y}H${x+w}V${y+h}H${x}Z`,'edge');}
function marks(points,f,numbered=false){return points.map(([x,y],i)=>O(x,y,f==='anatomy'?7:10,f==='anatomy'?'subject':'counter')+(numbered?T(x,y+4,i+1,11):'')).join('');}
function bricks(x,y,cols,rows,bw=48,bh=27){let out='';for(let row=0;row<rows;row++){out+=L(`M${x} ${y+row*bh}h${cols*bw}`,'edge',1);for(let col=0;col<cols;col++){const xx=x+col*bw+(row%2?bw/2:0);if(xx<x+cols*bw)out+=L(`M${xx} ${y+row*bh}v${bh}`,'edge',1);}}return out+L(`M${x} ${y+rows*bh}h${cols*bw}`,'edge',1);}
function board(violin=false){return L('M130 105H470V305H130Z','edge')+Array.from({length:violin?4:6},(_,i)=>L(`M${150+i*(violin?100:60)} 105V305`,'ink',1)).join('')+(violin?'':[145,185,225,265].map(y=>L(`M130 ${y}H470`,'edge',1)).join(''))+L('M130 105H470','ink',3);}
function troops(f,kind=0){let a='',b='';const token=(x,y,pike)=>f==='anatomy'?(pike?O(x,y,4,'subject')+L(`M${x-4} ${y}h8`,'ink',1):O(x,y,4,'ink')):f==='passage'?O(x,y,4,'ground'):R(x-4,y-4,8,8,pike?'subject':'counter');if(kind===0){for(let y=145;y<=265;y+=24){for(let x=252;x<=348;x+=24)a+=token(x,y,true);for(let x of [156,180,420,444])b+=token(x,y,false);}}else if(kind===1){for(let y of [150,198,246,294])for(let x=170;x<=410;x+=40)a+=token(x,y,false);}else{for(let r=0;r<6;r++)for(let col=0;col<4;col++)a+=token(122+col*22,143+r*25,true);for(let r=0;r<3;r++)for(let col=0;col<8;col++)b+=token(305+col*23,181+r*25,true);}return [a,b];}
function anatomy(p,v){let base='',subject='',detail='',accent='';
 if(p==='formlab'){
  if(v===0){base=L(arch(115,145,140,175))+L(arch(345,115,140,205,true));detail=dim(115,350,140)+dim(345,350,140)+T(185,378,'ROMANSK')+T(415,378,'GOTISK');accent=L(arch(358,132,114,188,true),'subject',3);}
  if(v===1){base=L('M130 320V140H155V120H180V140H205V120H230V320M370 320V120H395V140H420V120H445V140H470V320M230 200H370V320H130M230 228H370');subject=L(arch(270,243,60,77));detail=dim(130,350,340)+L('M110 140V320M104 140h12M104 320h12','edge',1);accent=R(155,177,20,32,'subject')+R(425,177,20,32,'subject');}
  if(v===2){base=L('M135 120H465V300H135Z')+bricks(135,120,6,6,55,30);subject=L('M245 180h55v30h-55Z','subject',3);detail=dim(135,340,330)+T(300,370,'FORSKUDT FORBANDT');accent=O(272.5,195,4);}
 }else if(p==='tonerum'){
  base=board(v===1);
  if(v===1){subject=marks([[350,149],[350,188],[350,206]],'anatomy',true);detail=['G','D','A','E'].map((s,i)=>T(150+i*100,332,s)).join('')+T(300,65,'H · CIS · D',21);}
  if(v===2){base=L('M280 105H475V305H280Z')+[300,330,360,390,420,450].map(x=>L(`M${x} 105V305`,'edge',1)).join('')+[145,185,225,265].map(y=>L(`M280 ${y}H475`,'edge',1)).join('');subject=O(360,165,8)+L('M140 210H215V165H352','ink',1)+T(140,200,'E',40);detail=T(360,334,'D-STRENG / BÅND 2');}
 }else if(p==='formationsstudio'){
  const [a,b]=troops('anatomy',v);base=a+b;subject=v===0?L('M240 129H360V282H240Z','edge',1):v===1?L('M150 150C100 150 100 310 150 310H430C490 310 490 150 430 150','subject',3):L('M228 210H279M271 204l8 6-8 6','subject',2);detail=v===0?T(300,304,'P')+T(168,304,'M')+T(432,304,'M'):v===1?T(300,105,'SKUDLINJE')+L('M160 117H420','edge',1):T(155,332,'4 × 6')+T(386,332,'8 × 3');accent=v===0?L('M252 145v-28M276 145v-28M300 145v-28M324 145v-28M348 145v-28','subject',1):'';
 }else{
  base=L('M310 210a110 110 0 1 1-220 0a110 110 0 1 1 220 0M288 210a88 88 0 1 1-176 0a88 88 0 1 1 176 0');
  if(v===0){subject=L(section(390,182));detail=L('M310 210H390','edge',1)+dim(390,268,110)+T(445,299,'SNIT');accent=L('M417.5 182H472.5','subject',3);}
  if(v===1){subject=P('M137 104L168 81H232L263 104V142H137Z','plane')+L('M137 104L168 81H232L263 104V142H137ZM151 112H249M168 81V112M232 81V112');detail=L('M263 112H367V166H410','edge',1)+L('M410 145h65v65h-65Z')+T(443,243,'FLADE');accent=L('M151 112H249','subject',3);}
  if(v===2){subject=L('M380 130h78v42h-78ZM380 250v-30q39-42 78 0v30Z');detail=L('M310 210H350V151H380M350 210V235H380','edge',1)+dim(380,288,78);accent=L('M380 220q39-42 78 0','subject',3);}
 }
 return [base,subject,accent,detail];
}
function lightroom(p,v,id){let foundation='',form='',light='',details='';
 if(p==='formlab'){
  if(v===0){foundation=ledge(id,108,92,384,245);const openings=[arch(161,164,90,149),arch(341,140,90,173,true)];form=openings.map(d=>P(d,'ground')).join('');light=`<path d="${arch(151,154,110,159)} ${openings[0]}" fill="url(#${id}-glow)" fill-rule="evenodd"/><path d="${arch(331,124,110,189,true)} ${openings[1]}" fill="url(#${id}-glow)" fill-rule="evenodd"/>`;details=L(arch(151,154,110,159),'edge')+L(arch(331,124,110,189,true),'edge')+L('M151 313H261M331 313H441','light',2);}
  if(v===1){foundation=ledge(id,124,171,352,150)+ledge(id,124,110,95,211)+ledge(id,381,110,95,211);form=R(146,132,51,24,'context')+R(403,132,51,24,'context')+P(arch(264,226,72,95),'context');light=`<path d="${arch(274,238,52,83)}" fill="url(#${id}-glow)"/>`;details=L('M144 321H456','light',2);}
  if(v===2){foundation=ledge(id,127,112,346,200);form=R(144,129,312,166,'context')+bricks(144,129,6,6,52,27);light=R(248,183,52,27,'light');details=T(300,352,'FUGE / STEN / RYTME');}
 }else if(p==='tonerum'){
  foundation=ledge(id,110,87,380,238);form=board(v===1);const pts=v===1?[[350,149],[350,188],[350,206]]:[[270,165]];light=pts.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="16" fill="url(#${id}-glow)"/>`).join('');details=v===1?T(300,65,'A-STRENG · VIOLIN',20):T(300,65,'E · D-STRENG · BÅND 2',20);details+=v===1?['G','D','A','E'].map((s,i)=>T(150+i*100,350,s)).join(''):['E','A','D','G','H','e'].map((s,i)=>T(150+i*60,350,s)).join('');
 }else if(p==='formationsstudio'){
  foundation=ledge(id,110,102,380,226);const [a,b]=troops('lightroom',v);form=a+b;light=v===0?R(243,136,114,4,'light'):v===1?L('M145 150C120 150 120 309 155 309H435C475 309 475 150 435 150','subject',3):L('M226 210H283','subject',3);details=T(300,370,v===0?'KERNE OG FLØJE':v===1?'AFGIV · AFLØS · GENTAG':'DYBDE ↔ FRONT');
 }else{
  foundation=`<g opacity="var(--g-depth-opacity)">${ring(244,227,115,26,'depth')}</g>`;form=ring(240,220,115,26,'context')+L('M125 220a115 115 0 1 1 230 0','edge')+L('M151 220a89 89 0 1 1 178 0','edge');light=L('M148 188a97 97 0 0 1 173-21','light',3);
  if(v===0){foundation+=`<g opacity="var(--g-depth-opacity)">${P(section(410,193),'depth')}</g>`;form+=P(section(406,186),'context')+L(section(406,186),'edge');light+=L('M433.5 186H488.5','light',2);details=L('M355 220H406','edge',1)+dim(406,274,110)+T(461,305,'SNIT');}
  if(v===1){form+=ledge(id,175,91,130,77);light+=R(185,101,110,57,'light');details=L('M193 109H287V150H193Z','edge',1);}
  if(v===2){form+=ledge(id,407,119,70,47)+ledge(id,407,263,70,36);light+=L('M417 273Q442 245 467 273','light',3);details=L('M355 220H386V143H407M386 220V281H407','edge',1);}
 }
 return [foundation,form,light,details];
}
function passage(p,v){let rear='',mass='',content='',detail='';
 if(p==='formlab'){
  if(v===0){rear=R(129,131,155,207,'counter')+R(344,101,155,237,'context');mass=P(arch(110,110,155,210)+' '+arch(129,129,117,191),'subject','fill-rule="evenodd"')+P(arch(325,80,155,240,true)+' '+arch(344,105,117,215,true),'subject','fill-rule="evenodd"');content=L('M110 320H265M325 320H480','ink');detail=dim(110,359,370);}
  if(v===1){rear=R(147,143,338,189,'context');mass=P('M130 320V120h24v20h24v-20h24v20h24v60h148v-80h24v20h24v-20h24v20h24v180ZM270 320V270a30 30 0 0 1 60 0v50Z','subject','fill-rule="evenodd"');content=R(155,177,24,35,'ground')+R(421,177,24,35,'ground');detail=L('M130 320H470','ink')+dim(130,357,340);}
  if(v===2){rear=R(144,134,330,180,'counter');mass=Array.from({length:5},(_,r)=>Array.from({length:5},(_,col)=>R(128+col*66+(r%2?22:0),118+r*36,62,32,r===2&&col===2?'counter':'subject')).join('')).join('');content=L('M128 118H458M128 298H480','ink',1);detail=dim(128,343,352);}
 }else if(p==='tonerum'){
  rear=R(135,118,346,205,'context');mass=P('M120 102H466V307H120ZM135 117H451V292H135Z','subject','fill-rule="evenodd"');content=board(v===1);detail=v===1?marks([[350,149],[350,188],[350,206]],'passage',true)+T(300,65,'A / H / CIS / D',20):marks([[270,165]],'passage')+T(300,65,'E → D-STRENG / BÅND 2',18);detail+=v===1?['G','D','A','E'].map((s,i)=>T(150+i*100,350,s)).join(''):['E','A','D','G','H','e'].map((s,i)=>T(150+i*60,350,s)).join('');
 }else if(p==='formationsstudio'){
  if(v===0){rear=R(258,148,114,150,'context');mass=R(240,130,120,154,'subject')+R(140,130,56,154,'counter')+R(404,130,56,154,'counter');content=troops('passage',0).join('');detail=T(300,319,'P')+T(168,319,'M')+T(432,319,'M');}
  if(v===1){rear=R(164,145,280,165,'context');mass=R(145,126,280,30,'subject')+R(145,175,280,30,'counter')+R(145,224,280,30,'subject');content=L('M164 141H400M164 190H400M164 239H400','ground',2);detail=L('M130 141C95 141 95 298 145 298H445C490 298 490 141 445 141','ink',1.8);}
  if(v===2){rear=R(119,141,99,158,'context')+R(299,179,185,86,'context');mass=R(102,125,99,158,'subject')+R(282,163,185,86,'counter');content=troops('anatomy',2).join('').replaceAll(c('subject'),c('ground'));detail=T(151,332,'DYBDE')+T(375,302,'FRONT');}
 }else{
  rear=ring(231,228,114,24,'context');mass=ring(214,212,114,24);content=L('M100 212a114 114 0 1 1 228 0','ink',1);
  if(v===0){mass+=P(section(413,184),'counter');content+=L(section(413,184),'ink',1);detail=L('M328 212H413','ink',1)+dim(413,273,110)+T(468,304,'SNIT');}
  if(v===1){mass+=P('M142 99L168 76H260L286 99V151H142Z','subject');content+=P('M157 108L177 90H251L271 108V136H157Z','counter')+L('M157 108H271','ink',1);detail=dim(142,345,144);}
  if(v===2){mass+=R(409,123,75,35,'counter')+P('M409 270V231q37-35 75 0v39Z','subject');detail=L('M328 212H380V140H409M380 212V251H409','ink',1)+dim(409,306,75);}
 }
 return [rear,mass,content,detail];
}
function fieldlines(p,v){let context='',content='',route='',destination='',detail='';
 if(p==='formlab'){
  if(v===0){content=L(arch(139,155,112,159),'edge')+L(arch(353,111,112,203,true),'edge');route='M251 270H287Q299 270 299 258V232Q299 220 311 220H353';destination=O(251,270,7,'ground',`stroke="${c('ink')}" stroke-width="1.8"`)+O(353,220,6,'counter');detail=T(195,350,'RUND')+T(409,350,'SPIDS');context=L('M139 370H465M195 360V377M409 360V377','edge',1,'opacity=".4"');}
  if(v===1){content=L('M190 320V145h60v75h100v-75h60v175ZM273 320v-60h54v60','edge');route='M110 350H288Q300 350 300 338V290';destination=O(300,290,8,'counter');detail=L('M204 169h32M364 169h32','edge',1);}
  if(v===2){content=bricks(180,120,6,6,48,29)+L('M180 120H468V294H180Z','edge');route='M85 270H133Q145 270 145 258V205Q145 193 157 193H228';destination=O(228,193,8,'counter');detail=T(324,345,'ÉN STEN → ET FORBANDT');}
 }else if(p==='tonerum'){
  content=board(v===1);
  if(v===1){route='M350 105V206';destination=marks([[350,149],[350,188],[350,206]],'fieldlines',true);detail=T(300,65,'A-STRENG · H / CIS / D',20);}
  if(v===2){content=board();route='M72 210H102Q114 210 114 198V177Q114 165 126 165H270';destination=O(270,165,10,'counter');detail=T(74,188,'E',28)+T(300,65,'D-STRENG / BÅND 2',20);}
  detail+=v===1?['G','D','A','E'].map((s,i)=>T(150+i*100,350,s)).join(''):['E','A','D','G','H','e'].map((s,i)=>T(150+i*60,350,s)).join('');
 }else if(p==='formationsstudio'){
  content=troops('fieldlines',v).join('');route=v===0?'M168 265V296Q168 308 180 308H420Q432 308 432 296V265':v===1?'M170 150H140Q128 150 128 162V310Q128 322 140 322H450Q462 322 462 310V162Q462 150 450 150H410':'M122 143V112Q122 100 134 100H281Q293 100 293 112V169Q293 181 305 181H466';const end=v===0?[432,265]:v===1?[410,150]:[466,181];destination=O(...end,8,'counter');detail=T(300,370,v===0?'KERNE + FLØJE':v===1?'KONTRAMARCH':'NY FRONT / SAMME ANTAL');if(v===0)context=L('M300 265V308','edge',1)+O(300,308,4,'ink');
 }else{
  content=L('M330 220a108 108 0 1 1-216 0a108 108 0 1 1 216 0M308 220a86 86 0 1 1-172 0a86 86 0 1 1 172 0','edge');
  if(v===0){content+=L(section(404,185),'edge');route='M459 212.5H382Q370 212.5 370 200.5V135Q370 123 358 123H222A97 97 0 1 0 279.015 141.525';destination=O(459,212.5,7,'ground',`stroke="${c('ink')}" stroke-width="1.8"`)+O(279.015,141.525,6,'counter');detail=dim(404,277,110)+T(459,308,'SNIT');}
  if(v===1){content+=R(158,89,128,70,'plane')+L('M158 89H286V159H158Z','edge');route='M505 300H374Q362 300 362 288V136Q362 124 350 124H286';destination=O(286,124,8,'counter');detail=L('M171 102H273V146H171Z','edge',1);}
  if(v===2){content+=L('M423 116h63v38h-63ZM423 278v-31q31-35 63 0v31Z','edge');route='M423 135H386Q374 135 374 147V208Q374 220 362 220H330';destination=O(330,220,8,'counter');detail=L('M423 261H386Q374 261 374 249V232Q374 220 362 220H330','edge',1);}
 }
 // Registration is local to the content. A fan of copied routes is not a family requirement.
 context+=L('M74 64h14M81 57v14M519 354h14M526 347v14','edge',1,'opacity=".35"');
 return [context+content,flow(route),destination,detail];
}
function productDetails(product,family,bodies){
 if(product==='formlab'){
  const arches={anatomy:[[115,145,140,175,false,12,12],[345,115,140,205,true,13,17]],lightroom:[[151,154,110,159,false,10,10],[331,124,110,189,true,10,16]],passage:[[110,110,155,210,false,19,19],[325,80,155,240,true,19,25]],fieldlines:[[139,155,112,159,false,10,10],[353,111,112,203,true,10,16]]}[family];
  for(const [x,y,w,h,pointed,inset,rise] of arches){
   if(family==='anatomy'||family==='fieldlines')bodies[1]+=L(arch(x+inset,y+rise,w-2*inset,h-rise,pointed),'edge',1);
   bodies[3]+=archJoints(x,y,w,h,pointed,inset,rise)+L(arch(x+inset/2,y+rise/2,w-inset,h-rise/2,pointed),'edge',1,'opacity=".5"');
  }
 }
 if(product==='formationsstudio'){
  const base=family==='anatomy'?117:family==='passage'?130:145;
  bodies[3]+=[252,276,300,324,348].map(x=>L(`M${x} ${base}V107M${x-3} 112l3-6 3 6`,'edge',1)).join('')+L('M300 82V62M294 68l6-6 6 6','edge',1);
 }
 if(product==='ringsmith'){
  const [cx,r,dimY,labelY,sx,sy]={anatomy:[200,88,350,378,445,325],lightroom:[240,89,365,393,461,332],passage:[214,90,356,384,468,331],fieldlines:[222,86,356,384,459,332]}[family];
  bodies[3]+=dim(cx-r,dimY,2*r)+T(cx,labelY,'Ø 16,20 MM',13)+T(sx,sy,'4,00 MM',13);
 }
 return bodies;
}
export function scene(product,variant,family){
 const id=`${product}-${variant}-${family}`;
 let bodies=product==='tonerum'&&variant===0?guitarStudy(family,id):family==='anatomy'?anatomy(product,variant):family==='lightroom'?lightroom(product,variant,id):family==='passage'?passage(product,variant):fieldlines(product,variant);
 if(variant===0)bodies=productDetails(product,family,bodies);
 const names=family==='anatomy'?['Konstruktion','Kontur','Aktuel detalje','Mål og navne']:family==='lightroom'?['Materialedybde','Stabil form','Lokalt lys','Detaljer']:family==='passage'?['Bagplan','Materiale og åbning','Indhold','Registrering']:['Felt og indhold','Valgt rute','Destination','Registrering'];
 const productData=products.find(p=>p.id===product);
 return {id,concept:id,family,label:productData.ideas[variant][1],parts:bodies.map((body,i)=>({key:['foundation','form','focus','detail'][i],name:names[i],purpose:productData.ideas[variant][1],start:[0,.13,.43,.7][i],end:[.35,.7,.88,1][i],body:i===0&&family==='lightroom'?`<defs><linearGradient id="${id}-wall" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c('light')}"/><stop offset="1" stop-color="${c('context')}"/></linearGradient><radialGradient id="${id}-glow" cx=".45" cy=".38" r=".7"><stop stop-color="${c('light')}"/><stop offset=".68" stop-color="${c('subject')}"/><stop offset="1" stop-color="${c('counter')}"/></radialGradient></defs>${body}`:body}))};
}
