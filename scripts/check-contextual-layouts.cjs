const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),records=JSON.parse(fs.readFileSync(path.join(root,'data/component-compositions.json'))).characters;
const chars=Object.keys(JSON.parse(fs.readFileSync(path.join(root,'data/colour-corrections-20261027-context.json'))).characters);
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:1040,height:1500},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('http://contextual.test/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'dist/倉頡小島試玩.html'),'utf8')}));await p.goto('http://contextual.test/');
 const all=await p.evaluate(chars=>{let steps=0;for(const char of chars){start('colour',{char});animateSplit();stopDemo();const v=splitVisual(char);for(let i=0;i<v.parts.length;i++){showDemoStep(i);if(!document.querySelector('#split-animation .active-stroke'))throw Error(char+' invisible step '+i);steps++}showDemoStep(-1);for(const el of document.querySelectorAll('#split-animation [data-stroke-index]')){if(el.getAttribute('d')!==STROKE_DATA[char][Number(el.dataset.strokeIndex)])throw Error(char+' source contour mismatch')}}close();return {characters:chars.length,steps}},chars);
 const spec=Object.entries(records).map(([char,r])=>({char,left:r.components[0].donor.strokeIndices.length}));const collisions=[];
 for(let start=0;start<spec.length;start+=200){
  collisions.push(...await p.evaluate(spec=>{
   const make=()=>{const c=document.createElement('canvas');c.width=c.height=256;return c.getContext('2d',{willReadFrequently:true})},a=make(),b=make(),out=[];
   for(const{char,left}of spec){
    for(const[ctx,from,to]of[[a,0,left],[b,left,STROKE_DATA[char].length]]){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,256,256);ctx.setTransform(.25,0,0,-.25,0,225);for(let i=from;i<to;i++)ctx.fill(new Path2D(STROKE_DATA[char][i]))}
    const aa=a.getImageData(0,0,256,256).data,bb=b.getImageData(0,0,256,256).data;let n=0;for(let i=3;i<aa.length;i+=4)if(aa[i]>240&&bb[i]>240)n++;if(n>2)out.push({char,pixels:n});
   }return out;
  },spec.slice(start,start+200)));
 }
 assert.deepEqual(collisions,[],'Distinct side forms must not obscure each other');
 await p.evaluate(()=>{
  const cases=[...'屻釙哋孖吅幵鏤噉偺儐崁篛綑綞縑繅闋闐迆邐颺鷥'],board=document.createElement('section');board.id='contextual-review';board.style='position:absolute;inset:0 auto auto 0;width:1020px;z-index:999999;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;background:#edf2f8;padding:12px';
  for(const c of cases){const card=document.createElement('article');card.style='text-align:center;background:white;padding:8px';card.innerHTML=`<b>${c} · ${CODE_TABLES[currentVersion][c].toUpperCase()}</b>`+colourThumb(c);card.querySelector('svg').style='width:220px;height:220px';board.append(card)}document.body.append(board);
 });
 fs.mkdirSync(path.join(root,'dist/colour-review'),{recursive:true});await p.locator('#contextual-review').screenshot({path:path.join(root,'dist/colour-review/contextual-layouts.png')});
 assert.deepEqual(errors,[]);const report={pass:true,...all,nonOverlappingSideForms:spec.length,collisions,errors};fs.writeFileSync(path.join(root,'dist/colour-review/contextual-audit.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
