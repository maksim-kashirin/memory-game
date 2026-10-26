import { AudioManager } from './audio.js';
import { generateBoard } from './board-generator.js';
import { setupFullscreen } from './fullscreen.js';
import { GameStorage } from './storage.js';
import { CATEGORIES, DIFFICULTY_ORDER, PLAYERS } from '../data/config.js';

const app = document.querySelector('#app');
const announcer = document.querySelector('#announcer');
const celebrationLayer = document.querySelector('#celebration-layer');
const soundButton = document.querySelector('#sound-button');
const fullscreenButton = document.querySelector('#fullscreen-button');
const storage = new GameStorage();
const audio = new AudioManager(storage.snapshot().settings.soundEnabled);

const state = {
  screen: 'home',
  playerId: null,
  categoryId: null,
  difficultyId: null,
  game: null,
  starting: false,
};

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

function announce(message) {
  announcer.textContent = '';
  requestAnimationFrame(() => { announcer.textContent = message; });
}

function setScreen(screen) {
  clearGameTimers();
  state.screen = screen;
  render();
  requestAnimationFrame(() => app.focus({ preventScroll: true }));
}

function clearGameTimers() {
  if (!state.game) return;
  for (const timer of state.game.timers) clearTimeout(timer);
  state.game.timers.clear();
}

function schedule(callback, delay) {
  const timer = setTimeout(() => {
    state.game?.timers.delete(timer);
    callback();
  }, delay);
  state.game?.timers.add(timer);
  return timer;
}

function updateSoundButton() {
  const enabled = storage.snapshot().settings.soundEnabled;
  soundButton.setAttribute('aria-pressed', String(enabled));
  soundButton.querySelector('.icon-button__icon').textContent = enabled ? '🔊' : '🔇';
  soundButton.querySelector('.icon-button__label').textContent = enabled ? 'Звук включён' : 'Звук выключен';
}

soundButton.addEventListener('click', () => {
  const enabled = !storage.snapshot().settings.soundEnabled;
  storage.setSoundEnabled(enabled);
  audio.setEnabled(enabled);
  if (enabled) audio.play('flip');
  updateSoundButton();
  announce(enabled ? 'Звук включён' : 'Звук выключен');
});

document.addEventListener('pointerdown', () => audio.unlock(), { once: true });
document.addEventListener('keydown', () => audio.unlock(), { once: true });
setupFullscreen(fullscreenButton);
updateSoundButton();

function homeTemplate() {
  const data = storage.snapshot();
  const playerCards = Object.values(PLAYERS).map((player) => `
    <button class="player-card player-card--${player.accent}" type="button" data-player="${player.id}">
      <span class="player-card__avatar" aria-hidden="true">${player.avatar}</span>
      <span class="player-card__body">
        <span class="player-card__name">${player.name}</span>
      </span>
      <span class="star-total"><span aria-hidden="true">★</span> ${data.players[player.id].totalStars}</span>
    </button>
  `).join('');

  return `
    <section class="screen home-screen" aria-labelledby="home-title">
      <div class="hero-badge" aria-hidden="true">✦ Найди одинаковые картинки ✦</div>
      <h1 id="home-title" class="game-title">Мемори</h1>
      <p class="game-subtitle">Кто сегодня играет?</p>
      <div class="player-grid">${playerCards}</div>
      <button class="secondary-button results-button" type="button" data-action="results">
        <span aria-hidden="true">🏆</span> Таблица результатов
      </button>
    </section>
  `;
}

