import test from 'node:test';
import assert from 'node:assert/strict';
import { splitQuestPlan } from '../lib/quest-plan.ts';

test('separates inline and multiline steps without splitting decimal distances', () => {
  assert.deepEqual(splitQuestPlan('1. Meet at the park. 2. Walk 1.5 miles. 3. Find a bench.'), ['Meet at the park.', 'Walk 1.5 miles.', 'Find a bench.']);
  assert.deepEqual(splitQuestPlan('1. Meet.\n2. Walk.\n3. Rest.'), ['Meet.', 'Walk.', 'Rest.']);
});
test('retains introductory and unnumbered text', () => {
  assert.deepEqual(splitQuestPlan('Your afternoon: 1. Meet. 2. Walk.'), ['Your afternoon:\n\nMeet.', 'Walk.']);
  assert.deepEqual(splitQuestPlan('Walk down 125th Street. Stop at 2. Main Street.'), ['Walk down 125th Street. Stop at 2. Main Street.']);
  assert.deepEqual(splitQuestPlan('A quiet stroll.\n\nA sunny bench.'), ['A quiet stroll.', 'A sunny bench.']);
  assert.deepEqual(splitQuestPlan(''), []);
});
