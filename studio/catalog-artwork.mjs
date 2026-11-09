import {renderGraphic} from '../core/graphics.mjs';
import {GRAPHIC_CATALOG_IDS} from '../core/graphics/catalog.mjs';
import {renderCatalogPlaceholder} from '../core/catalog-placeholder.mjs';

export const CATALOG_ARTWORK_IDS=GRAPHIC_CATALOG_IDS;

/** Every role uses the selected family's own semantic drawing and motion. */
export function renderCatalogArtwork(id,pack,renderer){
 if(!pack||!CATALOG_ARTWORK_IDS.includes(id))return '<span class="catalog-concept-art" aria-hidden="true">'+renderCatalogPlaceholder()+'</span>';
 const options={idPrefix:'catalog-artwork-'+id,decorative:true};
 const svg=renderer?renderer.render(id,options):renderGraphic(pack,id,options);
 return '<span class="catalog-concept-art catalog-concept-art--graphic" data-catalog-artwork="'+id+'" data-graphic-decoration aria-hidden="true">'+svg+'</span>';
}
