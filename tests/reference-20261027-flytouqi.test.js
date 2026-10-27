const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),source=JSON.parse(read('data/colour-source.json')),c=vm.createContext({});
vm.runInContext(['code-data.js','stroke-data.js','learning.js','extra-colours.js','colour-library.js'].map(read).join('\n')+';let currentVersion="5";'+read('app.js').slice(read('app.js').indexOf('function glyphClipRect'),read('app.js').indexOf('function glyphPaths'))+';globalThis.d={v:SPLIT_VISUALS,s:STROKE_DATA,c:CODE_TABLES,clip:glyphSplitRegion};',c);
test('飛：橫段完整取廿，下方彎鉤留灰，L形裁切完整覆蓋且不重疊',()=>{
 const v=c.d.v['飛'],split=v.splitStrokes[0];assert.equal(v.parts.map(p=>p[1]).join(''),'nohto');assert.equal(split.stroke,5);assert.equal(split.axis,'x');assert.equal(split.ceiling,433);assert.equal(split.boundary,573);assert.equal(split.above,-1);assert.equal(split.below,3);
 const rects=s=>Array.from(s.matchAll(/<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/g),m=>m.slice(1).map(Number)),upper=rects(c.d.clip(split,true)),lower=rects(c.d.clip(split,false)),inside=(rs,x,y)=>rs.some(([a,b,w,h])=>x>=a&&x<a+w&&y>=b&&y<b+h);
 for(let x=-190;x<1200;x+=31)for(let y=-190;y<1200;y+=29)assert.equal(Number(inside(upper,x,y))+Number(inside(lower,x,y)),1,`${x},${y}`);
 for(const[x,y]of[[500,400],[600,480]])assert.ok(inside(lower,x,y));for(const[x,y]of[[600,300],[850,50]])assert.ok(inside(upper,x,y));assert.deepEqual(Array.from(c.d.s['飛']),source.graphics['飛'].strokes);
});
test('透的尸保留橫段；起的口真正閉合，走部及兩代字碼保留',()=>{
 const t=c.d.v['透'];assert.equal(t.splitStrokes[0].boundary,350);assert.equal(t.splitStrokes[0].above,-1);assert.equal(t.splitStrokes[0].below,3);
 const g=source.graphics['起'],before=source.semantic_reference_original_graphics['起'];assert.deepEqual(g.strokes.slice(0,7),before.strokes.slice(0,7));assert.ok(g.medians[9][0][1]>=g.medians[7][0][1]-20,'口形左邊接上頂橫');assert.ok(g.medians[9][0][1]>g.medians[8][0][1]+100);assert.equal(c.d.v['起'].splitStrokes[0].boundary,462.87);
 for(const[ch,code]of Object.entries({飛:'nohto',透:'yhds',起:'goru'}))for(const ver of['3','5'])assert.equal(c.d.c[ver][ch],code);
});
test('飛的新裁切界線可經模板與區域證明往返，空白選用座標不會被誤算',()=>{
 const code="import importlib.util,json;sp=importlib.util.spec_from_file_location('b','scripts/build-colour-library.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);a=m.from_template('飛',m.SOURCE['templates']['飛']);print(json.dumps(m.compile_visual('飛',a)['splitStrokes']))";
 const splits=JSON.parse(execFileSync('python3',['-c',code],{cwd:root,encoding:'utf8'}));assert.equal(splits[0].ceiling,433);assert.equal(splits[0].axis,'x');assert.equal(splits[0].boundary,573);assert.equal(splits[0].floor,undefined);assert.equal(splits[0].xLimit,undefined);
});
