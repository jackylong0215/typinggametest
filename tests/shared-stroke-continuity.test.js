const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const read=p=>fs.readFileSync(require('path').join(__dirname,'..',p),'utf8');
const x=vm.createContext({});vm.runInContext(['code-data.js','stroke-data.js','learning.js','extra-colours.js','colour-library.js'].map(read).join('\n')+';globalThis.d={v:SPLIT_VISUALS,s:STROKE_DATA}',x);
const source=JSON.parse(read('data/colour-source.json')),audit=JSON.parse(read('data/colour-audit.json')).characters;
test('東柬、米及其他木形共241字：完整木豎不再裁斷，虛線僅限實際共用區',()=>{
 const revision=source.shared_stroke_continuity_20261026;
 assert.equal(revision.characters.length,20);assert.equal(revision.riceCharacters.length,114);assert.equal(revision.riceWoodOnlyCharacters.length,13);assert.equal(revision.otherWoodCharacters.length,95);
 const changed=JSON.parse(read('data/colour-corrections-20261026-shared.json')).characters;assert.equal(Object.keys(changed).length,241);
 for(const char of [...revision.characters,...revision.riceCharacters]){
  const v=x.d.v[char],g=v.sharedStrokeGuides[0];assert.ok(g.lo<g.hi,char);
  assert.equal(v.parts[g.part][1],revision.characters.includes(char)?'w':'f',char);
  assert.ok(v.parts.some(p=>p[1]==='d'&&p[2].includes(g.stroke)),char);
  assert.ok(!v.splitStrokes?.some(r=>r.stroke===g.stroke),char);
  assert.ok(!v.strokeRegions?.some(r=>r.stroke===g.stroke),char);
  if(audit[char]){const owners=audit[char].filter(a=>a.regions.some(r=>r[0]===g.stroke));assert.equal(owners.length,1,char);assert.equal(owners[0].key,'d',char);assert.ok(owners[0].regions.some(r=>r[0]===g.stroke&&r[1]===-200&&r[2]===1200),char)}
 }
});
test('未末朱果耒等同類木形中豎完整，虛線保留另一字根的共用部分',()=>{
 const rev=source.shared_stroke_continuity_20261026;
 for(const char of [...rev.riceWoodOnlyCharacters,...rev.otherWoodCharacters]){
  const v=x.d.v[char];
  for(const atom of audit[char].filter(a=>a.key==='d'&&['米','未','末','朱','果','耒','裹'].includes(a.component)))for(const r of atom.regions){assert.equal(r[1],-200,char);assert.equal(r[2],1200,char)}
  for(const g of v.sharedStrokeGuides||[]){assert.ok(g.lo<g.hi,char);assert.ok(v.parts.some(p=>p[1]==='d'&&p[2].includes(g.stroke)),char)}
 }
});

test('倉日形左側補共用長撇虛線；原長撇完整留灰，其餘根取碼維持原樣',()=>{
 const v=x.d.v['倉'],g=v.sharedStrokeGuides[0];assert.equal(g.stroke,6);assert.equal(g.part,2);assert.equal(v.parts[2][1],'a');assert.ok(v.ignored.includes(6));assert.equal(g.lo,270);assert.equal(g.hi,530);
 assert.deepEqual(JSON.parse(JSON.stringify(g.median)),source.graphics['倉'].medians[6]);
 assert.deepEqual(Array.from(v.parts,p=>p[1]),['o','i','a','r']);
});
