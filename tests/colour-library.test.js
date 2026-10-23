const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const context=vm.createContext({});
const helper=read('app.js').split('function splitVisual(char)')[1].split('function glyphPaths')[0];
vm.runInContext(['code-data.js','stroke-data.js','learning.js','extra-colours.js','colour-library.js'].map(read).join('\n')+'\nlet currentVersion="5";let item;function splitVisual(char)'+helper+'\nglobalThis.library={SPLIT_VISUALS,STROKE_DATA,CODE_TABLES,COLOUR_ORDER,visualFor:(char,version)=>{currentVersion=version;return splitVisual(char)},questionFor:(word,version)=>{currentVersion=version;item=word;return questionVisual()}}',context);
const corrections={...JSON.parse(read('data/colour-corrections-20261023.json')).characters,...JSON.parse(read('data/colour-corrections-20261023-batch2.json')).characters};
const lib=context.library,source=JSON.parse(read('data/colour-source.json')),audit=JSON.parse(read('data/colour-audit.json'));
test('五代標色教室恰好10009個不同字，包含常用字及所有既有修正',()=>{
 assert.equal(Object.keys(lib.SPLIT_VISUALS).length,10009);assert.equal(new Set(lib.COLOUR_ORDER).size,10009);assert.equal(audit.total,10009);assert.equal(Object.keys(audit.characters).length,9893);
 for(const char of '的是在不有了我國這個會們他來年上以要到時對麼能你就可地生發出也說於學後成與過行用多都沒作下得開經還法方而之民政看嗎所天新業全同定部最其進機美那當工關實裏小被自現動事前完池龍興')assert.ok(lib.visualFor(char,'5'),char);
});
test('全部10009字的每一步只取一碼；三代不顯示五代不同碼的標色',()=>{
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
test('9893個生成字的取碼區域均有明確部件來源，沒有按筆畫數平均分割',()=>{
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
 for(const [char,atoms]of Object.entries(audit.characters))for(const atom of atoms){if(atom.component==='門'&&atom.key==='n'){assert.ok(atom.regions.every(r=>r[1]===-200&&r[2]<1200&&(!r[3]||r[3]==='y')),char);doors++}if(atom.component==='阝'&&atom.key==='n'){assert.ok(atom.regions.every(r=>r[1]>-200&&r[2]===1200),char);ears++}}
 assert.ok(doors>=5);assert.ok(ears>=5);const door=lib.SPLIT_VISUALS['關'].splitStrokes.find(r=>r.stroke===5);assert.equal(door.above,-1);assert.equal(door.below,1);assert.equal(door.boundary,615);assert.equal(door.axis,undefined);const ear=lib.SPLIT_VISUALS['那'].splitStrokes.find(r=>r.stroke===4);assert.equal(ear.above,2);assert.equal(ear.below,-1);
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
 assert.equal(gate.axis,undefined);assert.equal(gate.boundary,615);assert.equal(gate.above,-1);
 assert.equal(gate.below,1);assert.equal(gate.floor,undefined);
 const door=lib.SPLIT_VISUALS['門'].splitStrokes.find(s=>s.stroke===5);assert.equal(door.boundary,517);assert.equal(door.above,-1);assert.equal(door.below,1);
});

test('小獨立取NC；尖等字中的小形仍取F，字根練習不誤用整字模型',()=>{
 assert.equal(lib.CODE_TABLES['5']['小'],'nc');assert.equal(lib.CODE_TABLES['3']['小'],'nc');
 const v=lib.SPLIT_VISUALS['小'];assert.equal(v.parts.map(p=>p[1]).join(''),'nc');
 assert.deepEqual(Array.from(v.parts[0][2]),[0]);assert.deepEqual(Array.from(v.parts[1][2]),[1,2]);
 assert.equal(source.roots['小'],'f');assert.equal(lib.SPLIT_VISUALS['尖'].parts[0][1],'f');
 assert.ok(lib.questionFor({char:'小',code:'nc'},'5'));
 assert.equal(lib.questionFor({char:'小',code:'f',formId:'f-small'},'5'),undefined);
});

test('也的左側橫段歸心，木只取中豎與右側橫折鉤；池同步分段',()=>{
 const v=lib.SPLIT_VISUALS['也'];assert.equal(v.parts.map(p=>p[1]).join(''),'pd');
 const split=v.splitStrokes.find(s=>s.stroke===0);assert.equal(split.axis,'x');assert.equal(split.boundary,350);assert.equal(split.above,1);assert.equal(split.below,0);
 const pool=lib.SPLIT_VISUALS['池'].splitStrokes[0];assert.equal(pool.stroke,3);assert.equal(pool.above,2);assert.equal(pool.below,1);
 for(const c of ['他','地','她']){const v=lib.SPLIT_VISUALS[c];assert.ok(v.splitStrokes.some(s=>s.axis==='x'&&s.above===2&&s.below===1),c)}
});

test('又與入獨立取NK及OH，部件仍取E及O',()=>{
 for(const [char,code,component] of [['又','nk','e'],['入','oh','o']]){
  assert.equal(lib.CODE_TABLES['5'][char],code);assert.equal(lib.CODE_TABLES['3'][char],code);
  assert.equal(lib.SPLIT_VISUALS[char].parts.map(p=>p[1]).join(''),code);
  assert.equal(source.roots[char],component);assert.ok(lib.questionFor({char,code},'5'));
  assert.equal(lib.questionFor({char,code:component,formId:'aux-'+char},'5'),undefined);
 }
 assert.equal(lib.CODE_TABLES['5']['友'],'ke');assert.ok(lib.SPLIT_VISUALS['友'].parts.some(p=>p[1]==='e'));
 assert.equal(lib.CODE_TABLES['5']['全'],'omg');
});

test('別的尸取右側橫折鉤，參的末碼竹只取最後一撇',()=>{
 const v=lib.SPLIT_VISUALS['別'];assert.equal(v.parts.map(p=>p[1]).join(''),'rsln');assert.deepEqual(Array.from(v.parts[1][2]),[4]);assert.ok(v.ignored.includes(3));
 assert.equal(v.splitStrokes[0].stroke,4);assert.equal(v.splitStrokes[0].below,-1);
 const sam=lib.SPLIT_VISUALS['參'];assert.equal(sam.parts.map(p=>p[1]).join(''),'iiih');assert.deepEqual(Array.from(sam.parts[3][2]),[10]);assert.ok([6,7,8,9].every(i=>sam.ignored.includes(i)));
});

test('態與熊縮取能部時取最後一個匕，完整能仍保留兩個匕',()=>{
 for(const c of ['態','熊']){const v=lib.SPLIT_VISUALS[c];assert.deepEqual(Array.from(v.parts[1][2]),[8,9],c);assert.ok([6,7].every(i=>v.ignored.includes(i)),c)}
 const v=lib.SPLIT_VISUALS['能'];assert.deepEqual(Array.from(v.parts[2][2]),[6,7]);assert.deepEqual(Array.from(v.parts[3][2]),[8,9]);
});
test('半的火包含上方中豎，票的田只標外框，酸的酉不標內橫',()=>{
 const half=lib.SPLIT_VISUALS['半'];assert.equal(half.splitStrokes[0].stroke,4);assert.equal(half.splitStrokes[0].above,0);assert.equal(half.splitStrokes[0].below,1);
 const ticket=lib.SPLIT_VISUALS['票'];assert.deepEqual(Array.from(ticket.parts[1][2]),[1,2,5]);assert.ok([3,4].every(i=>ticket.ignored.includes(i)));
 const acid=lib.SPLIT_VISUALS['酸'];assert.deepEqual(Array.from(acid.parts[1][2]),[1,2,6]);assert.ok(acid.ignored.includes(5));
 for(const [char,atoms]of Object.entries(audit.characters))for(const a of atoms){if(a.component==='酉'&&a.key==='w')assert.equal(a.regions.length,3,char);if(a.component==='覀'&&a.key==='w')assert.equal(a.regions.length,3,char)}
});
test('黃取TMWC並將田形完整分色；鳥的卜不取下方橫折鉤，鳳的日不含延伸直豎',()=>{
 assert.equal(lib.CODE_TABLES['5']['黃'],'tmwc');assert.equal(lib.SPLIT_VISUALS['黃'].parts.map(p=>p[1]).join(''),'tmwc');assert.deepEqual(Array.from(lib.SPLIT_VISUALS['黃'].parts[2][2]),[5,6,7,8,9]);
 const bird=lib.SPLIT_VISUALS['鳥'];assert.deepEqual(Array.from(bird.parts[2][2]),[5]);assert.ok(bird.ignored.includes(6));assert.equal(bird.splitStrokes[0].stroke,1);assert.equal(bird.splitStrokes[0].above,1);assert.equal(bird.splitStrokes[0].below,2);
 const phoenix=lib.SPLIT_VISUALS['鳳'].splitStrokes.find(s=>s.stroke===4);assert.equal(phoenix.above,3);assert.equal(phoenix.below,-1);
});
test('匕獨立UH、八獨立HO，部件分別仍取P及C',()=>{
 for(const [char,code,root] of [['匕','uh','p'],['八','ho','c']]){
  assert.equal(lib.CODE_TABLES['5'][char],code);assert.equal(lib.CODE_TABLES['3'][char],code);assert.equal(source.roots[char],root);
  assert.equal(lib.SPLIT_VISUALS[char].parts.map(p=>p[1]).join(''),code);assert.equal(lib.questionFor({char,code:root,formId:'aux-'+char},'5'),undefined);
 }
});

test('擴充新增6509字，既有幾何只允許逐字明訂的用戶修正',()=>{
 const crypto=require('node:crypto'),baseline=JSON.parse(read('data/colour-baseline-3500.json'));
 assert.equal(Object.keys(baseline).length,3500);
 assert.equal(Object.keys(lib.SPLIT_VISUALS).filter(c=>!baseline[c]).length,6509);
 for(const [c,expected] of Object.entries(baseline)){
  const v=lib.SPLIT_VISUALS[c];assert.ok(v,c);assert.equal(v.parts.map(p=>p[1]).join(''),(corrections[c]||expected).code,c);
  const shape={parts:v.parts.map(p=>[p[1],p[2]]),ignored:v.ignored||[],splits:v.splitStrokes||[],regions:v.strokeRegions||[]};
  // 新：2026-10-22 修正斤 H/M；2026-10-23 共用部件修正另以逐字雜湊列明。
  const corrected={新:'22b8f3d76eb82fefc82a5e98e8e098ded88e72c71eeb84f7de8e779b06911548'};
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(shape)).digest('hex'),corrections[c]?.geometrySha256||corrected[c]||expected.geometrySha256,c);
 }
});
test('新車的共用中豎分三段，頁的月山分界與甫的省略區明確',()=>{
 const car=lib.SPLIT_VISUALS['車'];assert.equal(car.parts.map(p=>p[1]).join(''),'jwj');assert.equal(car.strokeRegions[0].stroke,6);assert.deepEqual(Array.from(car.strokeRegions[0].segments,s=>s[2]),[2,1,0]);
 const page=lib.SPLIT_VISUALS['頁'];assert.equal(page.parts.map(p=>p[1]).join(''),'mbuc');assert.equal(page.splitStrokes.length,2);
 const fu=lib.SPLIT_VISUALS['甫'];assert.ok(fu.ignored.includes(3)&&fu.ignored.includes(4));assert.equal(fu.splitStrokes[0].below,-1);
});

