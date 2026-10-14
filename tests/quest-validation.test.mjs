import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePreferences, validateGeneration, boroughs, boroughForLocation, moods } from '../lib/quest-validation.ts';
test('rejects missing, forged, and oversized generation preferences', () => {
  const form = new FormData();
  assert.throws(() => validatePreferences(form));
  form.set('borough', 'Manhattan'); form.set('mood','Quiet solo reset'); form.set('idea','A quiet afternoon');
  assert.equal(validatePreferences(form).idea, 'A quiet afternoon');
  form.set('borough','forged'); assert.throws(() => validatePreferences(form));
  form.set('borough','Queens'); form.set('idea','x'.repeat(301)); assert.throws(() => validatePreferences(form));
});
test('rejects malformed or incomplete AI output before publication', () => {
  for (const data of [null, [], {}, {title:'a',caption:'b'}, {title:'a',caption:' ',plan:'c'}, {title:'a',caption:'b',plan:'x'.repeat(1201)}]) assert.throws(() => validateGeneration(data));
  assert.deepEqual(validateGeneration({title:' Quest ',caption:' Caption ',plan:' Plan ', extra:'ignored'}), {title:'Quest',caption:'Caption',plan:'Plan'});
});

test('accepts all five boroughs and groups legacy locations without rewriting quests', () => {
  for (const borough of boroughs) {
    const form = new FormData();
    form.set('borough', borough); form.set('mood', 'Discover hidden corners'); form.set('idea', 'A quiet afternoon');
    assert.equal(validatePreferences(form).borough, borough);
  }
  assert.equal(boroughForLocation('Central Park'), 'Manhattan');
  assert.equal(boroughForLocation('Queens'), 'Queens');
});

test('accepts each specific mood and rejects unknown moods', () => {
  const form = new FormData();
  form.set('borough', 'Manhattan'); form.set('idea', 'An afternoon outside');
  for (const mood of moods) {
    form.set('mood', mood);
    assert.equal(validatePreferences(form).mood, mood);
  }
  form.set('mood', 'forged');
  assert.throws(() => validatePreferences(form));
});
