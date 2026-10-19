import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validatePackage,generateCSS,getComponents} from '../core/engine.mjs';
import {renderComponent} from '../core/components.mjs';
import {PUBLIC_THEME_IDS} from '../tools/public-themes.mjs';
const theme=id=>JSON.parse(readFileSync(new URL(`../packages/${id}.json`,import.meta.url),'utf8'));
test('command menu roles render and validate in every public theme',()=>{
 for(const id of PUBLIC_THEME_IDS){const pack=theme(id);assert.deepEqual(validatePackage(pack),{valid:true,errors:[]});for(const component of ['menubar','menu','menu-item'])assert.ok(getComponents(pack)[component]);assert.match(renderComponent(pack,'menubar'),/aria-haspopup="menu"/);assert.match(renderComponent(pack,'menu'),/role="menu"/);const item=renderComponent(pack,'menu-item',{attrs:{role:'menuitemcheckbox','aria-checked':'true','aria-disabled':'true'},slots:{label:'<script>unsafe</script>'}});assert.match(item,/aria-checked="true"/);assert.match(item,/aria-disabled="true"/);assert.match(item,/&lt;script&gt;/);assert.doesNotMatch(item,/<script>/);assert.match(generateCSS(pack),/\.ds-menu-item/);}
});
test('desktop density is explicit and preserves normal target sizes',()=>{
 const components=getComponents(theme('castle-studio-v2'));
 for(const id of ['button','input','select']){assert.match(components[id].parts.root.styles.minHeight,/44px/);assert.equal(components[id].variants.desktop.styles.minHeight,'32px');}
 assert.equal(components.tree.variants.desktop.parts.row.styles.minHeight,'32px');
 assert.equal(components.button.variants.desktop.styles.color,'{color.text.primary}');
 assert.equal(components.button.variants.desktop.styles.backgroundColor,'{color.background.control}');
});


test('compact tool action buttons keep native labels, optional shortcuts and pressed state in all themes',()=>{
 for(const id of PUBLIC_THEME_IDS){
  const pack=theme(id),component=getComponents(pack)['action-button'];
  assert.equal(component.variants.tool.styles.flexDirection,'column');assert.equal(component.variants.tool.styles.minHeight,'52px');
  const html=renderComponent(pack,'action-button',{variant:'tool',label:'Flyt',icon:'↔',shortcut:'',pressed:true});
  assert.match(html,/data-variant="tool"/);assert.match(html,/aria-pressed="true"/);assert.match(html,/class="ds-action-button__label">Flyt/);assert.match(html,/class="ds-action-button__shortcut" hidden/);
  assert.match(component.parts.root.styles.minHeight,/44px/);
 }
});