test('新字的斤按參考分 HML：上撇與左撇同屬竹，橫畫單獨取一',()=>{const visual=lib.SPLIT_VISUALS['新'];assert.equal(visual.parts.map(p=>p[1]).join(''),'ydhml');assert.deepEqual(Array.from(visual.parts[2][2]),[9,10]);assert.deepEqual(Array.from(visual.parts[3][2]),[11]);assert.deepEqual(Array.from(visual.parts[4][2]),[12]);assert.deepEqual(Array.from(visual.ignored),[2,3,4]);for(const char of ['斤','近','所','斥','折','斬','斷'])for(const atom of audit.characters[char]||[])if(atom.component==='斤'&&atom.key==='m')assert.equal(atom.regions.length,1,char)});


test('37張新參考明確取形，既有5000字只允許明訂的用戶分色修正',()=>{
 const crypto=require('node:crypto'),baseline=JSON.parse(read('data/colour-baseline-5000.json'));
 assert.equal(Object.keys(baseline).length,5000);
 const chars='將從更讓道界樣展世向劃候使織號網港喫羣牀峯溼嚐揹髏緹綾譁才真史決己元單片樂';
 assert.equal([...chars].length,37);
 for(const c of chars){assert.ok(lib.visualFor(c,'5'),c);assert.ok(source.standalone_templates[c].reference,c);assert.ok(!baseline[c],c)}
 const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
 for(const [c,expected]of Object.entries(baseline)){
  const v=lib.SPLIT_VISUALS[c];assert.equal(v.parts.map(p=>p[1]).join(''),(corrections[c]||expected).code,c);
  const shape={parts:v.parts.map(p=>[p[1],p[2]]),ignored:v.ignored||[],splits:v.splitStrokes||[],regions:v.strokeRegions||[]};
  assert.equal(hash(shape),(corrections[c]||expected).geometrySha256,c);assert.equal(hash(lib.STROKE_DATA[c]),expected.strokesSha256,c);
 }
});
test('參考字省略留灰，共用長筆畫按部位裁切',()=>{
 const v=lib.SPLIT_VISUALS;
 assert.deepEqual(Array.from(v['將'].ignored),[1]);
 assert.deepEqual(Array.from(v['從'].ignored),[7,8]);
 assert.deepEqual(Array.from(v['真'].ignored),[7]);
 assert.deepEqual(Array.from(v['樂'].parts[0][2]),[5]);
 assert.deepEqual(Array.from(v['樂'].parts[1][2]),[9,10]);
 for(const c of '更使髏')assert.ok(v[c].strokeRegions.length,c);
 assert.deepEqual(Array.from(v['髏'].strokeRegions[0].segments,s=>Array.from(s)),[[-200,480,-1],[480,700,3],[700,1200,2]]);
 assert.ok(v['候'].ignored.includes(6));assert.equal(v['劃'].splitStrokes[0].boundary,530);
 for(const c of '道世喫羣史決己單片')assert.ok(v[c].splitStrokes.length,c);
});


