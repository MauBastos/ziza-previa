import {clamp,progressToTime,cueAtTime,validateCues} from './timeline.js';
import {bindFilmStart} from './opening.js?v=cinema1';
const root=document.querySelector('.cinema'),video=document.querySelector('#film'),stage=document.querySelector('.stage'),status=document.querySelector('.film-status');
const offers=[...document.querySelectorAll('.film-offer')],title=document.querySelector('.film-title'),counter=document.querySelector('#scene-counter'),progressBar=document.querySelector('.film-progress span');
const mobile=matchMedia('(max-width: 800px), (hover: none) and (pointer: coarse)');
const picker = document.querySelector('.film-picker');
const dots = [...picker.querySelectorAll('button[aria-pressed]')];
const resume = picker.querySelector('.film-resume');
const intro = document.querySelector('#film-intro');
const soundButton = document.querySelector('.film-sound');
const stills = [.55, 11.65, 14.25];
let frozen = false;
let panelIndex = 0;
const playButton=document.querySelector('.film-play');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let cues=[],ready=false,target=0,raf=0,inView=true,lastCue='',seeking=false,metadataReady=false,unlocked=false;
let started = false;
let introHasAudio = false;
let filmHasAudio = false;
let soundOn = false;
let soundSeek = false;
let holdFrame = false;

function refreshSound() {
  soundButton.hidden = started
    ? !filmHasAudio || !!video.error || !metadataReady
    : !introHasAudio || reduced.matches || !!intro.error || intro.readyState < 2;
  soundButton.setAttribute('aria-pressed', String(soundOn));
}

function playIntro() {
  if (started || reduced.matches || !intro.getAttribute('src') || !inView || document.hidden) {
    intro.pause();
    return;
  }
  intro.play().catch(() => {});
}

function resumeMedia() {
  if (!started) playIntro();
  else if (!mobile.matches && !video.muted && !reduced.matches) video.play().catch(() => {});
  else playMobile();
}

async function playWithSound(media) {
  media.muted = false;
  if (media.volume === 0) media.volume = 1;
  try {
    if (media.ended) media.currentTime = 0;
    await media.play();
  } catch {
    if (media === (started ? video : intro)) {
      media.muted = true;
      soundOn = false;
      refreshSound();
      resumeMedia();
    }
  }
}

soundButton.addEventListener('click', () => {
  const media = started ? video : intro;
  soundOn = !soundOn;
  refreshSound();
  if (soundOn) {
    holdFrame = false;
    unlocked = true;
    playWithSound(media);
  } else {
    media.muted = true;
    if (started && !mobile.matches && !reduced.matches) {
      holdFrame = true;
      soundSeek = false;
      media.pause();
    }
  }
});

intro.addEventListener('playing', () => root.classList.add('intro-playing'));
intro.addEventListener('error', () => {
  root.classList.remove('intro-playing');
  refreshSound();
});
intro.addEventListener('loadeddata', refreshSound);
video.addEventListener('volumechange', () => {
  if (started && video.controls && filmHasAudio) {
    soundOn = !video.muted && video.volume > 0;
    refreshSound();
  }
});

function configureMedia(config) {
  filmHasAudio = config.hasAudio === true;
  introHasAudio = config.intro?.hasAudio === true;

  function loadIntro() {
    if (!started && !reduced.matches && config.intro?.src && !intro.getAttribute('src')) {
      intro.src = config.intro.src;
    }
    playIntro();
  }

  reduced.addEventListener('change', loadIntro);
  loadIntro();
}

function revealFilm() {
  if (started && root.classList.contains('is-ready')) {
    root.classList.add('film-revealed');
  }
}

function startFilm() {
  if (started) return;
  started = true;
  intro.pause();
  intro.muted = true;
  holdFrame = false;
  root.classList.add('film-started');
  video.controls = reduced.matches && !mobile.matches;
  if (mobile.matches && reduced.matches) playButton.hidden = false;
  applyCue(video.currentTime);
  if (soundOn && filmHasAudio) playWithSound(video);
  else {
    soundOn = false;
    playMobile();
  }
  refreshSound();
  revealFilm();
  schedule();
}

