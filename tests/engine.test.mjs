import assert from 'node:assert/strict';
import fs from 'node:fs';
import {emptyState,question,recordLearning,recordAnswer,progress,mastered,dueEntries,queueRetry,validateBackup,DAY} from '../web/engine.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../web/data.json',import.meta.url)));
let n=0;
for(const group of data.groups)for(const entry of group.words){for(const stage of ['recognize','practice']){
 const state=emptyState();const q=question(entry,stage,data,state,group);assert(q,entry.word);assert.equal(q.options.length,5,entry.word);assert.equal(q.options.filter(x=>x.correct).length,1,entry.word);assert.equal(new Set(q.options.filter(x=>x.canonical).map(x=>x.canonical)).size,stage==='practice'?5:4);if(stage==='recognize')assert.equal(q.options[4].label,'I am not sure');
 state.seen[q.id]=1;const fresh=question(entry,stage,data,state,group);assert.notEqual(fresh.id,q.id);state.flags[q.id]=true;assert.notEqual(question(entry,stage,data,state,group).id,q.id);state.flags[fresh.id]=true;for(let i=0;i<(stage==='practice'?entry.contexts.length:2);i++)state.flags[(entry.questionNamespace??entry.canonical)+':'+stage+':'+i]=true;assert.equal(question(entry,stage,data,state,group),null);n++;
}}
const e=data.groups[0].words[0],s=emptyState(),now=Date.parse('2026-10-14T12:00:00Z');recordLearning(s,e,'knew',now);assert.equal(dueEntries(data,s,now).length,0);assert.equal(dueEntries(data,s,now+DAY).length,1);
recordAnswer(s,e,'recognize',true,false,now);recordAnswer(s,e,'practice',true,false,now);assert.equal(mastered(progress(s,e.canonical)),false);
recordAnswer(s,e,'recognize',true,true,now+DAY);const step=progress(s,e.canonical).reviewStep;recordAnswer(s,e,'practice',true,true,now+DAY+60000);assert.equal(progress(s,e.canonical).reviewStep,step);assert.equal(progress(s,e.canonical).reviewDays.length,1);
let t=now+2*DAY;recordAnswer(s,e,'practice',true,true,t);t=progress(s,e.canonical).due;recordAnswer(s,e,'recognize',true,true,t);assert.equal(mastered(progress(s,e.canonical)),true);
recordAnswer(s,e,'practice',false,true,t+DAY);assert.equal(progress(s,e.canonical).reviewStep,0);assert.equal(mastered(progress(s,e.canonical)),false);
const session={queue:['a','b','c','d','e','f'],index:0,retries:{}};queueRetry(session,'a',false);assert.equal(session.queue[5],'a');session.index=5;queueRetry(session,'a',true);assert.equal(session.retries.a.streak,1);session.index=session.queue.length-1;queueRetry(session,'a',true);assert.equal(session.retries.a.streak,2);
assert.equal(validateBackup(JSON.parse(JSON.stringify(s)),data).words[e.canonical].misses,1);assert.throws(()=>validateBackup({version:1,words:{},placements:{},history:[]},data));
console.log(`PASS: ${n} word/stage question checks, unique answers, five-option structure, variant rotation, quarantine, review dates, delayed mastery, retries, and backup validation.`);