function configTemplate() {
  const player = PLAYERS[state.playerId];
  const categories = player.categories.map((categoryId) => {
    const category = CATEGORIES[categoryId];
    const selected = state.categoryId === categoryId;
    return `
      <button class="choice-card ${selected ? 'is-selected' : ''}" type="button"
        data-category="${categoryId}" aria-pressed="${selected}">
        <span class="choice-card__icon ${category.className}" aria-hidden="true">${category.icon}</span>
        <span>${category.label}</span>
        <span class="choice-card__check" aria-hidden="true">✓</span>
      </button>`;
  }).join('');
  const difficulties = DIFFICULTY_ORDER.map((difficultyId) => {
    const difficulty = player.difficulties[difficultyId];
    const selected = state.difficultyId === difficultyId;
    return `
      <button class="difficulty-card difficulty-card--${difficultyId} ${selected ? 'is-selected' : ''}"
        type="button" data-difficulty="${difficultyId}" aria-pressed="${selected}">
        <span class="difficulty-card__name">${difficulty.label}</span>
        <span class="difficulty-card__grid">${difficulty.gridSize}×${difficulty.gridSize}</span>
        <span class="difficulty-card__pairs">${difficulty.pairs} пар</span>
      </button>`;
  }).join('');

  return `
    <section class="screen config-screen" aria-labelledby="config-title">
      <button class="back-button" type="button" data-action="home">← Назад</button>
      <div class="screen-heading">
        <span class="screen-heading__avatar" aria-hidden="true">${player.avatar}</span>
        <div><p>Игрок: ${player.name}</p><h1 id="config-title">Выбери игру</h1></div>
      </div>
      <div class="config-section">
        <h2><span>1</span> Что будем искать?</h2>
        <div class="choice-grid">${categories}</div>
      </div>
      <div class="config-section">
        <h2><span>2</span> Выбери сложность</h2>
        <div class="difficulty-grid">${difficulties}</div>
      </div>
      <button class="primary-button start-button" type="button" data-action="start">Начать игру <span aria-hidden="true">→</span></button>
    </section>
  `;
}

function cardFaceContent(card, categoryId) {
  if (card.kind === 'image') {
    return `<img src="${card.src}" alt="" draggable="false"><span class="image-fallback" aria-hidden="true">◉</span>`;
  }
  const className = categoryId === 'cursiveLetters' ? 'cursive' : card.kind;
  return `<span class="card-value ${className}">${escapeHtml(card.value)}</span>`;
}

function cardTemplate(card, index, categoryId) {
  if (!card) return '<div class="empty-cell" aria-hidden="true"></div>';
  return `
    <button class="memory-card" type="button" data-card-index="${index}"
      aria-label="Закрытая карточка" data-state="closed">
      <span class="memory-card__inner">
        <span class="memory-card__back" aria-hidden="true"><span>✦</span></span>
        <span class="memory-card__front" aria-hidden="true">${cardFaceContent(card, categoryId)}</span>
      </span>
    </button>`;
}

function gameTemplate() {
  const game = state.game;
  const player = PLAYERS[game.playerId];
  const category = CATEGORIES[game.categoryId];
  const difficulty = player.difficulties[game.difficultyId];
  return `
    <section class="screen game-screen game-screen--${game.gridSize}" aria-labelledby="game-title">
      <header class="game-header">
        <button class="back-button game-header__back" type="button" data-action="leave-game">← Меню</button>
        <div class="game-meta">
          <h1 id="game-title">${player.avatar} ${player.name}</h1>
          <p>${category.label} · ${difficulty.label} · ${game.gridSize}×${game.gridSize}</p>
        </div>
        <div class="game-score" aria-label="Звёзд в этой партии">
          <span aria-hidden="true">★</span><strong id="game-score">${game.stars}</strong><small>/ ${game.pairs}</small>
        </div>
      </header>
      <div class="memory-board" style="--grid-size:${game.gridSize}" aria-label="Игровое поле ${game.gridSize} на ${game.gridSize}">
        ${game.slots.map((card, index) => cardTemplate(card, index, game.categoryId)).join('')}
      </div>
      <p class="game-hint">Открой две одинаковые карточки</p>
    </section>
  `;
}

function formatDateTime(iso) {
  const date = new Date(iso);
  return {
    date: new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }).format(date),
    time: new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date),
  };
}

