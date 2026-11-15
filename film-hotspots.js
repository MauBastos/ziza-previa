import {introTrack, filmTracks} from './glasses-tracks.js';

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const px = value => Math.round(value * 10) / 10;

function sample(track, time) {
  const {frames} = track;
  const next = frames.findIndex(frame => frame[0] >= time);
  if (next < 0) return frames.at(-1).slice(1);
  if (next === 0) return frames[0].slice(1);
  const a = frames[next - 1], b = frames[next];
  const ratio = (time - a[0]) / (b[0] - a[0]);
  return a.slice(1).map((value, i) => value + (b[i + 1] - value) * ratio);
}

function projectMedia(stage, media) {
  const screen = stage.getBoundingClientRect();
  const box = media.getBoundingClientRect();
  const style = getComputedStyle(media);
  const xPosition = parseFloat(style.objectPosition.split(' ')[0]) / 100;
  const yPosition = parseFloat(style.objectPosition.split(' ')[1]) / 100;
  const ratios = [box.width / (media.videoWidth || 1600), box.height / (media.videoHeight || 900)];
  const scale = style.objectFit === 'contain' ? Math.min(...ratios) : Math.max(...ratios);
  const width = (media.videoWidth || 1600) * scale, height = (media.videoHeight || 900) * scale;

  return {
    width: screen.width, height: screen.height,
    x: box.left - screen.left + (box.width - width) * xPosition,
    y: box.top - screen.top + (box.height - height) * yPosition,
    sx: width / 1600, sy: height / 900,
  };
}

