import {createComponentFactory} from '../../core/components.mjs';
import {resolveTokens} from '../../core/engine.mjs';

export const BLOG_ARTICLES=Object.freeze([
  {id:'rum',category:'Rum',title:'Når et rum giver plads',summary:'Om de små valg, der gør et sted rart at vende tilbage til.',date:'9. november 2026',reading:'6 min.',art:'room',paragraphs:['Et rum begynder sjældent med en ting. Det begynder med en fornemmelse af, hvad der skal være plads til: en samtale, en pause eller en idé, der endnu ikke har fået form.','Lys, materialer og proportioner fortæller os, hvordan vi kan være til stede. En lav bænk ved vinduet kan invitere mere end et helt katalog af møbler. Det afgørende er sammenhængen mellem tingene.','Vi kan begynde med at fjerne noget. Lade en flade være fri, flytte stolen en smule og se, hvordan lyset ændrer stedet gennem dagen. Nogle gange er det den mindste beslutning, der giver mest plads.']},
  {id:'papir',category:'Materialer',title:'Papiret husker hånden',summary:'En notesbog, en blød blyant og glæden ved det ufærdige.',date:'6. november 2026',reading:'4 min.',art:'paper',paragraphs:['Papiret giver modstand. Det tager imod en streg med sin egen rytme og gør en lille forskel synlig, hver gang vi begynder forfra.','I notesbogen behøver en tanke ikke være færdig. Her kan en skitse møde en indkøbsliste og et ord, der måske først giver mening i morgen. Det er en anden måde at tænke med hænderne på.','Et godt materiale hjælper os ikke ved at gøre alt ens. Det hjælper os ved at give plads til det personlige aftryk.']},
  {id:'lys',category:'Rum',title:'Det bløde lys klokken fire',summary:'En lampe kan skabe et lille rum inde i det store.',date:'3. november 2026',reading:'3 min.',art:'lamp',paragraphs:['Når dagen bliver kortere, flytter vi lyset tættere på. En bordlampe gør ikke hele rummet lyst. Den giver det et sted at samles.','Afstanden mellem lyskilde, bord og væg bestemmer, om lyset føles åbent eller nært. Det er værd at prøve en ny placering, før man finder en ny lampe.','Lad det praktiske og det stemningsfulde mødes. Der skal være lys nok til arbejdet og ro nok til at blive siddende lidt længere.']},
  {id:'pause',category:'Arbejdsliv',title:'En pause med udsigt',summary:'Hverdagsritualer, der giver tankerne en anden retning.',date:'30. oktober 2026',reading:'5 min.',art:'vase',paragraphs:['En pause behøver ikke være en opgave mere. Den kan være det øjeblik, hvor vi flytter blikket fra det nære arbejde til noget, der ikke skal løses.','Et glas vand, en gren i en vase eller udsigten fra et andet vindue kan markere overgangen. Det enkle ritual hjælper os med at opdage, at vi faktisk har skiftet tempo.','Når vi kommer tilbage, er opgaven ofte den samme. Men vi ser den fra en lidt anden vinkel.']},
].map(({paragraphs,...article})=>Object.freeze({...article,body:paragraphs.join('\n\n')})));
export const SHOP_PRODUCTS=Object.freeze([
  {id:'lamp',category:'Lys',title:'Orbit bordlampe',description:'Et varmt lyspunkt til skrivebordet. Drejet skærm og en rolig, rund fod.',price:895,material:'Lakeret metal · Ø 24 cm',art:'lamp'},
  {id:'notebook',category:'Papir',title:'Fold notesbog',description:'Plads til skitser, løse tanker og de første gode idéer.',price:145,material:'Genbrugspapir · 160 sider',art:'paper'},
  {id:'vase',category:'Objekter',title:'Kant vase',description:'En enkel silhuet med en lille forskydning i formen.',price:325,material:'Glaseret keramik · 18 cm',art:'vase'},
  {id:'print',category:'Papir',title:'Rum / 01',description:'Et grafisk studie i lys, flader og mødet mellem former.',price:295,material:'Kunsttryk · 30 × 40 cm',art:'print'},
]);
const currency=value=>new Intl.NumberFormat('da-DK',{style:'currency',currency:'DKK',minimumFractionDigits:Number.isInteger(value)?0:2,maximumFractionDigits:2}).format(value);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/** Original product/editorial studies: local geometry, coloured by the theme. */
function artwork(tokens,motif){
  const color=id=>escape(tokens[id]);
  const ground=color('color.illustration.ground'),plane=color('color.illustration.plane'),subject=color('color.illustration.subject'),counter=color('color.illustration.counterpoint'),ink=color('color.illustration.ink'),light=color('color.illustration.light');
  let forms='';
  if(motif==='lamp')forms=`<ellipse cx="310" cy="348" rx="150" ry="18" fill="${ink}" opacity=".1"/><path d="M175 173Q300 35 425 173Z" fill="${subject}"/><ellipse cx="300" cy="173" rx="125" ry="26" fill="${light}"/><path d="M294 175V324" stroke="${ink}" stroke-width="12"/><ellipse cx="300" cy="329" rx="83" ry="15" fill="${subject}"/><path d="M294 187H307" stroke="${counter}" stroke-width="5"/>`;
  else if(motif==='paper')forms=`<ellipse cx="315" cy="344" rx="155" ry="20" fill="${ink}" opacity=".1"/><path d="M148 138 350 91 454 290 250 337Z" fill="${subject}"/><path d="M162 139 349 101 437 284 252 325Z" fill="${plane}"/><path d="M166 139 181 136 271 321 255 325Z" fill="${counter}"/><path d="M248 161 346 140M260 186 358 165M272 211 370 190M284 236 355 220" stroke="${ink}" stroke-width="3" opacity=".35"/><path d="M390 96 405 88 467 247 452 254Z" fill="${ink}"/>`;
  else if(motif==='vase')forms=`<ellipse cx="300" cy="353" rx="126" ry="18" fill="${ink}" opacity=".1"/><path d="M272 156C267 114 264 83 235 50M294 157C309 103 331 84 350 67" fill="none" stroke="${ink}" stroke-width="4"/><path d="M270 105Q225 83 220 116 247 133 270 105M315 112Q351 93 355 118 332 130 315 112" fill="${counter}"/><path d="M249 155H344L329 202Q371 253 347 333Q306 353 251 333 228 253 265 202Z" fill="${subject}"/><path d="M265 170H326M268 313Q302 324 333 313" fill="none" stroke="${light}" stroke-width="3" opacity=".5"/>`;
  else if(motif==='print')forms=`<ellipse cx="307" cy="359" rx="142" ry="13" fill="${ink}" opacity=".1"/><path d="M190 66H408V354H190Z" fill="${ink}"/><path d="M200 76H398V344H200Z" fill="${plane}"/><circle cx="298" cy="172" r="68" fill="${subject}"/><path d="M230 172H366V275H230Z" fill="${counter}"/><path d="M230 172H298V275H230Z" fill="${light}"/><path d="M218 305H319M218 315H282" stroke="${ink}" stroke-width="2"/>`;
  else forms=`<path d="M0 279H600V420H0Z" fill="${plane}"/><path d="M345 43H535V254H345Z" fill="${light}"/><path d="M355 53H525V244H355Z" fill="${counter}" opacity=".45"/><path d="M440 53V244M355 150H525" stroke="${plane}" stroke-width="7"/><path d="M60 420 345 255H535L600 292V420Z" fill="${light}" opacity=".55"/><path d="M145 207Q204 181 257 208V292H145Z" fill="${subject}"/><path d="M132 276H271V305H132Z" fill="${subject}"/><path d="M148 305V352M255 305V352" stroke="${ink}" stroke-width="7"/><path d="M345 278H423V293H345ZM358 293V343M411 293V343" fill="${ink}" stroke="${ink}" stroke-width="5"/><path d="M365 277 370 235H398L403 277Z" fill="${subject}"/><path d="M386 236V196M385 216Q353 197 359 183 380 185 385 216M386 208Q412 181 422 194 415 215 386 208" fill="${counter}" stroke="${counter}" stroke-width="3"/>`;
  return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420"><rect width="600" height="420" fill="${ground}"/>${forms}</svg>`);
}

