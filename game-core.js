const DIFFICULTIES = [
 {id:1,name:'萌芽探險',icon:'🌱',description:'原形字與 24 個基本字根',seconds:20,lives:5},
 {id:2,name:'森林學徒',icon:'🍀',description:'常見入門字・最多三碼',seconds:15,lives:4},
 {id:3,name:'拆字高手',icon:'🔥',description:'常見字、複合字與特殊取碼',seconds:10,lives:3},
 {id:4,name:'全字庫大師',icon:'👑',description:'整份碼表，每個字都有機會出現',seconds:7,lives:3}
];
const BASIC_CHARACTERS='日月金木水火土竹戈十大中一弓人心手口尸廿山女田卜';
const COMMON_CHARACTERS='的一是在不了有和人這中大為上個國我以要他時來用們生到作地於出就分對成會可主發年動同工也能下過子說產種面而方後多定行學法所民得經之進著等部度家電力裡如水化高自二理起小物現實加量都兩體制機當使點從業本去把性好應開合還因由其些然前外天政四日那社義事平形相全表間樣與關各重新線內數正心反你明看原利比或但質氣向道命此變條只沒結解問意建月公無系軍很情者最立代想已通並提直題程展五果料象員位入常文總次品式活設及管特件長求老頭基資邊流路級少圖山統接知較將組見計別手角期根論運指區強放決西被做必戰先回則任取據處隊南給色光門即保治北造百規熱領七海口東導器壓志世金增爭油思術極交受聯認六共權收證改清美再採轉更單風切打白教速花帶安場身車例真務具萬每目至達走積示議聲報鬥完類八離名確才科張信節話米整空元況今集溫傳土許步群廣石記需段研界拉林律叫且究觀越織裝影算低持音眾書布復容兒須際商非驗連斷深難近礦千周委素技備半辦青列習響約支般史感勞便團往酸歷市克何除消構府稱太準精值號率族維劃選標寫存候毛親快效斯院查江型眼王按格養易置派層片始卻專狀育廠京識適屬圓包火住調滿縣局照參紅細引聽該鐵價嚴龍飛父';
function buildChallengePool(dictionary,level,words){
 if(level===4)return Object.entries(dictionary).map(([char,code])=>({char,code,kind:'word'}));
 const chars=level===1?[...BASIC_CHARACTERS]:level===2?words.filter(w=>(dictionary[w.char]||'').length<=3).map(w=>w.char):[...words.map(w=>w.char),...COMMON_CHARACTERS];
 return [...new Set(chars)].filter(c=>dictionary[c]).map(char=>({char,code:dictionary[char],kind:'word'}));
}
const SIMPLIFIED_ONLY_SET=new Set(SIMPLIFIED_ONLY_CHARACTERS);
function practiceQuestionWeight(question){return !question.formId&&question.kind!=='punct'&&SIMPLIFIED_ONLY_SET.has(question.char)?0.1:1}
function pickPracticeQuestion(pool,preferTraditional=true,random=Math.random){
 if(!pool.length)return undefined;
 if(!preferTraditional)return pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];
 const total=pool.reduce((sum,q)=>sum+practiceQuestionWeight(q),0);let cursor=random()*total;
 for(const question of pool){cursor-=practiceQuestionWeight(question);if(cursor<0)return question}
 return pool[pool.length-1];
}
function mistakeId(question,version){return `${version}:${question.kind||'word'}:${question.kind==='punct'?question.code.toLowerCase():question.formId||question.char}`}
function addMistake(book,question,version,now){
 const id=mistakeId(question,version),old=book[id];
 book[id]={id,version,kind:question.kind||'word',char:question.char,code:question.code,formId:question.formId||null,correctCount:old?.correctCount||0,misses:(old?.misses||0)+1,lastWrong:now};return id;
}
function normalizePunctuationNotebook(book,reference){
 const normalized={};for(const [oldId,entry]of Object.entries(book)){
  const current=entry.kind==='punct'?reference.find(p=>p.code===String(entry.code).toLowerCase()):null;if(!current){normalized[oldId]=entry;continue}
  const question={...entry,...current},id=mistakeId(question,entry.version),old=normalized[id];normalized[id]={...question,id,misses:(old?.misses||0)+(entry.misses||0),correctCount:Math.max(old?.correctCount||0,entry.correctCount||0),lastWrong:Math.max(old?.lastWrong||0,entry.lastWrong||0)};
 }return normalized;
}
function creditMistake(book,question,version){const id=mistakeId(question,version);if(!book[id])return false;book[id].correctCount++;if(book[id].correctCount>=2){delete book[id];return true}return false}
function recordKey(mode,version,difficulty){return `${mode}:${version}:${difficulty}`}
function htmlEscape(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
