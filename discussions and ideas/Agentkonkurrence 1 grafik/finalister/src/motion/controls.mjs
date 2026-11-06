export function updateMotionControls(scope,state){
 const get=name=>scope.querySelector(`[data-motion="${name}"]`);
 get('play').textContent=state.playing?'Pause':'Afspil';
 for(const name of ['play','reverse','progress','loop'])get(name).disabled=state.reduced;
 get('progress').value=String(Math.round(state.progress*1000));
 get('progress').setAttribute('aria-valuetext',Math.round(state.progress*100)+' procent');
 get('time').textContent=`${(state.time/1000).toFixed(1)} / ${(state.duration/1000).toFixed(1)} s`;
 get('loop').checked=state.loop;
 get('reduced').checked=state.reduced;get('reduced').disabled=state.systemReduced;
 get('note').textContent=state.reduced?(state.systemReduced?'Din systemindstilling for reduceret bevægelse er aktiv.':'Rolig visning viser det færdige motiv uden bevægelse.'):(state.loop?'Gentagelse er slået til. Pause stopper afspilningen.':'Ingen automatisk gentagelse. Du styrer afspilningen.');
}
export function bindMotionControls(scope,controller,{beforePlay=()=>{},onReduced=value=>controller.setReduced(value)}={}){
 const cleanups=[];
 const listen=(name,event,handler)=>{const node=scope.querySelector(`[data-motion="${name}"]`);node.addEventListener(event,handler);cleanups.push(()=>node.removeEventListener(event,handler));};
 listen('play','click',()=>{if(!controller.state.playing)beforePlay();controller.toggle();});
 listen('reverse','click',()=>{beforePlay();controller.play(true);});
 listen('settle','click',()=>controller.settle());
 listen('progress','input',event=>{beforePlay();controller.seek(Number(event.target.value)/1000);});
 listen('loop','change',event=>controller.setLoop(event.target.checked));
 listen('reduced','change',event=>onReduced(event.target.checked));
 updateMotionControls(scope,controller.state);
 return ()=>cleanups.forEach(cleanup=>cleanup());
}

export const controlMarkup=()=>`<div class="motion-controls" id="motion-panel"><div class="motion-buttons"><button type="button" data-motion="play">Afspil</button><button type="button" data-motion="reverse">Baglæns</button><button type="button" data-motion="settle">Vis færdig</button></div><label for="motion-timeline">Tidslinje <output data-motion="time"></output></label><input id="motion-timeline" data-motion="progress" type="range" min="0" max="1000" step="1" value="1000"><div class="motion-options"><label><input type="checkbox" data-motion="loop"> Gentag</label><label><input type="checkbox" data-motion="reduced"> Rolig visning</label></div><p class="motion-note" data-motion="note"></p></div>`;
