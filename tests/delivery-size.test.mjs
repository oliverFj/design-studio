import test from 'node:test';
import assert from 'node:assert/strict';
import {assertDeliverySize,DELIVERY_SIZE_LIMITS} from '../tools/delivery-size.mjs';

test('every delivery budget accepts its boundary and rejects one extra UTF-8 byte',()=>{
 for(const [delivery,limit]of Object.entries(DELIVERY_SIZE_LIMITS)){
  const content='a'.repeat(limit-2)+'æ';
  assert.equal(assertDeliverySize(delivery,content),limit,delivery+' measures bytes rather than UTF-16 length');
  assert.throws(()=>assertDeliverySize(delivery,content+'!'),new RegExp(delivery+':.*'+(limit+1)+'.*'+limit),delivery+' is a hard build failure');
 }
 assert.throws(()=>assertDeliverySize('unknown',''),/Ukendt leverance/);
});
