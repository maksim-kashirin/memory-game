import test from 'node:test';
import assert from 'node:assert/strict';
import { LETTERS, SYLLABLES } from '../src/data/letters.js';
import { EMOJIS } from '../src/data/emojis.js';
import { WORDS } from '../src/data/words.js';
import { ANIMALS, ILLUSTRATIONS } from '../src/data/illustrations.js';

test('каталоги имеют требуемый размер и уникальные идентификаторы', () => {
  assert.equal(LETTERS.length, 28);
  assert.equal(SYLLABLES.length, 4);
  assert.equal(EMOJIS.length, 50);
  assert.equal(WORDS.length, 50);
  assert.equal(ILLUSTRATIONS.length, 50);
  assert.equal(ANIMALS.length, 32);
  for (const catalog of [EMOJIS, ILLUSTRATIONS]) {
    assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
  }
});

test('исключённые буквы отсутствуют', () => {
  for (const letter of ['Ъ', 'Ь', 'Ы', 'Э', 'Щ']) assert.equal(LETTERS.includes(letter), false);
});

test('все слова содержат от трёх до пяти букв', () => {
  assert.equal(new Set(WORDS).size, 50);
  for (const word of WORDS) {
    assert.ok([...word].length >= 3 && [...word].length <= 5, word);
  }
});

test('иллюстрации распределены 32 + 6 + 6 + 6', () => {
  const counts = Object.groupBy(ILLUSTRATIONS, (item) => item.group);
  assert.equal(counts.animal.length, 32);
  assert.equal(counts.transport.length, 6);
  assert.equal(counts.food.length, 6);
  assert.equal(counts.object.length, 6);
});
