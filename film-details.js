const video = document.querySelector('#film');
const portrait = matchMedia('(max-aspect-ratio: 1/1)');
const backdrop = document.querySelector('.film-backdrop');
backdrop.width = 96;
backdrop.height = 54;
const backdropContext = backdrop.getContext('2d');

export function updateFilmBackdrop() {
  if (portrait.matches && video.readyState >= 2) {
    backdropContext.drawImage(video, 0, 0, backdrop.width, backdrop.height);
  }
}