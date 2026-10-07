import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePreferences, validateGeneration } from '../lib/quest-validation.ts';
test('rejects missing, forged, and oversized generation preferences', () => {
  const form = new FormData();
  assert.throws(() => validatePreferences(form));
  form.set('neighborhood', 'Morningside Heights'); form.set('mood','Cozy'); form.set('idea','A quiet afternoon');
  assert.equal(validatePreferences(form).idea, 'A quiet afternoon');
  form.set('neighborhood','forged'); assert.throws(() => validatePreferences(form));
  form.set('neighborhood','Central Park'); form.set('idea','x'.repeat(301)); assert.throws(() => validatePreferences(form));
});
test('rejects malformed or incomplete AI output before publication', () => {
  for (const data of [null, [], {}, {title:'a',caption:'b'}, {title:'a',caption:' ',plan:'c'}, {title:'a',caption:'b',plan:'x'.repeat(1201)}]) assert.throws(() => validateGeneration(data));
  assert.deepEqual(validateGeneration({title:' Quest ',caption:' Caption ',plan:' Plan ', extra:'ignored'}), {title:'Quest',caption:'Caption',plan:'Plan'});
});
