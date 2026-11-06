import {mountGraphicMotion,MOTION} from './player.mjs';
import {bindMotionControls,updateMotionControls} from './controls.mjs';

const svg=document.querySelector('svg[data-family]');
const panel=document.querySelector('#motion-panel');
const motion=mountGraphicMotion(svg,{onUpdate:state=>updateMotionControls(panel,state)});
document.querySelector('#motion-interaction-hint').textContent=MOTION[svg.dataset.family].meta.interactionHint+' Du kan også fokusere grafikken og bruge piletasterne. Escape nulstiller.';
bindMotionControls(panel,motion);
requestAnimationFrame(()=>{if(!document.hidden&&!motion.state.reduced)motion.play();});
window.addEventListener('pagehide',()=>motion.destroy(),{once:true});
