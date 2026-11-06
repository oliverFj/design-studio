// Illustrationspaletter til prototypen. De ændrer ingen Design Studio-temafiler.
// Håndvalgte kernefarver: billedbund, blæk, motiv, modstemme og lys.
const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
const isDark=hex=>[1,3,5].reduce((sum,i,n)=>sum+parseInt(hex.slice(i,i+2),16)*[.2126,.7152,.0722][n],0)<110;
function palette([ground,ink,subject,counter,light,lineWidth=2,depthOpacity=.16]){
 const dark=isDark(ground);
 return {ground,plane:mix(ground,light,dark?.11:.46),ink,subject,counter,context:mix(ground,subject,dark?.26:.21),edge:mix(ground,ink,.57),light,depth:dark?mix(ground,'#000000',.55):mix(ground,ink,.28),lineWidth,depthOpacity};
}
const profile=(name,note,modes)=>({name,note,modes:Object.fromEntries(Object.entries(modes).map(([id,[label,...values]])=>[id,{id,name:label,...palette(values)}]))});
export const THEMES={
 'signal':profile('Signal','Præcis kobolt, kontrolleret rav og et køligt billedfelt. Et teknisk register med glatte materialer.',{
  light:['Lys','#eaf0fa','#192735','#3157cf','#d3a142','#fcfdff',1.8,.12],dark:['Mørk','#142337','#e7edf9','#8da8e0','#c69c55','#fcfdff',1.8,.13]}),
 'prisme':profile('Prisme','Syren og rosa deler vægten. Varmt lys giver de store billedflader en blødere farveovergang.',{
  light:['Lys','#e5dff3','#42354f','#ac7296','#8583b6','#fff3e9',1.8,.17],dark:['Mørk','#201e33','#eee5fb','#d5a6c1','#aaa5d6','#fff0df',1.8,.18]}),
 'fjordside':profile('Fjordside','Papir, jord og tryksværte. Oliven får sin egen rolle som grafisk modvægt til terracotta.',{
  light:['Lys','#eae2d5','#342e26','#b16d4d','#748777','#fff9e9',2,.18],dark:['Mørk','#26251f','#eee5d4','#c9a18a','#96aa95','#fff5dc',2,.16]}),
 'castle-studio':profile('Castle Studio','Grøn mineralfarve, kalk og kobber. Materialet er mildt, mens konturen holder konstruktionen tydelig.',{
  light:['Lys','#e6ece3','#243a37','#396e65','#c38c6e','#fff8dd',1.8,.15],dark:['Mørk','#1c302c','#e5eade','#90b6a4','#bf9176','#fff2d4',1.8,.16]}),
 'castle-studio-v2':profile('Castle Studio v2','En roligere teal og en mere afgrænset kobberfarve. Tæt beslægtet med Castle, med mindre pigmentkontrast.',{
  light:['Lys','#e8ece5','#273b38','#507c70','#b68b70','#fff8e7',1.8,.13],dark:['Mørk','#20312d','#e5ebe1','#9ab7aa','#bc9b86','#fff4dc',1.8,.14]}),
 'atelier':profile('Atelier','Vinrødt tryk møder okker på varmt papir. Billedets pigmenter har mere krop end appens neutraler.',{
  light:['Lys','#f2eadb','#352c29','#8a4646','#b9904d','#fff8e7',1.6,.15],dark:['Mørk','#2b2420','#f0e5d3','#d6aca0','#ba9b6e','#fff2dc',1.6,.14]}),
 'midnight-editorial':profile('Midnight Editorial','Oxidblæk og afdæmpet oliven. Mørk udgave bruger blommebrunt papir og nedtonede pigmenter.',{
  light:['Lys','#f1e9df','#342b33','#9a5942','#a0ad91','#fff8ed',1.6,.16],dark:['Mørk','#251e26','#eee5dc','#c69780','#84957d','#fff1df',1.6,.15]}),
 'kyst':profile('Kyst','Petrol og sandfarvet okker på køligt mineralpapir. De lyse kanter har en svag grøn temperatur.',{
  light:['Lys','#e6efeb','#193b3a','#2c7373','#b28d4e','#f9fff4',1.8,.14],dark:['Mørk','#172b2a','#e0eee4','#8fbeb6','#c2aa72','#f0ffe6',1.8,.15]}),
 'nocturne':profile('Nocturne','Blomme og støvet lavendel får en varm rosafarvet ledsager. Store farveflader er bevidst afdæmpede.',{
  light:['Lys','#ece5f1','#392b45','#8e6aad','#bd899e','#fff2eb',1.6,.17],dark:['Mørk','#221b2d','#eee3f5','#bca5d3','#bd92a7','#fff0e9',1.6,.17]}),
 'studio-light':profile('Studio Light','Rolig indigo og blågrøn som en grafisk modstemme. Klar form og begrænset materialedybde.',{
  light:['Lys','#ececf6','#2e314b','#6862b8','#72a09c','#fffdf4',1.8,.12],dark:['Mørk','#222536','#e8e9f6','#b1aedf','#92b6ac','#fff9e7',1.8,.13]}),
 'vaerk':profile('Værk','Varmt papir, vinrødt pigment og brændt ler. Lyset er mat og samlingerne præcise.',{
  light:['Lys','#eee3d3','#3b2a2b','#874858','#bb855a','#fff6df',1.6,.17],dark:['Mørk','#292119','#f1e2d1','#d1a0ab','#c5a17e','#fff0d5',1.6,.16]}),
 'bauhaus':profile('Bauhaus','Tre lyse farvevariationer med hver sin hovedvægt. Klar geometri og høj kontrast uden ekstra glans.',{
  solgul:['Solgul','#f2d462','#25272a','#3155b0','#b94433','#fff8da',2.2,.1],
  kalk:['Kalk','#f6f0dd','#25272a','#3155b0','#c54d37','#fffdef',2.2,.1],
  signalroed:['Signalrød','#f1e5d5','#2e2925','#b64232','#3655a7','#fff6e0',2.2,.1]}),
 'porcelaen':profile('Porcelæn','Bløde glasurpigmenter og et lyst, varmt genskin. Hver navngiven farvevariation har sit eget billedpar.',{
  light:['Lavendel','#e8e5f2','#44394e','#9382b2','#bc98b2','#fff9ef',1.6,.16],
  dark:['Natglasur','#29233b','#f0e7f4','#bd9fcf','#b19fbf','#fff0e6',1.6,.18],
  celadon:['Celadon','#e4efe5','#2d4843','#5b9282','#be936c','#ffffed',1.6,.16],
  rosenkvarts:['Rosenkvarts','#f1e1df','#543b47','#b67c94','#8098ae','#fff6e7',1.6,.16],
  maaneblaa:['Måneblå','#1b2940','#e8eef7','#93b2d4','#bca4cd','#fff2df',1.6,.17]}),
 'riso':profile('Riso','Trykfarver afstemt til større arealer. Billedets anden farve er et selvstændigt pigment, ikke en status.',{
  light:['Vermilion','#f1e4ca','#3a2e27','#bb5c42','#527d87','#fff6de',2.1,.17],
  dark:['Nattetryk','#2b251d','#f0e4cf','#d39c83','#9aafa3','#fff0d1',2.1,.16],
  kobolt:['Kobolt','#e8e3d1','#303747','#4b69a8','#ba7055','#fff8df',2.1,.17],
  skovtryk:['Skovtryk','#e7e0c8','#2b443a','#3d8065','#b16b4e','#fff3ce',2.1,.17],
  fuchsia:['Fuchsia','#f1dfdb','#493044','#a65383','#5775a9','#fff2df',2.1,.17]}),
 'terminal':profile('Terminal','Signalpræcision med kontrollerede fosforflader. Lyset er afstemt til hver skærmfarve, uden automatisk glød.',{
  dark:['Fosfor','#14251f','#e1efc8','#a7c877','#6eaa9b','#f1ffd7',2,.1],
  light:['Dagslys','#e8f0df','#2d412b','#6b8b42','#5b8b7f','#ffffeb',2,.1],
  rav:['Rav','#2b2117','#f1e1c6','#d6b169','#b7816b','#fff1cd',2,.1],
  isblaa:['Isblå','#182b3a','#dfedf4','#7bb7cd','#a69cc9','#f4fcff',2,.1],
  ultraviolet:['Ultraviolet','#2a1e39','#eee0f6','#bb92d0','#7fb6a9','#fff0ff',2,.1]})
};

export const TOKENS=[
 ['ground','color.illustration.ground','Billedets eget underlag'],
 ['plane','color.illustration.plane','Et selvstændigt materialeplan'],
 ['ink','color.illustration.ink','Bærende kontur og grafisk tyngde'],
 ['subject','color.illustration.subject','Motivets første tyngdepunkt'],
 ['counter','color.illustration.counterpoint','En selvstændig modstemme'],
 ['context','color.illustration.context','Tilbagetrukne dele og sekundær masse'],
 ['edge','color.illustration.edge','Samlinger og illustrative hjælpelinjer'],
 ['light','color.illustration.light','Lyskant og lyskilde'],
 ['depth','color.illustration.depth','Indsnit og afgrænset dybde'],
 ['lineWidth','illustration.material.lineWidth','Stregvægt i SVG-enheder'],
 ['depthOpacity','illustration.material.depthOpacity','Dybdefarvens styrke']
];
export const cssVariables=p=>Object.fromEntries(TOKENS.map(([key])=>['--g-'+key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),p[key]]));