function setStatus(text){status.textContent=text;status.hidden=false}
function applyCue(time){if(!started)return;const cue=cueAtTime(cues,time);const id=mobile.matches ? updateMobilePanel(time) : cue?.id||'';if(lastCue!==id){lastCue=id;offers.forEach(el=>{const active=el.dataset.scene===id;el.classList.toggle('active',active);el.inert=!active;el.setAttribute('aria-hidden',String(!active))});root.classList.toggle('has-offer',!!id)}title.classList.toggle('film-hidden',(!mobile.matches&&time>3.4)||!!id);counter.textContent=cue?String(cues.indexOf(cue)+1).padStart(2,'0')+' — 03':'ITAPUÃ · SALVADOR'}
function updateMobilePanel(time) {
  if (!frozen) {
    panelIndex = time >= 13.5 ? 2 : time >= 10.5 ? 1 : 0;
  }
  root.dataset.scene = offers[panelIndex].dataset.scene;
  dots.forEach((dot,index)=>dot.setAttribute('aria-pressed',String(index===panelIndex)));
  return offers[panelIndex].dataset.scene;
}
dots.forEach((dot,index)=>{
  dot.addEventListener('click',()=>{
    if(!metadataReady)return;
    frozen=true;
    panelIndex=index;
    video.pause();
    video.currentTime=stills[index];
    resume.hidden=false;
    playButton.hidden=true;
    applyCue(stills[index]);
  });
});
const panels = picker.closest('.film-panels');
let swipeStart;
let suppressCardClickUntil = 0;
stage.addEventListener('touchstart', event => {
  swipeStart = mobile.matches && started && event.touches.length === 1 ? event.touches[0] : null;
}, {passive:true});
stage.addEventListener('touchcancel', () => { swipeStart = null; });
stage.addEventListener('touchend', event => {
  if (!swipeStart) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - swipeStart.clientX;
  const dy = touch.clientY - swipeStart.clientY;
  swipeStart = null;
  if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
  suppressCardClickUntil = performance.now() + 350;
  const next = panelIndex + (dx < 0 ? 1 : -1);
  dots[next]?.click();
}, {passive:true});
panels.addEventListener('click', event => {
  if (event.target.closest('.film-offer') && performance.now() < suppressCardClickUntil) {
    event.preventDefault();
  }
}, true);
resume.addEventListener('click',()=>{
  frozen=false;
  resume.hidden=true;
  playButton.click();
});
function scrollProgress(){const r=root.getBoundingClientRect();return clamp(-r.top/Math.max(1,root.offsetHeight-stage.offsetHeight))}
function schedule(){if(!raf)raf=requestAnimationFrame(update)}
function update(){raf=0;if(!started||mobile.matches||!ready||!metadataReady)return;if(!video.muted&&!reduced.matches){if(soundSeek){target=progressToTime(scrollProgress(),video.duration);seek();if(!seeking&&!video.seeking)soundSeek=false}return}if(holdFrame&&!reduced.matches)return;const p=reduced.matches?video.currentTime/video.duration:scrollProgress();progressBar.style.width=clamp(p)*100+'%';if(reduced.matches){applyCue(video.currentTime);return}target=progressToTime(p,video.duration);seek()}
function seek(){if(!inView||seeking||video.seeking||video.readyState<2)return;if(Math.abs(video.currentTime-target)>.025){seeking=true;video.currentTime=target}else applyCue(video.currentTime)}
function hasDecoded(){
  seeking=false;
  root.classList.add('is-ready');
  status.hidden=true;
  refreshSound();
  if(!started)return;
  revealFilm();
  applyCue(video.currentTime);
  if(!video.muted)soundSeek=false;
  else if(!mobile.matches&&!reduced.matches&&Math.abs(video.currentTime-target)>.04)schedule();
}
video.addEventListener('seeked',hasDecoded);video.addEventListener('loadeddata',()=>{hasDecoded();schedule()});video.addEventListener('canplay',schedule);
video.addEventListener('loadedmetadata',()=>{metadataReady=Number.isFinite(video.duration)&&video.duration>0;if(!metadataReady)return;try{validateCues(cues,video.duration)}catch(error){setStatus('Os acessos às coleções estão disponíveis logo abaixo.');cues=[]}root.style.setProperty('--film-height',Math.max(800,Math.min(2400,video.duration*65))+'svh');schedule()});
video.addEventListener('timeupdate',()=>{if(mobile.matches||reduced.matches||!video.muted){applyCue(video.currentTime);if(!mobile.matches)progressBar.style.width=clamp(video.currentTime/video.duration)*100+'%'}});video.addEventListener('error',()=>{root.classList.remove('is-ready');root.classList.add('film-unavailable');cues=[];applyCue(0);refreshSound();setStatus('Não foi possível carregar o vídeo. Explore as coleções logo abaixo.');document.querySelector('.film-error').hidden=false});
async function playMobile() {
  if (!started || !mobile.matches || frozen || reduced.matches || !ready || !inView || document.hidden || video.ended) return;
  try {
    await video.play();
    playButton.hidden=true;
  } catch {
    if (mobile.matches && inView) playButton.hidden=false;
  }
}
playButton.onclick=async()=>{
  try { if(video.ended)video.currentTime=0; await video.play(); playButton.hidden=true; }
  catch { playButton.hidden=false; }
};
video.addEventListener('ended',()=>{if(mobile.matches){playButton.textContent='Rever vídeo';playButton.hidden=false}});
function setMotion(){
  root.classList.toggle('mobile-film',mobile.matches);
  root.classList.toggle('manual',reduced.matches&&!mobile.matches);
  video.controls=started&&reduced.matches&&!mobile.matches;
  video.loop=mobile.matches;
  video.defaultPlaybackRate=mobile.matches ? .65 : 1;
  video.playbackRate=video.defaultPlaybackRate;
  video.pause();
  lastCue='';
  if(mobile.matches)applyCue(video.currentTime);else{frozen=false;resume.hidden=true}
  playButton.hidden=!(started&&mobile.matches&&reduced.matches);
  playIntro();
  refreshSound();
  playMobile();
  schedule();
}

