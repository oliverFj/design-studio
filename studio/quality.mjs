import {materializePackage,resolveTokens} from '../core/engine.mjs';
import {themeContrastReport,componentContrastReport,controlBoundaryReport,componentBoundaryReport} from '../core/quality.mjs';
import {componentGeometryReport} from '../core/geometry.mjs';
import {compositionQualityReport} from '../patterns/quality.mjs';
import {COMPOSITIONS} from '../patterns/catalog.mjs';

const labels={pass:'Bestået',warning:'Advarsel',unmeasurable:'Kan ikke måles'};
const count=checks=>({pass:checks.filter(c=>c.status==='pass').length,warning:checks.filter(c=>c.status==='warning').length,unmeasurable:checks.filter(c=>c.status==='unmeasurable').length});

/** Explicit quality review; pattern checks never run on a token keystroke. */
export function createQualityStudio(state,{escape,validation,getTheme=()=>state.pack,render,notice,document=globalThis.document,runPatterns=compositionQualityReport}){
  let subject=null,revision=0,patternResult=null,running=false;
  const invalidate=()=>{revision++;patternResult=null;running=false;subject=state.pack;};
  const sync=()=>{if(subject!==state.pack)invalidate();};
  const status=check=>'<span class="quality-status '+check.status+'">'+labels[check.status]+'</span>';
  function rows(checks){
    return '<ul class="quality-checks">'+checks.map(check=>'<li><div>'+status(check)+'<strong>'+escape(check.label)+'</strong>'+(check.component?' <button type="button" class="token-ref" data-component="'+escape(check.component)+'">'+escape(check.component)+'</button>':'')+'</div>'+
      (check.composition?'<p>'+escape(COMPOSITIONS[check.composition]?.name??check.composition)+' · '+escape(check.scenario)+'</p>':'')+
      (check.measured!==undefined?'<p class="quality-measure">'+(check.measured===null?'Intet sikkert mål':escape(Number(check.measured.toFixed(2)).toLocaleString('da-DK'))+' '+escape(check.unit||''))+(check.expected!==undefined?' · forventet '+escape(check.expected)+' '+escape(check.unit||''):check.minimum!==undefined?' · mindst '+escape(check.minimum)+' '+escape(check.unit||''):'')+'</p>':'')+
      (check.details?'<p>'+escape(check.details)+'</p>':'')+'</li>').join('')+'</ul>';
  }
  const pairs=checks=>checks.map(check=>({status:check.ratio===null?'unmeasurable':check.passed?'pass':'warning',label:check.component?check.component+'.'+check.part+' · '+check.variant+' / '+check.state:check.foreground+' / '+check.background,
    component:check.component,details:(check.ratio===null?'Farveparret kan ikke måles sikkert.':check.ratio.toFixed(2)+':1 · minimum '+check.minimum+':1')+(check.context?' · '+check.context:'')}));
  function group(title,checks,{open=false,summaryOnly=false}={}){
    const totals=count(checks),failed=checks.filter(check=>check.status!=='pass');
    return '<details class="quality-group"'+(open||failed.length?' open':'')+'><summary>'+escape(title)+' <span>'+totals.pass+'/'+checks.length+' bestået'+(totals.warning?' · '+totals.warning+' advarsler':'')+(totals.unmeasurable?' · '+totals.unmeasurable+' kan ikke måles':'')+'</span></summary>'+
      (summaryOnly&&!failed.length?'<p class="help">'+checks.length+' eksplicitte, målbare tekst/flade-par og tilstandskombinationer består. Nedarvede og transparente CSS-par indgår kun, når kontrollen kan bestemme farverne sikkert.</p>':rows(summaryOnly?failed:checks))+'</details>';
  }
  function content(){
    sync();
    if(state.pack.schemaVersion!==2)return '<div class="canvas-toolbar"><h2>Kvalitet</h2></div><p class="help">De fælles geometri- og mønsterprøver kræver temaformat 2. Format 1 beholder sin eksisterende validering.</p>';
    const checked=validation();
    if(!checked.valid)return '<div class="canvas-toolbar"><h2>Kvalitet</h2></div><p class="help">Ret temaets valideringsfejl før den samlede kontrol. Der vises ingen resultater fra en tidligere gyldig kladde.</p><pre class="error-box">'+escape(checked.errors.join('\n'))+'</pre>';
    const theme=getTheme(),model=materializePackage(theme),resolved=resolveTokens(theme);
    const foundations=pairs(themeContrastReport(resolved)),components=pairs(componentContrastReport(model,resolved)),boundaries=pairs([...controlBoundaryReport(resolved),...componentBoundaryReport(model,resolved)]),geometry=componentGeometryReport(model,resolved);
    const totals=count([...foundations,...components,...boundaries,...geometry]);
    return '<div class="canvas-toolbar"><h2>Kvalitet</h2></div><p class="help">Kontrollér det aktuelle tema som både komponenter og samlede mønstre. Farve- og feltkantkrav håndhæves også ved validering og gemning. Geometri og mønsterprøver supplerer med afgrænsede kontroller.</p>'+
      '<div class="quality-overview"><span><strong>'+totals.pass+'</strong> bestået</span><span><strong>'+totals.warning+'</strong> advarsler</span><span><strong>'+totals.unmeasurable+'</strong> kan ikke måles</span></div>'+
      group('Semantiske tekst- og fokuspar',foundations)+group('Komponenternes tekst og tilstande',components,{summaryOnly:true})+
      group('Interaktive feltkanter',boundaries)+group('Beregnet kontrolgeometri',geometry)+
      '<section class="quality-patterns"><h3>Designmønstre i brug</h3><p class="help">Prøverne bruger katalogets interaktive eksempler. De undersøger fælles struktur og udvalgte forløb for valg, fejl og feedback i en isoleret DOM.</p>'+
      '<button type="button" class="studio-button" id="run-pattern-quality"'+(running?' disabled':'')+'>'+(running?'Kontrollerer…':'Kontrollér designmønstre')+'</button><p id="pattern-quality-progress" class="help" role="status" aria-live="polite">'+(running?'Kontrollen er i gang.':patternResult?'Resultatet gælder den aktuelle kladde.':'Ikke kørt for denne kladde.')+'</p>'+
      (patternResult?group('Struktur og udvalgte forløb',patternResult.checks)+'<ul class="help">'+patternResult.limitations.map(text=>'<li>'+escape(text)+'</li>').join('')+'</ul>':'')+'</section>';
  }
  function inspector(){
    return '<div class="inspector-heading">Kontrollens rækkevidde</div><h2>Kvalitet med synligt grundlag</h2><p>Geometri beregnes fra temaets værdier og bibliotekets opskrifter ved en rem-base på 16 px. Ukendt CSS får resultatet Kan ikke måles.</p><div class="inspector-section"><h3>Feltkanter</h3><p>3:1 er et bindende minimum for feltgrænser mod kontrol-, indholds- og grundflader. Også eksplicitte feltopskrifter og varianter kontrolleres. Dekorative kortkanter er ikke omfattet. Resultatet er ikke en tilgængelighedscertificering.</p></div><div class="inspector-section"><h3>Kontrollér også i brug</h3><p>Zoom, smalle paneler, lange labels, font-rendering og hjælpemidler kræver fortsat relevant browserkontrol. Mønsterprøverne måler ikke pixels.</p></div><div class="inspector-section"><h3>Efter ændringer</h3><p>Resultater for designmønstre nulstilles ved temaændring. Kør prøverne igen, når kladden er klar.</p></div>';
  }
  function bind(){
    document.querySelector('#run-pattern-quality')?.addEventListener('click',async()=>{
      if(running||!validation().valid)return;
      sync();const job=revision,theme=structuredClone(getTheme()),themeSubject=subject;
      running=true;const button=document.querySelector('#run-pattern-quality');if(button){button.disabled=true;button.textContent='Kontrollerer…';}
      try{
        const result=await runPatterns(theme,{document,onProgress:progress=>{
          if(job!==revision||state.pack!==themeSubject)return;
          const node=document.querySelector('#pattern-quality-progress');if(node)node.textContent='Kontrollerer mønster '+progress.index+' af '+progress.total+'…';
        }});
        if(job!==revision||state.pack!==themeSubject)return;
        patternResult=result;
      }catch(error){if(job===revision&&state.pack===themeSubject)notice('Mønsterkontrollen kunne ikke gennemføres: '+error.message,true);}
      finally{if(job===revision&&state.pack===themeSubject){running=false;if(state.view==='quality')render();}}
    });
  }
  return {content,inspector,bind,invalidate};
}
