const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const context=vm.createContext({});
const helper=read('app.js').split('function splitVisual(char)')[1].split('function glyphPaths')[0];
vm.runInContext(['code-data.js','stroke-data.js','learning.js','extra-colours.js','colour-library.js'].map(read).join('\n')+'\nlet currentVersion="5";let item;function splitVisual(char)'+helper+'\nglobalThis.library={SPLIT_VISUALS,STROKE_DATA,CODE_TABLES,COLOUR_ORDER,visualFor:(char,version)=>{currentVersion=version;return splitVisual(char)},questionFor:(word,version)=>{currentVersion=version;item=word;return questionVisual()}}',context);
const lib=context.library,source=JSON.parse(read('data/colour-source.json')),audit=JSON.parse(read('data/colour-audit.json'));
test('五代標色教室恰好3500個不同字，包含常用字及所有既有修正',()=>{
 assert.equal(Object.keys(lib.SPLIT_VISUALS).length,3500);assert.equal(new Set(lib.COLOUR_ORDER).size,3500);assert.equal(audit.total,3500);assert.equal(Object.keys(audit.characters).length,3384);
 for(const char of '的是在不有了我國這個會們他來年上以要到時對麼能你就可地生發出也說於學後成與過行用多都沒作下得開經還法方而之民政看嗎所天新業全同定部最其進機美那當工關實裏小被自現動事前完池龍興')assert.ok(lib.visualFor(char,'5'),char);
});
test('全部3500字的每一步只取一碼；三代不顯示五代不同碼的標色',()=>{
 for(const char of lib.COLOUR_ORDER){const visual=lib.visualFor(char,'5');assert.ok(visual,char);assert.ok(visual.parts.every(part=>part[1].length===1),char);const v3=lib.visualFor(char,'3');if(v3)assert.equal(v3.parts.map(p=>p[1]).join(''),lib.CODE_TABLES['3'][char],char);else assert.notEqual(visual.parts.map(p=>p[1]).join(''),lib.CODE_TABLES['3'][char],char)}
});
test('每個取碼步驟均有實際筆畫區域，跨根筆畫的各區域無重疊且完整覆蓋',()=>{
 for(const [char,visual] of Object.entries(lib.SPLIT_VISUALS)){
  const visible=new Set();const boundaries=new Set();
  for(const region of visual.strokeRegions||[]){assert.ok(!boundaries.has(region.stroke),char);boundaries.add(region.stroke);const segments=region.segments;assert.equal(segments[0][0],-200,char);assert.equal(segments.at(-1)[1],1200,char);for(let i=0;i<segments.length;i++){const [lo,hi,part]=segments[i];assert.ok(hi>lo,char);assert.ok(part>=-1&&part<visual.parts.length,char);if(i)assert.equal(lo,segments[i-1][1],char);if(part>=0)visible.add(part)}}
  for(const region of visual.splitStrokes||[]){assert.ok(!boundaries.has(region.stroke),char);boundaries.add(region.stroke);for(const part of [region.above,region.below])if(part>=0)visible.add(part)}
  visual.parts.forEach((part,i)=>{if(part[2].some(stroke=>!boundaries.has(stroke)))visible.add(i)});
  assert.equal(visible.size,visual.parts.length,char);
 }
});
test('龍只取亠為卜，匕的橫與彎鉤同屬心；完的厂與乚清楚分開',()=>{
 const dragon=lib.SPLIT_VISUALS['龍'],complete=lib.SPLIT_VISUALS['完'];assert.deepEqual(Array.from(dragon.parts[0][2]),[0,1]);assert.deepEqual(Array.from(dragon.parts[4][2]),[15]);assert.ok([2,3,4,13,14].every(i=>dragon.ignored.includes(i)));assert.equal(dragon.splitStrokes[0].below,3);assert.equal(dragon.splitStrokes[1].stroke,12);assert.equal(dragon.splitStrokes[1].above,3);assert.equal(dragon.splitStrokes[1].below,4);
 assert.deepEqual(Array.from(complete.parts[2][2]),[4,5]);assert.deepEqual(Array.from(complete.parts[3][2]),[6]);assert.equal(complete.ignored,undefined);
});
test('3384個新增字的取碼區域均有明確部件來源，沒有按筆畫數平均分割',()=>{
 for(const [char,atoms] of Object.entries(audit.characters)){
  assert.equal(atoms.map(a=>a.key).join(''),lib.CODE_TABLES['5'][char],char);
  for(const atom of atoms){assert.notEqual(atom.key,'?',char);assert.ok(source.dictionary[atom.component],char+atom.component);assert.ok(source.templates[atom.component]||source.roots[atom.component]||lib.SPLIT_VISUALS[atom.component],char+atom.component);assert.ok(atom.regions.length,char);for(const [stroke,lo,hi] of atom.regions){assert.ok(lib.STROKE_DATA[char][stroke],char);assert.ok(hi>lo,char)}}
 }
});
test('新參考圖十二字和廝的繁體變體均採本系統逐碼標色',()=>{
 const expected={丞:'nem',丑:'ng',並:'ttc',亟:'mem',亞:'mllm',伊:'osk',劉:'hcln',厮:'mtcl',廝:'itcl',囊:'jbrrv',募:'taks',巔:'ujcc',奧:'hbk'};
 for(const [char,code] of Object.entries(expected)){const visual=lib.visualFor(char,'5');assert.ok(visual,char);assert.equal(visual.parts.map(p=>p[1]).join(''),code,char);assert.ok(source.templates[char].reference,char)}
});
test('參考圖的省略區域留灰：亞只取兩短豎、劉省上部卯、募省力撇、奧省內部',()=>{
 const visual=lib.SPLIT_VISUALS;
 assert.deepEqual(Array.from(visual['亞'].ignored),[2,3,5,6]);assert.equal(visual['亞'].splitStrokes[0].below,-1);assert.equal(visual['亞'].splitStrokes[0].above,2);
 assert.deepEqual(Array.from(visual['劉'].ignored),[1,2,3,4]);assert.deepEqual(Array.from(visual['募'].ignored),[11]);assert.deepEqual(Array.from(visual['奧'].ignored),[3,4,5,6,7,8,9]);
 assert.deepEqual(Array.from(visual['丞'].parts[1][2]),[1,2,3,4]);assert.deepEqual(Array.from(visual['丑'].parts[1][2]),[1,2,3]);
});
test('囊的上十與省略口中豎分段，亟僅取頂橫，兩處保留原筆畫形狀',()=>{
 const n=lib.SPLIT_VISUALS['囊'],j=lib.SPLIT_VISUALS['亟'];assert.equal(n.splitStrokes[0].stroke,4);assert.equal(n.splitStrokes[0].above,0);assert.equal(n.splitStrokes[0].below,-1);assert.equal(j.splitStrokes[0].stroke,0);assert.equal(j.splitStrokes[0].below,-1);
 assert.deepEqual(Array.from(n.parts[4][2]),[19,20,21]);assert.ok(n.ignored.includes(18));
});
test('巔使用參考的十頭真，重組時逐筆保留來源輪廓，沒有把匕頭誤當十',()=>{
 const recipe=source.contour_adaptations['巔'].recipe,original=source.reference_original_graphics;
 const expected=recipe.flatMap(part=>part.indices.map(index=>original[part.source].strokes[index]));assert.deepEqual(Array.from(lib.STROKE_DATA['巔']),expected);
 assert.equal(lib.STROKE_DATA['巔'][3],original['巅'].strokes[3]);assert.equal(lib.STROKE_DATA['巔'][4],original['巅'].strokes[4]);
 assert.deepEqual(Array.from(lib.SPLIT_VISUALS['巔'].parts[1][2]),[3,4]);assert.deepEqual(Array.from(lib.SPLIT_VISUALS['巔'].parts[2][2]),[11,12]);assert.deepEqual(Array.from(lib.SPLIT_VISUALS['巔'].parts[3][2]),[20,21]);
});
test('用戶指定麽IDHI、梁EID、詐YRHS，三個字的標色取碼與實際答案一致',()=>{
 for(const [char,code]of Object.entries({麽:'idhi',梁:'eid',詐:'yrhs'})){assert.equal(lib.CODE_TABLES['5'][char],code);assert.equal(lib.visualFor(char,'5').parts.map(p=>p[1]).join(''),code)}
 assert.deepEqual(Array.from(lib.SPLIT_VISUALS['麽'].parts[1][2]),[7,8,9,10]);assert.deepEqual(Array.from(lib.SPLIT_VISUALS['梁'].parts[1][2]),[6]);assert.deepEqual(Array.from(lib.SPLIT_VISUALS['詐'].parts[2][2]),[7]);
});
test('力與九的共用橫畫分左右：𠂇含左橫與撇，𠃌或⺄只取右側',()=>{
 for(const char of ['力','九']){const v=lib.SPLIT_VISUALS[char],region=v.splitStrokes[0];assert.equal(region.axis,'x',char);assert.equal(region.below,0,char);assert.equal(region.above,1,char)}
 let count=0;for(const [char,atoms]of Object.entries(audit.characters))for(const atom of atoms)if(['力','九'].includes(atom.component)){
  const partial=atom.regions.filter(r=>r[3]==='x'&&(r[1]!==-200||r[2]!==1200));assert.ok(partial.length,char+atom.key);if(atom.key==='k'){assert.ok(atom.regions.length>=2,char);assert.ok(partial.some(r=>r[1]===-200),char)}else assert.ok(partial.some(r=>r[2]===1200),char);count++
 }assert.ok(count>=10);
 assert.equal(lib.SPLIT_VISUALS['加'].splitStrokes[0].axis,'x');assert.ok(lib.SPLIT_VISUALS['動'].splitStrokes.some(r=>r.stroke===9&&r.axis==='x'&&r.above===3&&r.below===2));
});
test('幺的女只取第一撇折，其餘厶取戈；機逐部件按新圖取形',()=>{
 const v=lib.SPLIT_VISUALS['幺'];assert.deepEqual(Array.from(v.parts[0][2]),[0]);assert.deepEqual(Array.from(v.parts[1][2]),[1,2]);assert.equal(v.splitStrokes,undefined);
 const m=lib.SPLIT_VISUALS['機'];assert.deepEqual(Array.from(m.parts[1][2]),[4]);assert.deepEqual(Array.from(m.parts[2][2]),[12]);assert.deepEqual(Array.from(m.parts[3][2]),[10,13,14,15]);assert.deepEqual(Array.from(m.ignored),[5,6,7,8,9,11]);
 assert.deepEqual(Array.from(lib.SPLIT_VISUALS['麼'].parts[2][2]),[11]);assert.deepEqual(Array.from(lib.SPLIT_VISUALS['關'].parts[2][2]),[8]);
});
test('我跨手戈的橫畫左右分色，隹與應只將右下土形取土',()=>{
 const w=lib.SPLIT_VISUALS['我'].splitStrokes[0];assert.equal(w.stroke,1);assert.equal(w.axis,'x');assert.equal(w.below,1);assert.equal(w.above,2);
 const z=lib.SPLIT_VISUALS['隹'];assert.deepEqual(Array.from(z.parts[1][2]),[5,6,7]);assert.deepEqual(Array.from(z.ignored),[2,3,4]);assert.equal(z.splitStrokes[0].above,-1);
 const y=lib.SPLIT_VISUALS['應'];assert.deepEqual(Array.from(y.parts[2][2]),[10,11,12]);assert.deepEqual(Array.from(y.ignored),[5,6,7,8,9]);assert.equal(y.splitStrokes[0].above,-1);
});
test('還只取右內丨為中，異的廿包含底橫，供洪等共部件同樣補齊',()=>{
 const h=lib.SPLIT_VISUALS['還'];assert.deepEqual(Array.from(h.parts[2][2]),[3]);assert.ok(h.ignored.includes(2));assert.deepEqual(Array.from(lib.SPLIT_VISUALS['異'].parts[1][2]),[5,6,7,8]);
 for(const [char,atoms]of Object.entries(audit.characters))for(const atom of atoms)if(atom.component==='共'&&atom.key==='t')assert.equal(atom.regions.length,4,char);
});
test('七與工獨立拆JU與MLM，用於切、紅等字仍保留P及M輔助形',()=>{
 assert.equal(lib.CODE_TABLES['5']['七'],'ju');assert.equal(lib.CODE_TABLES['5']['工'],'mlm');assert.equal(lib.SPLIT_VISUALS['七'].parts.map(p=>p[1]).join(''),'ju');assert.equal(lib.SPLIT_VISUALS['工'].parts.map(p=>p[1]).join(''),'mlm');assert.equal(lib.SPLIT_VISUALS['切'].parts[0][1],'p');assert.equal(lib.SPLIT_VISUALS['紅'].parts.at(-1)[1],'m');
 assert.ok(lib.questionFor({char:'七',code:'ju'},'5'));assert.equal(lib.questionFor({char:'七',code:'p',formId:'p-1'},'5'),undefined);
});
test('所有門部的N僅取下方亅，所有阝部的N僅取上方乛；上下省略區方向不同',()=>{
 let doors=0,ears=0;
 for(const [char,atoms]of Object.entries(audit.characters))for(const atom of atoms){if(atom.component==='門'&&atom.key==='n'){assert.ok(atom.regions.every(r=>r[3]==='x'&&r[1]>-200&&r[2]===1200&&Number.isFinite(r[4])),char);doors++}if(atom.component==='阝'&&atom.key==='n'){assert.ok(atom.regions.every(r=>r[1]>-200&&r[2]===1200),char);ears++}}
 assert.ok(doors>=5);assert.ok(ears>=5);const door=lib.SPLIT_VISUALS['關'].splitStrokes.find(r=>r.stroke===5);assert.equal(door.above,1);assert.equal(door.below,-1);assert.equal(door.axis,'x');assert.ok(Number.isFinite(door.floor));const ear=lib.SPLIT_VISUALS['那'].splitStrokes.find(r=>r.stroke===4);assert.equal(ear.above,2);assert.equal(ear.below,-1);
});
test('壯依參考把爿下方橫撇歸一，豎畫省略；所有爿的M均包含兩畫',()=>{
 const v=lib.SPLIT_VISUALS['壯'];assert.equal(v.parts.map(p=>p[1]).join(''),'vmg');assert.deepEqual(Array.from(v.parts[0][2]),[0]);assert.deepEqual(Array.from(v.parts[1][2]),[2,3]);assert.ok(v.ignored.includes(1));
 for(const [char,atoms]of Object.entries(audit.characters))for(const atom of atoms)if(atom.component==='爿'&&atom.key==='m')assert.equal(atom.regions.length,2,char);
});
test('亮依參考取YRBU，底部只標右側乚，左撇與多餘起筆橫段留灰',()=>{
 assert.equal(lib.CODE_TABLES['5']['亮'],'yrbu');const v=lib.SPLIT_VISUALS['亮'];assert.equal(v.parts.map(p=>p[1]).join(''),'yrbu');assert.deepEqual(Array.from(v.parts[3][2]),[8]);assert.ok(v.ignored.includes(7));assert.equal(v.splitStrokes[0].axis,'x');assert.equal(v.splitStrokes[0].above,3);assert.equal(v.splitStrokes[0].below,-1);
});
test('力九的左右切分只作用於上方橫畫，鉤尾保留在尸或弓的一側',()=>{
 for(const char of ['力','九','加']){const r=lib.SPLIT_VISUALS[char].splitStrokes.find(r=>r.axis==='x');assert.ok(Number.isFinite(r.floor),char)}
 for(const [char,atoms]of Object.entries(audit.characters))for(const atom of atoms)if(['力','九'].includes(atom.component))for(const region of atom.regions)if(region[3]==='x')assert.ok(Number.isFinite(region[4]),char);
});