reduced.addEventListener('change',setMotion);mobile.addEventListener('change',setMotion);setMotion();
bindFilmStart(stage, startFilm, () => {
  (playButton.hidden ? dots[panelIndex] : playButton).focus({preventScroll: true});
});
window.addEventListener('scroll', () => {
  if (scrollY > 0) startFilm();
  if (!mobile.matches) {
    holdFrame = false;
    soundSeek = !video.muted;
    schedule();
  }
}, {passive:true});
window.addEventListener('resize',schedule);
window.addEventListener('pageshow', () => { if (scrollY > 0) startFilm(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    intro.pause();
    video.pause();
  } else {
    resumeMedia();
    schedule();
  }
});
video.setAttribute('aria-label','Vídeo de Itapuã, da praia ao escritório');
new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView&&!document.hidden){resumeMedia();schedule()}else{intro.pause();video.pause()}}).observe(stage);
async function unlock(){if(!started||mobile.matches||unlocked||reduced.matches||!metadataReady||!video.muted)return;unlocked=true;const position=video.currentTime;try{await video.play();video.pause();video.currentTime=position;schedule()}catch{unlocked=false}}
window.addEventListener('pointerdown',unlock,{passive:true});window.addEventListener('touchstart',unlock,{passive:true});
document.querySelector('.film-replay').addEventListener('click',()=>{startFilm();holdFrame=false;root.scrollIntoView({behavior:reduced.matches?'auto':'smooth'});if(mobile.matches||reduced.matches){video.currentTime=0;frozen=false;resume.hidden=true;if(mobile.matches)playMobile();else video.play().catch(()=>{})}});
try{const config=JSON.parse(document.querySelector('#film-config').textContent);if(!config.src||!Array.isArray(config.cues)||config.cues.length!==3)throw new Error('Film needs three verified cues');cues=config.cues;video.poster=config.poster||'assets/beach-poster.jpg';video.src=config.src;ready=true;configureMedia(config);video.load();playMobile();schedule()}catch(error){console.error(error);root.classList.add('film-unavailable');setStatus('Explore as coleções enquanto preparamos a experiência.');document.querySelector('.film-error').hidden=false}
