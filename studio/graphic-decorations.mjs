import {mountGraphicMotion} from '../core/graphics.mjs';

/** Finite, decorative playback; the surrounding native control keeps its behavior. */
export function bindDecorativeGraphics(root,{triggerSelector}={}){
 const cleanups=[];
 const players=[...root.querySelectorAll('[data-graphic-decoration]')].map(host=>{
  const svg=host.querySelector('svg[data-family]');
  if(!svg)return null;
  const player=mountGraphicMotion(svg,{interactive:false});
  const trigger=triggerSelector?host.closest(triggerSelector):null;
  if(trigger){
   const play=()=>{if(!player.state.playing)player.play();};
   for(const event of ['pointerenter','focus']){
    trigger.addEventListener(event,play);
    cleanups.push(()=>trigger.removeEventListener(event,play));
   }
  }
  return player;
 }).filter(Boolean);
 return {
  play(){players.forEach(player=>player.play());return players.some(player=>!player.state.reduced);},
  destroy(){cleanups.forEach(cleanup=>cleanup());players.forEach(player=>player.destroy());}
 };
}
