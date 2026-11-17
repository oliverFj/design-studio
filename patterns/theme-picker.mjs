import {createComponentFactory,mountPopover} from '../core/components.mjs';
import {renderStadeMark} from '../core/stade-mark.mjs';

/** Products supply catalog, current choice and the operation that applies it. */
export function mountThemePicker(theme,{document=globalThis.document,preferences,idPrefix,label='Stade tema',showMark=true}={}){
  const c=createComponentFactory(theme,{document});
  const element=document.createElement('div');
  element.className='ds-theme-picker';
  element.style.cssText='display:flex;align-items:center;gap:var(--ds-theme-picker-gap,10px);--ds-theme-picker-control-height:max(44px, var(--ds-size-control-height, 44px))';
  const trigger=c('button',{variant:'secondary',text:label,iconName:'chevron-down'});
  trigger.style.cssText='min-height:var(--ds-theme-picker-control-height);padding-inline:var(--ds-theme-picker-button-padding,16px);white-space:nowrap';
  const chevron=trigger.querySelector('.ds-button__icon');
  if(chevron)trigger.append(chevron);
  const mark=document.createElement('span');
  mark.className='ds-theme-picker__mark';
  mark.style.cssText='display:flex;inline-size:var(--ds-theme-picker-control-height);block-size:var(--ds-theme-picker-control-height);flex:none';
  mark.innerHTML=renderStadeMark();
  const logo=mark.querySelector('svg');
  if(logo)logo.style.cssText='display:block;width:100%;height:100%';
  const facets=['subject','counterpoint','context','depth'];
  mark.querySelectorAll('.stade-facet').forEach((facet,index)=>{
    facet.style.fill='var(--ds-color-illustration-'+facets[index]+',currentColor)';
  });
  const panel=c('popover',{idPrefix,title:label,describeBody:false});
  panel.querySelector('.ds-popover__title').hidden=true;
  panel.querySelector('.ds-popover__footer').hidden=true;
  panel.style.width='min(360px, calc(var(--ds-overlay-available-width, 100vw) - 16px))';
  panel.querySelector('.ds-popover__body').style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,8rem),1fr));gap:var(--ds-space-component-gapLarge)';

  function field(label,suffix){
    return c('choice-field',{label,hint:'',controlVariant:'desktop',idPrefix:panel.querySelector('.ds-popover__title').id+'-'+suffix});
  }

  const themeField=field('Tema','theme'),modeField=field('Farve','color');
  const themeSelect=themeField.querySelector('select'),modeSelect=modeField.querySelector('select');
  panel.querySelector('.ds-popover__body').replaceChildren(themeField,modeField);
  if(showMark)element.append(mark);
  element.append(trigger,panel);

  function options(select,items,value){
    select.replaceChildren(...items.map(([id,name])=>{
      const option=document.createElement('option');
      option.value=id;
      option.textContent=name;
      return option;
    }));
    select.value=value;
  }
  function refresh(){
    themeSelect.value=preferences.id;
    const modes=preferences.modes();
    options(modeSelect,modes.length?modes:[['','Standard']],modes.length?preferences.mode:'');
    modeSelect.disabled=!modes.length;
  }
  const chooseTheme=()=>{preferences.set(themeSelect.value);refresh();};
  const chooseMode=()=>{preferences.set(themeSelect.value,modeSelect.value);modeSelect.value=preferences.mode;};
  options(themeSelect,preferences.themeOptions,preferences.id);
  refresh();
  themeSelect.addEventListener('change',chooseTheme);
  modeSelect.addEventListener('change',chooseMode);
  const controls=mountPopover(trigger,panel,{align:'end',initialFocus:themeSelect});
  return {element,open:controls.open,refresh,destroy(){
    controls.destroy();
    themeSelect.removeEventListener('change',chooseTheme);
    modeSelect.removeEventListener('change',chooseMode);
  }};
}
