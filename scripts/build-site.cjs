const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),out=path.join(root,'site'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
// A clean build matches an actual Pages deployment; stale files must not hide failures.
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(path.join(out,'colours'),{recursive:true});
const c=vm.createContext({});vm.runInContext(['code-data.js','stroke-data.js','learning.js','extra-colours.js','colour-library.js'].map(read).join('\n')+'\nglobalThis.data={STROKE_DATA,SPLIT_VISUALS,COLOUR_ORDER,COLOUR_REFERENCE_CHARS,COLOUR_CORRECTION_CHARS,USER_CODE_CORRECTIONS}',c);const d=c.data;
const base=vm.createContext({});vm.runInContext(['learning.js','extra-colours.js'].map(read).join('\n')+';globalThis.chars=Object.keys(SPLIT_VISUALS)',base);const existing=new Set(base.chars);
const hash=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,12);
function write(file,text){const p=path.join(out,file);fs.writeFileSync(p,text);if(/\.(js|css|html|json)$/.test(file)){fs.writeFileSync(p+'.gz',zlib.gzipSync(text,{level:9}));fs.writeFileSync(p+'.br',zlib.brotliCompressSync(text))}return file}
function asset(name,text){return write(name.replace(/(\.[^.]+)$/,'.'+hash(text)+'$1'),text)}
const chunkFor={};const unloaded=d.COLOUR_ORDER.filter(c=>!existing.has(c));
for(let start=0;start<unloaded.length;start+=48){const chars=unloaded.slice(start,start+48),strokes={},visuals={};for(const char of chars){strokes[char]=d.STROKE_DATA[char];visuals[char]=d.SPLIT_VISUALS[char]}const file=asset('colours/group-'+String(start/48+1).padStart(2,'0')+'.json',JSON.stringify({strokes,visuals}));for(const char of chars)chunkFor[char]=file}
// Initial examples normally need no request, but can also recover missing visual data.
const initial=d.COLOUR_ORDER.filter(c=>existing.has(c)),initialData={strokes:{},visuals:{}};
for(const char of initial){initialData.strokes[char]=d.STROKE_DATA[char];initialData.visuals[char]=d.SPLIT_VISUALS[char]}
const initialFile=asset('colours/initial.json',JSON.stringify(initialData));for(const char of initial)chunkFor[char]=initialFile;
const colourCodes=Object.fromEntries(d.COLOUR_ORDER.map(c=>[c,d.SPLIT_VISUALS[c].parts.map(p=>p[1]).join('')]));
const revision=hash(JSON.stringify({files:chunkFor,codes:colourCodes}));
write('colour-manifest.json',JSON.stringify({revision,files:chunkFor,codes:colourCodes}));
let metadata='const USER_CODE_CORRECTIONS='+JSON.stringify(d.USER_CODE_CORRECTIONS)+';for(const [v,c]of Object.entries(USER_CODE_CORRECTIONS))Object.assign(CODE_TABLES[v],c);\n';for(const key of ['COLOUR_ORDER','COLOUR_REFERENCE_CHARS','COLOUR_CORRECTION_CHARS'])metadata+='const '+key+'='+JSON.stringify(d[key])+';\n';metadata+='const COLOUR_CODES='+JSON.stringify(Object.fromEntries(d.COLOUR_ORDER.map(c=>[c,d.SPLIT_VISUALS[c].parts.map(p=>p[1]).join('')])))+';\nconst COLOUR_CHUNKS='+JSON.stringify(chunkFor)+';\n';
metadata+='const COLOUR_BUILD='+JSON.stringify(revision)+';\n'+read('colour-loader.js');
fs.mkdirSync(path.join(out,'assets'),{recursive:true});
const reference=fs.readFileSync(path.join(root,'assets/cj-table-kll.png'));const referenceAsset=asset('assets/cj-table-kll.png',reference);
const loader=asset('colour-index.js',metadata);let html=read('index.html');let initialBytes=Buffer.byteLength(html);
html=html.replace(/<script src="\/([^\"]+)"><\/script>/g,(_,name)=>{const file=name==='colour-library.js'?loader:asset(name,read(name).replace('./assets/cj-table-kll.png','./'+referenceAsset));initialBytes+=fs.statSync(path.join(out,file)).size;return `<script defer src="./${file}"></script>`});
const css=asset('style.css',read('style.css'));initialBytes+=fs.statSync(path.join(out,css)).size;html=html.replace('href="/style.css"',`href="./${css}"`).replace('class="brand" href="/"','class="brand" href="./"').replace('</footer>','<a href="./licenses.html">資料來源與授權</a></footer>');write('index.html',html);
const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');write('licenses.html','<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>資料來源與授權</title><a href="./">返回倉頡小島</a><pre style="white-space:pre-wrap">'+escape(['THIRD_PARTY_NOTICES.md','licenses/ARPHICPL.TXT','licenses/MAKE_ME_A_HANZI.txt','licenses/LGPL-3.0.txt','licenses/GPL-3.0.txt','licenses/GPL-2.0.txt','licenses/CJKVI_IDS.md','licenses/WORDFREQ-NOTICE.md','licenses/OPENCC-LICENSE.txt'].map(read).join('\n\n'))+'</pre></html>');write('.nojekyll','');
const manifest={glyphs:d.COLOUR_ORDER.length,chunks:new Set(Object.values(chunkFor)).size,initialBytes,initialGzipBytes:[...html.matchAll(/(?:src|href)="\.\/([^\"]+\.(?:js|css))"/g)].reduce((n,m)=>n+fs.statSync(path.join(out,m[1]+'.gz')).size,Buffer.byteLength(zlib.gzipSync(html))),largestChunkBytes:Math.max(...Object.values(chunkFor).map(f=>fs.statSync(path.join(out,f)).size))};fs.writeFileSync(path.join(out,'build-info.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest,null,2));
