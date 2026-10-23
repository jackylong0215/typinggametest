const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const context = vm.createContext({});
vm.runInContext(read('code-data.js') + read('stroke-data.js') + read('auxiliary-data.js') + read('learning.js') + read('extra-colours.js') + read('colour-library.js') + '\n' + read('app.js').split('const TITLES')[0] + '\nlet currentVersion="3";globalThis.course={CODE_TABLES,STROKE_DATA,SPLIT_VISUALS,WORDS,SPECIAL_WORDS,VARIANTS,PUNCTUATION,variantText,GROUPS,AUXILIARY_FORMS,USER_CODE_CORRECTIONS};', context);
const course = context.course;
const source3 = new Map();
for (const line of read('data/cangjie3-source.txt').split('\n')) {
 const [code, char] = line.trim().split(/\s+/);
 if (/^[a-z]{1,5}$/.test(code) && char && [...char].length===1) {
  if (!source3.has(char)) source3.set(char, new Set());
  source3.get(char).add(code);
 }
}
const source5 = JSON.parse(read('data/cangjie5_single_main.json')).chars;
test('五代碼表完整保留用戶上傳的 20,840 個主碼', () => {
 assert.equal(Object.keys(source5).length,20840);
 const originalContext=vm.createContext({});vm.runInContext(read('code-data.js')+';globalThis.original=CODE_TABLES["5"]',originalContext);
 assert.deepEqual(JSON.parse(JSON.stringify(originalContext.original)),source5);
 const corrections=JSON.parse(JSON.stringify(course.USER_CODE_CORRECTIONS));
 for(const [char,code]of Object.entries({贏:'yrbbn',函:'nue',盒:'omrt',兔:'nui',面:'mwyl',鬼:'hi',冤:'bnui',卑:'hhj',非:'lmyyy',欞:'dmbm',麽:'idhi',梁:'eid',詐:'yrhs',七:'ju',工:'mlm',亮:'yrbu',乙:'nu',小:'nc',又:'nk',入:'oh',黃:'tmwc',匕:'uh',八:'ho',牌:'llhhj',士:'jm',急:'nsp',微:'houuk',廣:'itmc'}))assert.equal(corrections['5'][char],code);
 const shared=JSON.parse(read('data/colour-source.json')).shared_code_corrections['乍'].characters;
 for(const {char,from,to}of shared){assert.equal(source5[char],from);assert.equal(to,from.replace('os','hs'));assert.equal(corrections['5'][char],to)}
 assert.equal(Object.keys(corrections['5']).length,new Set(['贏','函','盒','兔','面','鬼','冤','卑','非','欞','麽','梁','詐','七','工','亮','乙','小','又','入','黃','匕','八','牌','士','急','微','廣',...shared.map(c=>c.char)]).size);
 assert.deepEqual(JSON.parse(JSON.stringify(course.CODE_TABLES['5'])),{...source5,...corrections['5']});
 for(const [char,code]of Object.entries(course.USER_CODE_CORRECTIONS['5']))assert.ok(source3.get(char)?.has(code),char);
 for (const [char, code] of Object.entries(source5)) assert.match(code,/^[a-z]{1,5}$/,char);
});
test('三代字典每一條碼均可追溯至獨立參考碼表', () => {
 assert.equal(Object.keys(course.CODE_TABLES['3']).length,source3.size);
 for (const [char, code] of Object.entries(course.CODE_TABLES['3'])) assert.ok(source3.get(char)?.has(code),`${char}: ${code}`);
});
test('每道漢字題均有三代及五代的有效答案', () => {
 for(const item of [...course.WORDS,...course.SPECIAL_WORDS]) {
  assert.ok(source3.get(item.char)?.has(item.code),`三代教學主碼錯誤：${item.char} ${item.code}`);
  assert.ok(source5[item.char],`五代缺字：${item.char}`);
 }
 for (const [char,code] of Object.entries({伸:'olwl',定:'jmyo',兒:'hxhu'})) {
  assert.equal(course.CODE_TABLES['3'][char],code);
  assert.equal(course.CODE_TABLES['5'][char],code);
 }
 assert.equal(course.CODE_TABLES['3']['鬼'],'hi');
 assert.equal(course.CODE_TABLES['5']['鬼'],'hi');
 assert.equal(course.CODE_TABLES['5']['又'],'nk');
 assert.equal(course.CODE_TABLES['5']['工'],'mlm');
});
test('圖鑑例字按所選版本核對，沒有混用整字碼', () => {
 for(const version of ['3','5']) {
  vm.runInContext(`currentVersion='${version}'`,context);
  for (const key of Object.keys(course.VARIANTS)) {
   for (const [,char,code] of course.variantText(key,'example').matchAll(/([\u3400-\u9fff])\s+([A-Z]{1,5})/g)) {
    assert.ok(version==='3'?source3.get(char)?.has(code.toLowerCase()):(course.USER_CODE_CORRECTIONS['5']?.[char]||source5[char])===code.toLowerCase(),`${version}代 ${char} ${code}`);
   }
  }
 }
});
test('每個原字標色步驟都對應正確取碼，筆畫分組無重複或遺失', () => {
 for(const [char, visual] of Object.entries(course.SPLIT_VISUALS)) {
  const code=visual.parts.map(p=>p[1]).join('');
  assert.equal(code,course.USER_CODE_CORRECTIONS['5']?.[char]||source5[char],`${char} 五代或用戶修訂`);
  const indices=visual.parts.flatMap(p=>p[2]).concat(visual.ignored||[]).sort((a,b)=>a-b);
  assert.deepEqual(Array.from(indices),Array.from({length:course.STROKE_DATA[char].length},(_,i)=>i),char);
 }
});
test('75 筆符號完全保留用戶碼表的符號、字碼、原表字根與同形異碼', () => {
 const reference=JSON.parse(read('data/punctuation-user-reference.json'));assert.equal(reference.length,75);assert.equal(course.PUNCTUATION.length,75);assert.equal(new Set(reference.map(p=>p.code)).size,75);
 for(const [index,row]of reference.entries()){const item=course.PUNCTUATION[index];assert.equal(item.char,row.symbol);assert.equal(item.code,row.code.toLowerCase());assert.equal(item.stroke,row.stroke);assert.ok(item.name);assert.ok(item.sentence.includes(item.char));assert.equal(item.kind,'punct')}
 const map=new Map(course.PUNCTUATION.map(p=>[p.code,p.char]));for(const [code,char]of Object.entries({zxaa:' ',zxbe:'(',zxbf:')',zxcd:'┌',zxce:'┘',zxaq:'‧',zxaw:'—',zxay:'──',zxap:'．',zxcy:'′'}))assert.equal(map.get(code),char);
 assert.deepEqual(Array.from(course.PUNCTUATION.filter(p=>p.char==='．'),p=>p.code),['zxae','zxap']);assert.equal(course.PUNCTUATION.find(p=>p.code==='zxas').stroke,'Z難日戶');assert.equal(course.PUNCTUATION.find(p=>p.code==='zxat').stroke,'Z難日甘');
});
test('五個分組涵蓋 26 個鍵位，沒有重複', () => {
 const keys=course.GROUPS.flatMap(g=>[...g.keys]);
 assert.equal(keys.length,26);
 assert.equal(new Set(keys).size,26);
 assert.equal(keys.slice().sort().join(''),'abcdefghijklmnopqrstuvwxyz');
});

