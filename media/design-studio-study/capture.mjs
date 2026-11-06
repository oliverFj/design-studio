import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

// Uses an available Playwright installation; NODE_PATH may point at the bundled runtime.
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const sharp=require('sharp');
const output=path.resolve(fileURLToPath(new URL('../../artifacts/product-media/design-studio/',import.meta.url)));
const shots=JSON.parse(await readFile(new URL('./shots.json',import.meta.url),'utf8'));
const concepts=JSON.parse(await readFile(path.join(output,'concepts.json'),'utf8'));
const errors=[];
const server=createServer(async(req,res)=>{
  try{
    const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(output,'.'+(name==='/'?'/index.html':name));
    if(!file.startsWith(output+path.sep)){res.writeHead(403).end();return;}
    const data=await readFile(file);
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.png':'image/png','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(data);
  }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
let browser;
const settle=async page=>{await page.evaluate(async()=>{await document.fonts.ready;document.activeElement?.blur();await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});await page.mouse.move(1,1);};
try{
  browser=await chromium.launch({channel:process.env.MEDIA_BROWSER_CHANNEL||'msedge',headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2,colorScheme:'light',reducedMotion:'reduce',locale:'da-DK'});
  await context.route('**/*',route=>{const url=route.request().url();return url.startsWith(base+'/')||url.startsWith('data:')?route.continue():route.abort();});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(response.status()+' '+response.url());});
  if(!process.argv.includes('--review-only')){
    await mkdir(path.join(output,'originals'),{recursive:true});
    for(const shot of shots){
      await page.setViewportSize(shot.viewport);
      await page.emulateMedia({colorScheme:shot.colorMode});
      await page.goto(base+'/studio.html?'+new URLSearchParams({package:shot.theme,view:shot.view,mode:shot.mode}));
      await page.locator('#package-select').waitFor();
      await page.locator('#color-mode').selectOption(shot.colorMode);
      if(shot.hideInspector)await page.locator('#toggle-inspector').click();
      if(shot.category)await page.locator('[data-catalog-category="'+shot.category+'"]').click();
      if(shot.openComponent){await page.locator('[data-browser-open="'+shot.openComponent+'"]').click();await page.locator('#catalog-inline-details').scrollIntoViewIfNeeded();}
      if(shot.token)await page.locator('.token-item[data-token="'+shot.token+'"]').click();
      if(shot.crop)await page.locator(shot.crop).scrollIntoViewIfNeeded();
      await settle(page);
      await page.screenshot({path:path.join(output,'originals',shot.id+'.png')});
      const destination=path.join(output,'screenshots',shot.id+'.png');
      if(shot.crop){
        const target=page.locator(shot.crop),box=await target.boundingBox();
        const canvas=await page.locator('#studio-content').boundingBox();
        if(box.y<canvas.y-1||box.y+box.height>canvas.y+canvas.height+1)throw new Error(shot.id+': crop extends beyond visible canvas '+JSON.stringify({box,canvas}));
        await target.screenshot({path:destination});
      }else await page.screenshot({path:destination});
      const metadata=await sharp(destination).metadata();
      shot.width=metadata.width;shot.height=metadata.height;
      console.log('Optaget '+shot.id);
    }
    await page.setViewportSize({width:1080,height:1080});
    for(const concept of concepts){
      await page.goto(base+'/covers/'+concept.id+'.html');await settle(page);
      await page.screenshot({path:path.join(output,'covers',concept.id+'.png'),scale:'css'});
      console.log('Renderet produktkort '+concept.id.toUpperCase());
    }
    await writeFile(path.join(output,'capture.json'),JSON.stringify({date:'2026-11-04',browser:await browser.version(),deviceScaleFactor:2,source:'studio.html — buildStudio({showcase:true})',screenshots:shots,errors},null,2));
    await import('./review.mjs');
  }
  await page.setViewportSize({width:1440,height:1080});
  await page.goto(base+'/');await settle(page);
  await page.locator('.concept-grid').screenshot({path:path.join(output,'comparison.png'),scale:'css'});
  await page.locator('[data-cover="0"]').click();
  if(await page.locator('#gallery-cover').getAttribute('data-open')!=='0')throw new Error('Cover selection failed');
  await page.locator('.concept .image-button').first().click();
  if(!await page.locator('#viewer').evaluate(el=>el.open))throw new Error('Viewer did not open');
  await page.locator('[data-viewer="next"]').click();
  if(await page.locator('#viewer-title').textContent()!==concepts[1].name)throw new Error('Viewer navigation failed');
  await page.keyboard.press('Escape');
  if(await page.locator('#viewer').evaluate(el=>el.open))throw new Error('Escape failed');
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'/');await settle(page);
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Mobile page overflows');
  await page.locator('#kontekst').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(output,'review-mobile.png'),scale:'css'});
  const mobile=await page.locator('#gallery-cover').boundingBox();
  if(Math.abs(mobile.width-mobile.height)>1)throw new Error('Mobile cover is not square');
  // Verify the delivered review through the same restricted HTTP preview.
  await page.goto(base+'/');await settle(page);
  const broken=await page.locator('img[src]').evaluateAll(async imgs=>{await Promise.all(imgs.map(img=>{img.loading='eager';return img.decode().catch(()=>{});}));return imgs.filter(img=>!img.complete||img.naturalWidth===0).map(img=>img.alt);});
  if(broken.length)throw new Error('Review has broken images: '+broken.join(', '));
  await page.locator('[data-cover="2"]').click();
  await page.locator('#gallery-cover').click();
  if(await page.locator('#viewer-title').textContent()!==concepts[2].name)throw new Error('Cover viewer failed');
  await page.keyboard.press('Escape');
  await page.close();
  // Build a compact visual record from actual captures, without modifying originals.
  const tiles=await Promise.all(shots.map(async(shot,index)=>({input:await sharp(path.join(output,'screenshots',shot.id+'.png')).resize(600,470,{fit:'contain',background:'#edeeef'}).png().toBuffer(),left:(index%2)*620+20,top:Math.floor(index/2)*490+20})));
  await sharp({create:{width:1260,height:1490,channels:3,background:'#ffffff'}}).composite(tiles).png().toFile(path.join(output,'screenshot-series.png'));
  if(errors.length)throw new Error(errors.join('\n'));
  await writeFile(path.join(output,'verification.json'),JSON.stringify({http:true,file:false,desktop:true,mobile:true,coverSelection:true,viewerNavigation:true,escape:true,brokenImages:[],browserErrors:errors},null,2));
  console.log('Kontrolleret via HTTP: kortvalg, stor visning, navigation, Escape og mobilbredde. Direkte filåbning er ikke kontrolleret.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
