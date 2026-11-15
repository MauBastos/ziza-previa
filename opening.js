export function bindFilmStart(stage, start, focusPlaybackControl, trackSwipe) {
  stage.querySelector('.film-start').addEventListener('click', () => {
    start();
    focusPlaybackControl();
  });

  window.addEventListener('wheel', event => {
    if (event.deltaY > 0 && !event.ctrlKey) start();
  }, {passive: true});

  let openingTouch;
  stage.addEventListener('touchstart', event => {
    openingTouch = !stage.closest('.film-started') && event.touches.length === 1 ? event.touches[0] : null;
  }, {passive: true});

  stage.addEventListener('touchmove', event => {
    if (!openingTouch || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const distance = openingTouch.clientY - touch.clientY;
    if (distance > 12 && distance > Math.abs(openingTouch.clientX - touch.clientX) * 1.2) {
      trackSwipe(distance);
      start();
    }
  }, {passive: true});
}
