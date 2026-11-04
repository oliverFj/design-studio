import {buildStudio} from './build-studio.mjs';
import {buildWorkspace} from './build-workspace.mjs';
import {fileURLToPath} from 'node:url';

await buildStudio();
await buildWorkspace(fileURLToPath(new URL('../',import.meta.url)));