test('擴展保留已發佈5037字，取碼與標色只允許明訂修正',()=>{
 const crypto=require('node:crypto'),baseline=JSON.parse(read('data/colour-baseline-5037.json'));
 assert.equal(Object.keys(baseline).length,5037);assert.ok(audit.total>8000);
 const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
 for(const [c,e]of Object.entries(baseline)){
  const v=lib.SPLIT_VISUALS[c];assert.equal(v.parts.map(p=>p[1]).join(''),(corrections[c]||e).code,c);
  assert.equal(hash({parts:v.parts.map(p=>[p[1],p[2]]),ignored:v.ignored||[],splits:v.splitStrokes||[],regions:v.strokeRegions||[]}),(corrections[c]||e).geometrySha256,c);
  assert.equal(hash(lib.STROKE_DATA[c]),e.strokesSha256,c);
 }
});
test('重製字形只使用有來源的左右兩部件，筆畫對應完整且無重疊',()=>{
 const data=JSON.parse(read('data/component-compositions.json'));
 assert.equal(Object.keys(data.characters).length,audit.reconstructed.length);
 for(const [c,r]of Object.entries(data.characters)){
  assert.ok(lib.SPLIT_VISUALS[c],c);assert.match(r.dictionary.decomposition,/^⿰..$/u,c);
  assert.equal(r.components.length,2,c);assert.equal(r.dictionary.matches.length,r.graphics.strokes.length,c);
  for(const part of r.components)assert.ok(source.graphics[part.character],c+part.character);
  assert.deepEqual(Array.from(lib.STROKE_DATA[c]),r.graphics.strokes,c);
  const [a,b]=r.components.map(x=>x.bounds);
  assert.ok(r.dictionary.decomposition[0]==='⿰'?a[2]<b[0]:a[1]>b[3],c);
 }
});


