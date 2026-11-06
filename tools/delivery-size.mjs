/** Hard limits for uncompressed UTF-8 delivery files, with room for normal growth. */
// Shared vector scenes plus 44 full pattern compositions; fonts and logos remain pooled.
export const DELIVERY_SIZE_LIMITS=Object.freeze({studio:2_025_000,workspace:1_650_000,themes:850_000});

export function assertDeliverySize(delivery,content){
 const limit=DELIVERY_SIZE_LIMITS[delivery];
 if(limit===undefined)throw new Error('Ukendt leverance: '+delivery+'.');
 const bytes=Buffer.byteLength(content,'utf8');
 if(bytes>limit)throw new Error(delivery+': Leverancen fylder '+bytes+' bytes og overskrider grænsen på '+limit+' bytes. Reducér dublering og ressourcer før levering.');
 return bytes;
}
