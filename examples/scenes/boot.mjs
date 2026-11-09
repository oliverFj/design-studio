import themes from './bundled-themes.mjs';
import {mountScene} from './scene.mjs';

mountScene({root:document.querySelector('#scene'),themes,sceneId:document.body.dataset.scene,style:document.querySelector('#theme-styles')});
