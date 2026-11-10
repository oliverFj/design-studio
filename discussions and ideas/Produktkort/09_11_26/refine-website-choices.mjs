import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import './transparent-website-covers.mjs';

const website='E:/AI projekter/Second Gen/Hjemmeside';
async function update(file,edit){
 const target=path.join(website,file);
 const current=await readFile(target,'utf8');
 await writeFile(target,edit(current).replace(/\r\n/g,'\n'));
}
await update('src/illustrations.mjs',source=>source
 .replace(/  \{ id: 'original', name: 'Originale produktkort' \},\r?\n/,'')
 .replace("? style : 'original'","? style : 'anatomy'"));
await update('src/app.mjs',source=>source
 .replace(/const illustrationNote=.*\r?\n/,'')
 .replace(/illustrationSelect.setAttribute\('aria-describedby',illustrationNote.id\);\r?\n/,'')
 .replace("let illustration='original'","let illustration='anatomy'")
 .replace('const {selected,fallbackCount}=applyCoverStyle','const {selected}=applyCoverStyle')
 .replace(/  illustrationNote.classList.toggle.*\r?\n/,'')
 .replace("+(fallbackCount?'. Originalmotivet vises, når en stilvariant mangler.':'.')","+'.'"));
await update('tools/render-site.mjs',source=>source.replace(/<p class="journal-illustration-note is-inactive" id="journal-illustration-note">[^<]*<\/p>/,''));
await update('src/styles.css',source=>source
 .replace(/^.*\.journal-illustration-note.*\r?\n/gm,'')
 .replace(/\/\* Keep the help row's footprint; its text must not widen the preference columns\. \*\/\r?\n/,''));
await update('tools/illustrations.test.mjs',source=>source
 .replace("import {applyCoverStyle}","import {applyCoverStyle,ILLUSTRATION_STYLES}")
 .replace("{selected:'original',fallbackCount:0}","{selected:'anatomy',fallbackCount:2}")
 .replace("  assert.equal(original.hidden,false);assert.equal(illustrated.hidden,true);assert.equal(fallback.hidden,false);",`  assert.equal(original.hidden,false);assert.equal(illustrated.hidden,true);assert.equal(fallback.hidden,false);
  assert.deepEqual(ILLUSTRATION_STYLES.map(style=>style.id),['anatomy','lightroom','passage','fieldlines']);
  assert.equal(applyCoverStyle(root,'original').selected,'anatomy');`));
console.log('Fire illustrationsvalg; hjælpetekst og placeholder fjernet; FormLabs originale logo indsat.');
