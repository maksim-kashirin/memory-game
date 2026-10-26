export const PLAYERS = {
  mia: {
    id: 'mia',
    name: 'Мия',
    avatar: '🌷',
    accent: 'pink',
    categories: ['printLetters', 'cursiveLetters', 'emoji', 'animals'],
    difficulties: {
      easy: { label: 'Лёгкая', gridSize: 5, pairs: 12 },
      medium: { label: 'Средняя', gridSize: 6, pairs: 18 },
      hard: { label: 'Сложная', gridSize: 7, pairs: 24 },
    },
  },
  vasilisa: {
    id: 'vasilisa',
    name: 'Василиса',
    avatar: '🌟',
    accent: 'purple',
    categories: ['printLetters', 'cursiveLetters', 'emoji', 'animals', 'mixed', 'words'],
    difficulties: {
      easy: { label: 'Лёгкая', gridSize: 6, pairs: 18 },
      medium: { label: 'Средняя', gridSize: 7, pairs: 24 },
      hard: { label: 'Сложная', gridSize: 8, pairs: 32 },
    },
  },
};

export const CATEGORIES = {
  printLetters: { id: 'printLetters', label: 'Печатные буквы', icon: 'АБ', className: 'printed' },
  cursiveLetters: { id: 'cursiveLetters', label: 'Прописные буквы', icon: 'Аб', className: 'cursive' },
  emoji: { id: 'emoji', label: 'Эмодзи', icon: '😊', className: 'emoji' },
  animals: { id: 'animals', label: 'Животные', icon: '🐻', className: 'image' },
  mixed: { id: 'mixed', label: 'Разные картинки', icon: '🧸', className: 'image' },
  words: { id: 'words', label: 'Короткие слова', icon: 'ДОМ', className: 'word' },
};

export const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];
