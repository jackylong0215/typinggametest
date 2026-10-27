const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),chars=Object.keys(JSON.parse(fs.readFileSync(path.join(root,'data/colour-corrections-20261027-semantic.json'))).characters);
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:1150,height:1100},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('http://semantic.test/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'dist/倉頡小島試玩.html'),'utf8')}));await p.goto('http://semantic.test/');
 const result=await p.evaluate(chars=>{
  const board=document.createElement('section');board.id='semantic-review';board.style='position:absolute;inset:0 auto auto 0;width:1110px;z-index:999999;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;background:#edf2f8;padding:12px';let steps=0;
  for(const c of chars){start('colour',{char:c});animateSplit();stopDemo();const v=splitVisual(c);for(let i=0;i<v.parts.length;i++){showDemoStep(i);if(!document.querySelector('#split-animation .active-stroke'))throw Error(c+' missing step '+i);steps++}showDemoStep(-1);
   const card=document.createElement('article');card.style='text-align:center;background:white;padding:10px';card.innerHTML=`<b>${c} · ${item.code.toUpperCase()}</b>`+colourThumb(c);card.querySelector('svg').style='width:285px;height:285px';board.append(card);
   if(c==='鎮'){const expected=[8,9];for(const i of expected){const path=document.querySelector(`#split-animation [data-stroke-index="${i}"]`);if(path.dataset.partIndex!=='1')throw Error('鎮十頭標色歸屬錯誤')}for(const i of[14,15])if(document.querySelector(`#split-animation [data-stroke-index="${i}"]`).getAttribute('fill')!=='#d5dbd0')throw Error('鎮省略橫畫需留灰')}
  }close();document.body.append(board);return {characters:chars.length,steps};
 },chars);
 fs.mkdirSync(path.join(root,'dist/colour-review'),{recursive:true});await p.locator('#semantic-review').screenshot({path:path.join(root,'dist/colour-review/semantic-shapes.png')});assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,...result,errors},null,2));
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
