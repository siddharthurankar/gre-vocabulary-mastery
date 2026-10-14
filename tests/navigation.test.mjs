import assert from 'node:assert/strict';
import fs from 'node:fs';
import {emptyState,question,rememberQuestion,jumpToWord,resetStudyProgress,recordAnswer} from '../web/engine.mjs';
const d=JSON.parse(fs.readFileSync(new URL('../web/data.json',import.meta.url)));
let n=0;
for(const g of d.groups)for(const e of g.words)for(const stage of ['recognize','practice']){
 const s=emptyState();let prev=null;
 for(let i=0;i<4;i++){const q=question(e,stage,d,s,g);assert(q);assert.equal(q.options.length,5);assert.equal(q.options.filter(o=>o.correct).length,1);
  if(prev){assert.notEqual(q.variant,prev.variant,`${e.word}: context must change`);assert.notEqual(q.options.filter(o=>o.canonical!==null).map(o=>o.canonical).join(','),prev.options.filter(o=>o.canonical!==null).map(o=>o.canonical).join(','),`${e.word}: answer ordering must change`)}
  rememberQuestion(s,q);prev=q;
 }
 n++;
}
let session={queue:['a','b','c','d'],index:0,current:null,revealed:true,recall:true};jumpToWord(session,'d');assert.deepEqual(session.queue,['d','a','b','c']);assert.equal(session.index,0);assert.equal(session.revealed,false);
session.index=2;jumpToWord(session,'d');assert.deepEqual(session.queue,['d','a','d','b','c']);assert.equal(session.index,2);assert.equal(jumpToWord(session,'missing'),false);
session={queue:['a','b','c'],index:0,current:{answered:true},revealed:false};jumpToWord(session,'c');assert.deepEqual(session.queue,['a','c','b']);assert.equal(session.index,1);
const s=emptyState(),e=d.groups[0].words[0];s.settings.rate=1.25;s.hooks[e.canonical]='My personal hook';s.flags['card:'+e.canonical]=1;recordAnswer(s,e,'recognize',true,false);s.session=session;s.seen.example=3;s.reviewSets=5;
const fresh=resetStudyProgress(s);assert.deepEqual(fresh.words,{});assert.deepEqual(fresh.placements,{});assert.deepEqual(fresh.history,[]);assert.deepEqual(fresh.seen,{});assert.deepEqual(fresh.lastVariants,{});assert.equal(fresh.session,null);assert.equal(fresh.settings.rate,1.25);assert.equal(fresh.hooks[e.canonical],'My personal hook');assert.equal(fresh.flags['card:'+e.canonical],1);assert(s.words[e.canonical]);
console.log(`PASS: ${n} word/stage checks over four repeated questions each; contexts and answer order vary without needing an answer. Word jumps preserve remaining work; reset clears stats and preserves hooks/settings/flags.`);
