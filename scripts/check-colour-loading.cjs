const fs=require('fs'),path=require('path'),assert=require('assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{({chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))}
const base=process.env.COLOUR_TEST_URL||'http://127.0.0.1:3012/',out=path.resolve(__dirname,'../dist/colour-loading'),site=path.resolve(__dirname,'../site');
const complete=p=>p.waitForFunction(()=>document.getElementById('colour-results')?.getAttribute('aria-busy')==='false'&&!document.querySelector('.glyph-placeholder'));
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const errors=[],checks=[];
async function page(){const p=await browser.newPage({viewport:{width:1280,height:1000},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));await p.goto(base);return p}
async function secondPage(p){await p.evaluate(()=>{colourPage=1;showPage('colours')})}
try{
 // The reported failure: another file finishes after an early rejection.
 {
  const p=await page(),files=await p.evaluate(()=>[...new Set(COLOUR_ORDER.slice(48,96).filter(c=>!splitVisual(c)).map(c=>COLOUR_CHUNKS[c]).filter(Boolean))]);assert.ok(files.length>1);const failed=files[0];let attempts=0;
  await p.route('**/colours/*.json',async r=>{if(r.request().url().endsWith(failed)){attempts++;await r.fulfill({status:503,body:'Temporary failure'})}else{await new Promise(x=>setTimeout(x,100));await r.continue()}});
  await secondPage(p);await p.getByRole('button',{name:'重試未載入字形'}).waitFor();
  const state=await p.evaluate(()=>({ready:[...document.querySelectorAll('[data-colour-char]')].filter(x=>!!splitVisual(x.dataset.colourChar)).length,drawn:document.querySelectorAll('[data-colour-char] svg').length,placeholders:document.querySelectorAll('.glyph-placeholder').length,parent:document.querySelector('#colour-load-status button')?.parentElement.id}));
  assert.equal(state.ready,state.drawn);assert.ok(state.drawn>6);assert.ok(state.placeholders>0);assert.equal(attempts,3);assert.equal(state.parent,'colour-load-status');await p.screenshot({path:path.join(out,'partial-failure.png'),fullPage:true});await p.setViewportSize({width:390,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const retryBox=await p.getByRole('button',{name:'重試未載入字形'}).boundingBox();assert.ok(retryBox.width>100&&retryBox.height<70);await p.screenshot({path:path.join(out,'partial-failure-mobile.png'),fullPage:true});await p.setViewportSize({width:1280,height:1000});
  await p.unroute('**/colours/*.json');await p.getByRole('button',{name:'重試未載入字形'}).click();await complete(p);assert.equal(await p.locator('[data-colour-char] svg').count(),48);checks.push({partialFailure:state,manualRetry:true});await p.close();
 }
 {
  const p=await page();let failed=false,attempts=0;
  await p.route('**/colours/*.json',r=>{attempts++;if(!failed){failed=true;return r.abort()}return r.continue()});await secondPage(p);await complete(p);assert.equal(await p.getByRole('button',{name:'重試未載入字形'}).count(),0);assert.ok(attempts>=3);checks.push({transientFailureAutoRetry:true});await p.close();
 }
 {
  const p=await page();let expired=0,manifests=0;
  await p.route('**/colours/expired-*.json',r=>{expired++;return r.fulfill({status:404,body:'Deleted by deployment'})});
  await p.route('**/colour-manifest.json?*',async r=>{manifests++;const data=JSON.parse(fs.readFileSync(path.join(site,'colour-manifest.json')));data.revision='new-release';await r.fulfill({json:data})});
  await p.evaluate(()=>{for(const c of COLOUR_ORDER.slice(48,96))if(COLOUR_CHUNKS[c])COLOUR_CHUNKS[c]='colours/expired-'+COLOUR_CHUNKS[c].split('/').pop();colourPage=1;showPage('colours')});await complete(p);assert.ok(expired>0);assert.equal(manifests,1);assert.equal(await p.locator('[data-colour-char] svg').count(),48);checks.push({staleDeploymentRecovered:true,manifestRequests:manifests});await p.close();
 }
 {
  const p=await page();let malformed=false;
  await p.route('**/colours/*.json',r=>{if(!malformed){malformed=true;return r.fulfill({status:200,contentType:'application/json',body:'{"strokes":'})}return r.continue()});await secondPage(p);await complete(p);assert.equal(await p.locator('[data-colour-char] svg').count(),48);checks.push({truncatedDataRecovered:true});await p.close();
 }
 {
  const p=await page();await p.route('**/colours/*.json',r=>r.fulfill({status:503,body:'offline'}));await secondPage(p);await p.getByRole('button',{name:'重試未載入字形'}).waitFor();await p.unroute('**/colours/*.json');await p.evaluate(()=>window.dispatchEvent(new Event('online')));await complete(p);assert.equal(await p.locator('#colour-page-number').textContent(),'2 / 215');checks.push({onlineAutoRetry:true});await p.close();
 }
 {
  const p=await page();await p.evaluate(()=>{delete SPLIT_VISUALS['明'];colourSearch='明';showPage('colours')});await complete(p);assert.equal(await p.locator('[data-colour-char="明"] svg').count(),1);checks.push({initialExamplePartialDataRecovered:true});await p.close();
 }
 {
  const p=await page();let resolve;const intercepted=new Promise(r=>resolve=r);await p.route('**/colours/*.json',r=>resolve(r));await p.evaluate(()=>showPage('colours'));const held=await intercepted;await p.locator('[data-page="explore"]').click();const file=path.join(site,new URL(held.request().url()).pathname.replace(/^\//,''));await held.fulfill({path:file,contentType:'application/json'});await p.unroute('**/colours/*.json');await p.waitForTimeout(200);assert.ok(await p.locator('#home').isVisible());assert.ok(await p.locator('#extra').isHidden());assert.equal(await p.evaluate(()=>colourRetryHandler===null),true);await p.evaluate(()=>window.dispatchEvent(new Event('online')));checks.push({lateResponseDoesNotReopenPage:true});await p.close();
 }
 assert.deepEqual(errors,[]);const report={pass:true,checks,errors};fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
