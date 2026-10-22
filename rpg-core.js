// Deterministic battle rules, shared by the browser and node tests.
const RPG=(()=>{
 const foes=[{name:'苔苔史萊姆',kind:'slime',colour:'#56ba91',title:'字根草原'}, {name:'墨羽小夜梟',kind:'owl',colour:'#9980d7',title:'月光書林'}, {name:'赤尾符文狐',kind:'fox',colour:'#ee975b',title:'符文溪谷'}, {name:'岩甲守衛',kind:'golem',colour:'#809dad',title:'古字遺跡'}, {name:'古書幼龍',kind:'dragon',colour:'#6975ce',title:'天空藏書塔'}];
 const moves={strike:{name:'字根斬',damage:24,cost:0},burst:{name:'五色連擊',damage:46,cost:2},guard:{name:'守護結界',damage:16,cost:0}};
 const config=[{seconds:35,label:'選擇題・限時冒險'},{seconds:25,label:'五色圖引導・森林學徒'},{seconds:18,label:'進階拆字・遺跡探索'},{seconds:14,label:'全字庫・敵方技能'}];
 function enemy(stage,difficulty,wave=1){const type=foes[wave===3?stage-1:(stage+wave-2)%4],level=stage+(difficulty-1)*3+wave-1,maxHp=32+level*7+(wave===3?14:0);return {...type,title:foes[stage-1].title,level,maxHp,hp:maxHp,attack:5+difficulty*2+stage,boss:wave===3}}
 function create(difficulty,version){if(!Number.isInteger(difficulty)||difficulty<1||difficulty>4)throw Error('Invalid difficulty');return {difficulty,version,stage:1,wave:1,defeated:0,questionLevel:1,enemy:enemy(1,difficulty),hp:100,maxHp:100,mana:0,score:0,combo:0,turn:1,correct:0,attempts:0,phase:'question',action:'strike',inventory:{potion:2,clock:2,lens:2},seconds:config[difficulty-1].seconds,timeLimit:config[difficulty-1].seconds,shield:0,spell:null,spellCount:0,lensUsed:false}}
 function select(state,action){if(state.phase!=='question'||!moves[action]||moves[action].cost>state.mana||(state.spell==='seal'&&action==='burst'))return false;state.action=action;return true}
 function use(state,item){if(state.phase!=='question'||!state.inventory[item])return false;if(item==='potion'&&state.hp===state.maxHp||item==='clock'&&!config[state.difficulty-1].seconds||item==='lens'&&state.lensUsed)return false;state.inventory[item]--;if(item==='potion')state.hp=Math.min(state.maxHp,state.hp+35);if(item==='clock'){state.seconds+=8;state.timeLimit+=8}if(item==='lens')state.lensUsed=true;return true}
 function resolve(state,correct){
  if(state.phase!=='question')return null;
  const move=moves[state.action];if(!move||move.cost>state.mana)return null;
  state.attempts++;let damage=0,received=0,spell=null;state.spell=null;
  if(correct){state.correct++;state.combo++;state.mana=Math.min(3,state.mana-move.cost+1);damage=damageFor(state.questionLevel,state.action,state.combo);state.enemy.hp=Math.max(0,state.enemy.hp-damage);state.score+=20+state.combo*5;if(state.action==='guard')state.shield+=12}else state.combo=0;
  if(state.enemy.hp>0){received=Math.max(0,state.enemy.attack-(correct&&state.action==='guard'?state.shield:0));state.hp=Math.max(0,state.hp-received);state.shield=0;
   if(state.difficulty===4&&state.turn%3===0&&state.hp>0){spell=['fog','seal','wind'][state.spellCount++%3];state.spell=spell}
  }else {state.defeated++;state.score+=state.enemy.level*30;state.shield=0}
  state.phase=state.hp<=0?'defeat':state.enemy.hp<=0&&state.stage===5&&state.wave===3?'victory':'review';
  return {correct,damage,received,spell,defeated:state.enemy.hp===0,action:state.action};
 }
 function advance(state){if(state.phase!=='review')return false;if(state.enemy.hp===0){if(state.wave<3)state.wave++;else{state.stage++;state.wave=1}state.enemy=enemy(state.stage,state.difficulty,state.wave);state.hp=Math.min(100,state.hp+14);state.spell=null}state.turn++;state.phase='question';state.action='strike';state.seconds=config[state.difficulty-1].seconds-(state.spell==='wind'?3:0);state.timeLimit=state.seconds;state.lensUsed=false;return true}
 function guidance(difficulty,stage){return difficulty===1?'none':stage<=2?'roots':stage<=4?'colours':'independent'}
 function damageFor(level,action='strike',combo=1){return Math.round([18,24,32,42][Math.max(1,Math.min(4,level))-1]*moves[action].damage/24)+Math.min(6,Math.max(0,combo-1)*2)}
 function options(answer,pool,random=Math.random){const wrong=[...new Set(pool.map(q=>q.code).filter(c=>c!==answer))];for(let i=wrong.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[wrong[i],wrong[j]]=[wrong[j],wrong[i]]}const choices=[answer,...wrong.slice(0,3)];for(let i=choices.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]]}return choices}
 return {foes,moves,config,create,select,use,resolve,advance,options,damageFor,guidance};
})();
if(typeof module!=='undefined')module.exports=RPG;
