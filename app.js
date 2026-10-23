const ROOTS = {q:'手',w:'田',e:'水',r:'口',t:'廿',y:'卜',u:'山',i:'戈',o:'人',p:'心',a:'日',s:'尸',d:'木',f:'火',g:'土',h:'竹',j:'十',k:'大',l:'中',z:'重',x:'難',c:'金',v:'女',b:'月',n:'弓',m:'一'};
const WORDS = [{char:'明',code:'ab'},{char:'林',code:'dd'},{char:'好',code:'vnd'},{char:'休',code:'od'},{char:'早',code:'aj'},{char:'旦',code:'am'},{char:'本',code:'dm'},{char:'杏',code:'dr'},{char:'呆',code:'rd'},{char:'森',code:'ddd'},{char:'昌',code:'aa'},{char:'炎',code:'ff'},{char:'男',code:'wks'},{char:'字',code:'jnd'},{char:'安',code:'jv'},{char:'尖',code:'fk'},{char:'品',code:'rrr'},{char:'晶',code:'aaa'},{char:'朋',code:'bb'},{char:'相',code:'dbu'}];
WORDS.push(...BEGINNER_WORDS);
const TITLES={colour:'彩色拆字教室',punct:'標點符號學堂',special:'難字形與特殊規則',roots:'字根森林',split:'字根拆字工房',rpg:'倉頡勇者傳',rain:'生存挑戰',book:'錯字加強',speed:'極速航線'};
const $=id=>document.getElementById(id);
let saved;try{saved=JSON.parse(localStorage.getItem('cangjie-island')||'{}')}catch{saved={}}let progress={stars:0,rounds:0,best:0,history:[],...saved};
progress.notebook=normalizePunctuationNotebook(progress.notebook||{},PUNCTUATION);progress.records ||= {};
let difficulty=1;try{difficulty=Math.min(4,Math.max(1,Number(localStorage.getItem('cangjie-difficulty'))||1))}catch{}
let gameDifficulty=1,lives=0,challengePool=[],roundMistakes={};
let currentVersion;try{currentVersion=localStorage.getItem('cangjie-version')==='3'?'3':'5'}catch{currentVersion='5'}
function versionName(){return currentVersion==='5'?'倉頡五代':'倉頡三代'}
function questionForVersion(word){
 const code=CODE_TABLES[currentVersion][word.char];if(!code)throw new Error('碼表缺少題目：'+word.char);
 let note=word.note;if(word.char==='鬼')note='特殊字形：頂撇取竹，右下厶取戈（HI）；中間及彎鉤不另取碼。';
 return {...word,code,note};
}
let mode,item,score,combo,correct,attempts,remaining,tick,fall,active=false,lastCode='',round=0,wrongStreak=0,paused=false,practiceKeys=null,phase='idle',advanceTimer=null,advanceRemaining=0,advanceDeadline=0,demoTimer=null,demoStep=0;
function persist(){try{localStorage.setItem('cangjie-island',JSON.stringify(progress))}catch{}$('total-stars').textContent=progress.stars;if($('book-count'))$('book-count').textContent=Object.keys(progress.notebook).length;if($('dash-stars'))$('dash-stars').textContent=progress.stars;if($('dash-book'))$('dash-book').textContent=Object.keys(progress.notebook).length;if($('dash-best'))$('dash-best').textContent=Math.max(0,...Object.entries(progress.records).filter(([k])=>k.startsWith('rpg:')).map(([,v])=>v))+' 分'}
persist();
function keyboard(){
 $('keyboard').innerHTML=['qwertyuiop','asdfghjkl','zxcvbnm'].map(row=>'<div class="key-row">'+[...row].map(k=>`<button type="button" class="key" data-key="${k}" aria-label="${k.toUpperCase()} ${ROOTS[k]}">${k.toUpperCase()}<b>${ROOTS[k]}</b></button>`).join('')+'</div>').join('')+'<div class="key-row keyboard-controls"><button type="button" class="key action-key" data-action="delete" aria-label="刪除上一碼">⌫ 刪除</button><button type="button" class="key action-key space-key" data-action="submit">空白鍵 · 完成輸入</button></div>';
}
function bounce(element,cls){element.classList.remove(cls);void element.offsetWidth;element.classList.add(cls)}
function flashKey(key){const button=$('keyboard').querySelector(`[data-key="${key}"]`);if(button)bounce(button,'key-pressed')}
function symbolQuestion(){return mode==='punct'||item?.kind==='punct'}
function codeName(k){return symbolQuestion()?k.toUpperCase():ROOTS[k]}
function displayCode(code){return symbolQuestion()?[...code].map(k=>`<span class="symbol-code">${k.toUpperCase()}</span>`).join(''):chips(code)}
function stopDemo(){clearInterval(demoTimer);demoTimer=null;$('keyboard').querySelectorAll('.demo-lit').forEach(k=>k.classList.remove('demo-lit'))}
function renderCodeProgress(){
 const answer=$('answer').value.toLowerCase();let prefix=0;while(prefix<answer.length&&answer[prefix]===item.code[prefix])prefix++;
 $('code-progress').innerHTML=[...item.code].map((k,i)=>{const typed=answer[i];const good=i<prefix;return `<span class="code-slot ${good?'code-correct':typed?'code-wrong':''}"><small>第 ${i+1} 碼</small><b>${good?codeName(k):typed?'?':'·'}</b><span>${typed?typed.toUpperCase():'＿'} ${good?'✓':typed?'×':''}</span></span>`}).join('');
 if(!answer){$('input-status').textContent=mode==='punct'?'依序輸入符號碼，最後按空白鍵。':'逐碼輸入，正確的字根會亮起；最後按空白鍵。';$('input-status').className='';return}
 if(prefix===answer.length&&answer.length<=item.code.length){$('input-status').textContent=answer===item.code?`✓ 全部 ${prefix} 碼正確！按空白鍵完成「${item.char}」。`:`✓ 第 ${prefix} 碼「${codeName(item.code[prefix-1])}」正確！還有 ${item.code.length-prefix} 碼。`;$('input-status').className='status-correct';bounce($('code-progress'),'code-pop')}
 else{$('input-status').textContent=`第 ${prefix+1} 碼再找找看，可按 ⌫ 刪除修改。`;$('input-status').className='status-wrong'}
}
const ROOT_COLOURS={sky:'#278548',earth:'#1686b8',body:'#c24f43',shape:'#8552b6',special:'#9b7508'};
const PART_COLOURS=['#1686b8','#ed8a26','#69a72c','#9a5ba9','#cf526d'];
function componentChips(code,colour){return [...code].map(k=>`<span class="root-chip component-chip" style="color:${colour};background:${colour}15;border-color:${colour}55">${ROOTS[k]}<small>${k.toUpperCase()}</small></span>`).join('')}
let glyphRenderCount=0;
function splitVisual(char){const visual=SPLIT_VISUALS[char];return visual&&visual.parts.map(p=>p[1]).join('')===CODE_TABLES[currentVersion][char]?visual:undefined}
function colourCharacters(){return COLOUR_ORDER.filter(c=>typeof COLOUR_CODES!=='undefined'?COLOUR_CODES[c]===CODE_TABLES[currentVersion][c]:STROKE_DATA[c]&&splitVisual(c))}
function questionVisual(){const visual=splitVisual(item.char);return !item.formId&&visual&&visual.parts.map(p=>p[1]).join('')===item.code?visual:undefined}
function glyphClipRect(lo,hi,axis='y'){return axis==='x'?`<rect x="${lo}" y="-200" width="${hi-lo}" height="1400"/>`:`<rect x="-200" y="${lo}" width="1400" height="${hi-lo}"/>`}
function glyphSplitRegion(split,upper){
 if(split.axis==='x'&&Number.isFinite(split.floor))return upper?`<rect x="${split.boundary}" y="${split.floor}" width="${1200-split.boundary}" height="${1200-split.floor}"/><rect x="-200" y="-200" width="1400" height="${split.floor+200}"/>`:`<rect x="-200" y="${split.floor}" width="${split.boundary+200}" height="${1200-split.floor}"/>`;
 return upper?glyphClipRect(split.boundary,1200,split.axis):glyphClipRect(-200,split.boundary,split.axis);
}
function glyphPaths(char,allColoured=false){
 const visual=splitVisual(char),prefix='glyph-region-'+(++glyphRenderCount),colours=visual.colours||PART_COLOURS;
 const fill=part=>allColoured&&part>=0?colours[part%colours.length]:'#d5dbd0';
 return STROKE_DATA[char].map((d,stroke)=>{
  const multiple=visual.strokeRegions?.find(region=>region.stroke===stroke);
  if(multiple)return multiple.segments.map(([lo,hi,part],i)=>{const id=prefix+'-'+stroke+'-'+i;return `<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse">${glyphClipRect(lo,hi,multiple.axis)}</clipPath></defs><path data-stroke-index="${stroke}" data-part-index="${part}" data-stroke-region="${i}" d="${d}" clip-path="url(#${id})" fill="${fill(part)}"/>`}).join('');
  const split=visual.splitStrokes?.find(region=>region.stroke===stroke);
  if(!split){const part=visual.parts.findIndex(p=>p[2].includes(stroke));return `<path data-stroke-index="${stroke}" data-part-index="${part}" d="${d}" fill="${fill(part)}"/>`}
  const topId=prefix+'-'+stroke+'-above',bottomId=prefix+'-'+stroke+'-below';
  return `<defs><clipPath id="${topId}" clipPathUnits="userSpaceOnUse">${glyphSplitRegion(split,true)}</clipPath><clipPath id="${bottomId}" clipPathUnits="userSpaceOnUse">${glyphSplitRegion(split,false)}</clipPath></defs><path data-stroke-index="${stroke}" data-part-index="${split.above}" data-stroke-region="above" data-stroke-axis="${split.axis||'y'}" d="${d}" clip-path="url(#${topId})" fill="${fill(split.above)}"/><path data-stroke-index="${stroke}" data-part-index="${split.below}" data-stroke-region="below" data-stroke-axis="${split.axis||'y'}" d="${d}" clip-path="url(#${bottomId})" fill="${fill(split.below)}"/>`;
 }).join('');
}
function showDemoStep(index){
 const visual=questionVisual();if(!visual)return;
 demoStep=index;
 $('split-animation').querySelectorAll('[data-stroke-index]').forEach(path=>{
  const stroke=Number(path.dataset.strokeIndex);const partIndex=Number(path.dataset.partIndex);const seen=partIndex>=0&&(index===-1||partIndex<=index);const current=partIndex>=0&&(index===-1||partIndex===index);
  path.setAttribute('fill',seen?(visual.colours||PART_COLOURS)[partIndex%(visual.colours||PART_COLOURS).length]:'#d5dbd0');path.setAttribute('opacity',seen&&!current?'0.48':'1');path.classList.toggle('active-stroke',current);
 });
 $('split-animation').querySelectorAll('[data-demo-step]').forEach(button=>{const selected=Number(button.dataset.demoStep)===index;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected))});
 if(index===-1){$('split-animation').querySelector('.split-explanation').innerHTML=`<b>完整字形：${item.char}</b><div class="demo-code">${visual.parts.map((p,i)=>componentChips(p[1],(visual.colours||PART_COLOURS)[i%(visual.colours||PART_COLOURS).length])).join('')}</div><span>每種顏色是一個部件，灰色是保留但不另取碼的筆畫。按步驟查看解說。</span>`;return}
 const [description,code]=visual.parts[index];$('split-animation').querySelector('.split-explanation').innerHTML=`<b>第 ${index+1} 步：${description}</b><div class="demo-code">${componentChips(code,(visual.colours||PART_COLOURS)[index%(visual.colours||PART_COLOURS).length])}</div><span>${index===visual.parts.length-1?`完整取碼：${item.code.toUpperCase()}。`:'字形留在原位，按順序辨認下一個部件。'}</span>`;
 $('keyboard').querySelectorAll('[data-key]').forEach(key=>key.classList.toggle('demo-lit',code.includes(key.dataset.key)));
}
function animateSplit(){
 if(!active||paused)return;
 if(typeof loadColourCharacters==='function'&&!item.formId&&COLOUR_CODES[item.char]===item.code&&!questionVisual()){
  const pending=item;const section=$('split-animation');section.hidden=false;section.querySelector('.split-caption').textContent='正在準備這個字的彩色地圖…';section.querySelector('.split-stage').textContent='';section.querySelector('.split-note').textContent='';
  loadColourCharacters([item.char]).then(()=>{if(active&&item===pending)animateSplit()}).catch(()=>{if(active&&item===pending)section.querySelector('.split-caption').textContent='暫時未能載入，請按「看原字拆解」重試。'});return;
 }
stopDemo();const visual=questionVisual();const strokes=STROKE_DATA[item.char];const section=$('split-animation');section.hidden=false;
 section.querySelector('.split-caption').textContent=symbolQuestion()?`${item.char} · ${item.name||'標點符號'}`:visual?`${item.char} · 原字部件逐步標色 · ${visual.layout}`:`${item.char} · 已核對的取碼順序`;
 if(symbolQuestion()){
  section.querySelector('.split-stage').innerHTML=`<p class="punctuation-sentence">${item.sentence||'依序輸入符號碼，再按空白鍵。'}</p><div class="demo-code">${displayCode(item.code)}</div>`;section.querySelector('.split-note').textContent=item.note+' 此符號碼不按中文字形拆解。';return;
 }
 if(!visual||!strokes){
  section.querySelector('.split-stage').innerHTML=`<div class="demo-code">${chips(item.code)}</div>`;section.querySelector('.split-note').textContent=item.note||'這題暫未提供原字筆畫分組，這裡只列出取碼順序，不模擬部件位置。';return;
 }
 section.querySelector('.split-stage').innerHTML=`<div class="glyph-and-explanation"><svg class="component-glyph" viewBox="0 0 1024 1024" role="img" aria-label="${item.char}：原字部件標色示範"><path class="glyph-grid" d="M512 0V1024M0 512H1024M0 0L1024 1024M1024 0L0 1024"/><g transform="translate(0,900) scale(1,-1)">${glyphPaths(item.char)}</g></svg><div class="split-explanation" aria-live="polite"></div></div><div class="demo-step-controls" role="group" aria-label="選擇拆字步驟">${visual.parts.map(([name,code],i)=>`<button type="button" data-demo-step="${i}" style="--part-colour:${(visual.colours||PART_COLOURS)[i%(visual.colours||PART_COLOURS).length]}" aria-pressed="false">${i+1}. ${[...code].map(k=>ROOTS[k]).join('・')} ${code.toUpperCase()}</button>`).join('')}<button type="button" data-demo-step="-1" aria-pressed="false">全字標色</button><button type="button" data-demo-replay>↻ 重播</button></div>`;
 section.querySelector('.split-note').textContent=visual.explanation||'標色依倉頡取碼順序，不是寫字筆順；部件保持原字的形狀及位置。';showDemoStep(0);
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)demoTimer=setInterval(()=>{if(!active){stopDemo();return}if(paused)return;if(demoStep>=visual.parts.length-1){clearInterval(demoTimer);demoTimer=null;return}showDemoStep(demoStep+1)},1100);
}
$('split-animation').addEventListener('click',event=>{const step=event.target.closest('[data-demo-step]');if(step){stopDemo();showDemoStep(Number(step.dataset.demoStep))}if(event.target.closest('[data-demo-replay]'))animateSplit()});
function knownColourQuestion(question){const code=CODE_TABLES[currentVersion][question.char];return !question.formId&&question.kind!=='punct'&&!!code&&(typeof COLOUR_CODES!=='undefined'?COLOUR_CODES[question.char]===code:SPLIT_VISUALS[question.char]?.parts.map(p=>p[1]).join('')===code)}
function practiceGuidance(){if(mode==='book'&&!Object.values(progress.notebook).some(e=>e.version===currentVersion&&!e.formId&&e.kind!=='punct'))return 'none';return ['split','special','speed','book'].includes(mode)?round<2?'roots':round<4?'colours':'independent':'none'}
let practiceGuideStep=-1,practiceWarmupExample=false;
function paintPracticeGuide(){
 const container=$('practice-guide'),guidance=practiceGuidance(),visual=questionVisual();container.hidden=!!item.formId||!['roots','colours'].includes(guidance);if(!container.hidden&&!visual){container.innerHTML='<p class="rpg-guide-unavailable">本題五色圖暫時未能載入，先用原字練習；可按「看原字拆解」重試。</p>';return}if(container.hidden){container.innerHTML='';return}
 const roots=guidance==='roots';container.innerHTML=`<section class="rpg-colour-guide"><div class="rpg-guide-heading"><b>🌈 ${roots?'五色字根引導':'看圖自己拆'} · 熱身 ${round+1} / 4</b></div>${practiceWarmupExample?'<p class="rpg-guide-rule">先用這個有五色圖的字熱身，之後回到本模式的題目。</p>':''}<div class="rpg-guide-body"><svg class="rpg-colour-glyph" viewBox="0 0 1024 1024" role="img" aria-label="${htmlEscape(item.char)}五色拆字圖"><g transform="translate(0,900) scale(1,-1)">${glyphPaths(item.char,true)}</g></svg><div class="rpg-guide-steps"><span class="rpg-guide-order">觀察形狀 → 按順序找字根</span><div role="group" aria-label="取碼步驟">${visual.parts.map(([description,code],i)=>`<button data-practice-guide-step="${i}" style="--guide-colour:${(visual.colours||PART_COLOURS)[i%(visual.colours||PART_COLOURS).length]}" aria-pressed="false"><i></i>${i+1}</button>`).join('')}<button data-practice-guide-step="-1" aria-pressed="true">全字</button></div><p id="practice-guide-note" role="status">按顏色辨認原字部件，然後依序輸入；需要線索可以點步驟。</p></div></div><p class="rpg-guide-rule">先看五色圖自行找字根，點步驟只突出部件，不列出答案。完成四題熱身後會收起圖片，改為獨立拆字。</p></section>`;practiceGuideStep=-1;
}
function selectPracticeGuide(index){const visual=questionVisual(),container=$('practice-guide');if(!visual||container.hidden)return;if(!$('practice-guide-note'))paintPracticeGuide();practiceGuideStep=index;container.querySelectorAll('[data-part-index]').forEach(path=>{const part=Number(path.dataset.partIndex);path.setAttribute('opacity',index===-1||part===index?'1':part===-1?'.6':'.22')});container.querySelectorAll('[data-practice-guide-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.practiceGuideStep)===index)));$('practice-guide-note').textContent=index===-1?'觀察完整五色圖，再按部件順序輸入。':`第 ${index+1} 個取碼部件已突出。觀察形狀，自行找出對應字根。`}
$('practice-guide').addEventListener('click',event=>{const button=event.target.closest('[data-practice-guide-step]');if(button)selectPracticeGuide(Number(button.dataset.practiceGuideStep))});
async function next(forced){
 clearTimeout(fall);clearTimeout(advanceTimer);stopDemo();advanceRemaining=0;phase='preparing';wrongStreak=0;
 let pool=mode==='colour'?colourCharacters().map(char=>({char,kind:'word'})):mode==='book'?Object.values(progress.notebook).filter(entry=>entry.version===currentVersion):mode==='punct'?PUNCTUATION:mode==='special'?SPECIAL_WORDS:(mode==='roots'||mode==='split'&&round<2&&!forced)?Object.entries(AUXILIARY_FORMS).filter(([k])=>!practiceKeys||practiceKeys.includes(k)).flatMap(([code,forms])=>forms.map(form=>({code,char:form.label,formId:form.id,kind:'root',note:`這個輔助字形屬於「${ROOTS[code]}」字根，對應 ${code.toUpperCase()} 鍵；它不是獨立中文字。`}))):challengePool;
 const guidance=practiceGuidance(),guided=['roots','colours'].includes(guidance);practiceWarmupExample=false;
 if(guided&&!pool.some(w=>w.formId)){const supported=pool.filter(knownColourQuestion);if(supported.length)pool=supported;else{pool=WORDS.filter(knownColourQuestion);practiceWarmupExample=true}if(forced&&!knownColourQuestion(forced))forced=undefined}
 if(!pool.length){finish('cleared');return}
 let choices=pool.filter(w=>(w.formId||(w.kind==='punct'?w.code:w.char))!==(item?.formId||(item?.kind==='punct'?item.code:item?.char)));if(!choices.length)choices=pool;item=forced||choices[Math.floor(Math.random()*choices.length)];if(item.kind==='punct')item={...item,...PUNCTUATION.find(p=>p.code===item.code)};item={...item,kind:item.kind||(mode==='punct'?'punct':item.formId?'root':'word')};if(!item.formId&&item.kind!=='punct')item=questionForVersion(item);lastCode=item.code;
 const pending=item;practiceGuideStep=-1;$('practice-guide').hidden=true;
 if(guided&&typeof loadColourCharacters==='function'&&!questionVisual()){
  $('target').textContent=displayCharacter(item);$('answer').readOnly=true;$('success-card').hidden=true;$('split-animation').hidden=true;$('feedback').textContent='正在準備五色圖，準備好才開始本回合作答。';$('keyboard').querySelectorAll('.key').forEach(k=>k.disabled=true);
  try{await loadColourCharacters([item.char])}catch{}
  if(!active||item!==pending)return;
 }else if(typeof loadColourCharacters==='function'&&!item.formId)loadColourCharacters([item.char]).catch(()=>{});
 if(!active||item!==pending)return;phase='answering';
 $('decomposition').innerHTML=item.formId?`<span class="family-caption">${ROOTS[item.code]}字根家族 · ${AUXILIARY_FORMS[item.code].length} 個字形</span>`:'';
 $('play-split').textContent=symbolQuestion()?'查閱符號用法':'▶ 看原字拆解';$('target').textContent=displayCharacter(item);if(item.formId)$('target').innerHTML=auxiliarySvg(auxiliaryForm(item.formId));$('target').setAttribute('aria-label',item.kind==='punct'?item.name:item.char);$('target').classList.remove('target-success');$('answer').value='';$('answer').readOnly=false;$('success-card').hidden=true;$('split-animation').hidden=true;
 $('hint').textContent=symbolQuestion()?`${item.name||'標點符號'}：${item.note} 原表字根：${item.stroke||''}`:item.formId?`「${item.char}」屬於「${ROOTS[item.code]}」字根家族，找找它的英文字母`:'想一想，這個字可以拆成哪些字根？';$('feedback').textContent='';$('feedback').className='';
 $('keyboard').querySelectorAll('.key').forEach(k=>{k.classList.remove('lit','key-pressed');k.disabled=false});
 $('target').classList.remove('rain-active');renderCodeProgress();paintPracticeGuide();if(practiceGuidance()==='independent'&&round===4)$('hint').textContent='五色熱身完成！現在收起顏色，試試自己辨認部件和取碼。';
 if(mode==='rain'){remaining=DIFFICULTIES[gameDifficulty-1].seconds;updateChallengeStats()}
 $('answer').focus();
}
function updateChallengeStats(){
 $('timer').textContent=remaining;$('lives').textContent='♥'.repeat(Math.max(0,lives))+'♡'.repeat(Math.max(0,DIFFICULTIES[gameDifficulty-1].lives-lives));
 $('survival-bar').style.width=(mode==='rain'?Math.max(0,remaining)/DIFFICULTIES[gameDifficulty-1].seconds*100:100)+'%';
 $('challenge-best').textContent=['rain','speed'].includes(mode)?`本級最高 ${progress.records[recordKey(mode,currentVersion,gameDifficulty)]||0} 分`:'';
}
function start(which,forced,keys=null){
 if(which==='rpg'){startRpg();return}
 if(which==='roots')which='split';
 if((which==='roots'||(which==='book'&&Object.values(progress.notebook).some(e=>e.version===currentVersion&&e.formId)))&&!referenceImage){openLesson('chart');$('lesson-content').querySelector('.reference-import').scrollIntoView({block:'start'});return}
 if(which==='book'&&!Object.values(progress.notebook).some(e=>e.version===currentVersion)){showPage('notebook');return}
 practiceKeys=which==='split'?keys:null;gameDifficulty=difficulty;challengePool=buildChallengePool(CODE_TABLES[currentVersion],gameDifficulty,WORDS);roundMistakes={};
 paused=false;clearTimeout(advanceTimer);clearInterval(tick);clearTimeout(fall);mode=which;score=combo=correct=attempts=round=0;remaining=180;lives=DIFFICULTIES[gameDifficulty-1].lives;active=true;lastCode='';
 $('game-label').textContent=TITLES[mode]+(mode==='punct'?' · 固定符號方案':' · '+versionName());$('score').textContent=0;$('combo').textContent=0;$('timer').textContent=remaining;
 $('timer-wrap').hidden=!['rain','speed'].includes(mode);$('lives-wrap').hidden=mode!=='rain';$('survival-track').hidden=mode!=='rain';$('play-area').hidden=false;$('result').hidden=true;
 $('challenge-level').textContent=['rain','speed','split'].includes(mode)?DIFFICULTIES[gameDifficulty-1].icon+' '+DIFFICULTIES[gameDifficulty-1].name:mode==='book'?'每個錯字答對兩次，就能掌握它':'慢慢觀察，找出字根的秘密';
 $('prompt').textContent=mode==='punct'?'標點小任務 · 完成 10 題':mode==='book'?'錯字加強 · 答對兩次後移出錯字簿':mode==='roots'?'字根小任務 · 完成 10 題':mode==='special'?'特殊規則 · 完成 10 題':mode==='split'?'字根熱身 2 題 → 五色拆字 2 題 → 獨立取碼 6 題':mode==='rain'?`每字 ${DIFFICULTIES[gameDifficulty-1].seconds} 秒，答錯或超時扣一顆生命！`:'180 秒衝刺，看看你的手指能跑多遠！';
 keyboard();if(!$('game').open)$('game').showModal();next(forced);updateChallengeStats();
 if(['rain','speed'].includes(mode))tick=setInterval(()=>{if(paused||phase!=='answering')return;remaining--;updateChallengeStats();if(remaining<=0){if(mode==='rain'){attempts++;survivalMiss('（超時）')}else finish('time')}},1000);
}
function saveRoundMistake(entered){
 const key=mistakeId(item,currentVersion);addMistake(progress.notebook,item,currentVersion,Date.now());
 if(!roundMistakes[key])roundMistakes[key]={...item,version:currentVersion,count:0,entered:[]};roundMistakes[key].count++;
 if(!roundMistakes[key].entered.includes(entered))roundMistakes[key].entered.push(entered);persist();
}
function survivalMiss(entered){
 if(!active||phase!=='answering')return;saveRoundMistake(entered);lives--;combo=0;$('combo').textContent=0;updateChallengeStats();
 if(lives<=0){finish('lives');return}
 phase='miss';$('answer').readOnly=true;$('keyboard').querySelectorAll('.key').forEach(k=>k.disabled=true);$('decomposition').innerHTML=displayCode(item.code);$('feedback').textContent=`${entered==='（超時）'?'時間到':'再接再厲'}！「${item.char}」應輸入 ${item.code.toUpperCase()}。失去一顆生命，準備下一題。`;$('feedback').className='feedback-error';
 function afterMiss(){if(!active||phase!=='miss')return;if(paused){advanceTimer=setTimeout(afterMiss,150);return}next()}
 advanceTimer=setTimeout(afterMiss,1600);
}
function reviewMarkup(entries){return entries.length?`<section class="round-review"><h3>這次的錯題，現在一起看懂</h3><p>正確取碼已列在下方，並已加入錯字簿。</p>${entries.map(e=>`<article><strong>${e.formId?auxiliarySvg(auxiliaryForm(e.formId)):htmlEscape(displayCharacter(e))}</strong><div><b>${htmlEscape(e.code.toUpperCase())}</b><div class="review-chips">${e.kind==='punct'?'符號碼，不按字形拆根':chips(e.code)}</div><small>你的輸入：${e.entered.map(htmlEscape).join('、')} · 錯誤 ${e.count} 次</small></div></article>`).join('')}</section>`:'<div class="perfect-round">✨ 這次沒有錯字，太棒了！</div>'}
function finish(reason='completed'){
 if(!active)return;active=false;phase='idle';advanceRemaining=0;clearTimeout(advanceTimer);stopDemo();clearInterval(tick);clearTimeout(fall);
 const stars=Math.floor(score/10),key=recordKey(mode,currentVersion,gameDifficulty);progress.stars+=stars;progress.rounds++;progress.best=Math.max(progress.best,score);progress.records[key]=Math.max(progress.records[key]||0,score);
 const accuracy=attempts?Math.round(correct/attempts*100):0;progress.history.unshift({mode,version:currentVersion,difficulty:gameDifficulty,score,correct,accuracy,date:new Date().toLocaleDateString('zh-Hant')});progress.history=progress.history.slice(0,30);persist();
 $('play-area').hidden=true;$('result').hidden=false;
 const title=reason==='lives'?'生命用完了，下一次會更強！':reason==='cleared'?'錯字全部掌握，做得好！':reason==='time'?'時間到！你的進步已經留下足跡':'挑戰完成！又向前了一步';
 $('result').innerHTML=`<div class="result-medal">${correct?'🏆':'🌱'}</div><h2>${title}</h2><div class="result-metrics"><span><b>${score}</b>本次得分</span><span><b>${progress.records[key]}</b>本級最高</span><span><b>${accuracy}%</b>準確率</span></div><p>完成 ${correct} 字 · 獲得 ${stars} 顆星星</p>${reviewMarkup(Object.values(roundMistakes))}<div class="result-actions"><button class="primary" id="again">再挑戰一次 →</button><button class="outline" id="result-notebook">去錯字簿加強</button></div>`;
 $('again').onclick=()=>{if(mode==='book'&&!Object.values(progress.notebook).some(e=>e.version===currentVersion)){close();showPage('notebook')}else start(mode,undefined,practiceKeys)};
 $('result-notebook').onclick=()=>{close();showPage('notebook')};
}
$('end-round').onclick=()=>finish('manual');
function scheduleAutoAdvance(milliseconds){
 clearTimeout(advanceTimer);advanceRemaining=milliseconds;advanceDeadline=performance.now()+milliseconds;
 $('auto-next-status').textContent=`約 ${Math.ceil(milliseconds/1000)} 秒後${['roots','split','special','punct','colour'].includes(mode)&&round>=10?'自動顯示成績':'自動下一題'}，也可按下方按鈕繼續。`;
 const bar=$('auto-next-bar');bar.style.animation='none';void bar.offsetWidth;bar.style.animation=`auto-next-drain ${milliseconds}ms linear forwards`;bar.style.animationPlayState='running';
 advanceTimer=setTimeout(advanceGame,milliseconds);
}
function pauseAutoAdvance(){if(phase!=='success'||!advanceRemaining)return;clearTimeout(advanceTimer);advanceRemaining=Math.max(0,advanceDeadline-performance.now());$('auto-next-bar').style.animationPlayState='paused'}
function resumeAutoAdvance(){if(!active||phase!=='success')return;advanceDeadline=performance.now()+advanceRemaining;$('auto-next-bar').style.animationPlayState='running';advanceTimer=setTimeout(advanceGame,advanceRemaining)}
function advanceGame(){
 if(!active||phase!=='success')return;
 clearTimeout(advanceTimer);if(paused)return;advanceRemaining=0;
 if(['roots','split','special','punct','colour'].includes(mode)&&round>=10)finish();else next();
}
function submitAnswer(){
 if(!active||paused||phase!=='answering')return;
 const answer=$('answer').value.trim().toLowerCase();if(!answer)return;
 attempts++;
 if(answer===item.code){
  const mastered=creditMistake(progress.notebook,item,currentVersion);phase='success';clearTimeout(fall);correct++;combo++;round++;const points=10+(combo>=3?5:0);score+=points;
  progress.records[recordKey(mode,currentVersion,gameDifficulty)]=Math.max(progress.records[recordKey(mode,currentVersion,gameDifficulty)]||0,score);persist();updateChallengeStats();$('score').textContent=score;$('combo').textContent=combo;bounce($('score'),'score-pop');bounce($('target'),'target-success');
  $('target').classList.remove('rain-active');$('answer').readOnly=true;$('keyboard').querySelectorAll('.key').forEach(k=>k.disabled=true);
  $('feedback').textContent=`✓「${item.char}」答對了！＋${points} 分${combo>=3?' · '+combo+' 連擊！':''}${mastered?' · 錯字掌握，已移出錯字簿！':''}`;$('feedback').className='feedback-success';
  $('success-card').hidden=false;$('success-card').querySelector('.success-badge').textContent=symbolQuestion()?'✓ 符號輸入成功！':'✓ 拆字成功！';$('success-detail').innerHTML=`<b>${item.formId?auxiliarySvg(auxiliaryForm(item.formId)):displayCharacter(item)}</b><span>＝</span>${displayCode(item.code)}<span class="earned-points">＋${points}</span>`;
  $('continue-game').textContent=['roots','split','special','punct','colour'].includes(mode)&&round>=10?'查看本次成績 →':'下一題 →';
  animateSplit();const delay=['rain','speed'].includes(mode)?2200:mode==='roots'?2000:mode==='punct'?2600:questionVisual()?questionVisual().parts.length*1100+1400:2200;scheduleAutoAdvance(delay);
 }else{
  if(mode==='rain'){survivalMiss(answer);return}saveRoundMistake(answer);wrongStreak++;combo=0;$('combo').textContent=0;$('feedback').textContent='再試一次！可以按「看看提示」尋找線索。';$('feedback').className='feedback-error';bounce($('answer'),'answer-shake');
  if(wrongStreak>=2){revealHint(wrongStreak>=3);$('feedback').textContent=guidedQuestionActive()?'再觀察五色部件，按順序自己取碼。':wrongStreak>=3?'一起看看完整拆碼，再試一次。':'連續兩次沒答對，先看看字根線索！'}
  $('answer').select();
 }
}
$('continue-game').onclick=advanceGame;
$('answer').addEventListener('keydown',event=>{
 if(event.isComposing||!active||paused)return;
 if(event.key===' '||event.code==='Space'){event.preventDefault();if(!event.repeat)submitAnswer();return}
 if(event.key==='Enter'){event.preventDefault();if(phase==='answering')$('input-status').textContent='倉頡用空白鍵完成輸入，試試按空白鍵！';return}
 if(/^[a-z]$/i.test(event.key)&&phase==='answering')flashKey(event.key.toLowerCase());
});
$('answer').addEventListener('input',event=>{
 if(event.isComposing||!active||paused||phase!=='answering')return;
 const input=$('answer');const position=input.selectionStart;const cleaned=input.value.replace(/[^a-z]/gi,'');
 if(cleaned!==input.value){input.value=cleaned;input.setSelectionRange(Math.min(position,cleaned.length),Math.min(position,cleaned.length))}
 renderCodeProgress();if(practiceGuidance()==='roots'&&questionVisual()){let n=0;while(n<input.value.length&&input.value[n]===item.code[n])n++;selectPracticeGuide(n<item.code.length?n:-1)}
});
$('answer').addEventListener('compositionend',()=>{$('input-status').textContent='請切換至英文鍵盤，再輸入倉頡英文字母。'});
$('keyboard').addEventListener('mousedown',event=>{if(event.target.closest('button'))event.preventDefault()});
$('keyboard').addEventListener('click',event=>{
 const key=event.target.closest('button');if(!key||!active||paused||phase!=='answering')return;
 const input=$('answer');input.focus();
 if(key.dataset.action==='submit'){submitAnswer();return}
 let from=input.selectionStart??input.value.length,to=input.selectionEnd??input.value.length;
 if(key.dataset.action==='delete'){if(from===to)from=Math.max(0,from-1);input.setRangeText('',from,to,'end')}
 else if(key.dataset.key&&input.value.length-(to-from)<input.maxLength){input.setRangeText(key.dataset.key,from,to,'end');flashKey(key.dataset.key)}
 input.dispatchEvent(new Event('input',{bubbles:true}));
});
function guidedQuestionActive(){return phase==='answering'&&!$('practice-guide').hidden&&!!questionVisual()}
$('play-split').onclick=()=>{if(guidedQuestionActive())revealHint();else animateSplit()};
function revealHint(full=true){if(guidedQuestionActive()){selectPracticeGuide(practiceGuideStep<0?0:practiceGuideStep);$('hint').textContent='觀察突出部件的形狀，按顏色順序自行取碼。';$('answer').focus();return}$('decomposition').innerHTML=displayCode(item.code);$('hint').textContent=symbolQuestion()?`${item.name||'標點符號'}：輸入 ${item.code.toUpperCase()}，再按空白鍵。${item.note}`:full?`${item.char} → ${[...item.code].map(k=>ROOTS[k]).join('・')} → ${item.code.toUpperCase()}${item.note?'。'+item.note:''}`:`${item.char} 的字根是：${[...item.code].map(k=>ROOTS[k]).join('、')}。試着在字根表找鍵位。`;document.querySelectorAll('.key[data-key]').forEach(k=>k.classList.toggle('lit',item.code.includes(k.dataset.key)));$('answer').focus()}
$('show-hint').onclick=()=>{if(active&&!paused){revealHint();if(!guidedQuestionActive())animateSplit()}};
function close(){active=false;phase='idle';advanceRemaining=0;clearTimeout(advanceTimer);stopDemo();clearInterval(tick);clearTimeout(fall);$('game').close()}
$('close-game').onclick=close;$('game').addEventListener('cancel',close);
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>start(b.dataset.mode));$('begin').onclick=()=>openLesson('intro');$('warehouse-demo').onclick=()=>showPage('colours');$('try-tip').onclick=()=>start('split',WORDS[0]);
function showPage(page){
 colourViewRevision++;
 document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===page));$('home').hidden=page!=='explore';$('extra').hidden=page==='explore';
 if(page==='roots'){$('extra').innerHTML='<div class="eyebrow">ROOT FAMILIES</div><h2>字根圖鑑 · 找到每個字形的家</h2>'+rootChart();bindRoots($('extra'))}
 if(page==='notebook')renderNotebook();if(page==='colours')renderColourClassroom();
 if(page==='progress'){$('extra').innerHTML=`<div class="eyebrow">YOUR ADVENTURE LOG</div><h2>每一次挑戰，都在變強</h2><div class="progress-grid"><div class="progress-box"><b>${progress.stars} ✦</b>累積星星</div><div class="progress-box"><b>${progress.rounds}</b>完成挑戰</div><div class="progress-box"><b>${Object.keys(progress.notebook).length}</b>待掌握錯字</div></div><h3>最近的冒險</h3>${progress.history.length?progress.history.map(h=>`<div class="history"><span>${TITLES[h.mode]||h.mode} · ${h.version||'5'}代 ${h.difficulty?'· '+DIFFICULTIES[h.difficulty-1].name:''}<small>${h.date}</small></span><span>${h.score} 分 · ${h.correct} 字 · ${h.accuracy}%</span></div>`).join(''):'<p>冒險才正要開始！選一個模式，寫下你的第一個紀錄。</p>'}`}
}
document.querySelectorAll('[data-page]').forEach(button=>button.onclick=()=>showPage(button.dataset.page));
$('book-home').onclick=()=>showPage('notebook');
function renderNotebook(){
 const entries=Object.values(progress.notebook).filter(e=>e.version===currentVersion).map(e=>e.formId||e.kind==='punct'?e:questionForVersion(e)).sort((a,b)=>b.lastWrong-a.lastWrong);
 $('extra').innerHTML=`<div class="eyebrow">MISTAKES BECOME SUPERPOWERS</div><div class="notebook-heading"><div><h2>我的錯字簿 <span>${entries.length}</span></h2><p>每個字答對兩次，就能移出錯字簿。一般練習和挑戰中答對也會累計。</p><p>目前顯示 ${versionName()}；三代和五代分開記錄。</p></div><button class="primary" id="practice-book" ${entries.length?'':'disabled'}>開始錯字加強 →</button></div>${entries.length?`<div class="notebook-grid">${entries.map(e=>`<article class="notebook-card"><div class="notebook-character">${e.formId?auxiliarySvg(auxiliaryForm(e.formId)):htmlEscape(displayCharacter(e))}</div><div class="mastery-dots">${[0,1].map(i=>`<span class="${e.correctCount>i?'filled':''}">✓</span>`).join('')}</div><b>${htmlEscape(e.code.toUpperCase())}</b><div class="review-chips">${e.kind==='punct'?'符號碼':chips(e.code)}</div><p>累計錯誤 ${e.misses} 次 · 再答對 ${2-e.correctCount} 次即可掌握</p></article>`).join('')}</div>`:'<div class="empty-notebook"><span>🌈</span><h3>這裡空空的，做得好！</h3><p>之後答錯或超時的字會自動收錄，讓你知道下一步練甚麼。</p><button class="outline" id="empty-book-home">回小島挑戰 →</button></div>'}`;
 if(entries.length)$('practice-book').onclick=()=>start('book');else $('empty-book-home').onclick=()=>showPage('explore');
}
function colourThumb(char){return `<svg viewBox="0 0 1024 1024" aria-hidden="true"><g transform="translate(0,900) scale(1,-1)">${glyphPaths(char,true)}</g></svg>`}
let colourSearch='',colourPage=0,colourViewRevision=0;
function renderColourClassroom(){
 const chars=colourCharacters();
 $('extra').innerHTML=`<div class="eyebrow">COLOUR LAB · 看見漢字的秘密</div><h2>${chars.length.toLocaleString()} 張彩色地圖，一起拆字探險</h2><p>目前版本收錄 ${chars.length.toLocaleString()} 個原字標色示範，常用字優先排列。灰色是保留但不另取碼的筆畫。</p><div class="colour-toolbar"><label for="colour-search">找字或字碼<input id="colour-search" type="search" placeholder="例如：學、龍、HBND" autocomplete="off"></label><button class="outline" id="colour-references">查看新參考字</button><button class="outline" id="colour-corrections">查看本次修正</button><span id="colour-count" role="status"></span></div><div class="colour-library" id="colour-results"></div><div class="colour-pagination"><button class="outline" id="colour-prev">← 上一頁</button><span id="colour-page-number"></span><button class="outline" id="colour-next">下一頁 →</button></div>`;
 const input=$('colour-search');input.value=colourSearch;
 function update(){
  const revision=++colourViewRevision;
  const query=colourSearch.trim().toLowerCase();const filtered=chars.filter(c=>!query||query.includes(c)||CODE_TABLES[currentVersion][c].includes(query));const pages=Math.max(1,Math.ceil(filtered.length/48));colourPage=Math.min(colourPage,pages-1);
  const visible=filtered.slice(colourPage*48,(colourPage+1)*48);
  function paint(){
  $('colour-results').innerHTML=visible.map(c=>`<button class="colour-character" data-colour-char="${c}" title="${c} · ${CODE_TABLES[currentVersion][c].toUpperCase()}">${splitVisual(c)?colourThumb(c):`<span class="glyph-placeholder" aria-hidden="true">${c}</span>`}<span>${c}<small>${CODE_TABLES[currentVersion][c].toUpperCase()}</small></span></button>`).join('')||'<p class="colour-empty">找不到這個字，試試其他中文字或倉頡字碼。</p>';
  $('colour-count').textContent=`${filtered.length.toLocaleString()} 字 · ${versionName()}`;$('colour-page-number').textContent=`${colourPage+1} / ${pages}`;$('colour-prev').disabled=colourPage===0;$('colour-next').disabled=colourPage>=pages-1;
  $('colour-results').querySelectorAll('[data-colour-char]').forEach(button=>button.onclick=()=>{start('colour',{char:button.dataset.colourChar});animateSplit()});
  }
  paint();
  if(typeof loadColourCharacters==='function'&&visible.some(c=>!splitVisual(c))){
   $('colour-results').setAttribute('aria-busy','true');
   loadColourCharacters(visible).then(()=>{if(revision===colourViewRevision&&$('colour-results')){paint();$('colour-results').setAttribute('aria-busy','false')}}).catch(()=>{if(revision===colourViewRevision&&$('colour-results')){$('colour-results').setAttribute('aria-busy','false');const retry=document.createElement('button');retry.className='outline';retry.textContent='部分字形未能載入，點此重試';retry.onclick=update;$('colour-results').append(retry)}});
  }
 }
 input.oninput=()=>{colourSearch=input.value;colourPage=0;update()};$('colour-references').onclick=()=>{colourSearch=COLOUR_REFERENCE_CHARS.join('');input.value=colourSearch;colourPage=0;update()};$('colour-corrections').onclick=()=>{colourSearch=COLOUR_CORRECTION_CHARS.join('');input.value=colourSearch;colourPage=0;update()};$('colour-prev').onclick=()=>{colourPage--;update()};$('colour-next').onclick=()=>{colourPage++;update()};update();
}

