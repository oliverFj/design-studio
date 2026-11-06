import * as anatomy from './anatomy.mjs';
import * as lightroom from './lightroom.mjs';
import * as passage from './passage.mjs';
import * as fieldlines from './fieldlines.mjs';

export const MOTION={anatomy,lightroom,passage,fieldlines};

/** One finite, seekable timeline. Family modules supply the choreography. */
export function mountGraphicMotion(svg,{family=svg.dataset.family,motif=svg.dataset.motif,interactive=true,reduced=false,onUpdate=()=>{},beforePlay=()=>{}}={}){
 const module=MOTION[family];
 if(!module)throw new Error('Ukendt animationsfamilie.');
 const view=svg.ownerDocument.defaultView;
 const preference=view.matchMedia('(prefers-reduced-motion: reduce)');
 let requestedReduced=reduced,plan=null,animations=[],duration=module.meta.duration||3200;
 let time=duration,playing=false,direction=1,loop=false,frame=0,last=0,rest=0,destroyed=false;
 let pointerFrame=0,pointerInput=null,interactionEnabled=true,keyX=0,keyY=0;
 const isReduced=()=>requestedReduced||preference.matches;
 const report=()=>onUpdate({progress:time/duration,time,duration,playing,direction,reduced:isReduced(),systemReduced:preference.matches,loop});
 const resetInteraction=()=>{keyX=keyY=0;plan?.interact?.({x:0,y:0,active:false});svg.removeAttribute('data-interacting');};
 function discard(){
  animations.forEach(animation=>animation.cancel());animations=[];
  resetInteraction();plan?.destroy?.();plan=null;
 }
 function prepare(){
  if(plan||isReduced()||destroyed)return;
  plan=module.create(svg,motif);duration=plan.duration||module.meta.duration||3200;
  animations=plan.tracks.filter(Boolean).map(({target,frames,start=0,end=1,easing='cubic-bezier(.2,.7,.2,1)'})=>{
   if(!target||!svg.contains(target)||!(start>=0&&end>start&&end<=1))throw new Error(`Ugyldigt animationsspor: ${family}/${motif}`);
   const animation=target.animate(frames,{duration:(end-start)*duration,delay:start*duration,easing,fill:'both'});
   animation.pause();animation.currentTime=duration;return animation;
  });
 }
 function apply(){
  prepare();
  animations.forEach(animation=>{animation.pause();animation.currentTime=time;});
  svg.dataset.motionProgress=String(Math.round(time/duration*1000));
 }
 function pause(){
  playing=false;view.cancelAnimationFrame(frame);frame=0;report();
 }
 function tick(now){
  if(destroyed||!playing)return;
  const elapsed=Math.max(0,now-last);last=now;
  if(rest>0){rest-=elapsed;if(rest<=0)time=direction>0?0:duration;}
  else{
   time=Math.max(0,Math.min(duration,time+elapsed*direction));apply();
   if((direction>0&&time===duration)||(direction<0&&time===0)){
    if(loop)rest=650;else playing=false;
   }
  }
  report();frame=playing?view.requestAnimationFrame(tick):0;
 }
 function play(backwards=false){
  if(destroyed)return;
  if(isReduced()){settle();return;}
  beforePlay();
  resetInteraction();direction=backwards?-1:1;rest=0;
  if((direction>0&&time>=duration)||(direction<0&&time<=0))time=direction>0?0:duration;
  apply();playing=true;last=view.performance.now();view.cancelAnimationFrame(frame);
  frame=view.requestAnimationFrame(tick);report();
 }
 function seek(progress){
  if(destroyed)return;
  pause();resetInteraction();rest=0;
  time=isReduced()?duration:Math.max(0,Math.min(1,progress))*duration;
  if(!isReduced())apply();report();
 }
 function toggle(){
  if(playing)pause();else play(direction<0&&time>0&&time<duration);
 }
 function settle(){
  pause();time=duration;resetInteraction();
  animations.forEach(animation=>animation.cancel());
  svg.dataset.motionProgress='1000';report();
 }
 function setReduced(value){
  requestedReduced=Boolean(value);pause();discard();time=duration;
  if(!isReduced())prepare();time=duration;svg.dataset.motionProgress='1000';report();
 }
 function move(input){
  if(!interactionEnabled||isReduced()||destroyed||time<duration)return;
  plan?.interact?.(input);svg.toggleAttribute('data-interacting',input.active);
 }
 function pointerMove(event){
  const bounds=svg.getBoundingClientRect();
  if(!bounds.width||!bounds.height)return;
  pointerInput={x:Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1)),y:Math.max(-1,Math.min(1,(event.clientY-bounds.top)/bounds.height*2-1)),active:true};
  if(!pointerFrame)pointerFrame=view.requestAnimationFrame(()=>{pointerFrame=0;move(pointerInput);});
 }
 function pointerLeave(){view.cancelAnimationFrame(pointerFrame);pointerFrame=0;resetInteraction();}
 function keyDown(event){
  if(event.key===' '){event.preventDefault();toggle();return;}
  if(event.key==='Escape'||event.key==='Home'){event.preventDefault();pointerLeave();return;}
  const arrows={ArrowLeft:[-.16,0],ArrowRight:[.16,0],ArrowUp:[0,-.16],ArrowDown:[0,.16]};
  if(!arrows[event.key])return;
  event.preventDefault();
  if(!interactionEnabled||isReduced())return;
  if(time<duration||playing)settle();
  keyX=Math.max(-1,Math.min(1,keyX+arrows[event.key][0]));keyY=Math.max(-1,Math.min(1,keyY+arrows[event.key][1]));
  move({x:keyX,y:keyY,active:true});
 }
 const changedPreference=()=>setReduced(requestedReduced);
 const hidden=()=>{if(svg.ownerDocument.hidden){pause();pointerLeave();}};
 const observer=typeof view.IntersectionObserver==='function'?new view.IntersectionObserver(entries=>{if(!entries[0].isIntersecting){pause();pointerLeave();}},{threshold:0}):null;
 preference.addEventListener('change',changedPreference);
 svg.ownerDocument.addEventListener('visibilitychange',hidden);observer?.observe(svg);
 if(interactive){
  svg.setAttribute('tabindex','0');svg.setAttribute('aria-describedby','motion-interaction-hint');
  svg.addEventListener('pointermove',pointerMove);svg.addEventListener('pointerleave',pointerLeave);svg.addEventListener('pointercancel',pointerLeave);
  svg.addEventListener('keydown',keyDown);svg.addEventListener('blur',pointerLeave);
 }
 prepare();time=duration;svg.dataset.motionProgress='1000';report();
 return {
  play,pause,toggle,seek,settle,setReduced,
  setLoop(value){loop=Boolean(value);report();},
  setInteraction(value){interactionEnabled=Boolean(value);if(!interactionEnabled)pointerLeave();},
  get state(){return {progress:time/duration,time,duration,playing,direction,reduced:isReduced(),systemReduced:preference.matches,loop};},
  destroy(){
   if(destroyed)return;
   pause();destroyed=true;view.cancelAnimationFrame(pointerFrame);discard();observer?.disconnect();
   preference.removeEventListener('change',changedPreference);svg.ownerDocument.removeEventListener('visibilitychange',hidden);
   svg.removeEventListener('pointermove',pointerMove);svg.removeEventListener('pointerleave',pointerLeave);svg.removeEventListener('pointercancel',pointerLeave);svg.removeEventListener('keydown',keyDown);svg.removeEventListener('blur',pointerLeave);
   svg.removeAttribute('tabindex');svg.removeAttribute('aria-describedby');svg.removeAttribute('data-motion-progress');
  }
 };
}
