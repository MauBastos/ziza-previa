import {clamp,progressToTime,cueAtTime,validateCues} from './timeline.js';
const root=document.querySelector('.cinema'),video=document.querySelector('#film'),stage=document.querySelector('.stage'),status=document.querySelector('.film-status');
const offers=[...document.querySelectorAll('.film-offer')],title=document.querySelector('.film-title'),counter=document.querySelector('#scene-counter'),progressBar=document.querySelector('.film-progress span');
const mobile=matchMedia('(max-width: 800px), (hover: none) and (pointer: coarse)');
const picker = document.querySelector('.film-picker');
const dots = [...picker.querySelectorAll('button[aria-pressed]')];
const resume = picker.querySelector('.film-resume');
const stills = [.55, 11.65, 14.25];
let frozen = false;
let panelIndex = 0;
const playButton=document.querySelector('.film-play');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let cues=[],ready=false,target=0,raf=0,inView=true,lastCue='',seeking=false,metadataReady=false,unlocked=false;
function setStatus(text){status.textContent=text;status.hidden=false}
function applyCue(time){const cue=cueAtTime(cues,time);const id=mobile.matches ? updateMobilePanel(time) : cue?.id||'';if(lastCue!==id){lastCue=id;offers.forEach(el=>{const active=el.dataset.scene===id;el.classList.toggle('active',active);el.inert=!active;el.setAttribute('aria-hidden',String(!active))});root.classList.toggle('has-offer',!!id)}title.classList.toggle('film-hidden',(!mobile.matches&&time>3.4)||!!id);counter.textContent=cue?String(cues.indexOf(cue)+1).padStart(2,'0')+' — 03':'ITAPUÃ · SALVADOR'}
function updateMobilePanel(time) {
  if (!frozen) {
    panelIndex = time >= 13.5 ? 2 : time >= 10.5 ? 1 : 0;
  }
  root.style.setProperty('--panel-index', panelIndex);
  root.classList.toggle('dark-panel', panelIndex === 1);
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
resume.addEventListener('click',()=>{
  frozen=false;
  resume.hidden=true;
  playButton.click();
});
function scrollProgress(){const r=root.getBoundingClientRect();return clamp(-r.top/Math.max(1,root.offsetHeight-stage.offsetHeight))}
function schedule(){if(!raf)raf=requestAnimationFrame(update)}
function update(){raf=0;if(mobile.matches||!ready||!metadataReady)return;const p=reduced.matches?video.currentTime/video.duration:scrollProgress();progressBar.style.width=clamp(p)*100+'%';if(reduced.matches){applyCue(video.currentTime);return}target=progressToTime(p,video.duration);seek()}
function seek(){if(!inView||seeking||video.seeking||video.readyState<2)return;if(Math.abs(video.currentTime-target)>.025){seeking=true;video.currentTime=target}else applyCue(video.currentTime)}
function hasDecoded(){seeking=false;root.classList.add('is-ready');status.hidden=true;applyCue(video.currentTime);if(!mobile.matches&&!reduced.matches&&Math.abs(video.currentTime-target)>.04)schedule()}
video.addEventListener('seeked',hasDecoded);video.addEventListener('loadeddata',()=>{hasDecoded();schedule()});video.addEventListener('canplay',schedule);
video.addEventListener('loadedmetadata',()=>{metadataReady=Number.isFinite(video.duration)&&video.duration>0;if(!metadataReady)return;try{validateCues(cues,video.duration)}catch(error){setStatus('Os acessos às coleções estão disponíveis logo abaixo.');cues=[]}root.style.setProperty('--film-height',Math.max(800,Math.min(2400,video.duration*65))+'svh');schedule()});
video.addEventListener('timeupdate',()=>{if(mobile.matches||reduced.matches){applyCue(video.currentTime);if(!mobile.matches)schedule()}});video.addEventListener('error',()=>{root.classList.remove('is-ready');root.classList.add('film-unavailable');cues=[];applyCue(0);setStatus('Não foi possível carregar o vídeo. Explore as coleções logo abaixo.');document.querySelector('.film-error').hidden=false});
async function playMobile() {
  if (!mobile.matches || frozen || reduced.matches || !ready || !inView || document.hidden || video.ended) return;
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
  video.controls=reduced.matches&&!mobile.matches;
  video.defaultPlaybackRate=mobile.matches ? .65 : 1;
  video.playbackRate=video.defaultPlaybackRate;
  video.pause();
  lastCue='';
  if(mobile.matches)applyCue(video.currentTime);else{frozen=false;resume.hidden=true}
  playButton.hidden=!(mobile.matches&&reduced.matches);
  playMobile();
  schedule();
}

reduced.addEventListener('change',setMotion);mobile.addEventListener('change',setMotion);setMotion();
window.addEventListener('scroll',()=>{if(!mobile.matches)schedule()},{passive:true});window.addEventListener('resize',schedule);document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else{playMobile();schedule()}});
video.setAttribute('aria-label','Vídeo de Itapuã, da praia ao escritório');
new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView){playMobile();schedule()}else video.pause()}).observe(stage);
async function unlock(){if(mobile.matches||unlocked||reduced.matches||!metadataReady)return;unlocked=true;const position=video.currentTime;try{await video.play();video.pause();video.currentTime=position;schedule()}catch{unlocked=false}}
window.addEventListener('pointerdown',unlock,{passive:true});window.addEventListener('touchstart',unlock,{passive:true});
document.querySelector('.film-replay').addEventListener('click',()=>{root.scrollIntoView({behavior:reduced.matches?'auto':'smooth'});if(mobile.matches||reduced.matches){video.currentTime=0;frozen=false;resume.hidden=true;if(mobile.matches)playMobile();else video.play().catch(()=>{})}});
try{const config=JSON.parse(document.querySelector('#film-config').textContent);if(!config.src||!Array.isArray(config.cues)||config.cues.length!==3)throw new Error('Film needs three verified cues');cues=config.cues;video.poster=config.poster||'assets/itapua.png';video.src=config.src;ready=true;video.load();playMobile();schedule()}catch(error){console.error(error);root.classList.add('film-unavailable');setStatus('Explore as coleções enquanto preparamos a experiência.');document.querySelector('.film-error').hidden=false}