test('便與運縮碼時，同一筆畫中未取的中段保持灰色，俺的中碼仍有可見區域',()=>{
 for(const [c,code]of [['便','omlk'],['運','ybjj']]){
  const v=lib.SPLIT_VISUALS[c];assert.equal(v.parts.map(p=>p[1]).join(''),code,c);
  assert.ok(v.strokeRegions.some(r=>r.segments.some((segment,i)=>segment[2]===-1&&i>0&&i<r.segments.length-1)),c);
 }
 const visual=lib.SPLIT_VISUALS['俺'];assert.equal(visual.parts.map(p=>p[1]).join(''),'oklu');
 const atoms=audit.characters['俺'];assert.ok(atoms.find(a=>a.key==='l').regions.every(r=>r[2]>r[1]));
});


test('一萬字擴展保留已發佈8212字，取碼與標色只允許明訂修正',()=>{
 const crypto=require('node:crypto'),baseline=JSON.parse(read('data/colour-baseline-8212.json'));
 assert.equal(Object.keys(baseline).length,8212);assert.equal(audit.total,10009);
 const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
 for(const [c,e]of Object.entries(baseline)){
  const v=lib.SPLIT_VISUALS[c];assert.equal(v.parts.map(p=>p[1]).join(''),(corrections[c]||e).code,c);
  assert.equal(hash({parts:v.parts.map(p=>[p[1],p[2]]),ignored:v.ignored||[],splits:v.splitStrokes||[],regions:v.strokeRegions||[]}),(corrections[c]||e).geometrySha256,c);
  assert.equal(hash(lib.STROKE_DATA[c]),e.strokesSha256,c);
 }
});
test('足旁、羊部與戠的參考取形可用於跟路跑、議儀、識職熾等常用字',()=>{
 for(const [c,code]of Object.entries({跟:'rmav',路:'rmher',跑:'rmpru',議:'yrtgi',儀:'otgi',源:'emhf',願:'mfmbc',親:'ydbuu',程:'hdrhg',接:'qytv',識:'yryia',職:'sjyia',熾:'fyia'})){
  assert.equal(lib.SPLIT_VISUALS[c].parts.map(p=>p[1]).join(''),code,c);
 }
 for(const c of '跟路跑'){
  const atom=audit.characters[c].find(a=>a.component==='足'&&a.key==='m');
  assert.equal(atom.variant,'7',c);assert.deepEqual(Array.from(atom.regions[0]),[6,-200,1200],c);
 }
 for(const c of '識職熾'){
  const atoms=audit.characters[c].filter(a=>a.component==='戠');
  assert.equal(atoms.map(a=>a.key).join(''),'yia',c);assert.ok(atoms.every(a=>a.variant==='12'),c);
  assert.equal(atoms.at(-1).regions.length,4,c);
 }
 assert.equal(lib.SPLIT_VISUALS['足'].parts.map(p=>p[1]).join(''),'ryo');
 assert.equal(lib.SPLIT_VISUALS['羊'].parts.map(p=>p[1]).join(''),'tq');
});

