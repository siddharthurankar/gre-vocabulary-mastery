import {shuffle} from './engine.mjs';
// These deliberately bounded items use authored synonym pairs and clue-bearing contexts.
export {seBank as bank} from './advanced-bank.mjs';
import {seBank as bank} from './advanced-bank.mjs';
const extraMeanings={sycophantic:'Excessively flattering toward powerful people to gain favor.',methodical:'Following an orderly, systematic procedure.',impartial:'Fair and free from bias.',opulent:'Rich and luxurious.',commodious:'Spacious and comfortable.',protracted:'Continuing for a long time.',incisive:'Clear, sharp, and perceptive.',scrutinize:'Examine very closely.',witty:'Clever and amusing.',credulous:'Too willing to believe claims.',heedless:'Not paying attention to possible consequences.',dispassionate:'Calm and free from emotional bias.',acerbic:'Sharp and harsh in tone.',defiant:'Openly resisting authority.',effusive:'Expressing feelings with unrestrained enthusiasm.',steadfast:'Firm and unwavering.',exhaustive:'Complete and thorough.'};
export function equivalenceQuestion(entry,data,state,rng=Math.random){const item=bank.find(x=>x.word===entry.word),id=entry.canonical+':equivalence:0';if(!item||state.flags[id])return null;
 const dictionary=new Map([...Object.values(data.support??{}),...data.groups.flatMap(g=>g.words)].map(x=>[x.word,x]));
 if([item.word,item.pair,...item.wrong].some(w=>state.flags['card:'+(dictionary.get(w)?.canonical??w)]))return null;
 const options=shuffle([item.word,item.pair,...item.wrong],rng).map(word=>({word,label:word,canonical:dictionary.get(word)?.canonical??word,meaning:dictionary.get(word)?.meaning??extraMeanings[word]??'Meaning is included with the complete vocabulary bank.',correct:word===item.word||word===item.pair}));
 return {id,signature:id+':'+options.map(x=>x.word).join(','),stage:'practice',type:'equivalence',entryId:entry.id,variant:0,prompt:item.sentence,options,answered:false,selected:[],clue:item.clue};
}
