import { runCLI } from './cli.mjs';
import { PUBLIC_THEME_IDS } from './public-themes.mjs';

for (const id of PUBLIC_THEME_IDS) {
  await runCLI(['validate', `packages/${id}.json`]);
  if (id !== PUBLIC_THEME_IDS[0]) {
    await runCLI(['compare', `packages/${PUBLIC_THEME_IDS[0]}.json`, `packages/${id}.json`]);
  }
}
