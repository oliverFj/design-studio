import { COMPOSITIONS } from './catalog.mjs';
import {mountThemePicker} from './theme-picker.mjs';
import {createResizablePanelState,mountResizablePanel} from './resizable-panel.mjs';
import { createObjectWorkbenchState, mountObjectWorkbench } from './object-workbench.mjs';
import { createResourceLibraryState, mountResourceLibrary } from './resource-library.mjs';
import { createHistoryEditorState, mountHistoryEditor } from './history-editor.mjs';
import { createListDetailState, mountListDetail } from './list-detail.mjs';
import { createFormState, mountForm } from './form.mjs';
import { createParameterWorkbenchState, mountParameterWorkbench } from './parameter-workbench.mjs';
import { createRecipeEditorState, mountRecipeEditor } from './recipe-editor.mjs';
import { WEB_PATTERNS, createWebState, mountWebPattern } from './web.mjs';

export function createCompositionState(id) {
  if(id==='theme-picker')return {id:'studio',mode:'light'};
  if(id==='resizable-panel')return createResizablePanelState();
  if (WEB_PATTERNS.includes(id)) return createWebState(id);
  if (id === 'editor') return createObjectWorkbenchState();
  if (id === 'parameter-workbench') return createParameterWorkbenchState();
  if (id === 'recipe-editor') return createRecipeEditorState();
  if (id === 'resource-library') return createResourceLibraryState();
  if (id === 'history') return createHistoryEditorState();
  if (id === 'form') return createFormState();
  if (id === 'list-detail') return createListDetailState();
  throw new Error('Ukendt sammensætning: ' + id);
}

/** Optional reference code. State belongs to the host; callbacks never imply disk persistence. */
export function mountComposition(theme, id, {
  document = globalThis.document, state = createCompositionState(id),
  announce = () => {}, onChange = () => {}, onUse = () => {}, idPrefix = 'composition-' + id,
} = {}) {
  if (!COMPOSITIONS[id]) throw new Error('Ukendt sammensætning: ' + id);
  if(id==='theme-picker'){
    const preferences={
      themeOptions:[['studio','Studio'],['castle','Castle Studio']],
      get id(){return state.id;},
      get mode(){return state.mode;},
      modes:()=>state.id==='studio'?[['light','Indigo'],['dark','Indigonat']]:[['light','Elfenben'],['dark','Mørk grøn']],
      set(id,mode='light'){Object.assign(state,{id,mode});onChange(state);},
    };
    return {...mountThemePicker(theme,{document,preferences,idPrefix}),state};
  }
  if(id==='resizable-panel')return mountResizablePanel(theme,{document,state,announce,onChange,idPrefix});
  if (WEB_PATTERNS.includes(id)) return mountWebPattern(theme, id, { document, state, onChange, idPrefix });
  if (id === 'editor') return mountObjectWorkbench(theme, { document, state, announce, onChange, idPrefix });
  if (id === 'parameter-workbench') return mountParameterWorkbench(theme, { document, state, announce, onChange, onUse, idPrefix });
  if (id === 'recipe-editor') return mountRecipeEditor(theme, { document, state, announce, onChange, onUse, idPrefix });
  if (id === 'resource-library') return mountResourceLibrary(theme, { document, state, announce, onChange, onUse, idPrefix });
  if (id === 'history') return mountHistoryEditor(theme, { document, state, announce, onChange, idPrefix });
  if (id === 'list-detail') return mountListDetail(theme, { document, state, announce, onChange, idPrefix });
  if (id === 'form') return mountForm(theme, { document, state, announce, onChange, idPrefix });
}
