const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const read=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8'),source=JSON.parse(read('data/colour-source.json')),records=JSON.parse(read('data/component-compositions.json')).characters,audit=JSON.parse(read('data/colour-audit.json')).characters;
const ctx=vm.createContext({});vm.runInContext(['code-data.js','stroke-data.js','learning.js','extra-colours.js','colour-library.js'].map(read).join('\n')+';globalThis.d={v:SPLIT_VISUALS,s:STROKE_DATA}',ctx);const lib=ctx.d;
const graphic=c=>source.graphics[c]||records[c].graphics;
const direction=m=>{const xs=m.map(p=>p[0]),ys=m.map(p=>p[1]),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys);return w>2*h?'h':h>2*w?'v':'bent'};
function crosses(a,b){for(let i=1;i<a.length;i++)for(let j=1;j<b.length;j++){const[p,q,r,s]=[a[i-1],a[i],b[j-1],b[j]],u=[q[0]-p[0],q[1]-p[1]],v=[s[0]-r[0],s[1]-r[1]],d=u[0]*v[1]-u[1]*v[0];if(!d)continue;const z=[r[0]-p[0],r[1]-p[1]],t=(z[0]*v[1]-z[1]*v[0])/d,k=(z[0]*u[1]-z[1]*u[0])/d;if(t>=0&&t<=1&&k>=0&&k<=1)return true}return false}
test('22個真部件取J均有可見且相交的橫、直十頭',()=>{
 const heads=source.semantic_shape_review_20261027.trueHeads;assert.equal(heads.length,22);
 for(const{character:c,indices}of heads){const g=graphic(c),ms=indices.map(i=>g.medians[i]);assert.deepEqual(ms.map(direction).sort(),['h','v'],c);assert.ok(crosses(...ms),c);assert.deepEqual(Array.from(lib.s[c]),g.strokes,c)}
});
test('鎮依參考取CJBC：十頭、目上部、八分色；目末內橫及底橫留灰',()=>{
 const v=lib.v['鎮'];assert.equal(v.parts.map(p=>p[1]).join(''),'cjbc');assert.deepEqual(Array.from(v.parts[1][2]),[8,9]);assert.deepEqual(Array.from(v.parts[2][2]),[10,11,12,13]);assert.deepEqual(Array.from(v.parts[3][2]),[16,17]);assert.deepEqual(Array.from(v.ignored),[14,15]);
 for(const[c,p]of Object.entries(source.semantic_contour_corrections_20261027)){const before=source.semantic_reference_original_graphics[c],after=graphic(c),changed=new Set(p.targetStrokeIndices);assert.equal(direction(after.medians[Math.min(...p.targetStrokeIndices)+7]),'h',c+' straight base');for(let i=0;i<before.strokes.length;i++)if(!changed.has(i))assert.equal(after.strokes[i],before.strokes[i],c+' body '+i)}
});
test('蠹的J、冖、厂及口採實際對應筆畫，十的中豎不再引用橫畫',()=>{
 const v=lib.v['蠹'];assert.deepEqual(Array.from(v.parts,p=>Array.from(p[2])),[[0,2],[4,6],[8,10],[7,9,11],[23]]);
 const split=v.splitStrokes[0];assert.equal(split.stroke,2);assert.equal(split.boundary,700);assert.equal(split.above,0);assert.equal(split.below,-1);assert.equal(direction(graphic('蠹').medians[2]),'v');assert.ok([1,3,5].every(i=>v.ignored.includes(i)));
});
test('顯式標示十形的364組部件逐組核對，卂的連寫竪撇保留交點',()=>{
 let count=0;for(const[c,atoms]of Object.entries(audit))for(const p of atoms){
  if(p.key!=='j'||!(p.component==='十'||p.component==='真'||/上十|頂十|底十|末十|十形|十字/.test(p.name)))continue;
  const ix=[...new Set(p.regions.map(r=>r[0]))].sort((a,b)=>a-b);if(ix.length!==2)continue;count++;
  const ms=ix.map(i=>graphic(c).medians[i]);assert.ok(crosses(...ms),c+' visible ten intersection');if(c==='蝨')continue;assert.deepEqual(ms.map(direction).sort(),['h','v'],c);
 }assert.equal(count,364);
});
