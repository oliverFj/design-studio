/** Hard limits for uncompressed UTF-8 delivery files, with room for normal growth. */
export const DELIVERY_SIZE_LIMITS=Object.freeze({studio:1_500_000,workspace:1_250_000,themes:800_000});

export function assertDeliverySize(delivery,content){
 const limit=DELIVERY_SIZE_LIMITS[delivery];
 if(limit===undefined)throw new Error('Ukendt leverance: '+delivery+'.');
 const bytes=Buffer.byteLength(content,'utf8');
 if(bytes>limit)throw new Error(delivery+': Leverancen fylder '+bytes+' bytes og overskrider grænsen på '+limit+' bytes. Reducér dublering og ressourcer før levering.');
 return bytes;
}
