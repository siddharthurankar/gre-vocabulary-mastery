import assert from 'node:assert/strict';
import {emptyState, validateBackup} from '../web/engine.mjs';

const data = {groups: [{id: 1, words: [
  {id: 'word-1', canonical: 'first'},
  {id: 'word-2', canonical: 'second'},
]}]};
const session = () => ({
  mode: 'group', group: 1, stage: 'learn', queue: ['word-1'], index: 0,
  current: null, retries: {}, attempts: [], skipped: [],
});
const backup = saved => ({...emptyState(), savedParts: {'1:learn': saved}});

// Saved parts must pass the same checks as the active session before restore.
for (const saved of [
  42, null, [], {},
  {...session(), queue: ['unknown-word']},
  {...session(), index: -1},
  {...session(), index: 2},
  {...session(), stage: 'unknown'},
  {...session(), group: 999},
  {...session(), mode: 'due'},
  {...session(), retries: []},
  {...session(), attempts: null},
  {...session(), skipped: null},
  {...session(), current: {entryId: 'word-1', options: []}},
]) {
  assert.throws(() => validateBackup(backup(saved), data), /Invalid saved/);
}
assert.throws(() => validateBackup({
  ...emptyState(), savedParts: {'2:learn': session()},
}, data), /Invalid saved/);

// Old backups without saved parts and completed parts remain compatible.
assert.deepEqual(validateBackup(emptyState(), data).words, {});
for (const index of [0, 1]) {
  const restored = validateBackup(backup({...session(), index}), data);
  assert.equal(restored.savedParts['1:learn'].index, index);
  assert.deepEqual(restored.savedParts['1:learn'].queue, ['word-1', 'word-2']);
}

// A real saved quiz question is retained, and corrupt answers are rejected.
const quiz = {...session(), stage: 'recognize', current: {
  entryId: 'word-1', id: 'first:recognize:0', prompt: 'Choose a meaning.',
  options: Array.from({length: 5}, (_, i) => ({
    label: `Meaning ${i}`, meaning: `Meaning ${i}`, canonical: `option-${i}`,
    correct: i === 0,
  })), selected: null,
}};
const quizBackup = {...emptyState(), savedParts: {'1:recognize': quiz}};
assert.deepEqual(validateBackup(quizBackup, data).savedParts['1:recognize'].current, quiz.current);
const corruptQuiz = structuredClone(quizBackup);
corruptQuiz.savedParts['1:recognize'].current.selected = 9;
assert.throws(() => validateBackup(corruptQuiz, data), /Invalid saved answer/);

// The active session still receives validation too.
assert.throws(() => validateBackup({...emptyState(), session: {...session(), index: -1}}, data), /Invalid saved session/);
console.log('PASS: saved-part backup validation, valid round trips, completed parts, legacy backups, and active-session regression checks.');
