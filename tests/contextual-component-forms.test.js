const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const read=f=>JSON.parse(fs.readFileSync(path.resolve(__dirname,'..',f),'utf8'));
const source=read('data/colour-source.json'),composed=read('data/component-compositions.json').characters,moe=source.moe_completion_20261026.compositionPlans;
const records={...composed,...Object.fromEntries(Object.entries(moe).filter(([,p])=>p.method==='contextual_components'))};
const extent=ms=>{const points=ms.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]};
test('2331字偏旁來源逐筆可追溯；4362個偏旁取自原字同一結構位置',()=>{
 assert.equal(Object.keys(records).length,2331);let native=0;
 for(const[c,r]of Object.entries(records)){
  const op=(r.dictionary||source.dictionary[c]).decomposition[0];
  for(let side=0;side<2;side++){
   const part=r.components[side],d=part.donor,g=source[d.sourceVariant||'graphics'][d.character],ids=d.strokeIndices;
   assert.ok(!records[d.character],c+' donor must be original');assert.equal(new Set(ids).size,ids.length,c);assert.ok(ids.every(i=>g.strokes[i]&&g.medians[i]),c);
   if(part.native){
    native++;const dict=source.dictionary[d.character],decomp=[...dict.decomposition];assert.equal(decomp.length,3,c);assert.equal(decomp[0],op,c);
    assert.ok([part.character,{金:'釒',玉:'王'}[part.character]].includes(decomp[side+1]),c+part.character);
    assert.deepEqual([...ids].sort((a,b)=>a-b),dict.matches.flatMap((m,i)=>m&&m[0]===side?[i]:[]),c);
   }
  }
 }
 assert.equal(native,4362);
});
test('原生偏旁保留自然長寬比例，不再把獨立字橫壓成左右字格',()=>{
 for(const[c,r]of Object.entries(records)){
  let offset=0;const graphic=r.graphics||source.graphics[c];
  for(const part of r.components){
   const d=part.donor,ix=d.strokeIndices,base=source[d.sourceVariant||'graphics'][d.character];
   if(part.native){
    const omitted=new Set(source.semantic_contour_corrections_20261027?.[c]?.targetStrokeIndices||[]),keep=ix.map((_,i)=>i).filter(i=>!omitted.has(offset+i));
    if(!keep.length){const plan=source.semantic_contour_corrections_20261027[c];assert.equal(plan.sourceStrokeIndices.length,ix.length,c);offset+=ix.length;continue}
    const a=extent(keep.map(i=>base.medians[ix[i]])),b=extent(keep.map(i=>graphic.medians[offset+i]));
    const sx=(b[2]-b[0])/(a[2]-a[0]),sy=(b[3]-b[1])/(a[3]-a[1]);assert.ok(Math.abs(sx-sy)<0.0001,c+part.character);
   }
   offset+=ix.length;
  }
  assert.equal(offset,graphic.strokes.length,c);
 }
});
test('牜的中豎與提按實際筆畫對應，不沿用獨體牛的第三、四筆順序',()=>{
 const r=composed['牤'],p=r.components[0];assert.deepEqual(p.strokeCorrespondence.canonicalToDonor,[0,1,3,2]);
 const m=r.graphics.medians[3];assert.ok(Math.abs(m.at(-1)[1]-m[0][1])>Math.abs(m.at(-1)[0]-m[0][0]));
});
