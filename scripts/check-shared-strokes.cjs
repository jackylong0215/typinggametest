const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:1100,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('http://shared.test/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.resolve(__dirname,'../dist/倉頡小島試玩.html'),'utf8')}));await p.goto('http://shared.test/');
 const result=await p.evaluate(async()=>{
  const cases=[['東',0,500,450],['米',1,500,700],['倉',2],['粉',1],['棟',1],['束',0],['果',1],['未',1],['末',0],['朱',2],['耒',1],['裹',2]],results=[];
  const board=document.createElement('section');board.id='shared-review';board.style='position:fixed;inset:0;z-index:999999;background:white;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:18px;overflow:auto';
  for(const[char,step,x,y]of cases){start('colour',{char});animateSplit();stopDemo();showDemoStep(step);const svg=document.querySelector('#split-animation svg').cloneNode(true);svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.style='width:250px;height:250px';const v=splitVisual(char),g=v.sharedStrokeGuides[0];
   const base=[...svg.querySelectorAll(`[data-stroke-index="${g.stroke}"]`)].find(n=>!n.dataset.sharedStroke);if(base.hasAttribute('clip-path'))throw Error(char+' base was clipped');
   const guide=svg.querySelector('[data-shared-stroke]');if(Number.isFinite(g.lo)&&!guide.hasAttribute('clip-path'))throw Error(char+' shared range missing');
   let pixel;if(x!==undefined){const img=new Image();img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(svg))));await img.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,1024,1024);pixel='#'+Array.from(ctx.getImageData(x,900-y,1,1).data).slice(0,3).map(n=>n.toString(16).padStart(2,'0')).join('');if(pixel!==(v.colours||PART_COLOURS)[step])throw Error(char+' broken stem pixel '+pixel)}
   const card=document.createElement('article');card.style='text-align:center';card.innerHTML=`<h2>${char} · 第 ${step+1} 步</h2>`;card.append(svg);board.append(card);results.push({char,step,pixel,continuous:true});close();
  }
  document.body.append(board);
  const savedRandom=Math.random;Math.random=()=>.75;
  // Actual typing and RPG selectors must use the weighted picker.
  difficulty=4;await start('speed',{char:'日'});round=4;challengePool=[{char:'漢'},{char:'汉'}];item={char:'日'};await next();if(item.char!=='漢')throw Error('typing picker is not weighted');close();
  startRpg();rpgState.stage=21;rpgPool=[{char:'漢',code:CODE_TABLES[currentVersion]['漢']},{char:'汉',code:CODE_TABLES[currentVersion]['汉']}];rpgQuestion={char:'日'};rpgNextQuestion();if(rpgQuestion.char!=='漢')throw Error('RPG picker is not weighted');rpgClose();
  Math.random=savedRandom;
  return {cases:results,typingWeighted:true,rpgWeighted:true};
 });
 fs.mkdirSync(path.resolve(__dirname,'../dist/colour-review'),{recursive:true});await p.locator('#shared-review').screenshot({path:path.resolve(__dirname,'../dist/colour-review/shared-strokes.png')});assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,...result,errors},null,2));
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
