const STORAGE_KEY = 'memoryGameData';

function createDefaultData() {
  return {
    version: 1,
    players: {
      mia: { totalStars: 0, seenItems: {} },
      vasilisa: { totalStars: 0, seenItems: {} },
    },
    results: [],
    settings: { soundEnabled: true },
  };
}

function safeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function normalizeSeenItems(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([category, ids]) => [
      category,
      Array.isArray(ids) ? [...new Set(ids.filter((id) => typeof id === 'string'))] : [],
    ]),
  );
}

function normalizePlayer(value) {
  return {
    totalStars: safeInteger(value?.totalStars),
    seenItems: normalizeSeenItems(value?.seenItems),
  };
}

function normalizeResult(value) {
  if (!value || typeof value !== 'object') return null;
  if (!['mia', 'vasilisa'].includes(value.player)) return null;
  if (typeof value.startedAt !== 'string' || Number.isNaN(Date.parse(value.startedAt))) return null;
  return {
    id: typeof value.id === 'string' ? value.id : createId(),
    player: value.player,
    startedAt: value.startedAt,
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : null,
    category: typeof value.category === 'string' ? value.category : 'emoji',
    difficulty: ['easy', 'medium', 'hard'].includes(value.difficulty) ? value.difficulty : 'easy',
    gridSize: Number.isInteger(value.gridSize) ? value.gridSize : 6,
    stars: safeInteger(value.stars),
    status: value.status === 'completed' ? 'completed' : 'incomplete',
  };
}

function normalizeData(value) {
  const defaults = createDefaultData();
  return {
    version: 1,
    players: {
      mia: normalizePlayer(value?.players?.mia),
      vasilisa: normalizePlayer(value?.players?.vasilisa),
    },
    results: Array.isArray(value?.results) ? value.results.map(normalizeResult).filter(Boolean) : [],
    settings: {
      soundEnabled: typeof value?.settings?.soundEnabled === 'boolean'
        ? value.settings.soundEnabled
        : defaults.settings.soundEnabled,
    },
  };
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `game-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class GameStorage {
  constructor(storage) {
    if (arguments.length > 0) {
      this.storage = storage;
    } else {
      try {
        this.storage = globalThis.localStorage;
      } catch (error) {
        console.warn('Локальное хранилище недоступно. Игра продолжит работу без него.', error);
        this.storage = null;
      }
    }
    this.data = this.#load();
  }

  #load() {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      if (!raw) return createDefaultData();
      return normalizeData(JSON.parse(raw));
    } catch (error) {
      console.warn('Не удалось прочитать сохранение. Используются новые данные.', error);
      return createDefaultData();
    }
  }

  #save() {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.data));
      return true;
    } catch (error) {
      console.warn('Не удалось сохранить данные. Игра продолжит работу.', error);
      return false;
    }
  }

  snapshot() {
    return structuredClone(this.data);
  }

  getPlayer(playerId) {
    return this.data.players[playerId];
  }

  getSeenIds(playerId, categoryId) {
    return new Set(this.data.players[playerId]?.seenItems?.[categoryId] ?? []);
  }

  markSeen(playerId, categoryId, itemId) {
    const player = this.data.players[playerId];
    if (!player) return;
    const current = new Set(player.seenItems[categoryId] ?? []);
    if (current.has(itemId)) return;
    current.add(itemId);
    player.seenItems[categoryId] = [...current];
    this.#save();
  }

  createResult({ player, category, difficulty, gridSize }) {
    const result = {
      id: createId(), player, startedAt: new Date().toISOString(), completedAt: null,
      category, difficulty, gridSize, stars: 0, status: 'incomplete',
    };
    this.data.results.unshift(result);
    this.#save();
    return result.id;
  }

  awardStar(playerId, resultId) {
    const player = this.data.players[playerId];
    const result = this.data.results.find((entry) => entry.id === resultId);
    if (!player || !result || result.status === 'completed') return;
    player.totalStars += 1;
    result.stars += 1;
    this.#save();
  }

  completeResult(resultId) {
    const result = this.data.results.find((entry) => entry.id === resultId);
    if (!result || result.status === 'completed') return;
    result.status = 'completed';
    result.completedAt = new Date().toISOString();
    this.#save();
  }

  setSoundEnabled(enabled) {
    this.data.settings.soundEnabled = Boolean(enabled);
    this.#save();
  }
}

export { STORAGE_KEY, createDefaultData, normalizeData };
