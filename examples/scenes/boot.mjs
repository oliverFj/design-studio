import themes from './bundled-themes.mjs';
import {mountScene} from './scene.mjs';
import {receiveDemoTheme} from '../../studio/demo-theme.mjs';

const embedded = new URLSearchParams(location.search).get('embedded') === '1';
const scene = mountScene({root:document.querySelector('#scene'),themes,sceneId:document.body.dataset.scene,style:document.querySelector('#theme-styles'),embedded});
const stopFollowing = embedded ? receiveDemoTheme(window, scene.inheritTheme) : undefined;
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  stopFollowing?.();
  scene.destroy();
});
