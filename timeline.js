export function clamp(value,min=0,max=1){return Math.max(min,Math.min(max,value))}
export function progressToTime(progress,duration){return duration>0?clamp(progress)*Math.max(0,duration-.04):0}
export function cueAtTime(cues,time){return cues.find(cue=>Number.isFinite(cue.start)&&Number.isFinite(cue.end)&&time>=cue.start&&time<cue.end)||null}
export function validateCues(cues,duration){let end=0;for(const cue of cues){if(!cue.id||!Number.isFinite(cue.start)||!Number.isFinite(cue.end)||cue.start<end||cue.end<=cue.start||cue.end>duration+.05)throw new Error('Os marcadores das cenas precisam de revisão.');end=cue.end}return cues}
