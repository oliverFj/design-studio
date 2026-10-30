/** Build-only JSON pooling. Repeated immutable literals share bundle bytes;
 * parsing the final JSON restores independent plain data for every consumer.
 * No package format, runtime loader or network dependency is introduced.
 */
export function dataModule(value,{exportName='default'}={}){
 if(!/^[A-Za-z_$][\w$]*$/.test(exportName))throw new Error('Invalid bundle export name.');
 const records=new Map();
 function inspect(node){
  if(node&&typeof node==='object')for(const child of Object.values(node))inspect(child);
  if(typeof node!=='string'&&(!node||typeof node!=='object'))return;
  const signature=JSON.stringify(node);
  if(signature.length<40)return;
  const previous=records.get(signature);
  if(previous)previous.count++;
  else records.set(signature,{signature,node,count:1,id:'$d'+records.size});
 }
 inspect(value);
 let candidates=new Map([...records].filter(([,item])=>item.count>1&&(item.count-1)*item.signature.length>item.count*(item.id.length+1)+item.id.length+12));
 const render=(node,counts,own)=>{
  const record=(typeof node==='string'||node&&typeof node==='object')?candidates.get(JSON.stringify(node)):undefined;
  if(record&&record!==own){counts?.set(record,(counts.get(record)??0)+1);return record.id;}
  if(Array.isArray(node))return '['+node.map(item=>render(item,counts)).join(',')+']';
  if(node&&typeof node==='object')return '{'+Object.entries(node).map(([key,item])=>(key==='__proto__'?'['+JSON.stringify(key)+']':JSON.stringify(key))+':'+render(item,counts)).join(',')+'}';
  const literal=JSON.stringify(node);if(literal===undefined)throw new Error('Bundles require JSON data.');return literal;
 };
 let root,used;
 // Pooling a parent can make its children occur only once in generated code.
 // Prune those children rather than paying for unused or unhelpful constants.
 for(;;){
  const counts=new Map();root=render(value,counts);
  const visited=new Set();
  for(const [record]of counts){if(visited.has(record))continue;visited.add(record);render(record.node,counts,record);}
  const next=new Map([...candidates].filter(([,record])=>{const count=counts.get(record)??0;return count>1&&(count-1)*record.signature.length>count*(record.id.length+1)+record.id.length+12;}));
  if(next.size===candidates.size){used=counts;break;}candidates=next;
 }
 const definitions=[...candidates.values()].filter(record=>used.has(record)).map(record=>'const '+record.id+'='+render(record.node,null,record)+';');
 // JSON copies also prevent pooled token records/asset objects from leaking
 // edits across different themes. __proto__ is emitted as a computed own key.
 return definitions.join('\n')+'\nconst $bundle=JSON.parse(JSON.stringify('+root+'));\n'+(exportName==='default'?'export default $bundle;':'export { $bundle as '+exportName+' };')+'\n';
}
