import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transform} from 'esbuild';
import {dataModule} from '../tools/bundle-data.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
import {createThemeStorage} from '../studio/theme-storage.mjs';

const load=async source=>(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64')));
const themes=()=>PUBLIC_THEME_IDS.map(key=>({key,package:JSON.parse(readFileSync(new URL('../packages/'+key+'.json',import.meta.url),'utf8'))}));

test('pooled theme modules preserve every package and independent editable objects',async()=>{
 const source=themes(),module=dataModule(source),decoded=(await load(module)).default;
 assert.deepEqual(decoded,source);
 assert.ok(Buffer.byteLength(module)<Buffer.byteLength(JSON.stringify(source))*.8,'pooling actually saves at least 20% with current public data');
 const shared={deep:{description:'A repeated, mutable token description with sufficient length.',value:[1,2,3]}};
 const sameData=[{item:shared},{item:shared}];
 const copies=(await load(dataModule(sameData))).default;
 assert.notEqual(copies[0].item,copies[1].item);
 assert.notEqual(copies[0].item.deep,copies[1].item.deep);
 copies[0].item.deep.value.push(4);assert.deepEqual(copies[1].item.deep.value,[1,2,3]);
 const downloads=[],store=createThemeStorage(decoded,{download:(...args)=>downloads.push(args)});
 const opened=await store.read(source[0].key);opened.package.name='An edited local theme';
 await store.save(source[0].key,opened.package);
 assert.deepEqual(JSON.parse(downloads[0][1]),opened.package,'normal theme downloads retain the full format and original assets');
 assert.equal((await store.read(source[1].key)).package.name,source[1].package.name);
 assert.deepEqual(source,themes(),'the source packages remain untouched');
});

test('pooling remains plain data for prototype-like keys, text, null and empty values',async()=>{
 const object=JSON.parse('{"__proto__":{"polluted":"no"},"constructor":{"prototype":{"test":1}},"text":"</script>\\u2028\\u2029","empty":"","values":[null,false,0,[]]}');
 const source=[object,object,{unique:'kept'}];
 for(const minify of [false,true]){
  let module=dataModule(source,{exportName:'themes'});
  if(minify)module=(await transform(module,{loader:'js',format:'esm',minify:true,target:'es2022'})).code;
  const embedded=module.replace(/<\/script/gi,'<\\/script');
  assert.doesNotMatch(embedded,/<\/script/i);
  const decoded=(await load(embedded)).themes;
  assert.deepEqual(decoded,source);
  assert.ok(Object.hasOwn(decoded[0],'__proto__'));
  assert.equal(Object.getPrototypeOf(decoded[0]),Object.prototype);
  assert.equal({}.polluted,undefined);
  decoded[0].__proto__.polluted='local';assert.equal(decoded[1].__proto__.polluted,'no');
 }
 assert.throws(()=>dataModule(source,{exportName:'unsafe-name'}),/export name/);
});
