const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{({chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage();
 await page.route('http://reference-check.test/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.resolve(__dirname,'../dist/倉頡小島試玩.html'),'utf8')}));
 await page.goto('http://reference-check.test/');
 const result=await page.evaluate(async()=>{
  const holder=document.createElement('div');holder.innerHTML=colourThumb('毛');
  const svg=holder.firstElementChild;svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
  const img=new Image();img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(svg))));await img.decode();
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,1024,1024);
  const at=(x,y)=>{const p=ctx.getImageData(x,900-y,1,1).data;return '#'+Array.from(p).slice(0,3).map(n=>n.toString(16).padStart(2,'0')).join('')};
  return {stem:at(435,400),hookTip:at(930,290),expectedStem:PART_COLOURS[1],expectedHook:PART_COLOURS[2]};
 });
 assert.equal(result.stem,result.expectedStem);assert.equal(result.hookTip,result.expectedHook);
 await browser.close();console.log('PASS 毛的中豎與右側上鉤尖實際像素分屬手、山',result);
})().catch(e=>{console.error(e);process.exit(1)});
