import {track,trace} from '../../../core/graphics/motion/primitives.mjs';

// Trusted product choreography; the shared player owns playback and reduced motion.
export function createProductIllustrationPlan(svg,family){
 const tracks=[];
 [...svg.querySelectorAll('[data-part]')].forEach((node,i)=>{
  const start=[0,.13,.43,.7][i],end=[.35,.7,.88,1][i];
  if(family==='anatomy'){
   for(const shape of node.querySelectorAll('[stroke]')){const drawing=trace(shape,start,end,{easing:'linear'});if(drawing)tracks.push(drawing);}
   tracks.push(track(node,[{opacity:0},{opacity:1}],start,Math.min(end,start+.2)));
  }else if(family==='lightroom'){
   tracks.push(track(node,[{opacity:0},{opacity:1}],start,end,'cubic-bezier(.2,.7,.2,1)'));
  }else if(family==='passage'){
   tracks.push(track(node,[{opacity:0,transform:`translate(${i<2?-10:0}px,${i<2?4:0}px)`},{opacity:1,transform:'translate(0px,0px)'}],start,end,'cubic-bezier(.22,.78,.2,1)'));
  }else{
   tracks.push(track(node,[{opacity:0},{opacity:1}],start,Math.min(end,start+.15)));
   if(i===1)for(const shape of node.querySelectorAll('path')){const drawing=trace(shape,start,end,{easing:'linear'});if(drawing)tracks.push(drawing);}
  }
 });
 return {tracks};
}
