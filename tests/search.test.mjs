import test from 'node:test';
import assert from 'node:assert/strict';
import { searchMatch } from '../collaboration/search.mjs';
import { searchExperiences } from '../collaboration/catalog.mjs';

test('English concepts match Danish terms and phrases without weakening AND semantics', () => {
  for (const [query, title] of [
    ['theme', 'Temaer'], ['graphic style', 'Illustrationsstil'], ['brand guide', 'Brandguide'],
    ['keyboard focus', 'Tastatur og fokus'], ['save file', 'Gem fil'], ['data grid', 'Redigerbart datagrid'],
    ['dropdown', 'Kombinationsfelt'], ['spacing', 'Afstande'], ['animation', 'Bevægelse'], ['pattern', 'Designmønstre'],
  ]) {
    const result = searchMatch(query, { title });
    assert.ok(result, query + ' should match ' + title);
    assert.deepEqual(result.matchedIn, ['title']);
    assert.ok(result.snippet.includes(title));
  }
  assert.equal(searchMatch('keyboard focus', { title: 'Tastatur' }), null);
  assert.equal(searchMatch('brand guide keyboard', { title: 'Brandguide' }), null);
  assert.equal(searchMatch('theme nonexistingconcept', { title: 'Temaer' }), null);
  assert.equal(searchMatch('save', { title: 'Gemini' }), null, 'translated aliases must match full terms');
  assert.equal(searchMatch('focus', { title: 'Fokusgruppe' }), null);
  assert.ok(searchMatch('ændringer renderer.mjs', { body: 'Teksturændringer i renderer.mjs' }), 'existing literal compound/source searches still work');
});

test('exact IDs and titles retain priority and snippets identify actual translated matches', () => {
  const exact = searchMatch('data-grid', { id: 'data-grid', title: 'Redigerbart datagrid' });
  const translated = searchMatch('data-grid', { title: 'Datagrid' });
  assert.ok(exact.score > translated.score);
  const title = searchMatch('Gem fil', { title: 'Gem fil' });
  const body = searchMatch('Gem fil', { title: 'Andet', body: 'Gem fil her.' });
  assert.ok(title.score > body.score);
  const result = searchMatch('keyboard focus', { title: 'Tastatur', body: 'x'.repeat(400) + ' Fokus vender tilbage til udløseren.' });
  assert.deepEqual(result.matchedIn, ['title', 'body']);
  assert.match(result.snippet, /Fokus vender tilbage/);
  assert.ok(result.snippet.startsWith('…'));
});

test('experience search shares translated matching, exact ranking and explicit lifecycle/project filters', () => {
  const entry = (id, title, rest = {}) => ({ id, title, summary: 'En observation', tags: [], status: 'reviewed', scope: 'project', project: 'editor', ...rest });
  const entries = [
    entry('incidental', 'Andet', { heuristic: 'Brug brandguide og tastatur.' }),
    entry('guide', 'Brandguide og tastatur'),
    entry('other-project', 'Brandguide og tastatur', { project: 'other' }),
    entry('old', 'Brandguide og tastatur', { status: 'retired' }),
    entry('partial', 'Brandguide'),
  ];
  assert.deepEqual(searchExperiences(entries, { query: 'brand guide keyboard', project: 'editor' }).map(item => item.id), ['guide', 'incidental']);
  assert.deepEqual(searchExperiences(entries, { query: 'brand guide keyboard', status: 'retired' }).map(item => item.id), ['old']);
  assert.deepEqual(searchExperiences(entries, { query: 'brand guide keyboard impossible' }), []);
  const exact = entry('brandguide', 'Et andet navn');
  assert.equal(searchExperiences([entries[1], exact], { query: 'brandguide' })[0].id, 'brandguide');
  assert.equal(searchMatch('brand guide keyboard', { id: entries[1].id, title: entries[1].title, body: JSON.stringify(entries[1]) }).matchedIn.includes('title'), true);
});
