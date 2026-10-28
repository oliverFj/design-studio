/** JSON document snapshots. UI selection and native input drafts stay outside this history. */
export function createHistoryState(value) {
  return { present: structuredClone(value), past: [], future: [], saved: JSON.stringify(value) };
}

export function createHistory(state, { limit = 50 } = {}) {
  if (!Number.isInteger(limit) || limit < 1) throw new Error('Historikken kræver en positiv grænse.');
  const clone = value => structuredClone(value);
  return {
    get value() { return clone(state.present); },
    get canUndo() { return state.past.length > 0; },
    get canRedo() { return state.future.length > 0; },
    get undoLabel() { return state.past.at(-1)?.label || ''; },
    get redoLabel() { return state.future.at(-1)?.label || ''; },
    get dirty() { return JSON.stringify(state.present) !== state.saved; },
    commit(label, value) {
      if (JSON.stringify(value) === JSON.stringify(state.present)) return false;
      const next = clone(value);
      state.past.push({ label, value: clone(state.present) });
      state.past.splice(0, Math.max(0, state.past.length - limit));
      state.present = next; state.future = []; return true;
    },
    undo() {
      if (!state.past.length) return false;
      const entry = state.past.pop();
      state.future.push({ label: entry.label, value: clone(state.present) }); state.present = entry.value; return true;
    },
    redo() {
      if (!state.future.length) return false;
      const entry = state.future.pop();
      state.past.push({ label: entry.label, value: clone(state.present) });
      state.past.splice(0, Math.max(0, state.past.length - limit));
      state.present = entry.value; return true;
    },
    markSaved() { state.saved = JSON.stringify(state.present); },
  };
}