export function bindFilmHotspots(stage) {
  const cinema = stage.closest('.cinema');
  const film = stage.querySelector('#film');
  const intro = stage.querySelector('#film-intro');
  const opening = intro.parentElement;
  const poster = opening.querySelector('img');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const layer = document.createElement('div');
  layer.className = 'glasses-spot';
  layer.innerHTML = `
    <svg class="glasses-outline" aria-hidden="true">
      <ellipse rx=".5" ry=".5"/><ellipse rx=".5" ry=".5"/>
      <rect x="-.5" y="-.5" width="1" height="1" rx=".19"/>
      <rect x="-.5" y="-.5" width="1" height="1" rx=".19"/>
      <path/>
    </svg>
    <button class="glasses-hit" type="button" aria-controls="glasses-card" aria-expanded="false" hidden></button>
    <div class="glasses-card" id="glasses-card" inert>
      <button class="glasses-close" type="button" aria-label="Fechar detalhes">×</button>
      <strong></strong><p></p>
      <a class="catalog-pill glasses-link"><span class="film-cta-label"></span></a>
    </div>`;
  stage.append(layer);

  const trigger = layer.querySelector('.glasses-hit');
  const card = layer.querySelector('.glasses-card');
  const link = card.querySelector('a');
  const shapes = [...layer.querySelectorAll('ellipse, rect')];
  const arms = layer.querySelector('path');
  const offers = new Map([...stage.querySelectorAll('.film-offer')].map(offer => [offer.dataset.scene, offer]));
  let activeMedia, projection, projectionKey, pose, trackId, hit, open = false;
  let frameRequest, redraw, closeTimer, dissolveTimer, heldVideo;
  let lastHit = '';
  let mainVisible = false;

  function drawOutline() {
    if (!open || !pose) return;
    const [ax,ay,aw,ah,aa,bx,by,bw,bh,ba,tx,ty] = pose;
    const index = trackId === 'grau' ? 2 : 0;
    const {x,y,sx,sy} = projection;
    const transform = (cx,cy,w,h,angle) =>
      `translate(${px(x+cx*sx)} ${px(y+cy*sy)}) scale(${sx} ${sy}) rotate(${angle}) scale(${w} ${h})`;
    shapes[index].setAttribute('transform',transform(ax,ay,aw,ah,aa));
    shapes[index+1].setAttribute('transform',transform(bx,by,bw,bh,ba));
    const point = (cx,cy) => `${px(x+cx*sx)} ${px(y+cy*sy)}`;
    arms.setAttribute('d',`M${point(ax+aw*.36,ay-ah*.16)} L${point(bx-bw*.37,by-bh*.2)} M${point(bx+bw*.43,by-bh*.27)} L${point(tx,ty)}`);
  }

  function placeCard() {
    const margin = 12, width = card.offsetWidth, height = card.offsetHeight;
    const {width: stageWidth, height: stageHeight} = projection;
    let x = hit.x + hit.width + margin;
    let y = hit.y + hit.height / 2 - height / 2;
    if (stageWidth > 680 && x + width > stageWidth - margin) x = hit.x - width - margin;
    if (stageWidth <= 680) {
      x = hit.x + hit.width / 2 - width / 2;
      y = hit.y - height - margin >= 75 ? hit.y - height - margin : hit.y + hit.height + margin;
    }
    card.style.left = `${clamp(x, margin, Math.max(margin, stageWidth - width - margin))}px`;
    card.style.top = `${clamp(y, margin, Math.max(margin, stageHeight - height - margin))}px`;
  }

  function dismiss({resume = true, focus = false} = {}) {
    clearTimeout(closeTimer);
    if (!open) return;
    open = false;
    layer.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    card.inert = true;
    if (focus) {
      if (!trigger.hidden) trigger.focus({preventScroll: true});
      else (stage.querySelector('.film-offer.active, .film-sound:not([hidden]), .film-start') || document.querySelector('.home-header .brand'))?.focus({preventScroll: true});
    }
    const media = heldVideo;
    heldVideo = null;
    if (resume && media && media === activeMedia && !document.hidden) media.play().catch(() => {});
  }

  let restoringFocus = false;
  function reveal(hold = false) {
    if (trigger.hidden || !pose || restoringFocus) return;
    clearTimeout(closeTimer);
    if (!open) {
      open = true;
      trigger.setAttribute('aria-expanded', 'true');
      card.inert = false;
      layer.classList.add('is-open');
      placeCard();
      drawOutline();
    }
    if (hold && activeMedia instanceof HTMLVideoElement && !activeMedia.paused) {
      heldVideo = activeMedia;
      activeMedia.pause();
    }
  }

  function closeAndFocus() {
    restoringFocus = true;
    dismiss({focus: true});
    restoringFocus = false;
  }

  function hide(resume = true) {
    if (trigger.hidden && !open) return;
    const hadFocus = layer.contains(document.activeElement);
    trigger.hidden = true;
    dismiss({resume, focus: hadFocus});
    pose = null;
    trackId = null;
    lastHit = '';
  }

  function draw(time) {
    if (!activeMedia) return hide();
    const track = activeMedia === film
      ? filmTracks.find(item => time >= item.start && time < item.end)
      : introTrack;
    if (!track) return hide();

    const key = `${activeMedia.id || 'poster'}:${cinema.classList.contains('mobile-film')}:${cinema.dataset.scene}:${reduced.matches}`;
    if (!projection || projectionKey !== key) {
      projection = projectMedia(stage, activeMedia);
      projectionKey = key;
      if (open && hit) placeCard();
    }
    pose = sample(track, time);
    const [ax,ay,aw,ah,,bx,by,bw,bh] = pose;
    const {width,height,x,y,sx,sy} = projection;
    const left = x + Math.min(ax-aw/2,bx-bw/2)*sx;
    const right = x + Math.max(ax+aw/2,bx+bw/2)*sx;
    const top = y + Math.min(ay-ah/2,by-bh/2)*sy;
    const bottom = y + Math.max(ay+ah/2,by+bh/2)*sy;
    if (right < 3 || left > width-3 || bottom < 3 || top > height-3) return hide();

    if (track.id !== trackId) {
      if (trackId) hide();
      pose = sample(track, time);
      trackId = track.id;
      const offer = offers.get(trackId);
      const category = offer.querySelector('.film-cta-label').textContent;
      trigger.setAttribute('aria-label', `Ver detalhes: ${category}`);
      card.querySelector('strong').textContent = category;
      card.querySelector('p').textContent = offer.querySelector('p:not(.eyebrow)').textContent;
      link.href = offer.href;
      link.firstElementChild.textContent = category;
      layer.dataset.track = trackId;
    }
    const w = Math.max(44, right-left+10), h = Math.max(44, bottom-top+10);
    hit = {x: px(clamp((left+right-w)/2, 0, Math.max(0,width-w))),
      y: px(clamp((top+bottom-h)/2, 0, Math.max(0,height-h))), width: px(w), height: px(h)};
    const signature = Object.values(hit).join(',');
    if (signature !== lastHit) {
      lastHit = signature;
      trigger.style.translate = `${hit.x}px ${hit.y}px`;
      trigger.style.width = `${hit.width}px`;
      trigger.style.height = `${hit.height}px`;
    }
    trigger.hidden = false;
    drawOutline();
  }

  function mediaNow() {
    if (cinema.classList.contains('film-started')) return mainVisible && !film.error ? film : null;
    return cinema.classList.contains('intro-playing') && !reduced.matches && !intro.error ? intro : poster;
  }

  function stopFrames() {
    if (!frameRequest) return;
    if (activeMedia?.cancelVideoFrameCallback) activeMedia.cancelVideoFrameCallback(frameRequest);
    else cancelAnimationFrame(frameRequest);
    frameRequest = 0;
  }

  function watchFrames() {
    if (frameRequest || !(activeMedia instanceof HTMLVideoElement)) return;
    const media = activeMedia;
    if (!media.requestVideoFrameCallback && media.paused) return;
    const advance = (now, frame) => {
      frameRequest = 0;
      draw(frame?.mediaTime ?? media.currentTime);
      watchFrames();
    };
    frameRequest = media.requestVideoFrameCallback
      ? media.requestVideoFrameCallback(advance)
      : requestAnimationFrame(advance);
  }

  function refresh() {
    redraw = 0;
    const media = mediaNow();
    if (media !== activeMedia) {
      stopFrames();
      hide(false);
      activeMedia = media;
      projection = null;
    }
    if (media) draw(media === poster ? 0 : media.currentTime);
    watchFrames();
  }

  function schedule() {
    if (!redraw) redraw = requestAnimationFrame(refresh);
  }

  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!trigger.matches(':hover, :focus-visible') && !card.matches(':hover') && !card.contains(document.activeElement)) dismiss();
    }, 240);
  }

  trigger.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'touch') reveal();
  });
  trigger.addEventListener('pointerleave', scheduleClose);
  trigger.addEventListener('focus', () => reveal(trigger.matches(':focus-visible')));
  trigger.addEventListener('click', event => reveal(event.pointerType !== 'mouse'));
  card.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  card.addEventListener('pointerleave', scheduleClose);
  card.querySelector('.glasses-close').addEventListener('click', closeAndFocus);
  layer.addEventListener('focusout', event => {
    if (!layer.contains(event.relatedTarget)) scheduleClose();
  });
  document.addEventListener('pointerdown', event => {
    if (!layer.contains(event.target)) dismiss();
  }, {passive: true});
  stage.addEventListener('keydown', event => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeAndFocus();
    }
  });

  const observer = new MutationObserver(() => {
    if (cinema.classList.contains('film-revealed') && !mainVisible && !dissolveTimer) {
      if (reduced.matches) mainVisible = true;
      else dissolveTimer = setTimeout(() => {
        mainVisible = true;
        schedule();
      }, 360);
    }
    schedule();
  });
  observer.observe(cinema, {attributes: true, attributeFilter: ['class']});
  const resize = new ResizeObserver(() => {
    projection = null;
    schedule();
  });
  resize.observe(stage);
  resize.observe(film);
  resize.observe(poster);
  [film,intro].forEach(media => {
    for (const event of ['loadeddata','seeked','play','pause','error']) media.addEventListener(event, schedule);
  });
  reduced.addEventListener('change', () => { projection = null; schedule(); });
  poster.addEventListener('load', schedule);
  schedule();
}
