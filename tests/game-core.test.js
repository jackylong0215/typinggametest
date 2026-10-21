const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({});const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
vm.runInContext(read('game-core.js')+';globalThis.core={DIFFICULTIES,buildChallengePool,addMistake,creditMistake,mistakeId,recordKey};',ctx);
const c=ctx.core,dict=JSON.parse(read('data/cangjie5_single_main.json')).chars;
const words=[{char:'明'},{char:'林'},{char:'家'},{char:'想'},{char:'兒'}];
test('四級題庫：入門只有基本字根，最高級逐字涵蓋全部 20,840 個主碼',()=>{
 const low=c.buildChallengePool(dict,1,words);assert.equal(low.length,24);assert.ok(low.every(q=>q.code.length===1));
 const apprentice=c.buildChallengePool(dict,2,words);assert.ok(apprentice.every(q=>q.code.length<=3));
 assert.ok(c.buildChallengePool(dict,3,words).length>apprentice.length);
 const all=c.buildChallengePool(dict,4,words);assert.equal(all.length,20840);assert.deepEqual(new Set(all.map(q=>q.char)),new Set(Object.keys(dict)));
 assert.deepEqual(Array.from(c.DIFFICULTIES,d=>d.seconds),[20,15,10,7]);assert.deepEqual(Array.from(c.DIFFICULTIES,d=>d.lives),[5,4,3,3]);
});
test('錯字去重、跨回合答對兩次移除，途中再錯不會抹去已累積的掌握次數',()=>{
 const book={},q={char:'明',code:'ab',kind:'word'};
 c.addMistake(book,q,'5',10);c.addMistake(book,q,'5',20);assert.equal(Object.keys(book).length,1);assert.equal(book['5:word:明'].misses,2);
 assert.equal(c.creditMistake(book,q,'5'),false);assert.equal(book['5:word:明'].correctCount,1);
 c.addMistake(book,q,'5',30);assert.equal(book['5:word:明'].correctCount,1);assert.equal(c.creditMistake(book,q,'5'),true);assert.equal(Object.keys(book).length,0);
});
test('三代、五代、符號和輔助字形分別記錄，不會錯誤消除其他版本的錯字',()=>{
 const book={},q={char:'鬼',code:'hi',kind:'word'};
 c.addMistake(book,q,'3',1);c.addMistake(book,{...q,code:'hui'},'5',1);c.creditMistake(book,q,'3');c.creditMistake(book,q,'3');assert.equal(Object.keys(book).length,1);assert.ok(book['5:word:鬼']);
 assert.notEqual(c.mistakeId({char:'日',kind:'word'},'5'),c.mistakeId({char:'日',kind:'root',formId:'a-01'},'5'));
 assert.notEqual(c.recordKey('rain','5',1),c.recordKey('rain','5',4));assert.notEqual(c.recordKey('rain','5',1),c.recordKey('speed','5',1));
});