function renderDifficulties(){
 $('difficulty-options').innerHTML=DIFFICULTIES.map(level=>`<button class="difficulty-card ${level.id===difficulty?'selected':''}" data-difficulty="${level.id}" aria-pressed="${level.id===difficulty}"><span>${level.icon}</span><small>LEVEL 0${level.id}</small><b>${level.name}</b><p>${level.description}</p><em>${level.id===1?'RPG 選擇題 · 35 秒／回合':level.id===4?'RPG 五色過渡 → 全字庫戰鬥':level.id===2?'RPG 25 秒／回合 · 五色圖引導':'RPG 五色過渡 → 獨立拆字'}</em></button>`).join('');
 const pool=buildChallengePool(CODE_TABLES[currentVersion],difficulty,WORDS);$('pool-size').textContent=`本級題庫 ${pool.length.toLocaleString()} 字 · ${versionName()}`;
 $('difficulty-options').querySelectorAll('[data-difficulty]').forEach(button=>button.onclick=()=>{difficulty=Number(button.dataset.difficulty);try{localStorage.setItem('cangjie-difficulty',String(difficulty))}catch{}renderDifficulties()});
}
renderDifficulties();
let resumeRain=false;
function applyRootFilters(chart){
 const selectedGroup=chart.dataset.filter||'all',selectedRoot=chart.dataset.selectedRoot||'all';
 const group=GROUPS.find(g=>g.color===selectedGroup);
 chart.querySelectorAll('[data-group]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.group===selectedGroup)));
 chart.querySelectorAll('[data-group]').forEach(button=>button.classList.toggle('selected',button.dataset.group===selectedGroup));
 chart.querySelectorAll('[data-root-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.rootFilter===selectedRoot)));
 chart.querySelectorAll('[data-root-group]').forEach(row=>row.hidden=(selectedGroup!=='all'&&row.dataset.rootGroup!==selectedGroup)||(selectedRoot!=='all'&&row.dataset.rootKey!==selectedRoot));
 chart.querySelectorAll('.reference-group').forEach(section=>section.hidden=(selectedGroup!=='all'&&!section.classList.contains(selectedGroup))||(selectedRoot!=='all'&&!section.querySelector(`[data-root-key="${selectedRoot}"]`)));
 chart.querySelector('.reference-special').hidden=selectedRoot!=='all'||(selectedGroup!=='all'&&selectedGroup!=='special');
 chart.querySelector('.chart-count').textContent=selectedRoot!=='all'?`${ROOTS[selectedRoot]} ${selectedRoot.toUpperCase()} 字根家族 · ${AUXILIARY_FORMS[selectedRoot].length} 個字形`:group?`${group.name} · ${group.description} · ${group.keys.length} 個鍵位`:'按字根分組：24 個字根家族，特殊鍵另列。';
 chart.querySelector('[data-review-group]').textContent=selectedRoot!=='all'?`練習「${ROOTS[selectedRoot]}」字根家族 →`:selectedGroup==='all'?'練習全部基本字根 →':selectedGroup==='special'?'練習難字形 →':`練習${group.name} →`;
}
function bindRoots(container){
 const chart=container.querySelector('.root-chart');if(!chart)return;
 chart.addEventListener('click',event=>{
  const view=event.target.closest('[data-chart-view]');if(view){const overview=view.dataset.chartView==='overview';chart.querySelector('.overview-wrapper').hidden=!overview;chart.querySelector('.variant-grid').hidden=overview;chart.querySelectorAll('[data-chart-view]').forEach(button=>button.setAttribute('aria-pressed',String(button===view)));return}
  const rootFilter=event.target.closest('button[data-root-filter]');
  if(rootFilter){chart.dataset.selectedRoot=rootFilter.dataset.rootFilter;chart.dataset.filter='all';applyRootFilters(chart);return}
  const filter=event.target.closest('[data-group]');
  if(filter){chart.dataset.filter=filter.dataset.group;chart.dataset.selectedRoot='all';if(filter.dataset.group==='special'){chart.querySelector('.overview-wrapper').hidden=true;chart.querySelector('.variant-grid').hidden=false;chart.querySelectorAll('[data-chart-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.chartView==='cards')))}applyRootFilters(chart);return}
  const root=event.target.closest('[data-root]');const review=event.target.closest('[data-review-group]');const selectedForm=event.target.closest('[data-aux-form]');if(!root&&!review&&!selectedForm)return;
  if(selectedForm){const form=auxiliaryForm(selectedForm.dataset.auxForm);if($('lesson').open)closeLesson();start('roots',{char:form.label,formId:form.id,code:form.key},form.key);return}
  const chosen=chart.dataset.filter;const group=GROUPS.find(g=>g.color===chosen);
  if($('lesson').open)closeLesson();
  if(root?.dataset.root==='x'||(!root&&chosen==='special')){start('special',SPECIAL_WORDS.find(w=>w.char==='臼'));return}
  const keys=root?root.dataset.root:chart.dataset.selectedRoot&&chart.dataset.selectedRoot!=='all'?chart.dataset.selectedRoot:group?.keys||null;
  start('roots',root?{char:ROOTS[keys],code:keys}:undefined,keys);
 });
}
function openLesson(type,pending){pauseAutoAdvance();if(type==='punct'){openPunctuationLesson();return}paused=active;resumeRain=active&&mode==='rain';if(resumeRain){clearTimeout(fall);$('target').style.animationPlayState='paused'}$('lesson-title').textContent=type==='chart'?'五色字根・輔助字形速查':'拆字入門 · 先看懂，再輸入';$('lesson-content').innerHTML=type==='chart'?rootChart():`<p class="chart-note">目前使用 ${versionName()}。先辨認字形結構，再找基本字根和輔助字形；不要把每個筆畫當成一個碼。</p><div class="lesson-step"><b>01　看左右、上下、內外</b><p>「明」是左右結構，先左後右；「安」是上下結構，先上後下；「困」是內外結構，先外後內。</p></div><div class="lesson-step"><b>02　辨認變形：同一家族，同一個鍵</b><p>「休」的亻屬於人 O；「沐」的氵屬於水 E；「安」的宀屬於十 J。</p><div class="example-row">休 ${chips('od')}　沐 ${chips('ed')}</div></div><div class="lesson-step"><b>03　組合字根，輸入英文字母</b><p>明 → 日＋月 → AB；安 → 十＋女 → JV。輸入字碼後按空白鍵完成，先練完整拆碼，速度之後再練。</p><div class="example-row">明 ${chips('ab')}　安 ${chips('jv')}</div></div><div class="lesson-step"><b>04　進一步：取碼與難字形</b><p>每字最多五碼。可分體的字：字首最多取首尾兩碼，字身最多取首、次、尾三碼；連體字超過四碼時取首、次、三、尾。應先判斷字形結構，而非直接截斷完整字根串。</p><p>相 → DBU；想 → DUP（字首相取首尾 D、U，字身心取 P）。X 表示指定的難字形，不是所有難拆的部分都能用 X。</p><div class="example-row">臼 ${chips('hx')}　兼 ${chips('txc')}</div></div><button class="outline" id="lesson-chart">先查字根表</button> <button class="primary" id="lesson-go">${pending?'我準備好了，開始挑戰':'跟着練「明」 →'}</button>`;if(!$('lesson').open)$('lesson').showModal();if(type==='chart')bindRoots($('lesson-content'));else{$('lesson-chart').onclick=()=>{openLesson('chart');const back=document.createElement('button');back.className='primary';back.textContent='查閱完畢，返回拆字課 →';back.onclick=()=>openLesson('intro',pending);$('lesson-content').append(back)};$('lesson-go').onclick=()=>{closeLesson();start(pending||'split',pending?undefined:WORDS[0])}}}
function closeLesson(){$('lesson').close();paused=false;resumeAutoAdvance();if(resumeRain&&active&&phase==='answering'){$('target').style.animationPlayState='running';fall=setTimeout(()=>{if(active&&phase==='answering'){attempts++;combo=0;$('combo').textContent=0;next()}},8000)}resumeRain=false;if(active)$('answer').focus()}
$('close-lesson').onclick=closeLesson;$('lesson').addEventListener('cancel',e=>{e.preventDefault();closeLesson()});$('learn-first').onclick=()=>openLesson('intro');$('open-chart').onclick=()=>openLesson('chart');$('game-chart').onclick=()=>openLesson('chart');
// Before advanced modes, offer instruction and a reference table without imposing a score gate.
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>b.dataset.mode==='punct'?openPunctuationLesson():['special','rain','speed','split'].includes(b.dataset.mode)?openLesson('intro',b.dataset.mode):start(b.dataset.mode));

function openPunctuationLesson(){
 pauseAutoAdvance();paused=active;$('lesson-title').textContent='標點符號學堂 · 用途與輸入';$('lesson-content').innerHTML=punctuationGuide();if(!$('lesson').open)$('lesson').showModal();
 let group='all';const search=$('punctuation-search');function filter(){let count=0;const query=search.value.trim().toLowerCase();$('lesson-content').querySelectorAll('[data-punctuation-card]').forEach(card=>{card.hidden=(group!=='all'&&card.dataset.punctuationGroup!==group)||(query&&!card.dataset.punctuationQuery.toLowerCase().includes(query));if(!card.hidden)count++});$('punctuation-count').textContent=`${count} / ${PUNCTUATION.length} 筆符號碼`;$('lesson-content').querySelectorAll('[data-punctuation-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.punctuationFilter===group)))}search.addEventListener('input',filter);$('lesson-content').querySelectorAll('[data-punctuation-filter]').forEach(button=>button.onclick=()=>{group=button.dataset.punctuationFilter;filter()});
 $('punctuation-go').onclick=()=>{closeLesson();start('punct')};$('lesson-content').querySelectorAll('[data-punctuation]').forEach(button=>button.onclick=()=>{const selected=PUNCTUATION.find(p=>p.code===button.dataset.punctuation);closeLesson();start('punct',selected)});
}

function lookupCode(){const raw=$('lookup-char').value,symbol=raw==='␠'?' ':raw,matched=PUNCTUATION.filter(p=>p.char===symbol);if(matched.length){$('lookup-result').textContent=`${symbol===' '?'␠':symbol} → ${matched.map(p=>p.code.toUpperCase()).join(' / ')} · 用戶符號表`;return}const char=[...raw.trim()][0];$('lookup-result').textContent=char?CODE_TABLES[currentVersion][char]?`${char} → ${CODE_TABLES[currentVersion][char].toUpperCase()} · ${versionName()}`:`此碼表未收錄「${char}」`:`${versionName()} · ${Object.keys(CODE_TABLES[currentVersion]).length.toLocaleString()} 字`}

$('code-version').value=currentVersion;$('lookup-char').addEventListener('input',lookupCode);lookupCode();
$('code-version').addEventListener('change',()=>{currentVersion=$('code-version').value;try{localStorage.setItem('cangjie-version',currentVersion)}catch{}lookupCode();renderDifficulties();if(!$('extra').hidden)document.querySelector('.nav.active').click()});
