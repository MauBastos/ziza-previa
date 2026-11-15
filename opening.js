export function bindFilmStart(stage, start, focusPlaybackControl) {
  stage.querySelector('.film-start').addEventListener('click', () => {
    start();
    focusPlaybackControl();
  });

  window.addEventListener('wheel', event => {
    if (event.deltaY > 0 && !event.ctrlKey) start();
  }, {passive: true});

  let touchStartY;
  stage.addEventListener('touchstart', event => {
    touchStartY = event.touches.length === 1 ? event.touches[0].clientY : undefined;
  }, {passive: true});

  stage.addEventListener('touchmove', event => {
    if (event.touches.length === 1 && touchStartY - event.touches[0].clientY > 22) start();
  }, {passive: true});
}
