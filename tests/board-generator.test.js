import test from 'node:test';
import assert from 'node:assert/strict';
import { generateBoard, getCatalog, selectBalanced } from '../src/js/board-generator.js';

function seededRandom(seed = 1) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const configurations = [
  ['mia', 5, 12], ['mia', 6, 18], ['mia', 7, 24],
  ['vasilisa', 6, 18], ['vasilisa', 7, 24], ['vasilisa', 8, 32],
];

for (const [playerId, gridSize, pairs] of configurations) {
  test(`${playerId}: поле ${gridSize}×${gridSize} содержит ${pairs} пар`, () => {
    const board = generateBoard({
      playerId, categoryId: 'emoji', gridSize, pairs, seenIds: new Set(), random: seededRandom(gridSize),
    });
    assert.equal(board.slots.length, gridSize * gridSize);
    assert.equal(board.slots.filter(Boolean).length, pairs * 2);
    const counts = Object.groupBy(board.slots.filter(Boolean), (card) => card.id);
    assert.equal(Object.keys(counts).length, pairs);
    for (const cards of Object.values(counts)) assert.equal(cards.length, 2);
    if (gridSize % 2) assert.equal(board.slots[Math.floor(board.slots.length / 2)], null);
  });
}

test('выбор делится поровну между знакомыми и новыми', () => {
  const catalog = getCatalog('emoji');
  const seen = new Set(catalog.slice(0, 25).map((item) => item.id));
  const selected = selectBalanced(catalog, 18, seen, seededRandom(9));
  assert.equal(selected.filter((item) => seen.has(item.id)).length, 9);
  assert.equal(selected.filter((item) => !seen.has(item.id)).length, 9);
});

test('нехватка одной группы заполняется другой', () => {
  const catalog = getCatalog('emoji');
  const seen = new Set(catalog.slice(0, 2).map((item) => item.id));
  const selected = selectBalanced(catalog, 18, seen, seededRandom(12));
  assert.equal(selected.length, 18);
  assert.equal(selected.filter((item) => seen.has(item.id)).length, 2);
  assert.equal(new Set(selected.map((item) => item.id)).size, 18);
});

test('сложные режимы Василисы используют полный фиксированный каталог', () => {
  for (const categoryId of ['printLetters', 'cursiveLetters', 'animals']) {
    const board = generateBoard({
      playerId: 'vasilisa', categoryId, gridSize: 8, pairs: 32,
      seenIds: new Set(), random: seededRandom(20),
    });
    assert.deepEqual(
      new Set(board.selected.map((item) => item.id)),
      new Set(getCatalog(categoryId).map((item) => item.id)),
    );
  }
});

test('смешанное поле всегда представляет все четыре типа картинок', () => {
  const board = generateBoard({
    playerId: 'vasilisa', categoryId: 'mixed', gridSize: 6, pairs: 18,
    seenIds: new Set(), random: seededRandom(33),
  });
  assert.deepEqual(new Set(board.selected.map((item) => item.group)), new Set(['animal', 'transport', 'food', 'object']));
});
