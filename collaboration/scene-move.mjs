import { readSceneApp, readSceneContext } from './scene-context.mjs';

function indexBlocks(acts) {
  const entries = new Map();
  function visit(block, actId, parent = null, index = 0) {
    const entry = { block, actId, parent, index };
    entries.set(block.id, entry);
    block.children?.forEach((child, position) => visit(child, actId, entry, position));
  }
  for (const act of acts) visit(act.layout, act.id);
  return entries;
}

function placement(parent, index) {
  return { actId: parent.actId, parentId: parent.block.id, parentName: parent.block.name, index };
}

export function planSceneMove(html, { appId, blockId, destinationId, index }) {
  const { manifest, start, end, actLayouts, context } = readSceneApp(html, appId);
  const entries = indexBlocks(actLayouts);
  const source = entries.get(blockId);
  const destination = entries.get(destinationId);
  if (!source) throw new Error('Blokken blev ikke fundet i scenen.');
  if (!source.parent) throw new Error('Aktens rodcontainer kan ikke flyttes.');
  if (destination?.block.type !== 'container') throw new Error('Destinationen skal være en container i scenen.');
  if (source.actId !== destination.actId) throw new Error('Blokken og destinationen skal være i samme akt.');

  for (let ancestor = destination; ancestor; ancestor = ancestor.parent) {
    if (ancestor === source) throw new Error('En blok kan ikke flyttes ind i sig selv eller en underblok.');
  }

  const sameParent = source.parent === destination;
  const maxIndex = destination.block.children.length - Number(sameParent);
  const destinationIndex = index === undefined ? maxIndex : index;
  if (!Number.isInteger(destinationIndex) || destinationIndex < 0 || destinationIndex > maxIndex) {
    throw new Error(`Placeringen skal være et heltal fra 0 til ${maxIndex}.`);
  }

  const before = placement(source.parent, source.index);
  const after = placement(destination, destinationIndex);
  const baseRevision = context.revision;
  if (sameParent && destinationIndex === source.index) {
    return { html, baseRevision, previewRevision: baseRevision, before, after, blockId };
  }

  source.parent.block.children.splice(source.index, 1);
  destination.block.children.splice(destinationIndex, 0, source.block);
  const json = JSON.stringify(manifest, null, 2).replace(/</g, '\\u003c');
  const updatedHtml = html.slice(0, start) + '\n' + json + '\n' + html.slice(end);
  const { revision: previewRevision } = readSceneContext(updatedHtml, appId);
  return { html: updatedHtml, baseRevision, previewRevision, before, after, blockId };
}
