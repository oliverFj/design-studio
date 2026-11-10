import {mountGraphicMotion} from '../design/runtime/graphics/motion/player.mjs';
import {createProductIllustrationPlan} from './product-illustration-plan.mjs';

/** Decorative SVGs share their cover's pointer/focus target and never create extra stops. */
export function mountProductIllustrations(root){
 const controllers=new Map(),listeners=[];
 for(const svg of root.querySelectorAll('svg[data-product-illustration]')){
  controllers.set(svg,mountGraphicMotion(svg,{interactive:false,createPlan:element=>createProductIllustrationPlan(element,svg.dataset.family)}));
 }
 for(const button of root.querySelectorAll('[data-project-cover]')){
  const play=()=>{
   const svg=button.querySelector('[data-cover-variant]:not([hidden]) svg[data-product-illustration]');
   controllers.get(svg)?.play();
  };
  const touch=event=>{if(event.pointerType==='touch')play();};
  for(const [name,handler] of [['pointerenter',play],['focus',play],['pointerdown',touch]]){
   button.addEventListener(name,handler);listeners.push(()=>button.removeEventListener(name,handler));
  }
 }
 return {
  settle(){controllers.forEach(controller=>controller.settle());},
  destroy(){listeners.forEach(remove=>remove());controllers.forEach(controller=>controller.destroy());}
 };
}