test('十月二十三日參考：欞取底橫，曲內廿外田，氐省豎提，東的中豎分三段',()=>{
 const v=lib.SPLIT_VISUALS;
 assert.equal(lib.CODE_TABLES['5']['欞'],'dmbm');assert.deepEqual(Array.from(v['欞'].parts[3][2]),[27]);
 assert.deepEqual(Array.from(v['曲'].parts[0][2]),[2,3,4]);assert.deepEqual(Array.from(v['曲'].parts[1][2]),[0,1,5]);
 assert.deepEqual(Array.from(v['禮'].parts[2][2]),[6,7,8]);assert.deepEqual(Array.from(v['禮'].parts[3][2]),[4,5,9]);
 assert.deepEqual(Array.from(v['梁'].parts[1][2]),[6]);assert.deepEqual(Array.from(v['氏'].parts[1][2]),[1]);
 assert.deepEqual(Array.from(v['氐'].ignored),[1]);assert.deepEqual(Array.from(v['氐'].parts[1][2]),[2,3]);
 assert.equal(v['禮'].splitStrokes.find(s=>s.stroke===1).above,-1);
 for(const [c,code] of Object.entries({東:'dw',凍:'imdw',棟:'ddw',腖:'bdw',陳:'nldw',鶇:'dwhaf'})){
  assert.equal(v[c].parts.map(p=>p[1]).join(''),code,c);
  const regions=v[c].strokeRegions;assert.ok(regions?.length,c);
  const segment=regions.find(s=>s.segments.length===3).segments;
  assert.equal(segment[0][2],segment[2][2],c);assert.notEqual(segment[0][2],segment[1][2],c);
 }
 for(const c of '低底抵牴詆砥柢'){
  const part=audit.characters[c].find(a=>a.component==='氐'&&a.key==='p');assert.equal(part.regions.length,2,c);
 }
});

