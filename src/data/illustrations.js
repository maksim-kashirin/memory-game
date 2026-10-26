const ILLUSTRATIONS_DATA = [
  ['cat', 'кошка', 'animal'], ['dog', 'собака', 'animal'], ['rabbit', 'кролик', 'animal'],
  ['fox', 'лиса', 'animal'], ['bear', 'медведь', 'animal'], ['lion', 'лев', 'animal'],
  ['tiger', 'тигр', 'animal'], ['elephant', 'слон', 'animal'], ['giraffe', 'жираф', 'animal'],
  ['zebra', 'зебра', 'animal'], ['monkey', 'обезьяна', 'animal'], ['panda', 'панда', 'animal'],
  ['koala', 'коала', 'animal'], ['cow', 'корова', 'animal'], ['horse', 'лошадь', 'animal'],
  ['pig', 'поросёнок', 'animal'], ['sheep', 'овечка', 'animal'], ['goat', 'коза', 'animal'],
  ['deer', 'олень', 'animal'], ['squirrel', 'белка', 'animal'], ['hedgehog', 'ёжик', 'animal'],
  ['raccoon', 'енот', 'animal'], ['wolf', 'волк', 'animal'], ['owl', 'сова', 'animal'],
  ['penguin', 'пингвин', 'animal'], ['duck', 'утка', 'animal'], ['chicken', 'курица', 'animal'],
  ['frog', 'лягушка', 'animal'], ['turtle', 'черепаха', 'animal'], ['crocodile', 'крокодил', 'animal'],
  ['dolphin', 'дельфин', 'animal'], ['whale', 'кит', 'animal'],
  ['car', 'машина', 'transport'], ['bus', 'автобус', 'transport'], ['bicycle', 'велосипед', 'transport'],
  ['train', 'поезд', 'transport'], ['airplane', 'самолёт', 'transport'], ['boat', 'кораблик', 'transport'],
  ['apple', 'яблоко', 'food'], ['banana', 'банан', 'food'], ['strawberry', 'клубника', 'food'],
  ['carrot', 'морковь', 'food'], ['cake', 'торт', 'food'], ['bread', 'хлеб', 'food'],
  ['ball', 'мяч', 'object'], ['book', 'книга', 'object'], ['chair', 'стул', 'object'],
  ['clock', 'часы', 'object'], ['umbrella', 'зонт', 'object'], ['key', 'ключ', 'object'],
];

export const ILLUSTRATIONS = ILLUSTRATIONS_DATA.map(([id, name, group], index) => ({
  id: `picture-${id}`,
  name,
  group,
  kind: 'image',
  src: `./assets/images/${String(index + 1).padStart(2, '0')}-${id}.webp`,
}));

export const ANIMALS = ILLUSTRATIONS.filter((item) => item.group === 'animal');
