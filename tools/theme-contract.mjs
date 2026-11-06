import {DEFAULT_TOKENS} from '../core/library.mjs';
import {materializePackage,resolveTokens} from '../core/engine.mjs';

/** Public themes share library roles; their private palette vocabularies may differ.
 * Product replacement still uses the complete source package with validateCompatibility.
 */
export function createSharedLibraryContract(theme){
  if(theme.schemaVersion!==2)throw new Error('A shared library contract requires a format 2 theme.');
  const model=materializePackage(theme),resolved=resolveTokens(theme);
  const {brand,...contract}=model;
  contract.tokens=Object.fromEntries(Object.keys(DEFAULT_TOKENS).map(id=>[id,{...model.tokens[id],$value:resolved[id]}]));
  return contract;
}
