const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const active=entry=>entry?.status==='active'||Boolean(entry?.direct?.length||entry?.indirect?.length);

export function usageLabel(entry){
  return active(entry)?'I brug':entry?.status==='compatibility'||entry?.compatibility?'Kompatibilitet':'Reference';
}

/** Compact inspector content. Buttons use the editor's existing delegated navigation. */
export function usageDetails(entry,components={},escape=escapeHTML){
  if(!entry)return '<p class="help">Ingen anvendelsesdata for tokenet.</p>';
  const e=value=>escape(String(value));
  const token=id=>'<button type="button" class="token-ref" data-token="'+e(id)+'">'+e(id)+'</button>';
  const component=id=>id==='@graphics'?'<strong>Grafik og billedfamilier</strong>':id==='@materials'?'<strong>Materialer og effekter</strong>':'<button type="button" class="token-ref" data-component="'+e(id)+'">'+e(components[id]?.name??id)+'</button>';
  const location=usage=>'<code>'+e(usage.part??'root')+'</code>'
    +(usage.variant?' · variant <code>'+e(usage.variant)+'</code>':'')
    +(usage.state?' · tilstand <code>'+e(usage.state)+'</code>':'')
    +' · <code>'+e(usage.property??'')+'</code>';
  function uses(title,items,indirect=false){
    if(!items.length)return '';
    const groups=new Map();
    for(const usage of items){if(!groups.has(usage.component))groups.set(usage.component,[]);groups.get(usage.component).push(usage);}
    return '<details class="code-details"'+(items.length<=4?' open':'')+'><summary>'+title+' ('+items.length+')</summary>'
      +[...groups].map(([id,usages])=>'<div>'+component(id)+'<ul class="help">'+usages.map(usage=>'<li>'+location(usage)
        +(indirect?'<br>Via '+(usage.via??[]).map(token).concat('<code>'+e(entry.id)+'</code>').join(' → '):'')+'</li>').join('')+'</ul></div>').join('')
      +'</details>';
  }
  function links(title,ids){
    return ids.length?'<p class="help"><strong>'+title+'</strong></p><div>'+ids.map(token).join('')+'</div>':'';
  }
  const explanation=active(entry)
    ?entry.compatibility?'Kompatibilitetsværdi, som stadig påvirker fælles komponenter.':(entry.direct??[]).concat(entry.indirect??[]).some(use=>use.domain==='materials')?'Bruges i fælles materialer og effekter, direkte eller gennem andre tokens.':(entry.direct??[]).concat(entry.indirect??[]).some(use=>use.domain==='graphics')?'Bruges i de fælles billedfamilier, direkte eller gennem andre tokens.':'Bruges i fælles komponenters opskrifter, direkte eller gennem andre tokens.'
    :usageLabel(entry)==='Kompatibilitet'?'Bevares til kompatibilitet. Ingen kendt brug i fælles komponenter; værdien kan stadig bruges i ældre produktkode.'
    :'Ingen kendt brug i fælles komponenter. Tokenet kan stadig bruges i produktets egen kode.';
  return '<p class="help">'+explanation+'</p>'
    +uses('Direkte brug',entry.direct??[])+uses('Via andre tokens',entry.indirect??[],true)
    +links('Afhænger af',entry.dependencies??[])+links('Henvises til af',entry.aliases??[]);
}
