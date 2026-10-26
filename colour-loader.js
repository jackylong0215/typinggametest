// Included in the generated colour index. Data files never execute JavaScript.
const colourAssetBase=new URL('.',document.currentScript.src);
const COLOUR_LOAD_POLICY={concurrency:4,attempts:3,timeoutMs:15000,retryDelays:[250,1000]};
const colourRequests=new Map(),colourLoadQueue=[],colourOutdatedCharacters=new Set();
let colourActiveLoads=0,colourManifestRequest=null,colourManifestFreshUntil=0;

function colourDataReady(char){
 const visual=SPLIT_VISUALS[char];
 return !!STROKE_DATA[char]&&!!visual&&visual.parts.map(p=>p[1]).join('')===COLOUR_CODES[char];
}
function colourLoadError(message,status=0){const error=new Error(message);error.status=status;return error}
function colourDataUrl(file){
 const url=new URL(file,colourAssetBase);
 if(url.origin!==colourAssetBase.origin||!url.pathname.startsWith(colourAssetBase.pathname+'colours/')||!url.pathname.endsWith('.json'))throw colourLoadError('字形檔案位置不正確');
 return url;
}
function pumpColourLoads(){
 while(colourLoadQueue.length&&colourActiveLoads<COLOUR_LOAD_POLICY.concurrency){
  const job=colourLoadQueue.shift();colourActiveLoads++;
  Promise.resolve().then(job.run).then(job.resolve,job.reject).finally(()=>{colourActiveLoads--;pumpColourLoads()});
 }
}
function queueColourLoad(run){return new Promise((resolve,reject)=>{colourLoadQueue.push({run,resolve,reject});pumpColourLoads()})}
async function fetchColourJson(url,cache){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),COLOUR_LOAD_POLICY.timeoutMs);
 try{
  const response=await fetch(url,{signal:controller.signal,cache});
  if(!response.ok)throw colourLoadError('字形載入失敗',response.status);
  try{return await response.json()}catch(error){if(error.name==='AbortError')throw error;throw colourLoadError('字形資料未完整載入',422)}
 }finally{clearTimeout(timer)}
}
function applyColourData(data){
 if(!data||!data.strokes||!data.visuals||typeof data.strokes!=='object'||typeof data.visuals!=='object')throw colourLoadError('字形資料未完整載入',422);
 const accepted=[];
 for(const [char,visual]of Object.entries(data.visuals)){
  if(!Object.prototype.hasOwnProperty.call(COLOUR_CODES,char))continue;
  const strokes=data.strokes[char];
  if(!Array.isArray(strokes)||!strokes.length||!strokes.every(s=>typeof s==='string'&&s.length)||!visual||!Array.isArray(visual.parts)||!visual.parts.length||!visual.parts.every(p=>Array.isArray(p)&&typeof p[1]==='string'&&p[1].length===1&&Array.isArray(p[2])&&p[2].every(i=>Number.isInteger(i)&&i>=0&&i<strokes.length)))throw colourLoadError('字形資料未完整載入',422);
  // An open practice session keeps its answer codes until the page is refreshed.
  if(visual.parts.map(p=>p[1]).join('')===COLOUR_CODES[char])accepted.push([char,strokes,visual]);
 }
 if(!accepted.length)throw colourLoadError('字形資料未完整載入',422);
 for(const [char,strokes,visual]of accepted){STROKE_DATA[char]=strokes;SPLIT_VISUALS[char]=visual}
}
function requestColourFile(file,attempt){
 if(colourRequests.has(file))return colourRequests.get(file);
 const promise=queueColourLoad(async()=>applyColourData(await fetchColourJson(colourDataUrl(file),attempt?'reload':'default')));
 colourRequests.set(file,promise);
 const remove=()=>{if(colourRequests.get(file)===promise)colourRequests.delete(file)};
 promise.then(remove,remove);
 return promise;
}
function refreshColourManifest(){
 if(colourManifestRequest)return colourManifestRequest;
 if(Date.now()<colourManifestFreshUntil)return Promise.resolve();
 colourManifestRequest=(async()=>{
  const url=new URL('colour-manifest.json',colourAssetBase);url.searchParams.set('refresh',Date.now());
  const data=await fetchColourJson(url,'no-store');
  if(!data||typeof data.revision!=='string'||!data.files||!data.codes||typeof data.files!=='object'||typeof data.codes!=='object')throw colourLoadError('字形清單未完整載入',422);
  const updates=[];
  for(const char of Object.keys(COLOUR_CHUNKS)){
   if(data.codes[char]===COLOUR_CODES[char]&&typeof data.files[char]==='string'){
    colourDataUrl(data.files[char]);updates.push([char,data.files[char]]);
   }
  }
  if(!updates.length)throw colourLoadError('字形清單未完整載入',422);
  const compatible=new Set(updates.map(([char])=>char));
  for(const char of Object.keys(COLOUR_CHUNKS)){if(compatible.has(char))colourOutdatedCharacters.delete(char);else colourOutdatedCharacters.add(char)}
  for(const [char,file]of updates)COLOUR_CHUNKS[char]=file;
  colourManifestFreshUntil=Date.now()+(data.revision===COLOUR_BUILD?2000:30000);
 })();
 const request=colourManifestRequest;
 const remove=()=>{if(colourManifestRequest===request)colourManifestRequest=null};request.then(remove,remove);
 return request;
}
async function loadColourCharacters(chars,{onProgress}={}){
 const targets=[...new Set(chars)].filter(c=>COLOUR_CHUNKS[c]);
 let manifestChecked=false,lastError;
 for(let attempt=0;attempt<COLOUR_LOAD_POLICY.attempts;attempt++){
  const missing=targets.filter(c=>!colourDataReady(c));
  if(!missing.length)return;
  const groups=new Map();
  for(const char of missing){
   if(colourOutdatedCharacters.has(char))continue;
   const file=COLOUR_CHUNKS[char];if(!groups.has(file))groups.set(file,[]);groups.get(file).push(char);
  }
  const results=await Promise.allSettled([...groups].map(async([file,requested])=>{
   try{
    await requestColourFile(file,attempt);
    if(requested.some(c=>!colourDataReady(c)))throw colourLoadError('字形資料未完整載入',422);
   }finally{if(typeof onProgress==='function')onProgress()}
  }));
  if(targets.every(colourDataReady))return;
  const failures=results.filter(r=>r.status==='rejected').map(r=>r.reason);
  lastError=failures[0]||lastError;
  if(!manifestChecked&&failures.some(e=>[404,410,422].includes(e.status))){
   manifestChecked=true;
   const previous=missing.map(c=>COLOUR_CHUNKS[c]);
   try{
    await refreshColourManifest();
    // A corrected release path gets a fresh attempt even if the old path timed out first.
    if(missing.some((c,i)=>!colourOutdatedCharacters.has(c)&&COLOUR_CHUNKS[c]!==previous[i])){attempt--;continue}
   }catch(error){lastError=error}
  }
  if(missing.every(c=>colourDataReady(c)||colourOutdatedCharacters.has(c)))break;
  if(attempt+1<COLOUR_LOAD_POLICY.attempts)await new Promise(resolve=>setTimeout(resolve,COLOUR_LOAD_POLICY.retryDelays[Math.min(attempt,COLOUR_LOAD_POLICY.retryDelays.length-1)]||0));
 }
 const missing=targets.filter(c=>!colourDataReady(c));
 if(!missing.length)return;
 const error=colourLoadError('部分字形未能載入',lastError?.status);error.characters=missing;error.needsRefresh=missing.some(c=>colourOutdatedCharacters.has(c));throw error;
}
