let portableSourceHtml=null;
function validateReference(data){return data&&typeof data.data==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(data.data)&&Number.isFinite(data.width)&&Number.isFinite(data.height)&&Math.abs(data.width/data.height-2048/901)<0.08}
try{const embedded=document.getElementById('embedded-reference');const saved=embedded?JSON.parse(embedded.textContent):JSON.parse(localStorage.getItem('cangjie-reference-image')||'null');if(validateReference(saved))referenceImage=saved}catch{}
function refreshReferenceViews(){
 document.querySelectorAll('[data-aux-form]').forEach(button=>{const form=auxiliaryForm(button.dataset.auxForm);button.innerHTML=auxiliarySvg(form)+`<small>${form.id.toUpperCase()}</small>`});
 document.querySelectorAll('.reference-import').forEach(panel=>panel.outerHTML=referenceControls());
}
async function readReferenceFile(file){
 if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('請選擇 PNG、JPG 或 WebP 圖檔。');
 if(file.size>8*1024*1024)throw Error('請使用 8 MB 以下的參考圖。');
 const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('未能讀取圖檔。'));reader.readAsDataURL(file)});
 const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('圖檔無法開啟。'));img.src=data});
 const next={data,width:image.naturalWidth,height:image.naturalHeight,name:file.name};if(!validateReference(next))throw Error('這份圖的比例與 cj-table-kll.png 不符，請選擇未裁切的完整原圖。');
 referenceImage=next;let retained=true;try{localStorage.setItem('cangjie-reference-image',JSON.stringify(next))}catch{retained=false}
 refreshReferenceViews();document.querySelectorAll('.reference-status').forEach(status=>status.textContent=retained?'原圖已載入並保存在此瀏覽器。字形直接取自原圖；可下載內嵌版本。':'原圖已載入本次頁面。瀏覽器儲存空間不足，請下載內嵌版本保留原圖。');
}
async function downloadWithReference(){
 if(!referenceImage||!portableSourceHtml)return;
 let portableReference=referenceImage;
 if(!referenceImage.data.startsWith('data:')){
  try{const response=await fetch(referenceImage.data);if(!response.ok)throw Error('原圖載入失敗');const blob=await response.blob();const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('原圖讀取失敗'));reader.readAsDataURL(blob)});portableReference={...referenceImage,data}}catch(error){document.querySelectorAll('.reference-status').forEach(s=>s.textContent='匯出失敗：'+error.message);return}
 }
 const saved=JSON.stringify(portableReference).replace(/</g,'\\u003c');
 const snapshot=new DOMParser().parseFromString(portableSourceHtml,'text/html');snapshot.getElementById('embedded-reference')?.remove();let html=snapshot.documentElement.outerHTML;
 if(/<script[^>]+src=/.test(html)){
  try{
   const doc=new DOMParser().parseFromString(html,'text/html');
   await Promise.all([...doc.querySelectorAll('script[src]')].map(async script=>{const response=await fetch(script.getAttribute('src'));if(!response.ok)throw Error('無法讀取程式');script.textContent=(await response.text()).replaceAll('</script','<'+String.fromCharCode(92)+'/script');script.removeAttribute('src')}));
   await Promise.all([...doc.querySelectorAll('link[rel="stylesheet"]')].map(async link=>{const response=await fetch(link.getAttribute('href'));if(!response.ok)throw Error('無法讀取樣式');const style=doc.createElement('style');style.textContent=(await response.text()).replace(/^@import[^\n]*\n/gm,'');link.replaceWith(style)}));
   html=doc.documentElement.outerHTML;
  }catch(error){document.querySelectorAll('.reference-status').forEach(status=>status.textContent='匯出失敗：'+error.message+'。原圖仍保留在本頁。');return}
 }
 html=html.replace(/<script(?:\s|>)/,match=>`<script id="embedded-reference" type="application/json">${saved}<\/script>${match}`);
 const link=document.createElement('a');const url=URL.createObjectURL(new Blob(['<!doctype html>\n'+html],{type:'text/html;charset=utf-8'}));link.href=url;link.download='倉頡小島-原圖版.html';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.addEventListener('change',async event=>{if(!event.target.matches('[data-reference-file]'))return;const panel=event.target.closest('.reference-import');try{panel.querySelector('.reference-status').textContent='正在讀取原圖…';await readReferenceFile(event.target.files[0])}catch(error){panel.querySelector('.reference-status').textContent=error.message}});
document.addEventListener('click',event=>{if(event.target.closest('[data-reset-reference]')){referenceImage=BUILTIN_REFERENCE;try{localStorage.removeItem('cangjie-reference-image')}catch{}refreshReferenceViews()}if(event.target.closest('[data-export-reference]'))downloadWithReference()});
// A clean initial snapshot avoids serializing a live chart with the image repeated in every cell.
window.addEventListener('DOMContentLoaded',()=>{portableSourceHtml=document.documentElement.outerHTML});
