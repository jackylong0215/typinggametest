const fs=require('fs'),path=require('path');
let chromium;try{({chromium}=require('playwright'))}catch{({chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
(async()=>{
 const root=path.join(__dirname,'..'),folder=path.join(root,'dist','reference-glyphs');fs.mkdirSync(folder,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1100,height:1000},reducedMotion:'reduce'});
 await page.route('http://reference-export.test/',route=>route.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'dist','倉頡小島試玩.html'),'utf8')}));await page.goto('http://reference-export.test/');
 const chars=await page.evaluate(()=>{
  const board=document.createElement('section');board.id='export-reference-cards';board.style='position:absolute;top:0;left:0;width:1020px;z-index:99999;background:#f5f8ff;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:24px';
  board.innerHTML=COLOUR_REFERENCE_CHARS.map(c=>`<article data-reference="${c}" style="text-align:center;border:1px solid #dfe5ed;border-radius:18px;padding:18px;background:white"><div style="width:240px;height:240px;margin:auto">${colourThumb(c)}</div><div style="font-size:24px;font-weight:bold;color:#344a76">${c} · ${CODE_TABLES[currentVersion][c].toUpperCase()}</div><div style="display:flex;justify-content:center;gap:8px;margin-top:10px">${splitVisual(c).parts.map((p,i)=>componentChips(p[1],PART_COLOURS[i])).join('')}</div></article>`).join('');board.querySelectorAll('svg').forEach(svg=>svg.style='width:240px;height:240px');document.body.append(board);
  return COLOUR_REFERENCE_CHARS.map(char=>({char,code:CODE_TABLES[currentVersion][char]}));
 });
 for(const {char} of chars)await page.locator(`[data-reference="${char}"]`).screenshot({path:path.join(folder,char+'.png')});
 fs.writeFileSync(path.join(folder,'字碼與配色.txt'),'倉頡小島：新參考字（五代）\n\n按完整取碼順序使用藍、橙、綠、紫、紅；未取碼的筆畫保留灰色。\n參考截圖中的背景及配色不直接使用，所有字以本遊戲的原字 SVG 格式重建。\n\n'+chars.map(c=>c.char+'　'+c.code.toUpperCase()).join('\n')+'\n\n巔使用參考圖的十頭真；另附厮的繁體廝。\n');
 await browser.close();console.log('Exported '+chars.length+' reference cards to '+folder);
})().catch(error=>{console.error(error);process.exit(1)});
