import test from 'node:test';
import assert from 'node:assert/strict';
import { GameStorage, STORAGE_KEY } from '../src/js/storage.js';

class FakeStorage {
  constructor(initial) { this.value = initial; }
  getItem(key) { return key === STORAGE_KEY ? this.value : null; }
  setItem(key, value) { if (key === STORAGE_KEY) this.value = value; }
}

test('повреждённые данные не ломают хранилище', () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  const gameStorage = new GameStorage(new FakeStorage('{broken'));
  console.warn = originalWarn;
  assert.equal(gameStorage.snapshot().players.mia.totalStars, 0);
  assert.equal(gameStorage.snapshot().settings.soundEnabled, true);
});

test('результат создаётся незавершённым и звезда сохраняется сразу', () => {
  const backend = new FakeStorage(null);
  const gameStorage = new GameStorage(backend);
  const id = gameStorage.createResult({ player: 'mia', category: 'emoji', difficulty: 'easy', gridSize: 5 });
  gameStorage.markSeen('mia', 'emoji', 'emoji-star');
  gameStorage.awardStar('mia', id);
  const saved = JSON.parse(backend.value);
  assert.equal(saved.results[0].status, 'incomplete');
  assert.equal(saved.results[0].stars, 1);
  assert.equal(saved.players.mia.totalStars, 1);
  assert.deepEqual(saved.players.mia.seenItems.emoji, ['emoji-star']);
});

test('завершение добавляет время и не начисляет лишние звёзды', () => {
  const gameStorage = new GameStorage(new FakeStorage(null));
  const id = gameStorage.createResult({ player: 'vasilisa', category: 'words', difficulty: 'easy', gridSize: 6 });
  gameStorage.awardStar('vasilisa', id);
  gameStorage.completeResult(id);
  gameStorage.awardStar('vasilisa', id);
  const snapshot = gameStorage.snapshot();
  assert.equal(snapshot.results[0].status, 'completed');
  assert.ok(snapshot.results[0].completedAt);
  assert.equal(snapshot.players.vasilisa.totalStars, 1);
});
