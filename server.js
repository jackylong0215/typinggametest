const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'site');
http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);return res.end('Bad request')}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()||/\.(br|gz)$/.test(file)){res.writeHead(404);return res.end('Not found')}
 const type={'.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.html':'text/html; charset=utf-8','.json':'application/json; charset=utf-8'}[path.extname(file)]||'application/octet-stream';
 res.setHeader('Content-Type',type);res.setHeader('Vary','Accept-Encoding');res.setHeader('Cache-Control',/\.[a-f0-9]{12}\./.test(file)?'public, max-age=31536000, immutable':'no-cache');res.setHeader('X-Content-Type-Options','nosniff');
 const accept=req.headers['accept-encoding']||'';const encoding=/\bbr\b/.test(accept)&&fs.existsSync(file+'.br')?'br':/\bgzip\b/.test(accept)&&fs.existsSync(file+'.gz')?'gzip':null;const selected=encoding?file+(encoding==='br'?'.br':'.gz'):file;if(encoding)res.setHeader('Content-Encoding',encoding);res.setHeader('Content-Length',fs.statSync(selected).size);if(req.method==='HEAD')return res.end();fs.createReadStream(selected).on('error',()=>res.destroy()).pipe(res);
}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Cangjie Island running on port '+(process.env.PORT||3000)));
