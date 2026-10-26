export function setupFullscreen(button, onChange = () => {}) {
  if (!document.fullscreenEnabled) {
    button.hidden = true;
    return;
  }
  const update = () => {
    const active = Boolean(document.fullscreenElement);
    button.querySelector('.icon-button__icon').textContent = active ? '⤢' : '⛶';
    button.querySelector('.icon-button__label').textContent = active ? 'Выйти из полного экрана' : 'На весь экран';
    button.setAttribute('aria-label', active ? 'Выйти из полноэкранного режима' : 'Открыть на весь экран');
    onChange(active);
  };
  button.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (error) {
      console.warn('Полноэкранный режим недоступен.', error);
    }
  });
  document.addEventListener('fullscreenchange', update);
  update();
}
