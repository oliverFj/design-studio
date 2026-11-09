/** Hard limits for uncompressed UTF-8 delivery files, with room for normal growth. */
// Shared scenes, pattern compositions and the sourced collaboration catalog; fonts and logos remain pooled.
export const DELIVERY_SIZE_LIMITS=Object.freeze({studio:2_100_000,workspace:1_650_000,themes:850_000});

export function assertDeliverySize(delivery,content){
 const limit=DELIVERY_SIZE_LIMITS[delivery];
 if(limit===undefined)throw new Error('Ukendt leverance: '+delivery+'.');
 const bytes=Buffer.byteLength(content,'utf8');
 if(bytes>limit)throw new Error(delivery+': Leverancen fylder '+bytes+' bytes og overskrider grænsen på '+limit+' bytes. Reducér dublering og ressourcer før levering.');
 return bytes;
}
