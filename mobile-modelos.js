const motion = matchMedia('(prefers-reduced-motion: reduce)');
const previews = new Set();

function updateVideo(video) {
  if (!previews.has(video) || motion.matches || document.hidden) {
    video.pause();
    return;
  }
  if (!video.getAttribute('src')) video.src = video.dataset.src;
  video.play().catch(() => {});
}

const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    const video = entry.target.querySelector('.model-video');
    if (entry.isIntersecting) previews.add(video);
    else previews.delete(video);
    updateVideo(video);
  }
}, { threshold: 0.3 });

for (const screen of document.querySelectorAll('.screen')) {
  const video = screen.querySelector('.model-video');
  video.addEventListener('playing', () => video.classList.add('is-playing'));
  video.addEventListener('error', () => video.classList.remove('is-playing'));
  observer.observe(screen);
}

function updatePreviews() {
  for (const video of previews) updateVideo(video);
}

motion.addEventListener('change', updatePreviews);
document.addEventListener('visibilitychange', updatePreviews);
