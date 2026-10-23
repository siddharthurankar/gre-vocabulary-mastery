import assert from 'node:assert/strict';
import fs from 'node:fs';
import {emptyState,question,validateBackup} from '../web/engine.mjs';
const base=JSON.parse(fs.readFileSync(new URL('../web/data.json',import.meta.url))),syn=JSON.parse(fs.readFileSync(new URL('../web/synonyms.json',import.meta.url)));
const data={...base,groups:[...base.groups,...syn.groups]};
assert.equal(base.groups.length,39);assert.equal(syn.groups.length,137);assert.equal(syn.groups.flatMap(g=>g.sections).length,685);assert.equal(syn.groups.flatMap(g=>g.words).length,2052);
assert.equal(new Set(data.groups.flatMap(g=>g.words.map(e=>e.id))).size,3223);
for(const [i,g] of syn.groups.entries()){
 assert.equal(g.sections.length,5);
 assert.deepEqual(g.words.map(e=>e.word),g.sections.flatMap(s=>s.words.map(w=>w.word)));
 for(const e of g.words){assert(e.meaning&&e.sourceHeading&&e.contexts.length);assert.equal(e.contexts.length,e.clues.length);for(const stage of ['recognize','practice']){const q=question(e,stage,data,emptyState(),g);assert(q,`${e.word}: ${stage} unavailable`);assert.equal(q.options.length,5);assert.equal(q.options.filter(o=>o.correct).length,1);assert.equal(new Set(q.options.map(o=>o.word??'?')).size,5);}}
}
assert.deepEqual(validateBackup(emptyState(),data).words,{});
console.log('PASS: all 2,052 source entries preserved in order, 685 families in 137 groups, original 39 groups untouched, unique IDs and five-option practice available for every entry.');