test('原圖取景涵蓋全部字形，每格在參考圖範圍內且不使用手繪路徑', () => {
 const expected={a:3,b:11,c:5,d:3,e:4,f:6,g:3,h:5,i:4,j:2,k:5,l:5,m:5,n:9,o:7,p:11,q:5,r:1,s:6,t:8,u:4,v:7,w:4,y:4};
 let total=0;const ids=new Set();
 for(const [key,count] of Object.entries(expected)){
  const forms=course.AUXILIARY_FORMS[key];assert.equal(forms.length,count,key);total+=forms.length;
  forms.forEach((form,i)=>{assert.equal(form.key,key);assert.equal(form.index,i);assert.ok(form.label);assert.ok(!ids.has(form.id));ids.add(form.id);assert.equal(form.path,undefined);assert.equal(form.rect.length,4);const [x,y,w,h]=form.rect;assert.ok(x>=0&&y>=0&&w>0&&h>0);assert.ok(x+w<=2048&&y+h<=901)});
 }
 assert.equal(total,127);assert.equal(ids.size,127);
});

test('標色教室至少提供 100 個不同原字，全部有原始筆畫輪廓',()=>{
 const chars=Object.keys(course.SPLIT_VISUALS);assert.ok(chars.length>=100);for(const char of chars)assert.ok(course.STROKE_DATA[char]?.length>0,char);
});

test('池春家米想宇守完字子村朵李逐碼分色，不再把多碼部件塗成單一區塊',()=>{
 for(const char of '池春家米想宇守完字子村朵李'){
  const visual=course.SPLIT_VISUALS[char];assert.ok(visual,char);assert.ok(visual.parts.every(part=>part[1].length===1),char);
 }
 assert.deepEqual(Array.from(course.SPLIT_VISUALS['池'].parts[1][2]),[5]);
 assert.deepEqual(Array.from(course.SPLIT_VISUALS['池'].parts[2][2]),[3,4]);
 assert.deepEqual(Array.from(course.SPLIT_VISUALS['子'].parts[0][2]),[0]);
 assert.deepEqual(Array.from(course.SPLIT_VISUALS['子'].parts[1][2]),[1,2]);
 assert.deepEqual(Array.from(course.SPLIT_VISUALS['想'].ignored),[6,7]);
});
test('春米跨字根筆畫分段，想省略的月形保留灰色；分段引用有效原始輪廓',()=>{
 for(const [char,visual] of Object.entries(course.SPLIT_VISUALS)){
  const split=new Set();for(const region of visual.splitStrokes||[]){
   assert.ok(!split.has(region.stroke),char);split.add(region.stroke);
   assert.ok(course.STROKE_DATA[char][region.stroke],char);assert.ok(Number.isFinite(region.boundary)&&region.boundary>0&&region.boundary<(region.axis==='x'?1024:900),char);
   assert.ok(region.above>=-1&&region.above<visual.parts.length);assert.ok(region.below>=-1&&region.below<visual.parts.length);assert.notEqual(region.above,region.below);
  }
 }
 for(const char of ['春','米']){const segment=course.SPLIT_VISUALS[char].splitStrokes[0];assert.equal(segment.stroke,3);assert.equal(segment.above,0);assert.equal(segment.below,1)}
 assert.ok(course.SPLIT_VISUALS['想'].splitStrokes.every(segment=>segment.above===-1&&segment.below===1));
});

test('完的厂包含左撇，僅乚取山；新增複雜字逐碼分組',()=>{
 assert.deepEqual(Array.from(course.SPLIT_VISUALS['完'].parts[3][2]),[6]);
 assert.deepEqual(Array.from(course.SPLIT_VISUALS['完'].parts[2][2]),[4,5]);
 for(const char of '龍興園書齊')assert.ok(course.SPLIT_VISUALS[char].parts.every(part=>part[1].length===1),char);
 assert.equal(course.SPLIT_VISUALS['龍'].parts.length,5);
});