function sceneHelpers(theme,document){
  const component=createComponentFactory(theme,{document}),listeners=[],images=new Map();
  let imageTokens=resolveTokens(theme);
  const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
  const listen=(node,type,handler)=>{node.addEventListener(type,handler);listeners.push(()=>node.removeEventListener(type,handler));return node;};
  const clear=()=>{for(const cleanup of listeners.splice(0))cleanup();images.clear();};
  const heading=(text,variant='panel',tag='h3')=>component('heading',{variant,slots:{root:{tag,text}}});
  const image=(motif,alt)=>{
    const figure=component('image',{src:artwork(imageTokens,motif),alt,caption:''});
    images.set(figure.querySelector('img'),motif);
    return figure;
  };
  const setTheme=next=>{
    imageTokens=resolveTokens(next);
    for(const [img,motif]of images)img.setAttribute('src',artwork(imageTokens,motif));
  };
  const card=(className,parts)=>{
    const node=component('card',{slots:{header:[],body:[],footer:[]}});node.className+=' '+className;
    for(const part of ['header','body','footer']){const target=node.querySelector('.ds-card__'+part),children=parts[part];if(children?.length)target.replaceChildren(...children);else target.setAttribute('hidden','');}
    return node;
  };
  return {component,el,listen,clear,heading,image,card,setTheme};
}

