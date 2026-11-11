import {createComponentFactory,mountPopover} from '../core/components.mjs';
import {renderStadeMark} from '../core/stade-mark.mjs';

/** Products supply catalog, current choice and the operation that applies it. */
export function mountThemePicker(theme,{document=globalThis.document,preferences,idPrefix}={}){
  const c=createComponentFactory(theme,{document});
  const label='Stade tema';
  const element=document.createElement('div');
  element.className='ds-theme-picker';
  const trigger=c('button',{variant:'desktop',text:label,iconName:'chevron-down'});
  const chevron=trigger.querySelector('.ds-button__icon');
  if(chevron)trigger.append(chevron);
  const mark=document.createElement('span');
  mark.style.cssText='display:inline-flex;width:16px;height:16px;flex:none';
  mark.innerHTML=renderStadeMark();
  const facets=['subject','counterpoint','context','depth'];
  mark.querySelectorAll('.stade-facet').forEach((facet,index)=>{
    facet.style.fill='var(--ds-color-illustration-'+facets[index]+',currentColor)';
  });
  trigger.insertBefore(mark,trigger.childNodes[0]);
  const panel=c('popover',{idPrefix,title:label,describeBody:false});
  panel.querySelector('.ds-popover__title').hidden=true;
  panel.querySelector('.ds-popover__footer').hidden=true;
  panel.style.width='min(360px, calc(var(--ds-overlay-available-width, 100vw) - 16px))';
  panel.querySelector('.ds-popover__body').style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,8rem),1fr));gap:var(--ds-space-component-gapLarge)';

  function field(label,suffix){
    const field=c('field',{label,idPrefix:panel.querySelector('.ds-popover__title').id+'-'+suffix});
    const input=field.querySelector('input');
    const select=c('select',{variant:'desktop'});
    select.style.width='100%';
    select.setAttribute('id',input.id);
    select.removeAttribute('aria-label');
    select.className+=' ds-field__control';
    input.parentNode.insertBefore(select,input);
    input.remove();
    return field;
  }

  const themeField=field('Tema','theme'),modeField=field('Farve','color');
  const themeSelect=themeField.querySelector('select'),modeSelect=modeField.querySelector('select');
  panel.querySelector('.ds-popover__body').replaceChildren(themeField,modeField);
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
  return {element,open:controls.open,destroy(){
    controls.destroy();
    themeSelect.removeEventListener('change',chooseTheme);
    modeSelect.removeEventListener('change',chooseMode);
  }};
}
