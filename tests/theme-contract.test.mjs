import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSharedLibraryContract} from '../tools/theme-contract.mjs';
import {validatePackage,validateCompatibility} from '../core/engine.mjs';
import {DEFAULT_TOKENS} from '../core/library.mjs';

const load=id=>JSON.parse(readFileSync(new URL('../packages/'+id+'.json',import.meta.url),'utf8'));

test('public themes with different palette vocabularies satisfy the shared semantic library contract',()=>{
  const studio=load('studio-light'),porcelain=load('porcelaen');
  const before=structuredClone(studio),contract=createSharedLibraryContract(studio);
  assert.deepEqual(validatePackage(contract),{valid:true,errors:[]});
  assert.deepEqual(validateCompatibility(contract,porcelain),{compatible:true,errors:[]});
  assert.deepEqual(Object.keys(contract.tokens),Object.keys(DEFAULT_TOKENS));
  assert.equal(contract.tokens['palette.neutral.550'],undefined);
  assert.equal(contract.brand,undefined,'theme-specific brand token references do not enter the shared contract');
  assert.equal(Object.values(contract.tokens).some(token=>typeof token.$value==='string'&&/\{[^}]+\}/.test(token.$value)),false,'the contract retains semantic values without private palette dependencies');
  assert.deepEqual(studio,before,'creating the quality-check model does not alter the source theme');
});

test('complete product replacement still rejects palette primitives missing from Porcelæn',()=>{
  const studio=load('studio-light'),porcelain=load('porcelaen');
  assert.ok(studio.tokens['palette.neutral.550']);
  assert.equal(porcelain.tokens['palette.neutral.550'],undefined);
  const fullProduct=validateCompatibility(studio,porcelain);
  assert.equal(fullProduct.compatible,false);
  assert.ok(fullProduct.errors.some(error=>error.includes('tokens.palette.neutral.550: replacement is missing')));
  const product=structuredClone(studio);
  product.tokens['product.required.value']={$type:'color',$value:'#123456',description:'A product-owned token that must survive replacement.'};
  assert.ok(validateCompatibility(product,porcelain).errors.some(error=>error.includes('tokens.product.required.value: replacement is missing')));
});