export function mountBlogScene(theme,{
  document=globalThis.document,state={},renderParts,getArticles=()=>BLOG_ARTICLES,
  renderArticleImage,onOpenArticle,onCloseArticle,onOpenProduct,announce=()=>{},
}={}){
  const {component:c,el,listen,clear,heading,image,setTheme}=sceneHelpers(theme,document);
  const root=el('section','case-blog');root.setAttribute('aria-label','Mellemrum · redaktionelt magasin');
  const lists=new Set();
  let presentation={},origin,articles,matching;
  function articleImage(article,alternate){
    const alt=alternate??article.imageAlt??article.summary??'';
    return renderArticleImage?.(alternate===undefined?article:{...article,imageAlt:alternate})??image(article.art,alt);
  }
  function closeArticle(){
    const previous=origin;
    origin=undefined;
    state.article=null;
    render();
    if(previous?.navigate&&onCloseArticle?.())return;
    const host=previous?.host??root;
    const button=host.querySelector(previous?.selector??'[data-blog-open]')
      ??host.querySelector('[data-blog-open]');
    button?.focus();
  }
  function articleButton(article,{feature=false,separate=false}={}){
    const button=c('button',{text:feature?'Læs historien':'Læs artikel',variant:feature?'primary':'ghost',size:feature?'medium':'small'});
    return connectArticleButton(button,article,separate);
  }
  function connectArticleButton(button,article,separate,sourceId,buttonId){
    button.setAttribute('data-blog-open',article.id);
    if(separate){
      button.setAttribute('data-scene-action','read');
      button.setAttribute('data-scene-action-item',article.id);
    }
    if(sourceId)button.setAttribute('data-scene-action-source',sourceId);
    if(buttonId)button.setAttribute('data-blog-template-button',buttonId);
    return listen(button,'click',()=>{
      const host=button.closest?.(sourceId?'[data-scene-block="'+sourceId+'"]':'[data-scene-block]')??root;
      const hostPanel=host.closest?.('[data-scene-act-panel]')??null;
      const selector='[data-blog-open="'+article.id+'"]'+(buttonId?'[data-blog-template-button="'+buttonId+'"]':'');
      origin={host,separate,selector};
      state.article=article.id;
      render();
      if(separate){
        const live=host.querySelector(selector);
        if(live&&onOpenArticle?.(live)){
          origin.navigate=!live.isConnected||Boolean((document.querySelector('[data-scene-act-panel]')??null)!==hostPanel);
        }else announce('Vælg en artikellæser som mål for læseknappen.');
      }else host.querySelector('[data-blog-back]')?.focus();
    });
  }
  function appendText(host,className,text){
    if(text)host.append(el('p',className,text));
  }
  function renderFeature(featured,settings={},separate=false){
    if(!featured)return el('p','case-blog__empty','Der er ingen artikler at fremhæve.');
    const feature=el('article','case-blog__feature'),copy=el('div','case-blog__feature-copy');
    appendText(copy,'case-blog__eyebrow',[settings.label??'Ugens historie',featured.category].filter(Boolean).join(' / '));
    copy.append(heading(featured.title,'display','h2'));
    if(settings.showSummary!==false)appendText(copy,'case-blog__lead',featured.summary);
    appendText(copy,'case-blog__meta',[featured.date,featured.reading].filter(Boolean).join(' · '));
    if(settings.showLink!==false)copy.append(articleButton(featured,{feature:true,separate}));
    if(settings.showImage!==false)feature.append(articleImage(featured));
    else feature.className+=' case-blog__feature--text';
    feature.append(copy);
    return feature;
  }
  function renderList(items,settings={},separate=false,template){
    const latest=el('section','case-blog__latest');
    if(settings.showHeading!==false)latest.append(heading(settings.title??'Flere historier','panel','h2'));
    const grid=el('div',settings.layout==='list'?'case-blog__grid case-blog__grid--list':'case-blog__grid');
    for(const article of items){
      const item=el('article','case-blog__story');
      if(template){
        item.append(template(article,{
          image: alt=>articleImage(article,alt),
          connectButton: (button,sourceId,buttonId)=>connectArticleButton(button,article,true,sourceId,buttonId),
        }));
        grid.append(item);
        continue;
      }
      if(settings.showImage!==false)item.append(articleImage(article));
      appendText(item,'case-blog__eyebrow',[article.category,article.reading].filter(Boolean).join(' / '));
      item.append(heading(article.title));
      if(settings.showSummary!==false)appendText(item,'case-blog__summary',article.summary);
      if(settings.showLink!==false)item.append(articleButton(article,{separate}));
      grid.append(item);
    }
    latest.append(items.length?grid:el('p','case-blog__empty','Ingen artikler i dette udsnit.'));
    return latest;
  }
  function renderReader(current,settings={}){
    if(!current)return el('p','case-blog__empty','Vælg en artikel for at læse den her.');
    const article=el('article','case-blog__reader');
    const back=listen(c('button',{text:'Tilbage til magasinet',variant:'ghost',size:'small',iconName:'arrow-left',attrs:{'data-blog-back':''}}),'click',closeArticle);
    back.setAttribute('data-scene-target-focus','');
    const copy=el('div','case-blog__reader-copy');
    appendText(copy,'case-blog__eyebrow',[current.category,current.reading].filter(Boolean).join(' / '));
    copy.append(heading(current.title,'title','h2'));
    if(settings.showSummary!==false)appendText(copy,'case-blog__lead',current.summary);
    if(settings.showDate!==false)appendText(copy,'case-blog__meta',current.date);
    for(const paragraph of (current.body??'').split(/\r?\n\s*\r?\n/))appendText(copy,'case-blog__paragraph',paragraph.trim());
    if(current.productId&&onOpenProduct){
      const product=c('button',{text:'Se varen',variant:'secondary',attrs:{'data-scene-action':'product','data-scene-action-item':current.productId}});
      copy.append(listen(product,'click',()=>{
        if(!onOpenProduct(current.productId,product))announce('Vælg en blok med varedetaljer som mål.');
      }));
    }
    article.append(back);
    if(settings.showImage!==false)article.append(articleImage(current));
    article.append(copy);
    return article;
  }
  function paintList(list){
    const {settings,element,renderCard,card}=list;
    const start=(settings.startAt??1)-1;
    const source=settings.source==='all'?articles:matching;
    element.replaceChildren(renderList(source.slice(start,start+(settings.count??3)),settings,true,
      card&&((article,controls)=>renderCard(card,article,controls))));
  }
  function render(focus){
    clear();
    articles=getArticles();
    const categories=[...new Set(['Alle',...articles.map(article=>article.category).filter(Boolean)])];
    if(!categories.includes(state.category))state.category='Alle';
    const current=articles.find(article=>article.id===state.article);
    if(!current){state.article=null;origin=undefined;}
    matching=articles.filter(article=>state.category==='Alle'||article.category===state.category);
    const header=el('header','case-blog__masthead');
    header.append(el('span','case-blog__wordmark','Mellemrum'),el('span','case-blog__edition','Et magasin om form og hverdag · Nr. 04'));
    const nav=el('nav','case-blog__categories');nav.setAttribute('aria-label','Artikelemner');
    for(const category of categories){
      const button=c('button',{text:category,variant:'ghost',size:'small',attrs:{'aria-pressed':String(state.category===category),'data-blog-category':category}});
      listen(button,'click',()=>{state.category=category;state.article=null;render(category);});nav.append(button);
    }
    const stories=current&&!origin?.separate?[renderReader(current)]:[renderFeature(matching[0])];
    const extra=matching.slice(1,presentation.stories?.count??matching.length);
    if((!current||origin?.separate)&&extra.length)stories.push(renderList(extra));
    const footer=el('footer','case-blog__footer');footer.append(el('span','','Mellemrum'),el('span','','Nye perspektiver på det, vi omgiver os med.'));
    if(renderParts){
      const feature=presentation.feature??{};
      const source=feature.source==='all'?articles:matching;
      renderParts({
        masthead:header,categories:nav,stories,footer,
        feature:renderFeature(source[(feature.startAt??1)-1],feature,true),
        reader:renderReader(current,presentation.reader),
      });
    }
    else root.replaceChildren(header,nav,...stories,footer);
    for(const list of lists)paintList(list);
    if(focus)Array.from(nav.children).find(button=>button.getAttribute('data-blog-category')===focus)?.focus();
  }
  render();
  return {
    element:root,destroy:clear,setTheme,refresh:()=>render(),
    configure(region,settings){
      const previous=presentation[region]??{};
      if(JSON.stringify(previous)===JSON.stringify(settings))return;
      presentation={...presentation,[region]:settings};
      render();
    },
    mountList(renderCard){
      const list={element:el('div','case-blog__list'),settings:{},renderCard};
      lists.add(list);
      paintList(list);
      return {
        element:list.element,
        update(settings={},card){
          const revision=JSON.stringify([settings,card]);
          if(list.revision===revision)return;
          list.revision=revision;
          list.settings=settings;
          list.card=card;
          render();
        },
        destroy(){lists.delete(list);},
      };
    },
  };
}

