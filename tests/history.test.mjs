import test from 'node:test';
import assert from 'node:assert/strict';
import { createHistoryState, createHistory } from '../patterns/history.mjs';

test('history records named snapshots, preserves references and drops redo after a new branch', () => {
  const state = createHistoryState({ values: [1] }), history = createHistory(state);
  const next = { values: [1, 2] }; history.commit('Tilføj', next); next.values.push(99);
  assert.deepEqual(history.value.values, [1, 2]); assert.equal(history.undoLabel, 'Tilføj');
  const copy = history.value; copy.values.push(88); assert.deepEqual(history.value.values, [1, 2]);
  assert.equal(history.undo(), true); assert.deepEqual(history.value.values, [1]); assert.equal(history.redoLabel, 'Tilføj');
  assert.equal(history.redo(), true); history.undo(); history.commit('Alternativ', { values: [1, 3] });
  assert.equal(history.canRedo, false); assert.equal(history.redo(), false);
  assert.equal(history.commit('Ingen ændring', { values: [1, 3] }), false); assert.equal(state.past.length, 1);
  const invalid = {}; invalid.self = invalid;
  assert.throws(() => history.commit('Ugyldig', invalid));
  assert.deepEqual(history.value, { values: [1, 3] }); assert.equal(state.past.length, 1);
});

test('save points follow content through undo and redo and history has a bounded capacity', () => {
  const history = createHistory(createHistoryState({ count: 0 }), { limit: 2 });
  assert.equal(history.dirty, false);
  history.commit('En', { count: 1 }); history.markSaved(); history.commit('To', { count: 2 });
  assert.equal(history.dirty, true); history.undo(); assert.equal(history.dirty, false);
  history.redo(); assert.equal(history.dirty, true);
  history.commit('Tre', { count: 3 }); history.undo(); history.undo();
  assert.deepEqual(history.value, { count: 1 }); assert.equal(history.undo(), false); assert.equal(history.dirty, false);
  assert.throws(() => createHistory(createHistoryState({}), { limit: 0 }), /positiv/);
});
