import { validatePackage, resolveTokens, brandAssetDataURL } from '../core/engine.mjs';

import { DEFAULT_TOKENS, COMPONENT_LIBRARY } from '../core/library.mjs';

const imageTypes = new Set(['image/svg+xml','image/png','image/jpeg','image/webp']);
const mimeByExtension = {svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',ttf:'font/ttf',woff:'font/woff',woff2:'font/woff2',txt:'text/plain'};
const bytesOf = asset => Uint8Array.from(atob(asset.data), c => c.charCodeAt(0));
function encodeBytes(bytes) {
  let raw='';
  for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(raw);
}
const slug = value => {const id=value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'resource';return /^[a-z]/.test(id)?id:'resource-'+id;};
const uniqueId = (items, base) => {let id=base,index=2;while(items.some(item=>item.id===id))id=base+'-'+index++;return id;};

/** The guide edits the same package as tokens and recipes, without executable markup. */
export function createBrandStudio(state, {escape:e, field, edited, render, notice, allowNavigation, download, showcase=false}) {
  let selected={kind:'overview',id:null}, key=null, uploadTarget=null;
  const guide = () => state.pack.brand;
  const tokens = () => state.pack.schemaVersion === 2 ? { ...DEFAULT_TOKENS, ...state.pack.tokens } : state.pack.tokens;
  const components = () => state.pack.schemaVersion === 2 ? COMPONENT_LIBRARY : state.pack.components;
  function normalizeSelection() {
    if(key!==state.key){selected={kind:'overview',id:null};key=state.key;}
    if(selected.kind!=='overview'&&!guide()?.[selected.kind]?.some(item=>item.id===selected.id))selected={kind:'overview',id:null};
  }
  const current = () => selected.kind==='overview'?guide():guide()?.[selected.kind]?.find(item=>item.id===selected.id);
  const active = (kind,id) => selected.kind===kind&&selected.id===id?' selected':'';
  const pick = (kind,id,label) => '<button type="button" class="brand-edit-pick'+active(kind,id)+'" data-brand-pick="'+kind+'" data-brand-id="'+e(id || '')+'" aria-label="Rediger '+e(label)+'">'+e(label)+'</button>';
  function dataURL(asset, color) {
    if(!asset)return '';
    if(asset.mimeType==='image/svg+xml'&&color) {
      const svg=new TextDecoder().decode(bytesOf(asset)).replace(/\bcurrentColor\b/gi,color);
      return 'data:image/svg+xml;base64,'+encodeBytes(new TextEncoder().encode(svg));
    }
    return brandAssetDataURL(asset);
  }
  function ruleList(rules,label) {
    return rules.length?'<div class="brand-rules"><h4>'+label+'</h4><ul>'+rules.map(rule=>'<li>'+e(rule)+'</li>').join('')+'</ul></div>':'';
  }
  function tokenSample(id, resolved) {
    const token=tokens()[id];if(!token)return '';
    const value=resolved[id];
    let sample='<span class="brand-value">'+e(value)+'</span>';
    if(token.$type==='color')sample='<span class="brand-color" style="background:'+e(value)+'"></span>';
    else if(token.$type==='fontFamily')sample='<span class="brand-font" style="font-family:'+e(value)+'">Aa Bb · Æøå 0123</span>';
    else if(token.$type==='dimension'&&id.startsWith('typography.size.'))sample='<span class="brand-font" style="font-family:var(--ds-typography-font-heading);font-size:clamp(11px,'+e(value)+',64px)">Aa</span>';
    else if(token.$type==='dimension'&&id.startsWith('space.'))sample='<span class="brand-space" style="width:max(0px,min('+e(value)+',220px))"></span>';
    else if(token.$type==='shadow')sample='<span class="brand-shadow" style="box-shadow:'+e(value)+'"></span>';
    else if(token.$type==='dimension'&&id.startsWith('radius.'))sample='<span class="brand-shape" style="border-radius:'+e(value)+'"></span>';
    return '<button type="button" class="brand-token" data-brand-token="'+e(id)+'">'+sample+'<span class="brand-token-id">'+e(id)+'</span><span class="brand-token-value">'+e(value)+'</span></button>';
  }
  function content() {
    normalizeSelection();
    const brand=guide();
    const toolbar='<div class="canvas-toolbar"><h2>Brandguide</h2>'+(brand?'<button type="button" class="studio-button" data-brand-upload>Tilføj logo</button>':'')+'</div>';
    if(!brand)return toolbar+'<section class="empty"><h3>Et sted til designets hensigt</h3><p>Tilføj principper, anvendelsesregler og originale logoer til denne pakke.</p><button type="button" class="studio-button primary" data-brand-create>Opret brandguide</button></section>';
    const valid=validatePackage(state.pack).valid;
    let resolved={};if(valid)resolved=resolveTokens(state.pack);
    const assets=new Map(brand.assets.map(asset=>[asset.id,asset]));
    const primary=brand.logos[0],primaryAsset=primary&&assets.get(primary.asset);
    const heroLogo=valid&&primaryAsset?'<div class="brand-hero-mark" style="background:'+e(resolved[primary.background] || resolved['color.background.canvas'])+'"><img class="brand-hero-logo" src="'+e(dataURL(primaryAsset,resolved[primary.foreground] || resolved['color.text.primary']))+'" alt="'+e(primary.name)+'"></div>':'';
    const logos=brand.logos.map(logo=>{
      const asset=assets.get(logo.asset),background=resolved[logo.background] || resolved['color.background.canvas'],color=resolved[logo.foreground] || resolved['color.text.primary'];
      return '<article class="brand-logo-card'+active('logos',logo.id)+'"><div class="brand-logo-surface" style="background:'+e(background || 'transparent')+';color:'+e(color || 'inherit')+'">'+(valid&&asset?'<img src="'+e(dataURL(asset,color))+'" alt="'+e(logo.name)+'">':'<span>Logo</span>')+'</div><div class="brand-logo-caption">'+pick('logos',logo.id,logo.name)+'<p>'+e(logo.usage)+'</p>'+(asset&&!showcase?'<button class="brand-link" type="button" data-brand-download="'+e(asset.id)+'">Hent original · '+e(asset.fileName)+'</button>':'')+'</div></article>';
    }).join('');
    return toolbar+'<div class="brand-document ds-scope"><header class="brand-hero">'+heroLogo+'<div>'+pick('overview',null,'Identitet')+'<h2>'+e(brand.name)+'</h2><p>'+e(brand.summary)+'</p></div></header>'+
      (brand.principles.length?'<section class="brand-principles" aria-label="Designprincipper">'+brand.principles.map(item=>'<article class="'+active('principles',item.id)+'">'+pick('principles',item.id,item.title)+'<p>'+e(item.description)+'</p></article>').join('')+'</section>':'')+
      '<div class="brand-add-row"><button type="button" class="brand-link" data-brand-add="principles">Tilføj princip</button><button type="button" class="brand-link" data-brand-add="sections">Tilføj afsnit</button></div>'+
      (logos?'<section class="brand-logo-section"><h3>Logoer og mærker</h3><div class="brand-logo-grid">'+logos+'</div></section>':'')+
      brand.sections.map((section,index)=>'<section class="brand-section'+active('sections',section.id)+'"><div class="brand-section-label"><span>'+String(index+1).padStart(2,'0')+'</span>'+pick('sections',section.id,section.title)+'</div><p class="brand-section-description">'+e(section.description)+'</p>'+
        (section.tokens.length?'<div class="brand-token-grid">'+section.tokens.map(id=>tokenSample(id,resolved)).join('')+'</div>':'')+
        (section.components.length?'<div class="brand-component-links">'+section.components.map(id=>'<button type="button" class="brand-link" data-brand-component="'+e(id)+'">Se '+e(components()[id]?.name || id)+'</button>').join('')+'</div>':'')+
        '<div class="brand-rule-columns">'+ruleList(section.dos,'Gør')+ruleList(section.donts,'Undgå')+'</div></section>').join('')+
      '<section class="brand-section brand-resources"><h3>Originaler og ressourcer</h3><p>Disse filer følger med i designpakken.'+(showcase?'':' Download giver den originale fil.')+'</p><div class="brand-resource-list">'+brand.assets.map(asset=>'<div class="brand-resource-row">'+pick('assets',asset.id,asset.name)+'<span>'+e(asset.fileName)+' · '+Math.round(asset.data.length*3/4/1024)+' KB</span>'+(showcase?'':'<button type="button" class="brand-link" data-brand-download="'+e(asset.id)+'">Hent fil</button>')+'</div>').join('')+'</div></section>'+
      (brand.sources.length?'<section class="brand-section brand-sources"><h3>Grundlag og kilder</h3>'+brand.sources.map(source=>'<p><strong>'+e(source.title)+'</strong><span>'+e(source.location)+'</span></p>').join('')+'</section>':'')+'</div>';
  }
  function editField(property,label,value,{textarea=false}={}) {
    return field('brand-edit-'+property,label,value,{textarea}).replace(/<(input|textarea) /,'<$1 data-brand-edit="'+property+'" ');
  }
  function selectField(property,label,options,value,multiple=false) {
    return '<label class="studio-field" for="brand-edit-'+property+'">'+e(label)+'<select class="studio-input" id="brand-edit-'+property+'" data-brand-edit="'+property+'"'+(multiple?' multiple size="6"':'')+'>'+options.map(([id,label])=>'<option value="'+e(id)+'"'+((multiple?value.includes(id):value===id)?' selected':'')+'>'+e(label)+'</option>').join('')+'</select></label>';
  }
  function inspector() {
    normalizeSelection();const brand=guide(),item=current();
    let body='<div class="inspector-heading">Brandguide</div>';
    if(!brand)return body+'<h2>Fælles format. Egen identitet.</h2><p>Guiden samler begrundelser og anvendelsesregler med de visuelle værdier.</p>';
    body+='<h2>'+e(selected.kind==='overview'?'Identitet':item?.title || item?.name)+'</h2>';
    if(selected.kind==='overview')body+=editField('name','Brandnavn',brand.name)+editField('summary','Hensigt og karakter',brand.summary,{textarea:true})+'<p>Vælg et princip, afsnit, logo eller en ressource i guiden for at redigere det.</p>';
    else if(selected.kind==='principles')body+=editField('title','Princip',item.title)+editField('description','Betydning i designet',item.description,{textarea:true});
    else if(selected.kind==='sections')body+=editField('title','Afsnit',item.title)+editField('description','Anvendelse',item.description,{textarea:true})+editField('dos','Gør · én regel pr. linje',item.dos.join('\n'),{textarea:true})+editField('donts','Undgå · én regel pr. linje',item.donts.join('\n'),{textarea:true})+
      selectField('tokens','Viste designværdier',Object.keys(tokens()).map(id=>[id,id]),item.tokens,true)+selectField('components','Tilknyttede komponenter',Object.entries(components()).map(([id,c])=>[id,c.name]),item.components,true);
    else if(selected.kind==='logos')body+=editField('name','Logovariant',item.name)+editField('usage','Hvornår og hvordan bruges den?',item.usage,{textarea:true})+
      selectField('asset','Originalfil',brand.assets.filter(a=>imageTypes.has(a.mimeType)).map(a=>[a.id,a.fileName]),item.asset)+
      selectField('background','Baggrund i visningen',[['','Pakkens baggrund'],...Object.entries(tokens()).filter(([,t])=>t.$type==='color').map(([id])=>[id,id])],item.background || '')+
      selectField('foreground','Farve til currentColor-originaler',[['','Pakkens tekstfarve'],...Object.entries(tokens()).filter(([,t])=>t.$type==='color').map(([id])=>[id,id])],item.foreground || '')+
      '<button type="button" class="studio-button" data-brand-replace="'+e(item.asset)+'">Udskift originalfil</button>';
    else if(selected.kind==='assets')body+=editField('name','Ressource',item.name)+editField('description','Anvendelse og rettigheder',item.description,{textarea:true})+
      '<p class="file-info">'+e(item.fileName)+'<br>'+e(item.mimeType)+'</p>'+
      (item.font?editField('font-family','Skriftfamilie',item.font.family)+selectField('font-style','Stil',[['normal','Normal'],['italic','Kursiv']],item.font.style)+editField('font-weight','Vægt eller interval',item.font.weight):'')+
      '<button type="button" class="studio-button" data-brand-replace="'+e(item.id)+'">Udskift fil</button>';
    return body+'<div class="inspector-section"><p>Teksten og filerne gemmes sammen med resten af pakken.</p>'+(selected.kind!=='overview'?'<button type="button" class="studio-button" data-brand-remove>Fjern '+(selected.kind==='assets'?'ressource':selected.kind==='logos'?'logovariant':selected.kind==='principles'?'princip':'afsnit')+'</button>':'')+'</div><div id="validation-errors" class="error-box" hidden></div><input type="file" id="brand-upload-file" hidden>';
  }
  function refreshCanvas() {const canvas=document.querySelector('.canvas');if(canvas)canvas.innerHTML=content();}
  function pickItem(kind,id) {if(!allowNavigation())return;selected={kind,id:id || null};render();}
  async function upload(file,targetId) {
    if(!file)return;
    if(file.size>256*1024)throw new Error('Filen må højst fylde 256 KB.');
    const ext=file.name.split('.').pop().toLowerCase(),mimeType=mimeByExtension[ext];
    if(!mimeType)throw new Error('Vælg SVG, PNG, JPEG, WebP, TTF, WOFF, WOFF2 eller TXT.');
    const packageKey=state.key, packageBefore=JSON.stringify(state.pack);
    const candidate=structuredClone(state.pack),brand=candidate.brand,target=brand.assets.find(a=>a.id===targetId);
    let nextSelection=selected;
    if(!target&&!imageTypes.has(mimeType))throw new Error('Et nyt logo skal være en billedfil.');
    if(target?.font&&!mimeType.startsWith('font/'))throw new Error('Vælg en skriftfil til denne ressource.');
    if(target&&!target.font&&mimeType.startsWith('font/'))throw new Error('Skriftfiler skal have dokumenteret familie, stil og vægt.');
    if(brand.logos.some(logo=>logo.asset===targetId)&&!imageTypes.has(mimeType))throw new Error('Et logo skal fortsat være en billedfil.');
    const fileName=file.name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'-');
    const data=encodeBytes(new Uint8Array(await file.arrayBuffer()));
    if(target){target.fileName=fileName;target.mimeType=mimeType;target.data=data;}
    else{
      const assetId=uniqueId(brand.assets,slug(fileName)),logoId=uniqueId(brand.logos,'logo');
      brand.assets.push({id:assetId,name:file.name.replace(/\.[^.]+$/,''),fileName,mimeType,data,description:'Original logofil. Tilføj anvendelsesregler og eventuelle rettigheder.'});
      brand.logos.push({id:logoId,name:file.name.replace(/\.[^.]+$/,''),asset:assetId,usage:'Beskriv denne logovariants anvendelse.',background:'color.background.canvas',foreground:'color.text.primary'});
      nextSelection={kind:'logos',id:logoId};
    }
    const checked=validatePackage(candidate);if(!checked.valid)throw new Error(checked.errors.join('\n'));
    if(state.key!==packageKey)throw new Error('Pakken blev skiftet, mens filen blev indlæst. Vælg filen igen.');
    if(JSON.stringify(state.pack)!==packageBefore)throw new Error('Pakken blev redigeret, mens filen blev indlæst. Vælg filen igen for at bevare ændringerne.');
    state.pack=candidate;selected=nextSelection;edited();render();notice('Filen er lagt i pakken. Gem ændringer for at beholde den.');
  }
  function handleAction(event) {
    const el=event.target.closest('button');if(!el)return;
    if(el.hasAttribute('data-brand-create')){
      state.pack.brand={name:state.pack.name,summary:state.pack.description,principles:[],sections:[],logos:[],assets:[],sources:[]};selected={kind:'overview',id:null};edited();render();
    }else if(el.dataset.brandPick)pickItem(el.dataset.brandPick,el.dataset.brandId);
    else if(el.dataset.brandToken){if(allowNavigation()){state.token=el.dataset.brandToken;state.view='tokens';render();}}
    else if(el.dataset.brandComponent){if(allowNavigation()){state.component=el.dataset.brandComponent;state.view='components';render();}}
    else if(el.dataset.brandDownload){
      const asset=guide().assets.find(a=>a.id===el.dataset.brandDownload);
      if(!validatePackage(state.pack).valid){notice('Ret pakkens ugyldige værdier før download.',true);return;}
      download(asset.fileName,bytesOf(asset),asset.mimeType);
    }else if(el.dataset.brandAdd){
      const kind=el.dataset.brandAdd,id=uniqueId(guide()[kind],kind==='principles'?'principle':'section');
      guide()[kind].push(kind==='principles'?{id,title:'Nyt princip',description:'Beskriv, hvordan princippet anvendes.'}:{id,title:'Nyt afsnit',description:'Beskriv reglerne for denne del af designet.',tokens:[],components:[],dos:[],donts:[]});
      selected={kind,id};edited();render();
    }else if(el.hasAttribute('data-brand-upload')||el.dataset.brandReplace){
      uploadTarget=el.dataset.brandReplace || null;
      const input=document.querySelector('#brand-upload-file'),asset=guide().assets.find(a=>a.id===uploadTarget);
      input.accept=asset?.font?'.ttf,.woff,.woff2':asset?.mimeType==='text/plain'?'.txt':'.svg,.png,.jpg,.jpeg,.webp';input.click();
    }else if(el.hasAttribute('data-brand-remove')&&selected.kind!=='overview'){
      if(selected.kind==='assets')guide().logos=guide().logos.filter(logo=>logo.asset!==selected.id);
      guide()[selected.kind]=guide()[selected.kind].filter(item=>item.id!==selected.id);selected={kind:'overview',id:null};edited();render();
    }
  }
  function bind() {
    if(state.view!=='brand')return;
    document.querySelector('.canvas').addEventListener('click',handleAction);
    document.querySelector('.inspector').addEventListener('click',handleAction);
    document.querySelectorAll('[data-brand-edit]').forEach(el=>el.addEventListener('input',()=>{
      const item=current(),property=el.dataset.brandEdit;
      if(property.startsWith('font-'))item.font[property.slice(5)]=el.value;
      else if(el.multiple)item[property]=[...el.selectedOptions].map(option=>option.value);
      else if(property==='dos'||property==='donts')item[property]=el.value.split('\n').map(line=>line.trim()).filter(Boolean);
      else if(['background','foreground'].includes(property)&&!el.value)delete item[property];
      else item[property]=el.value;
      edited();refreshCanvas();
    }));
    document.querySelector('#brand-upload-file')?.addEventListener('change',async event=>{
      try{await upload(event.target.files[0],uploadTarget);}catch(error){notice(error.message,true);}finally{event.target.value='';}
    });
  }
  return {content,inspector,bind};
}

