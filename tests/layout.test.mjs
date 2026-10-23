import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../web/app.mjs',import.meta.url),'utf8');
const fragment=source.slice(source.indexOf('function cardSection('),source.indexOf('\nfunction study()'));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ctx=vm.createContext({state:{hooks:{},flags:{}},esc,line:text=>`<p data-speech="${esc(text)}">${esc(text)}</p>`,field:(label,text)=>`<div>${esc(label)}<p>${esc(text)}</p></div>`});
vm.runInContext(fragment,ctx);
const base=JSON.parse(fs.readFileSync(new URL('../web/data.json',import.meta.url))),syn=JSON.parse(fs.readFileSync(new URL('../web/synonyms.json',import.meta.url)));
let total=0;
for(const g of [...base.groups,...syn.groups])for(const e of g.words){
 const html=ctx.learningCard(e,true,true);
 const headings=[...html.matchAll(/<section class="card-section [^"]*" aria-label="([^"]*)"/g)].map(m=>m[1]);
 if(e.sourceHeading)assert.deepEqual(headings.slice(0,7),['Simple meaning','Meaning in use','Quick recall','Recall answer','Instructor’s usage &amp; distinctions','Words in this family','More contexts &amp; other meanings']);
 assert(!html.includes('<details'),'No learning content may be collapsed');
 for(const text of [e.meaning,e.distinction,...e.contexts.map(t=>t.replace('____',e.word)),...(e.otherSenses??[]).map(s=>`${s.pos}: ${s.definition}`)])assert(html.includes(esc(text)),`${e.id}: learning content lost`);
 assert(html.includes('Memory hook'));total++;
}
console.log(`PASS: ${total} learning cards retain definitions, all contexts, all dictionary senses, distinctions and memory aids; synonym sections follow the requested order with no dropdown.`);
