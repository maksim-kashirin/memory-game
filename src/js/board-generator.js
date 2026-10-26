import { ANIMALS, ILLUSTRATIONS } from '../data/illustrations.js';
import { EMOJIS } from '../data/emojis.js';
import { createLetterCatalog } from '../data/letters.js';
import { WORD_ITEMS } from '../data/words.js';

export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function getCatalog(categoryId) {
  if (categoryId === 'printLetters' || categoryId === 'cursiveLetters') return createLetterCatalog();
  if (categoryId === 'emoji') return EMOJIS;
  if (categoryId === 'animals') return ANIMALS;
  if (categoryId === 'mixed') return ILLUSTRATIONS;
  if (categoryId === 'words') return WORD_ITEMS;
  throw new Error(`Неизвестная категория: ${categoryId}`);
}

export function selectBalanced(catalog, count, seenIds, random = Math.random) {
  if (count > catalog.length) throw new Error('В каталоге недостаточно элементов');
  const familiar = shuffle(catalog.filter((item) => seenIds.has(item.id)), random);
  const newItems = shuffle(catalog.filter((item) => !seenIds.has(item.id)), random);
  const familiarTarget = Math.floor(count / 2);
  const newTarget = count - familiarTarget;
  const selected = [
    ...familiar.slice(0, familiarTarget),
    ...newItems.slice(0, newTarget),
  ];
  if (selected.length < count) {
    const selectedIds = new Set(selected.map((item) => item.id));
    const remaining = shuffle(catalog.filter((item) => !selectedIds.has(item.id)), random);
    selected.push(...remaining.slice(0, count - selected.length));
  }
  return shuffle(selected, random);
}

function ensureMixedGroups(items, catalog, random = Math.random) {
  const selected = [...items];
  const groups = ['animal', 'transport', 'food', 'object'];
  const selectedIds = new Set(selected.map((item) => item.id));
  const countGroup = (group) => selected.filter((item) => item.group === group).length;

  for (const missingGroup of groups.filter((group) => countGroup(group) === 0)) {
    const candidates = shuffle(
      catalog.filter((item) => item.group === missingGroup && !selectedIds.has(item.id)),
      random,
    );
    const replacementIndex = selected.findIndex((item) => countGroup(item.group) > 1);
    if (!candidates.length || replacementIndex < 0) continue;
    selectedIds.delete(selected[replacementIndex].id);
    selected[replacementIndex] = candidates[0];
    selectedIds.add(candidates[0].id);
  }
  return shuffle(selected, random);
}

function isFixedCatalog({ playerId, categoryId, gridSize }) {
  return playerId === 'vasilisa' && gridSize === 8
    && ['printLetters', 'cursiveLetters', 'animals'].includes(categoryId);
}

export function generateBoard({ playerId, categoryId, gridSize, pairs, seenIds, random = Math.random }) {
  const catalog = getCatalog(categoryId);
  let selected = isFixedCatalog({ playerId, categoryId, gridSize })
    ? [...catalog]
    : selectBalanced(catalog, pairs, seenIds, random);
  if (categoryId === 'mixed') selected = ensureMixedGroups(selected, catalog, random);
  if (selected.length !== pairs) throw new Error('Неверное количество выбранных пар');

  const cards = shuffle(
    selected.flatMap((item) => [0, 1].map((copy) => ({
      ...item,
      cardId: `${item.id}-${copy}`,
      state: 'closed',
    }))),
    random,
  );

  const slotCount = gridSize * gridSize;
  const centerIndex = gridSize % 2 === 1 ? Math.floor(slotCount / 2) : -1;
  const slots = [];
  let cardIndex = 0;
  for (let index = 0; index < slotCount; index += 1) {
    if (index === centerIndex) slots.push(null);
    else slots.push(cards[cardIndex++]);
  }
  return { slots, selected, centerIndex };
}