test('乙獨立取NU、部件仍取N；斤的兩撇屬H，ML不包含左撇',()=>{
 assert.equal(lib.CODE_TABLES['5']['乙'],'nu');
 assert.equal(lib.SPLIT_VISUALS['乙'].parts.map(p=>p[1]).join(''),'nu');
 assert.equal(source.roots['乙'],'n');
 assert.deepEqual(source.templates['斤'].parts.map(p=>p[2]),[[0,1],[2],[3]]);
 for(const c of ['近','新','所'])for(const a of audit.characters[c]||[])if(a.component==='斤'&&a.key==='m')assert.ok(a.regions.length===1,c);
 assert.equal(source.templates['力'].splitStrokes[0].boundary,600);
});
test('乍結構依參考取HS，相關字碼與標色同步',()=>{
 for(const [c,code]of Object.entries({乍:'hs',作:'ohs',昨:'ahs',炸:'fhs',怎:'hsp',詐:'yrhs'})){
  assert.equal(lib.CODE_TABLES['5'][c],code,c);assert.equal(lib.SPLIT_VISUALS[c].parts.map(p=>p[1]).join(''),code,c);
 }
});

test('乙右端上翹鉤尖完整取U；關右側亅不被裁成半條豎畫',()=>{
 const yi=lib.SPLIT_VISUALS['乙'].splitStrokes[0];
 assert.equal(yi.axis,'x');assert.equal(yi.above,1);assert.equal(yi.below,0);
 assert.equal(yi.boundary,700);assert.equal(yi.floor,250);
 const gate=lib.SPLIT_VISUALS['關'].splitStrokes.find(s=>s.stroke===5);
 assert.equal(gate.axis,'x');assert.equal(gate.boundary,760);assert.equal(gate.above,1);
 assert.equal(gate.below,-1);assert.equal(gate.floor,300);
});