function resultsTemplate() {
  const data = storage.snapshot();
  const rows = data.results.map((result) => {
    const { date, time } = formatDateTime(result.startedAt);
    const player = PLAYERS[result.player];
    const difficulty = player.difficulties[result.difficulty];
    return `
      <tr>
        <td><span class="table-player">${player.avatar} ${player.name}</span></td>
        <td>${date}</td><td>${time}</td>
        <td>${CATEGORIES[result.category]?.label ?? result.category}</td>
        <td>${difficulty?.label ?? result.difficulty}</td>
        <td>${result.gridSize}×${result.gridSize}</td>
        <td><span class="table-stars">★ ${result.stars}</span></td>
        <td><span class="status status--${result.status}">${result.status === 'completed' ? 'Завершена' : 'Не завершена'}</span></td>
      </tr>`;
  }).join('');
  return `
    <section class="screen results-screen" aria-labelledby="results-title">
      <button class="back-button" type="button" data-action="home">← Назад</button>
      <div class="screen-heading compact-heading"><span class="screen-heading__avatar" aria-hidden="true">🏆</span>
        <div><p>Все наши победы</p><h1 id="results-title">Результаты</h1></div>
      </div>
      <div class="totals-row">
        <div><span>🌷 Мия</span><strong>★ ${data.players.mia.totalStars}</strong></div>
        <div><span>🌟 Василиса</span><strong>★ ${data.players.vasilisa.totalStars}</strong></div>
      </div>
      ${data.results.length ? `
        <div class="table-scroll"><table><thead><tr>
          <th>Игрок</th><th>Дата</th><th>Время</th><th>Категория</th>
          <th>Сложность</th><th>Поле</th><th>Звёзды</th><th>Статус</th>
        </tr></thead><tbody>${rows}</tbody></table></div>`
        : '<div class="empty-results"><span aria-hidden="true">✨</span><p>Здесь появятся сыгранные партии</p></div>'}
    </section>`;
}

function render() {
  if (state.screen === 'home') app.innerHTML = homeTemplate();
  else if (state.screen === 'config') app.innerHTML = configTemplate();
  else if (state.screen === 'game') app.innerHTML = gameTemplate();
  else if (state.screen === 'results') app.innerHTML = resultsTemplate();
}

function startGame() {
  if (state.starting) return;
  state.starting = true;
  const player = PLAYERS[state.playerId];
  const difficulty = player.difficulties[state.difficultyId];
  const seenIds = storage.getSeenIds(state.playerId, state.categoryId);
  const board = generateBoard({
    playerId: state.playerId,
    categoryId: state.categoryId,
    gridSize: difficulty.gridSize,
    pairs: difficulty.pairs,
    seenIds,
  });
  const resultId = storage.createResult({
    player: state.playerId,
    category: state.categoryId,
    difficulty: state.difficultyId,
    gridSize: difficulty.gridSize,
  });
  state.game = {
    playerId: state.playerId,
    categoryId: state.categoryId,
    difficultyId: state.difficultyId,
    gridSize: difficulty.gridSize,
    pairs: difficulty.pairs,
    resultId,
    slots: board.slots,
    firstIndex: null,
    stars: 0,
    matchedPairs: 0,
    locked: false,
    timers: new Set(),
  };
  state.starting = false;
  setScreen('game');
}

function updateCard(index) {
  const game = state.game;
  const card = game?.slots[index];
  const button = app.querySelector(`[data-card-index="${index}"]`);
  if (!card || !button) return;
  button.dataset.state = card.state;
  button.classList.toggle('is-open', card.state === 'open' || card.state === 'matched');
  button.classList.toggle('is-matched', card.state === 'matched');
  button.disabled = card.state === 'matched';
  button.setAttribute('aria-label', card.state === 'closed' ? 'Закрытая карточка' : `${card.name}. ${card.state === 'matched' ? 'Пара найдена' : 'Карточка открыта'}`);
}

function showMatchStar(cardButton) {
  const star = document.createElement('span');
  star.className = 'flying-star';
  star.textContent = '★';
  const rect = cardButton?.getBoundingClientRect();
  if (rect) {
    star.style.left = `${rect.left + rect.width / 2}px`;
    star.style.top = `${rect.top + rect.height / 2}px`;
  }
  document.body.append(star);
  star.addEventListener('animationend', () => star.remove(), { once: true });
}

function celebrate(big = false) {
  celebrationLayer.replaceChildren();
  celebrationLayer.classList.toggle('is-big', big);
  const count = big ? 28 : 10;
  for (let index = 0; index < count; index += 1) {
    const particle = document.createElement('span');
    particle.textContent = index % 3 === 0 ? '✦' : '★';
    particle.style.setProperty('--x', `${5 + Math.random() * 90}%`);
    particle.style.setProperty('--delay', `${Math.random() * 0.5}s`);
    particle.style.setProperty('--duration', `${0.9 + Math.random() * 0.9}s`);
    celebrationLayer.append(particle);
  }
  celebrationLayer.classList.remove('is-active');
  requestAnimationFrame(() => celebrationLayer.classList.add('is-active'));
  schedule(() => celebrationLayer.classList.remove('is-active'), big ? 2400 : 1500);
}

