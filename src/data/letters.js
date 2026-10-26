export const LETTERS = [
  'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М',
  'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Ю', 'Я',
];

export const SYLLABLES = ['МА', 'КО', 'РА', 'ЛИ'];

export function createLetterCatalog() {
  return [...LETTERS, ...SYLLABLES].map((value) => ({
    id: `letter-${value.toLocaleLowerCase('ru-RU')}`,
    value,
    name: value.length === 1 ? `Буква ${value}` : `Слог ${value}`,
    kind: 'text',
  }));
}
