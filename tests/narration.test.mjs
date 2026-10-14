import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../web/app.mjs',import.meta.url),'utf8');
const selection=source.slice(source.indexOf('function readSelection('),source.indexOf('function decorateSpeech('));
const full=source.slice(source.indexOf('function readAll('),source.indexOf('function refreshVoices('));
const makeLine=(text,token=false)=>({textContent:text,dataset:{speech:text},offsetParent:{},classList:{contains:()=>token}});
const explanation=[makeLine('Correct answer'),makeLine('Remember this meaning'),makeLine('word',true)];
const question=makeLine('Question and choices');
let scope={querySelectorAll:selector=>selector==='[data-speech]'?explanation:[]};
const context=vm.createContext({state:{session:{stage:'recognize',index:0,queue:['word']}},route:'study',root:{querySelector:()=>scope,querySelectorAll:selector=>selector==='[data-speech]'?[question]:[]},voiceReady:()=>true,stopAudio(){context.audioToken++},audioToken:0,audioActivated:false,audioIsFull:false,audioLines:[],speakLineAt(){},toast(message){context.notice=message},lab:{suspend(){context.suspended=true}},$(){return null}});
vm.runInContext(selection+full,context);
for(const stage of ['recognize','practice']){context.state.session.stage=stage;context.readAll();assert.deepEqual(Array.from(context.audioLines),explanation.slice(0,2));assert.equal(context.audioIsFull,true)}
scope=null;context.audioLines=[];context.readAll();assert.equal(context.audioLines.length,0);assert.match(context.notice,/Answer first/);
context.state.session.stage='learn';context.readAll();assert.deepEqual(Array.from(context.audioLines),[question]);
const word=makeLine('restrain,');context.readSelection(word,true);assert.equal(word.dataset.speech,'restrain');assert.deepEqual(Array.from(context.audioLines),[word]);assert.equal(context.audioIsFull,false);assert.equal(context.suspended,true);
assert.equal(context.state.session.index,0,'Tapping speech must not advance study progress');
console.log('PASS: Parts 2 and 3 narrate explanations only; unanswered quizzes do not reveal answers; word taps interrupt into isolated playback without advancing progress.');