export function mountShopScene(theme,{
  document=globalThis.document,state={},idPrefix='case-shop',announce=()=>{},renderParts,onOpenCart,
  getProducts=()=>SHOP_PRODUCTS,renderProductImage,
}={}){
  const {component:c,el,listen,clear,heading,image,card,setTheme}=sceneHelpers(theme,document);
  const root=el('section','case-shop');root.setAttribute('aria-label','Form Butik · designprodukter');
  state.quantity??='1';state.cart??={};state.cartOpen??=false;
  let products;
  const productImage=product=>renderProductImage?.(product)??image(product.art,product.imageAlt??product.title);
  const count=()=>Object.values(state.cart).reduce((sum,quantity)=>sum+quantity,0);
  function add(product,focus){
    const amount=product.id===state.product?Number(state.quantity):1;
    state.cart[product.id]=(state.cart[product.id]??0)+amount;
    state.message=product.title+' er lagt i kurven.';announce(state.message);render(focus);
  }
  function openCart(trigger){
    const wasOpen=state.cartOpen;
    if(onOpenCart){
      if(!wasOpen){
        state.cartOpen=true;
        trigger=render('[data-shop-cart]');
      }
      if(onOpenCart(trigger)||!wasOpen)return;
    }
    state.cartOpen=!wasOpen;
    render('[data-shop-cart]');
  }
  function render(focus,fallback,focusCategory){
    clear();
    products=getProducts();
    const categoryNames=[...new Set(['Alle',...products.map(product=>product.category).filter(Boolean)])];
    if(!categoryNames.includes(state.category))state.category='Alle';
    const ids=new Set(products.map(product=>product.id));
    if(!ids.has(state.product)){state.product=products[0]?.id;state.quantity='1';state.message='';}
    for(const id of Object.keys(state.cart))if(!ids.has(id))delete state.cart[id];
    const header=el('header','case-shop__header'),identity=el('div','case-shop__identity');identity.append(el('span','case-shop__wordmark','FORM / BUTIK'),el('span','case-shop__byline','Gode ting til den nære hverdag.'));
    const cartButton=c('button',{text:'Kurv · '+count(),variant:'secondary',size:'small',attrs:{
      'data-shop-cart':'',...(onOpenCart?{'data-scene-action':'cart'}:{'aria-expanded':String(state.cartOpen)}),
    }});
    listen(cartButton,'click',()=>openCart(cartButton));header.append(identity,cartButton);
    let cart;
    if(state.cartOpen){
      cart=el('section','case-shop__cart');cart.setAttribute('aria-labelledby',idPrefix+'-cart-title');
      const cartTitle=heading('Din kurv','panel','h2');cartTitle.setAttribute('id',idPrefix+'-cart-title');
      cartTitle.setAttribute('tabindex','-1');
      cartTitle.setAttribute('data-shop-cart-focus','');
      cartTitle.setAttribute('data-scene-target-focus','');
      cart.append(cartTitle);
      const entries=products.filter(product=>state.cart[product.id]>0);
      if(!entries.length)cart.append(el('p','','Din kurv er tom. Find en ting, du har lyst til at se nærmere på.'));
      else{
        const list=el('ul','case-shop__cart-items');
        for(const product of entries){
          const row=el('li','case-shop__cart-item'),description=el('div','case-shop__cart-copy');description.append(el('strong','',product.title),el('span','',state.cart[product.id]+' stk. · '+currency(product.price)));
          const remove=c('button',{text:'Fjern',variant:'ghost',size:'small',label:'Fjern '+product.title,attrs:{'aria-label':'Fjern '+product.title}});listen(remove,'click',()=>{
            delete state.cart[product.id];
            render(onOpenCart?'[data-shop-cart-focus]':'[data-shop-cart]');
          });row.append(description,el('strong','',currency(product.price*state.cart[product.id])),remove);list.append(row);
        }
        const total=entries.reduce((sum,product)=>sum+Math.round(product.price*100)*state.cart[product.id],0),summary=el('div','case-shop__total');summary.append(el('span','','I alt'),el('strong','',currency(total/100)));
        cart.append(list,summary,el('p','case-shop__demo-note','Demokurv · Der gennemføres ingen bestilling eller betaling.'));
      }
    }
    const current=products.find(product=>product.id===state.product);
    const feature=current?renderProduct(current):el('p','case-shop__description','Der er ingen varer endnu.');
    function renderProduct(current){
    const detail=el('section','case-shop__feature'),copy=el('div','case-shop__feature-copy');
    const title=heading(current.title,'title','h2');
    title.setAttribute('data-scene-target-focus','');title.setAttribute('tabindex','-1');
    copy.append(el('p','case-shop__eyebrow',['Udvalgt',current.category].filter(Boolean).join(' / ')),title,el('p','case-shop__description',current.description??''),el('p','case-shop__material',current.material??''),el('p','case-shop__price',currency(current.price)));
    const options=el('div','case-shop__purchase');
    const quantity=c('field',{idPrefix:idPrefix+'-quantity',label:'Antal',slots:{control:{tag:'select',children:[1,2,3,4,5].map(value=>({tag:'option',attrs:{value:String(value)},text:String(value)}))}},hint:''});
    const select=quantity.querySelector('select');select.value=state.quantity;listen(select,'change',()=>{state.quantity=select.value;});
    const addButton=c('button',{text:'Læg i kurv',variant:'primary',attrs:{'data-shop-add':'feature'}});listen(addButton,'click',()=>add(current,'[data-shop-add="feature"]'));options.append(quantity,addButton);copy.append(options);
    const message=el('p','case-shop__message',state.message??'');message.setAttribute('role','status');copy.append(message);detail.append(productImage(current),copy);
    return detail;
    }
    const collection=el('section','case-shop__collection'),bar=el('div','case-shop__collection-bar');bar.append(heading('Ting med omtanke','panel','h2'));
    const categories=el('div','case-shop__categories');categories.setAttribute('role','group');categories.setAttribute('aria-label','Produktkategorier');
    for(const category of categoryNames){const button=c('button',{text:category,variant:'ghost',size:'small',attrs:{'aria-pressed':String(state.category===category),'data-shop-category':category}});listen(button,'click',()=>{state.category=category;render(undefined,undefined,category);});categories.append(button);}
    bar.append(categories);collection.append(bar);const grid=el('div','case-shop__products');
    for(const product of products.filter(product=>state.category==='Alle'||product.category===state.category)){
      const detail=c('button',{text:'Se produkt',variant:'ghost',size:'small',attrs:{'data-shop-product':product.id,'aria-pressed':String(state.product===product.id),'aria-label':'Se '+product.title}});
      listen(detail,'click',()=>{state.product=product.id;state.quantity='1';state.message='';render('[data-shop-add="feature"]','[data-shop-product="'+product.id+'"]');});
      const productCopy=el('div','case-shop__product-copy');productCopy.append(heading(product.title),el('p','case-shop__product-material',product.material));const productBuy=el('div','case-shop__product-buy');productBuy.append(el('strong','',currency(product.price)),detail);
      const item=card('case-shop__product',{header:[productImage(product)],body:[productCopy],footer:[productBuy]});grid.append(item);
    }
    collection.append(grid);
    const footer=el('footer','case-shop__footer');footer.append(el('span','','FORM / BUTIK'),el('span','','Demobutik · produkter og priser er eksempler.'));
    const parts={header,cart,feature,collection,footer};
    const visible=Object.values(parts).filter(Boolean);
    if(renderParts)renderParts(parts);else root.replaceChildren(...visible);
    if(focus){
      const candidates=[focus,fallback].filter(Boolean).flatMap(selector=>visible.map(part=>part.querySelector(selector)));
      (candidates.find(node=>node?.isConnected)??candidates.find(node=>node&&node.isConnected===undefined))?.focus();
    }
    if(focusCategory)Array.from(categories.children).find(button=>button.getAttribute('data-shop-category')===focusCategory)?.focus();
    return cartButton;
  }
  render();
  return {
    element:root,destroy:clear,setTheme,refresh:()=>render(),
    selectProduct(id){
      if(!getProducts().some(product=>product.id===id))return false;
      if(state.product!==id){state.product=id;state.quantity='1';state.message='';render();}
      return true;
    },
  };
}
