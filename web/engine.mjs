export const DAY=86400000;
export const intervals=[1,3,7,14,30];
export const shuffle=(xs,rng=Math.random)=>{const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
export const dateKey=(time=Date.now())=>new Date(time).toLocaleDateString('en-CA');
export function emptyState(){return {version:1,words:{},placements:{},groups:{},history:[],seen:{},lastVariants:{},lastOptions:{},flags:{},hooks:{},settings:{rate:1,autoRead:false,voice:'',examDate:'2026-11-05'},session:null}}
export function resetStudyProgress(state){return {...emptyState(),settings:{...state.settings},hooks:{...state.hooks},flags:{...state.flags}}}
export function jumpToWord(session,id){
 if(!session.queue.includes(id))return false;
 if(session.queue[session.index]===id)return true;
 if(session.current?.answered)session.index++;
 const ahead=session.queue.indexOf(id,session.index);
 if(ahead>=0)session.queue.splice(ahead,1);
 session.queue.splice(session.index,0,id);
 session.current=null;session.revealed=false;session.recall=false;
 return true;
}
export function rememberQuestion(state,q){
 const prefix=q.id.slice(0,q.id.lastIndexOf(':')+1);
 state.seen[q.id]=(state.seen[q.id]??0)+1;
 state.lastVariants??={};state.lastOptions??={};
 state.lastVariants[prefix]=q.variant;
 state.lastOptions[prefix]=q.options.filter(x=>x.canonical!==null).map(x=>x.canonical).join(',');
}
export function progress(state,id){return state.words[id]??{learned:false,misses:0,recognition:{right:0,total:0},application:{right:0,total:0},reviewStep:0,reviewDays:[],due:null,lastScheduledDay:null}}
export function recordLearning(state,entry,rating,now=Date.now()){
 const p=progress(state,entry.canonical);p.learned=true;p.due=p.due??now+DAY;
 if(rating!=='knew'){p.misses++;p.due=Math.min(p.due,now+DAY)}
 state.words[entry.canonical]=p;state.placements[entry.id]={...(state.placements[entry.id]??{}),learn:true,rating};
}
export function recordAnswer(state,entry,stage,correct,isReview,now=Date.now()){
 const p=progress(state,entry.canonical),metric=stage==='practice'?'application':'recognition';p.learned=true;p[metric].total++;if(correct)p[metric].right++;else p.misses++;
 const day=dateKey(now);
 if(!correct){p.reviewStep=0;p.due=now+DAY;p.lastScheduledDay=day}
 else if(isReview&&p.due!==null&&now>=p.due&&p.lastScheduledDay!==day){p.reviewDays=[...new Set([...p.reviewDays,day])];p.due=now+intervals[Math.min(p.reviewStep,intervals.length-1)]*DAY;p.reviewStep=Math.min(p.reviewStep+1,intervals.length-1);p.lastScheduledDay=day}
 else if(p.due===null)p.due=now+DAY;
 state.words[entry.canonical]=p;
 state.history.push({entry:entry.id,word:entry.canonical,stage,correct,review:isReview,time:now});if(state.history.length>15000)state.history=state.history.slice(-15000);
}
export function mastered(p){return p.reviewDays.length>=3&&p.recognition.right>=2&&p.application.right>=2&&p.reviewStep>=3}
export function dueEntries(data,state,now=Date.now()){
 const unique=[...new Map(data.groups.flatMap(g=>g.words).map(w=>[w.canonical,w])).values()];
 return unique.filter(e=>{const p=progress(state,e.canonical);return p.learned&&p.due!==null&&p.due<=now}).sort((a,b)=>progress(state,a.canonical).due-progress(state,b.canonical).due||progress(state,b.canonical).misses-progress(state,a.canonical).misses);
}
function tokens(text){return new Set(text.toLowerCase().match(/[a-z]+/g)?.filter(x=>!['a','an','the','of','to','or','and','in','is','with','being','very','someone','something'].includes(x))??[])}
export function distinct(a,b){
 if(a.canonical===b.canonical||a.pos!==b.pos||a.tag===b.tag)return false;
 if(a.distractorExclusions?.includes(b.word)||b.distractorExclusions?.includes(a.word))return false;
 const equivalents=e=>[e.canonical,...e.synonyms,...(e.otherSenses??[]).flatMap(x=>x.synonyms??[])].map(x=>x.toLowerCase());
 const as=new Set(equivalents(a)),bs=new Set(equivalents(b));if([...as].some(x=>bs.has(x)))return false;
 if(a.senseIds?.some(x=>b.senseIds?.includes(x)))return false;
 const at=tokens(a.meaning),bt=tokens(b.meaning);let overlap=[...at].filter(x=>bt.has(x)).length;
 return overlap/Math.max(1,Math.min(at.size,bt.size))<0.5;
}
const ordinaryAdverbs=[
 ['occasionally','From time to time rather than always.','frequency'],['partially','Only in part, rather than completely.','incompleteness'],['gradually','Little by little over time.','gradual change'],['deliberately','Intentionally rather than accidentally.','intention'],['recently','Not long ago.','recency'],['rarely','Not often.','rarity']
].map(([word,meaning,tag])=>({word,meaning,tag,pos:'adverb',canonical:'distractor:'+word,synonyms:[]}));
const abreastAdverbs=[['ahead','In advance or farther forward.'],['out','Away from or outside something.'],['short','At less than the needed amount.'],['clear','Away from contact or involvement.']].map(([word,meaning])=>({word,meaning,tag:'position:'+word,pos:'adverb',canonical:'distractor:'+word,synonyms:[]}));
export function question(source,stage,data,state,group,rng=Math.random){
 const variants=stage==='practice'?source.contexts.length:2;
 const available=Array.from({length:variants},(_,i)=>i).filter(i=>!state.flags[`${source.questionNamespace??source.canonical}:${stage}:${i}`]);if(!available.length)return null;
 const prefix=`${source.questionNamespace??source.canonical}:${stage}:`,alternate=available.filter(i=>i!==state.lastVariants?.[prefix]);
 const eligible=alternate.length?alternate:available,min=Math.min(...eligible.map(i=>(state.seen[prefix+i]??0)));
 const variant=shuffle(eligible.filter(i=>(state.seen[prefix+i]??0)===min),rng)[0];
 const meta=stage==='practice'?source.contextMeta?.[variant]:null;
 const entry=meta?{...source,meaning:meta.meaning,pos:meta.pos,tag:meta.senseLabel??source.tag}:source;
 const all=[...new Map(data.groups.flatMap(g=>g.words).map(w=>[w.canonical,w])).values()].filter(x=>!state.flags['card:'+x.canonical]);
 const grammarFits=x=>{
  if(x.pos!==entry.pos)return false;
  return true;
 };
 const acceptable=x=>grammarFits(x)&&distinct(entry,x);
 const local=shuffle(group?.words??[],rng).filter(x=>!state.flags['card:'+x.canonical]&&acceptable(x));
 const pool=entry.word==='abreast'&&stage==='practice'?shuffle(abreastAdverbs,rng):[...local,...shuffle(all,rng).filter(acceptable),...shuffle(ordinaryAdverbs,rng).filter(acceptable)];
 let wrong=[];for(const e of pool){if(wrong.some(x=>x.canonical===e.canonical)||wrong.some(x=>!distinct(x,e)))continue;wrong.push(e);if(wrong.length===(stage==='practice'?4:3))break}
 if(wrong.length<(stage==='practice'?4:3))for(const e of pool){if(!wrong.some(x=>x.canonical===e.canonical))wrong.push(e);if(wrong.length===(stage==='practice'?4:3))break}
 if(wrong.length<(stage==='practice'?4:3))return null;
 const options=shuffle([entry,...wrong],rng).map(e=>({word:e.word,canonical:e.canonical,meaning:e.meaning,label:stage==='practice'?e.word:e.meaning,correct:e.canonical===entry.canonical}));
 if(options.map(x=>x.canonical).join(',')===state.lastOptions?.[prefix])options.push(options.shift());
 if(stage!=='practice')options.push({label:'I am not sure',canonical:null,correct:false});
 const id=prefix+variant,signature=id+':'+options.map(x=>x.canonical??'?').join(',');
 return {id,signature,stage,entryId:source.id,variant,prompt:stage==='practice'?source.contexts[variant]:variant===0?`Choose the best definition of ${source.word}.`:`Which meaning best matches ${source.word}?`,options,answered:false,selected:null,clue:stage==='practice'?source.clues[variant]:source.distinction,intendedMeaning:entry.meaning,senseLabel:meta?.senseLabel??'Primary sense'};
}
export function queueRetry(session,entryId,correct){
 let st=session.retries[entryId]??{missed:false,streak:0,count:0};st.count++;
 if(!correct){st.missed=true;st.streak=0}else st.streak++;
 const needs=st.missed&&st.streak<2&&st.count<5;
 if(needs&&!session.queue.slice(session.index+1).includes(entryId)){const insert=Math.min(session.queue.length,session.index+5);session.queue.splice(insert,0,entryId)}
 session.retries[entryId]=st;
 return needs;
}
export function reconcileGroupSessions(state,data){
 for(const session of [state.session,...Object.values(state.savedParts??{})]){
  if(!session||session.mode!=='group'||!Array.isArray(session.queue))continue;
  const group=data.groups.find(g=>g.id===session.group);if(!group)continue;
  const present=new Set(session.queue);
  for(const entry of group.words)if(!present.has(entry.id)){session.queue.push(entry.id);present.add(entry.id)}
  session.initialCount=group.words.length;
 }
 return state;
}
export function validateBackup(x,data){
 if(!x||x.version!==1||typeof x.words!=='object'||!x.words||typeof x.placements!=='object'||!x.placements||!Array.isArray(x.history)||!x.settings||typeof x.settings!=='object')throw Error('This is not a GRE Vocabulary Mastery backup.');
 for(const field of ['words','placements','groups','seen','hooks','flags','lastVariants','lastOptions','savedParts'])if(x[field]!==undefined&&(!x[field]||typeof x[field]!=='object'||Array.isArray(x[field])))throw Error('Invalid '+field+' in backup.');
 const known=new Set(data.groups.flatMap(g=>g.words).map(x=>x.canonical));
 for(const [id,p] of Object.entries(x.words)){if(!known.has(id)||!p||!p.recognition||!p.application||!Array.isArray(p.reviewDays)||!Number.isInteger(p.misses)||p.misses<0||!(p.due===null||Number.isFinite(p.due))||!Number.isInteger(p.reviewStep)||p.reviewStep<0||p.reviewStep>5)throw Error('The backup contains invalid progress.');for(const m of [p.recognition,p.application])if(!Number.isInteger(m.right)||!Number.isInteger(m.total)||m.right<0||m.total<m.right)throw Error('Invalid score in backup.')}
 const ids=new Set(data.groups.flatMap(g=>g.words).map(x=>x.id));
 for(const id of Object.keys(x.placements))if(!ids.has(id))throw Error('The backup contains unknown vocabulary entries.');
 if(x.session){const s=x.session;
  if(!Array.isArray(s.queue)||s.queue.some(id=>!ids.has(id))||!Number.isInteger(s.index)||s.index<0||s.index>s.queue.length||!['learn','recognize','practice'].includes(s.stage)||!['group','due','hard','equivalence'].includes(s.mode)||!Array.isArray(s.attempts)||!Array.isArray(s.skipped)||!s.retries||typeof s.retries!=='object'||(s.mode==='group'&&!data.groups.some(g=>g.id===s.group)))throw Error('Invalid saved session.');
  const q=s.current;
  if(q){const pair=q.type==='equivalence';
   if(q.entryId!==s.queue[s.index]||typeof q.prompt!=='string'||typeof q.id!=='string'||!Array.isArray(q.options)||q.options.length!==(pair?6:5)||q.options.filter(o=>o.correct).length!==(pair?2:1)||q.options.some(o=>typeof o.label!=='string'||typeof o.meaning!=='string'&&o.canonical!==null))throw Error('Invalid saved question.');
   if(pair&&(!Array.isArray(q.selected)||q.selected.length>2||q.selected.some(i=>!Number.isInteger(i)||i<0||i>5)))throw Error('Invalid saved answer.');
   if(!pair&&q.selected!==null&&(!Number.isInteger(q.selected)||q.selected<0||q.selected>4))throw Error('Invalid saved answer.');
  }
 }
 if(!Number.isFinite(Number(x.settings.rate))||Number(x.settings.rate)<.5||Number(x.settings.rate)>2)throw Error('Invalid reading speed in backup.');
 return reconcileGroupSessions({...emptyState(),...x,settings:{...emptyState().settings,...x.settings},seen:x.seen??{},flags:x.flags??{},hooks:x.hooks??{},groups:x.groups??{}},data);
}
