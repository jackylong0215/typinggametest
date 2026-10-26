const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../colour-loader.js'),'utf8');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const payload=(codes)=>({strokes:Object.fromEntries(Object.keys(codes).map(c=>[c,['M0 0L10 10']])),visuals:Object.fromEntries(Object.entries(codes).map(([c,code])=>[c,{parts:[...code].map(k=>['取形',k,[0]])}]))});
const ok=data=>({ok:true,status:200,json:async()=>data});const failure=status=>({ok:false,status});
function loader({files={甲:'colours/a.json'},codes={甲:'m'},fetch,strokes={},visuals={}}){
 const context=vm.createContext({URL,AbortController,setTimeout,clearTimeout,document:{currentScript:{src:'https://island.test/typinggametest/colour-index.old.js'}},fetch:(url,options)=>fetch(new URL(url),options),STROKE_DATA:strokes,SPLIT_VISUALS:visuals,COLOUR_CHUNKS:{...files},COLOUR_CODES:{...codes},COLOUR_BUILD:'old'});
 vm.runInContext(source+';COLOUR_LOAD_POLICY.retryDelays=[0,0];COLOUR_LOAD_POLICY.timeoutMs=500;globalThis.api={load:loadColourCharacters,policy:COLOUR_LOAD_POLICY,ready:colourDataReady};',context);
 return {context,...context.api};
}
test('loads both visual and stroke data, including recovery from a partial previous load',async()=>{
 let count=0;const x=loader({strokes:{甲:['partial']},fetch:async()=>{count++;return ok(payload({甲:'m'}))}});
 await x.load(['甲','甲']);assert.equal(count,1);assert.equal(x.ready('甲'),true);assert.deepEqual(Array.from(x.context.STROKE_DATA.甲),['M0 0L10 10']);
 await x.load(['甲']);assert.equal(count,1);
});
test('retries transient failures automatically and shares concurrent requests',async()=>{
 let count=0;const x=loader({fetch:async()=>++count<3?failure(503):ok(payload({甲:'m'}))});
 await Promise.all([x.load(['甲']),x.load(['甲'])]);assert.equal(count,3);assert.equal(x.ready('甲'),true);
});
test('one failed group does not prevent progress or cause successful groups to reload',async()=>{
 const counts={a:0,b:0},events=[];const x=loader({files:{甲:'colours/a.json',乙:'colours/b.json'},codes:{甲:'m',乙:'n'},fetch:async url=>{const a=url.pathname.endsWith('a.json');counts[a?'a':'b']++;return a?ok(payload({甲:'m'})):failure(503)}});
 await assert.rejects(x.load(['甲','乙'],{onProgress:()=>events.push(x.ready('甲'))}),e=>{assert.deepEqual(Array.from(e.characters),['乙']);assert.equal(e.needsRefresh,false);return true});
 assert.deepEqual(counts,{a:1,b:3});assert.ok(events.includes(true));assert.equal(x.ready('甲'),true);
});
test('limits requests across separate consumers and deduplicates overlapping files',async()=>{
 const chars=[...'甲乙丙丁戊己庚辛'],codes=Object.fromEntries(chars.map(c=>[c,'m'])),files=Object.fromEntries(chars.map((c,i)=>[c,'colours/'+i+'.json']));let active=0,max=0,count=0;
 const x=loader({codes,files,fetch:async url=>{active++;max=Math.max(max,active);count++;await sleep(10);active--;const i=Number(url.pathname.match(/(\d+)\.json$/)[1]);return ok(payload({[chars[i]]:'m'}))}});
 await Promise.all([x.load(chars.slice(0,5)),x.load(chars.slice(3)),x.load(chars)]);assert.equal(count,8);assert.equal(max,4);assert.ok(chars.every(x.ready));
});
test('times out a stalled request, releases its slot and retries',async()=>{
 let count=0,aborted=false;const x=loader({fetch:async(url,{signal})=>{if(++count>1)return ok(payload({甲:'m'}));return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;const e=new Error('aborted');e.name='AbortError';reject(e)}))}});x.policy.timeoutMs=20;
 await x.load(['甲']);assert.equal(aborted,true);assert.equal(count,2);assert.equal(x.ready('甲'),true);
});
test('an old release path recovers from the latest uncached manifest under a Pages subpath',async()=>{
 const seen=[];const x=loader({fetch:async(url,options)=>{seen.push([url.pathname,options.cache]);if(url.pathname.endsWith('colour-manifest.json')){assert.ok(url.searchParams.has('refresh'));return ok({revision:'new',files:{甲:'colours/new.json'},codes:{甲:'m'}})}return url.pathname.endsWith('/new.json')?ok(payload({甲:'m'})):failure(404)}});
 await x.load(['甲']);assert.deepEqual(seen,[['/typinggametest/colours/a.json','default'],['/typinggametest/colour-manifest.json','no-store'],['/typinggametest/colours/new.json','default']]);assert.equal(x.ready('甲'),true);
});
test('refreshes stale paths even when 404 is only returned on the final attempt',async()=>{
 let old=0;const x=loader({fetch:async url=>url.pathname.endsWith('colour-manifest.json')?ok({revision:'new',files:{甲:'colours/new.json'},codes:{甲:'m'}}):url.pathname.endsWith('/new.json')?ok(payload({甲:'m'})):failure(++old<3?503:404)});
 await x.load(['甲']);assert.equal(old,3);assert.equal(x.ready('甲'),true);
});
test('validates complete data before assigning it and recovers from malformed content',async()=>{
 let count=0;const x=loader({fetch:async url=>{if(url.pathname.endsWith('colour-manifest.json'))return ok({revision:'old',files:{甲:'colours/a.json'},codes:{甲:'m'}});if(++count===1)return ok({strokes:{甲:['incomplete']},visuals:{}});assert.equal(x.context.STROKE_DATA.甲,undefined);return ok(payload({甲:'m'}))}});
 await x.load(['甲']);assert.equal(count,2);assert.equal(x.ready('甲'),true);
});
test('a failed request is not cached forever; a later manual or online retry succeeds',async()=>{
 let fail=true,count=0;const x=loader({fetch:async()=>{count++;return fail?failure(503):ok(payload({甲:'m'}))}});
 await assert.rejects(x.load(['甲']));assert.equal(count,3);fail=false;await x.load(['甲']);assert.equal(count,4);assert.equal(x.ready('甲'),true);
});
test('recovers compatible characters without silently changing an open question answer',async()=>{
 const x=loader({files:{甲:'colours/old.json',乙:'colours/old.json'},codes:{甲:'m',乙:'n'},fetch:async url=>url.pathname.endsWith('colour-manifest.json')?ok({revision:'new',files:{甲:'colours/new.json',乙:'colours/new.json'},codes:{甲:'q',乙:'n'}}):url.pathname.endsWith('/new.json')?ok(payload({甲:'q',乙:'n'})):failure(404)});
 await assert.rejects(x.load(['甲','乙']),e=>{assert.equal(e.needsRefresh,true);assert.deepEqual(Array.from(e.characters),['甲']);return true});
 assert.equal(x.context.COLOUR_CODES.甲,'m');assert.equal(x.context.SPLIT_VISUALS.甲,undefined);assert.equal(x.ready('乙'),true);
});
test('concurrent stale requests share a single manifest refresh',async()=>{
 let manifest=0;const x=loader({files:{甲:'colours/a.json',乙:'colours/b.json'},codes:{甲:'m',乙:'n'},fetch:async url=>{if(url.pathname.endsWith('colour-manifest.json')){manifest++;await sleep(10);return ok({revision:'new',files:{甲:'colours/new.json',乙:'colours/new.json'},codes:{甲:'m',乙:'n'}})}return url.pathname.endsWith('/new.json')?ok(payload({甲:'m',乙:'n'})):failure(404)}});
 await Promise.all([x.load(['甲']),x.load(['乙'])]);assert.equal(manifest,1);
});
