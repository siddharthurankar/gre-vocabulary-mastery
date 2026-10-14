import {question,progress,shuffle,recordAnswer} from './engine.mjs';
import {seBank,tcBank,trapPairs} from './advanced-bank.mjs';
export function weakness(state,e,now=Date.now()) {const p=progress(state,e.canonical),total=p.recognition.total+p.application.total,right=p.recognition.right+p.application.right;return p.misses*5+(total?1-right/total:1)*6+(p.due&&p.due<=now?3:0)+(p.reviewStep<3?2:0)}
export function eligibleWords(data,state,learnedOnly=true){return [...new Map(data.groups.flatMap(g=>g.words).map(e=>[e.canonical,e])).values()].filter(e=>!state.flags['card:'+e.canonical]&&(!learnedOnly||progress(state,e.canonical).learned))}
export function formatTime(ms){const seconds=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`}
export function makeSE(item,dictionary,rng=Math.random){const options=shuffle([item.word,item.pair,...item.wrong],rng).map(word=>({word,label:word,canonical:dictionary[word]?.canonical??word,meaning:dictionary[word]?.meaning??'See the explanation for this usage.',correct:[item.word,item.pair].includes(word)}));return {id:item.id,kind:'se',entryId:dictionary[item.word]?.id,prompt:item.sentence,options,selected:[],clue:item.clue,explanation:item.clue,targetWords:[item.word,item.pair],editorialStatus:item.editorialStatus}}
export function makeTC(item,rng=Math.random){return {...item,columns:item.columns.map((col,j)=>shuffle(col.map((word,i)=>({word,label:word,correct:i===item.answers[j]})),rng)),selected:item.columns.map(()=>null)}}
export function isCorrect(q){if(q.kind==='tc')return q.selected.length===q.columns.length&&q.selected.every((v,j)=>Number.isInteger(v)&&q.columns[j][v]?.correct);if(q.kind==='se')return q.selected.length===2&&q.selected.every(v=>q.options[v]?.correct);return Number.isInteger(q.selected)&&q.options[q.selected]?.correct===true}
export function choose(q,index,column=null){if(q.kind==='tc'){if(!q.columns[column]?.[index])return;q.selected[column]=index}else if(q.kind==='se'){if(!q.options[index])return;if(q.selected.includes(index))q.selected=q.selected.filter(i=>i!==index);else if(q.selected.length<2)q.selected.push(index)}else if(q.options[index])q.selected=index}
export function answered(q){return q.kind==='tc'?q.selected.every(v=>v!==null):q.kind==='se'?q.selected.length===2:q.selected!==null}
export function makeSession(data,state,dictionary,{mode='exam',count=12,minutes=18,learnedOnly=true,weakest=false,kind='mixed'}={},rng=Math.random){
 let words=eligibleWords(data,state,learnedOnly);if(!words.length)return null;
 words=weakest?shuffle(words,rng).sort((a,b)=>weakness(state,b)-weakness(state,a)):shuffle(words,rng);
 const known=new Set(words.map(e=>e.canonical)), allowed=ws=>ws.every(w=>!state.flags['card:'+w])&&(!learnedOnly||ws.every(w=>known.has(dictionary[w]?.canonical??w)));
 const ses=shuffle(seBank.filter(x=>allowed([x.word,x.pair])&&!state.flags[x.id]),rng).map(x=>makeSE(x,dictionary,rng));
 const tcs=shuffle(tcBank.filter(x=>allowed(x.targetWords)&&!state.flags[x.id]),rng).map(x=>makeTC(x,rng));
 const qs=[],scratch={...state,seen:{...state.seen},lastVariants:{...state.lastVariants}};
 if(kind==='se')qs.push(...ses.slice(0,count));else if(kind==='tc')qs.push(...tcs.slice(0,count));
 else for(const e of words){const useSpecial=mode==='exam'&&qs.length%3!==0;const special=useSpecial?(qs.length%3===1?ses.shift():tcs.shift()):null;
  if(special){qs.push(special);if(qs.length>=count)break;continue}
  if(qs.length>=count)break;
  const stage=mode==='final'&&qs.length%3===0?'recognize':'practice';const q=question(e,stage,data,scratch,null,rng);if(!q)continue;
  qs.push({...q,kind:stage==='recognize'?'recognition':'single',targetWords:[e.word],clue:stage==='practice'?e.clues[q.variant]:e.distinction,explanation:stage==='practice'?`${e.contextMeta?.[q.variant]?.meaning??e.meaning}. ${e.clues[q.variant]}`:`${e.meaning}. ${e.distinction}`,selected:null});
  scratch.lastVariants[q.id.slice(0,q.id.lastIndexOf(':')+1)]=q.variant;if(qs.length>=count)break;
 }
 if(!qs.length)return null;
 const now=Date.now();return {id:'set-'+now,mode,questions:qs,index:0,marked:[],startedAt:now,deadline:minutes>0?now+minutes*60000:null,minutes,submitted:false,graded:false,learnedOnly,requestedCount:count,weakest};
}
export function logMistake(state,q,dictionary,{context='',clue='',explanation=''}={}){
 state.journal??=[];const choices=q.kind==='tc'?q.columns.flatMap((col,j)=>q.selected[j]!==null&&!col[q.selected[j]]?.correct?[col[q.selected[j]].word]:[]):q.kind==='se'?q.selected.filter(i=>!q.options[i].correct).map(i=>q.options[i].word??q.options[i].label):q.selected!==null?[q.options[q.selected]?.word??q.options[q.selected]?.label].filter(Boolean):[];
 const targets=q.targetWords??(q.kind==='tc'?q.columns.map(c=>c.find(o=>o.correct).word):q.options.filter(o=>o.correct).map(o=>o.word));
 const differences=choices.filter(w=>dictionary[w]).map(w=>`${w}: ${dictionary[w].meaning}`).join(' ');
 const contrast=targets.map(w=>dictionary[w]?.distinction??'').filter(Boolean).join(' ');
 const item={id:'mistake-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),time:Date.now(),question:JSON.parse(JSON.stringify(q)),targets,confusedWith:choices,prompt:context||q.prompt,clue:clue||q.clue,explanation:[explanation||q.explanation,differences,contrast].filter(Boolean).join(' '),resolved:0};state.journal.unshift(item);state.journal=state.journal.slice(0,2000);return item;
}
export function gradeSession(session,state,dictionary,now=Date.now()){
 if(session.graded)return session;session.submitted=true;session.graded=true;session.submittedAt=now;
 for(const q of session.questions){q.correct=isCorrect(q);q.answered=true;
  if(!q.correct)logMistake(state,q,dictionary);
  const targets=q.kind==='tc'?q.columns.map(c=>c.find(o=>o.correct).word):q.targetWords;
  for(const word of new Set(targets)){const e=dictionary[word];if(e?.id&&answered(q))recordAnswer(state,e,q.kind==='recognition'?'recognize':'practice',q.correct,session.mode==='final',now)}
 }
 session.score=session.questions.filter(q=>q.correct).length;return session;
}
export function journalSession(state,id=null){const allowed=(state.journal??[]).filter(x=>!state.flags[x.question.id]&&!x.targets.some(w=>state.flags['card:'+w]));const items=id?allowed.filter(x=>x.id===id):allowed.filter(x=>!x.resolved).slice(0,30);if(!items.length)return null;return {id:'journal-'+Date.now(),mode:'journal',questions:items.map(item=>{const q=JSON.parse(JSON.stringify(item.question));q.answered=false;q.correct=undefined;q.selected=q.kind==='tc'?q.columns.map(()=>null):q.kind==='se'?[]:null;q.journalId=item.id;return q}),index:0,marked:[],startedAt:Date.now(),deadline:null,submitted:false,graded:false}}
export function checkSession(s){if(!s||!Array.isArray(s.questions)||s.questions.length>200||!Number.isInteger(s.index)||s.index<0||s.index>=s.questions.length)return false;return s.questions.every(q=>typeof q.prompt==='string'&&['tc','se','single','recognition','trap'].includes(q.kind)&&(q.kind==='tc'?Array.isArray(q.columns)&&[2,3].includes(q.columns.length)&&q.columns.every(c=>c.length===3&&c.filter(o=>o.correct).length===1)&&Array.isArray(q.selected)&&q.selected.length===q.columns.length&&q.selected.every((i,j)=>i===null||Number.isInteger(i)&&i>=0&&i<q.columns[j].length):Array.isArray(q.options)&&q.options.length===(q.kind==='se'?6:q.kind==='trap'?2:5)&&q.options.filter(o=>o.correct).length===(q.kind==='se'?2:1)&&(q.kind==='se'?Array.isArray(q.selected)&&q.selected.length<=2&&q.selected.every(i=>Number.isInteger(i)&&i>=0&&i<6):q.selected===null||Number.isInteger(q.selected)&&q.selected>=0&&q.selected<q.options.length)))}
export function trapSession(dictionary,rng=Math.random){const qs=[];for(const [a,b] of trapPairs){for(const [word,other] of [[a,b],[b,a]]){const e=dictionary[word],o=dictionary[other];if(!e||!o||!e.contexts?.length)continue;const options=shuffle([e,o],rng).map(x=>({word:x.word,label:x.word,canonical:x.canonical??x.word,meaning:x.meaning,correct:x.word===word}));qs.push({id:'trap-'+word,kind:'trap',prompt:e.contexts[0],options,selected:null,clue:e.clues[0],explanation:`${e.word}: ${e.meaning}. ${other}: ${o.meaning}. ${e.distinction??''}`,targetWords:[word],entryId:e.id})}}return qs.length?{id:'trap-'+Date.now(),mode:'traps',questions:shuffle(qs,rng),index:0,marked:[],startedAt:Date.now(),deadline:null,submitted:false,graded:false}:null}
export function validateLabFields(state,data){
 if(state.labSession&&!checkSession(state.labSession))throw Error('The experimental session in this backup is invalid.');
 if(state.journal!==undefined){if(!Array.isArray(state.journal)||state.journal.length>2000)throw Error('Invalid mistake journal in backup.');for(const j of state.journal){if(!j||typeof j.id!=='string'||!Number.isFinite(j.time)||typeof j.prompt!=='string'||!Array.isArray(j.targets)||!Array.isArray(j.confusedWith)||!j.targets.every(w=>typeof w==='string')||!j.confusedWith.every(w=>typeof w==='string')||!checkSession({questions:[j.question],index:0}))throw Error('Invalid saved mistake in backup.')}}
 if(state.listen){const l=state.listen,known=new Set(data.groups.flatMap(g=>g.words).map(e=>e.id));if(!Array.isArray(l.queue)||!l.queue.length||l.queue.some(id=>!known.has(id))||!Number.isInteger(l.index)||l.index<0||l.index>=l.queue.length)throw Error('Invalid listen playlist in backup.');}
 return state;
}