test('第二批九字的主碼、取形及省略區同步符合用戶參考圖',()=>{
 const expected={贏:'yrbbn',函:'nue',盒:'omrt',兔:'nui',面:'mwyl',鬼:'hi',冤:'bnui',卑:'hhj',非:'lmyyy'};
 for(const [c,code]of Object.entries(expected)){
  assert.equal(lib.CODE_TABLES['5'][c],code,c);assert.equal(lib.visualFor(c,'5').parts.map(p=>p[1]).join(''),code,c);
  assert.equal(lib.visualFor(c,'3').parts.map(p=>p[1]).join(''),code,c);
  assert.ok(source.standalone_templates[c].reference,c);
 }
 const v=lib.SPLIT_VISUALS;
 assert.deepEqual(Array.from(v['贏'].parts[3][2]),[10,11,12,13,14]);assert.deepEqual(Array.from(v['贏'].parts[4][2]),[18]);
 assert.deepEqual(Array.from(v['函'].parts[1][2]),[6,7]);assert.deepEqual(Array.from(v['函'].parts[2][2]),[1,2,3,4,5]);
 assert.deepEqual(Array.from(v['盒'].ignored),[6,7]);assert.deepEqual(Array.from(v['兔'].ignored),[2,3,4,5]);
 assert.deepEqual(Array.from(v['面'].parts[2][2]),[4,6]);assert.deepEqual(Array.from(v['面'].ignored),[7]);
 assert.deepEqual(Array.from(v['鬼'].parts[1][2]),[7,8]);assert.deepEqual(Array.from(v['冤'].parts[2][2]),[8]);
 assert.deepEqual(Array.from(v['卑'].parts[1][2]),[5]);assert.equal(v['卑'].splitStrokes,undefined);
 assert.deepEqual(Array.from(v['非'].strokeRegions[0].segments,r=>Array.from(r)),[[-200,350,4],[350,530,3],[530,1200,2]]);
 // 獨立字修正不將三代取碼套用到仍沿用五代碼的複合字。
 for(const [c,code]of Object.entries({碑:'mrhwj',魂:'mihui'}))assert.equal(v[c].parts.map(p=>p[1]).join(''),code,c);
});
