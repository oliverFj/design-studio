import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const formlab = path.resolve(process.env.FORMLAB_PROJECT_DIR || process.cwd());
try {
  const manifest = JSON.parse(await readFile(path.join(formlab, 'package.json'), 'utf8'));
  if (manifest.name !== 'formlab') throw new Error('package.json tilhører ikke FormLab.');
  for (const file of ['material-production.js', 'material-source-runtime.js', 'tests/browser-helpers.mjs']) {
    if (!(await stat(path.join(formlab, file))).isFile()) throw new Error('FormLab-filen mangler: ' + file);
  }
} catch (error) {
  throw new Error('Kør fra FormLabs projektmappe, eller angiv en gyldig mappe i FORMLAB_PROJECT_DIR. ' + error.message);
}
const requireFormlab = createRequire(pathToFileURL(path.join(formlab, 'package.json')));
const { build } = requireFormlab('esbuild');
const { launchBrowser } = await import(pathToFileURL(path.join(formlab, 'tests/browser-helpers.mjs')));

// A diagnostic pilot, not a temporal regression assertion. The fixture and
// shaders are the product's current code; only the final normal display is added.
test('observe actual blinding infill material under one-pixel camera motion', { timeout: 180000 }, async () => {
  const bundle = await build({ stdin: { resolveDir: formlab, sourcefile: 'stade-blind-panel-pilot.js', contents: `
    import * as T from 'three';
    import {createMasonryStudyExample,MASONRY_STUDY_DETAILS} from './masonry-study-example.js';
    import {ensureMaterialSourceMaterials} from './material-source-defaults.js';
    import {applyMaterialSelection} from './material-application.js';
    import {addBlinding} from './blindings.js';
    import {buildScene,disposeScene} from './geometry.js';
    (async()=>{
      const W=640,H=480,state=createMasonryStudyExample({materialLibrary:ensureMaterialSourceMaterials()}),module=state.modules[0],storey=module.storeys[0];
      const blind=addBlinding(state,module.id,storey.id,{kind:'side',key:'side-1',position:2.1},{...structuredClone(MASONRY_STUDY_DETAILS[1].recipe),kind:'blinding',width:1.8,height:2.7,base:.6,depth:.6});
      const chosen=state.materialLibrary.find(entry=>entry.source?.family==='brick');
      applyMaterialSelection(state,{moduleId:module.id},chosen);
      const renderer=new T.WebGLRenderer({antialias:false}),gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');renderer.setSize(W,H);
      const target=new T.WebGLRenderTarget(W,H),rows=[],fixtures=[];
      const resources=()=>({textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries,programs:renderer.info.programs?.length??0});
      const pixelBackground=(pixels,at)=>pixels[at]>250&&pixels[at+1]<5&&pixels[at+2]>250;
      for(const pattern of ['bond','herringbone','radial']){
        blind.gothicDetail.masonryStudy.field={pattern,angle:45,centerX:0,centerY:.7};
        const group=buildScene(state,{mode:'materials',hideFront:false});group.updateMatrixWorld(true);
        const candidates=[];group.traverse(mesh=>{if(mesh.isMesh&&mesh.userData.blindingId===blind.id&&mesh.userData.gothicZone==='blind-panels')candidates.push(mesh);});
        if(candidates.length!==1)throw new Error('Expected one production blind-panels mesh, found '+candidates.length);
        const source=candidates[0],material=source.material;
        if(!material.userData.sourceMaterial)throw new Error('The actual infill did not use a source material.');
        await material.userData.sourceMaterial.ready;
        const mode={value:0},compile=material.onBeforeCompile,key=material.customProgramCacheKey;
        material.onBeforeCompile=(shader,r)=>{compile.call(material,shader,r);if(!shader.fragmentShader.includes('#include <colorspace_fragment>'))throw new Error('Normal display marker is missing.');shader.uniforms.pilotNormalOutput=mode;shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\\nuniform float pilotNormalOutput;').replace('#include <colorspace_fragment>','#include <colorspace_fragment>\\nif(pilotNormalOutput>.5)gl_FragColor=vec4(normalize(normal)*.5+.5,1.0);');};
        material.customProgramCacheKey=()=>key.call(material)+'|stade-infill-normal-display';material.needsUpdate=true;
        const mesh=new T.Mesh(source.geometry,material);mesh.matrix.copy(source.matrixWorld);mesh.matrixAutoUpdate=false;
        const scene=new T.Scene();scene.background=new T.Color('#ff00ff');scene.add(mesh,new T.HemisphereLight('#ffffff','#888888',1));
        const sun=new T.DirectionalLight('#ffffff',3);sun.position.set(-5,2,3);scene.add(sun);
        const box=new T.Box3().setFromObject(mesh),center=box.getCenter(new T.Vector3()),position=source.geometry.attributes.position,index=source.geometry.index;
        let area=-1,normal=new T.Vector3();
        for(let at=0;at<(index?.count??position.count);at+=3){const ids=[0,1,2].map(i=>index?index.getX(at+i):at+i),p=ids.map(i=>new T.Vector3().fromBufferAttribute(position,i).applyMatrix4(source.matrixWorld)),cross=p[1].clone().sub(p[0]).cross(p[2].clone().sub(p[0]));if(cross.lengthSq()>area){area=cross.lengthSq();normal.copy(cross).normalize();}}
        if(area<=0)throw new Error('Production infill has no visible triangles.');
        const camera=new T.OrthographicCamera(-3,3,2,-2,.01,100),sample=()=>{renderer.setRenderTarget(target);renderer.render(scene,camera);const pixels=new Uint8Array(W*H*4);renderer.readRenderTargetPixels(target,0,0,W,H,pixels);return {pixels,error:gl.getError()};};
        fixtures.push({pattern,zone:source.userData.gothicZone,axis:source.userData.masonryStudy?.axis,domain:source.geometry.attributes.masonryStudyUv?.getZ(0),sourceId:chosen.id,units:material.userData.sourceMaterial.units,triangles:(index?.count??position.count)/3,attributes:Object.keys(source.geometry.attributes)});
        for(const width of [3,1.5])for(const output of [0,1]){
          mode.value=output;camera.left=-width/2;camera.right=width/2;camera.top=width*H/W/2;camera.bottom=-camera.top;camera.updateProjectionMatrix();camera.position.copy(center).addScaledVector(normal,5);camera.lookAt(center);camera.updateMatrixWorld();
          const first=sample(),shift=new T.Vector3(1,0,0).applyQuaternion(camera.quaternion).multiplyScalar(width/W);camera.position.add(shift);camera.lookAt(center.clone().add(shift));const moved=sample();
          let compared=0,changed=0,total=0,max=0;
          for(let y=8;y<H-8;y++)for(let x=8;x<W-8;x++){const at=(y*W+x)*4,previous=(y*W+x-1)*4;if(pixelBackground(first.pixels,at)||pixelBackground(moved.pixels,previous))continue;const delta=Math.abs(first.pixels[at]-moved.pixels[previous])+Math.abs(first.pixels[at+1]-moved.pixels[previous+1])+Math.abs(first.pixels[at+2]-moved.pixels[previous+2]);compared++;if(delta>6)changed++;total+=delta;max=Math.max(max,delta);}
          rows.push({pattern,width,output:output?'normal':'color',compared,changed,changedFraction:compared?changed/compared:null,total,max,glErrors:[first.error,moved.error]});
        }
        fixtures[fixtures.length-1].resourcesAfterRender=resources();scene.remove(mesh);disposeScene(group);fixtures[fixtures.length-1].resourcesAfterRelease=resources();
      }
      const driver=gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER);target.dispose();renderer.dispose();
      window.blindPanelPilot={rows,fixtures,driver,temporalRegressionAsserted:false,coverage:'Actual production blind-panels mesh/material isolated from surrounding scene; software WebGL via existing FormLab browser helper. No occlusion/shadows/perspective/user-file reproduction.'};
    })().catch(error=>window.blindPanelPilotError=error.stack||error.message);
  ` }, bundle: true, format: 'iife', write: false, logLevel: 'silent' });
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning' && /GL_INVALID/.test(message.text())) errors.push(message.text()); });
    await page.setContent('<!doctype html><script>' + bundle.outputFiles[0].text.replaceAll('</script', '<\\/script') + '</script>');
    await page.waitForFunction(() => window.blindPanelPilot || window.blindPanelPilotError, null, { timeout: 150000 });
    const actual = await page.evaluate(() => ({ report: window.blindPanelPilot, error: window.blindPanelPilotError }));
    console.log('Infill pilot observations:', JSON.stringify(actual));
    assert.equal(actual.error, undefined);
    assert.deepEqual(errors, []);
    assert.equal(actual.report.rows.length, 12);
    for (const row of actual.report.rows) { assert.ok(row.compared > 1000, 'The field must be rendered: ' + JSON.stringify(row)); assert.deepEqual(row.glErrors, [0, 0]); }
  } finally { await browser.close(); }
});
