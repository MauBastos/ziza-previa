const closer = document.querySelector('.brand-closer');
const video = closer.querySelector('video');
const motion = matchMedia('(prefers-reduced-motion: reduce)');

if ('IntersectionObserver' in window) {
  let inView = false;
  if (!motion.matches) closer.classList.add('awaiting-brand');

  function update() {
    if (motion.matches) {
      closer.classList.remove('awaiting-brand', 'reveal-brand');
      video.pause();
      return;
    }
    if (!inView || document.hidden) {
      video.pause();
      return;
    }
    if (closer.classList.contains('awaiting-brand')) {
      closer.classList.replace('awaiting-brand', 'reveal-brand');
    }
    if (video.ended) return;
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    video.play().catch(() => {});
  }

  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.intersectionRatio >= .35;
    update();
  }, {threshold: [.35]});
  observer.observe(closer);
  motion.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
}
