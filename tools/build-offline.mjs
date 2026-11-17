import {buildStudio} from './build-studio.mjs';
import {buildWorkspace} from './build-workspace.mjs';
import {buildScenes} from './build-scenes.mjs';
import {buildSceneIntegration,sceneDemoCatalog} from './build-scene-integration.mjs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const scenePages=await buildSceneIntegration(root);
await buildStudio({sceneDemos:sceneDemoCatalog(scenePages)});
await buildWorkspace(root);
await buildScenes();
