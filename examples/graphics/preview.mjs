import {mountGraphicMotion} from '../../core/graphics/motion/player.mjs';
import {createConceptPlan} from './concepts.mjs';

const data=__GRAPHIC_LAB_DATA__;
const controllers=[];
const timeline=document.querySelector('#timeline'),position=document.querySelector('#position');
for(const scene of data.scenes){
 const card=document.querySelector(`[data-study="${scene.family}-${scene.concept}"]`),svg=card.querySelector('svg');
 const controller=mountGraphicMotion(svg,{
  createPlan:element=>createConceptPlan(element,scene),hintId:'motion-help',
  onUpdate:state=>{if(document.activeElement!==timeline){timeline.value=String(Math.round(state.progress*100));position.value=timeline.value+' %';}}
 });
 controllers.push(controller);
 card.addEventListener('pointerenter',()=>controller.play());
 svg.addEventListener('focus',()=>controller.play());
 card.querySelector('[data-replay]').addEventListener('click',()=>{controller.seek(0);controller.play();});
}
document.querySelector('#play-all').addEventListener('click',()=>controllers.forEach(c=>{c.seek(0);c.play();}));
document.querySelector('#pause-all').addEventListener('click',()=>controllers.forEach(c=>c.pause()));
document.querySelector('#reverse-all').addEventListener('click',()=>controllers.forEach(c=>c.play(true)));
document.querySelector('#settle-all').addEventListener('click',()=>controllers.forEach(c=>c.settle()));
timeline.addEventListener('input',()=>{controllers.forEach(c=>c.seek(Number(timeline.value)/100));position.value=timeline.value+' %';});
document.querySelector('#reduce').addEventListener('change',event=>controllers.forEach(c=>c.setReduced(event.target.checked)));
// The page can return from the back-forward cache with its native controllers intact.
window.addEventListener('pagehide',event=>{if(!event.persisted)controllers.forEach(c=>c.destroy());else controllers.forEach(c=>c.pause());});