function showVictory() {
  const game = state.game;
  const player = PLAYERS[game.playerId];
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <section class="victory-card" role="dialog" aria-modal="true" aria-labelledby="victory-title">
      <div class="victory-card__stars" aria-hidden="true">★ ✦ ★</div>
      <p class="victory-card__eyebrow">Все пары собраны!</p>
      <h2 id="victory-title">Ура, ${player.name}!</h2>
      <div class="victory-score"><span aria-hidden="true">★</span><strong>${game.stars}</strong><small>${game.stars === 1 ? 'звезда' : 'звёзд'}</small></div>
      <div class="victory-actions">
        <button class="primary-button" type="button" data-action="play-again">Играть ещё</button>
        <button class="secondary-button" type="button" data-action="home">Главное меню</button>
      </div>
    </section>`;
  app.append(modal);
  modal.querySelector('button').focus();
}

function openCard(index) {
  const game = state.game;
  const card = game?.slots[index];
  if (!game || game.locked || !card || card.state !== 'closed') return;
  card.state = 'open';
  updateCard(index);
  storage.markSeen(game.playerId, game.categoryId, card.id);
  audio.play('flip');

  if (game.firstIndex === null) {
    game.firstIndex = index;
    return;
  }

  const firstIndex = game.firstIndex;
  const firstCard = game.slots[firstIndex];
  game.firstIndex = null;
  game.locked = true;
  if (firstCard.id === card.id) {
    schedule(() => {
      if (!state.game) return;
      firstCard.state = 'matched';
      card.state = 'matched';
      updateCard(firstIndex);
      updateCard(index);
      game.matchedPairs += 1;
      game.stars += 1;
      storage.awardStar(game.playerId, game.resultId);
      const score = document.querySelector('#game-score');
      if (score) score.textContent = game.stars;
      audio.play('match');
      showMatchStar(app.querySelector(`[data-card-index="${index}"]`));
      celebrate(false);
      announce(`Пара найдена! Звёзд: ${game.stars}`);
      if (game.matchedPairs === game.pairs) {
        storage.completeResult(game.resultId);
        schedule(() => {
          audio.play('win');
          celebrate(true);
          showVictory();
        }, 550);
      } else {
        game.locked = false;
      }
    }, 320);
  } else {
    schedule(() => {
      if (!state.game) return;
      firstCard.state = 'closed';
      card.state = 'closed';
      updateCard(firstIndex);
      updateCard(index);
      game.locked = false;
      audio.play('mismatch');
      announce('Карточки разные. Попробуй ещё!');
    }, 1000);
  }
}

app.addEventListener('click', (event) => {
  const playerButton = event.target.closest('[data-player]');
  if (playerButton) {
    state.playerId = playerButton.dataset.player;
    const player = PLAYERS[state.playerId];
    state.categoryId = player.categories[0];
    state.difficultyId = 'easy';
    setScreen('config');
    return;
  }
  const categoryButton = event.target.closest('[data-category]');
  if (categoryButton) {
    state.categoryId = categoryButton.dataset.category;
    render();
    return;
  }
  const difficultyButton = event.target.closest('[data-difficulty]');
  if (difficultyButton) {
    state.difficultyId = difficultyButton.dataset.difficulty;
    render();
    return;
  }
  const cardButton = event.target.closest('[data-card-index]');
  if (cardButton) {
    openCard(Number(cardButton.dataset.cardIndex));
    return;
  }
  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;
  const action = actionButton.dataset.action;
  if (action === 'home' || action === 'leave-game') {
    clearGameTimers();
    state.game = null;
    setScreen('home');
  } else if (action === 'results') setScreen('results');
  else if (action === 'start') startGame();
  else if (action === 'play-again') {
    clearGameTimers();
    startGame();
  }
});

app.addEventListener('error', (event) => {
  if (!(event.target instanceof HTMLImageElement)) return;
  event.target.classList.add('has-error');
  event.target.closest('.memory-card__front')?.classList.add('image-error');
}, true);

render();
