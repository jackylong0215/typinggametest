// Deterministic battle rules, shared by the browser and node tests.
const RPG=(()=>{
 const foes=[{name:'噬晶黏怪',kind:'slime',colour:'#38aa92'}, {name:'裂眼夜蝠',kind:'owl',colour:'#7956b4'}, {name:'焰牙魔狼',kind:'fox',colour:'#dd713a'}, {name:'咒岩石像',kind:'golem',colour:'#768f91'}, {name:'棘翼飛龍',kind:'dragon',colour:'#508f83'}, {name:'鐮足蟲魔',kind:'mantis',colour:'#91a646'}];
 const zones=['苔骨森林','幽燐洞窟','赤焰荒原','符文遺跡','裂空山脈','黑曜王座'];
 const items={potion:{name:'補血藥',icon:'🧪'},clock:{name:'沙漏',icon:'⌛'},lens:{name:'提示鏡',icon:'🔎'}};
 const boss={name:'蝕字魔龍王',kind:'overlord',colour:'#65468b'};
 const totalFloors=30;
 function lootChance(rank){return rank==='normal'?.05:.25}
 function rollLoot(rank,random=Math.random){if(random()>=lootChance(rank))return null;return Object.keys(items)[Math.min(2,Math.floor(random()*3))]}

 const moves={strike:{name:'字根斬',damage:24,cost:0},burst:{name:'五色連擊',damage:46,cost:2},guard:{name:'守護結界',damage:16,cost:0}};
 const config=[{seconds:35,label:'選擇題・限時冒險'},{seconds:25,label:'五色圖引導・森林學徒'},{seconds:18,label:'進階拆字・遺跡探索'},{seconds:14,label:'全字庫・敵方技能'}];
 function enemy(floor,difficulty){const rank=floor===totalFloors?'boss':floor%5===0?'elite':'normal',type=rank==='boss'?boss:foes[(floor-1)%foes.length],level=floor+(difficulty-1)*4,base=38+Math.floor((floor-1)/5)*6+difficulty*3,maxHp=base+(rank==='boss'?110:rank==='elite'?28:0);return {...type,name:(rank==='elite'?'狂化・':'')+type.name,title:zones[Math.ceil(floor/5)-1],level,maxHp,hp:maxHp,attack:4+difficulty+Math.floor((floor-1)/10)+(rank==='elite'?2:rank==='boss'?4:0),rank,elite:rank==='elite',boss:rank==='boss',floor}}

 function create(difficulty,version){if(!Number.isInteger(difficulty)||difficulty<1||difficulty>4)throw Error('Invalid difficulty');return {difficulty,version,floor:1,stage:1,wave:1,defeated:0,drops:[],questionLevel:1,enemy:enemy(1,difficulty),hp:100,maxHp:100,mana:0,score:0,combo:0,turn:1,correct:0,attempts:0,phase:'question',action:'strike',inventory:{potion:1,clock:1,lens:1},seconds:config[difficulty-1].seconds,timeLimit:config[difficulty-1].seconds,shield:0,spell:null,spellCount:0,lensUsed:false}}
 function select(state,action){if(state.phase!=='question'||!moves[action]||moves[action].cost>state.mana||(state.spell==='seal'&&action==='burst'))return false;state.action=action;return true}
 function use(state,item){if(state.phase!=='question'||!state.inventory[item])return false;if(item==='potion'&&state.hp===state.maxHp||item==='clock'&&!config[state.difficulty-1].seconds||item==='lens'&&state.lensUsed)return false;state.inventory[item]--;if(item==='potion')state.hp=Math.min(state.maxHp,state.hp+35);if(item==='clock'){state.seconds+=8;state.timeLimit+=8}if(item==='lens')state.lensUsed=true;return true}
 function resolve(state,correct,random=Math.random){
  if(state.phase!=='question')return null;
  const move=moves[state.action];if(!move||move.cost>state.mana)return null;
  state.attempts++;let damage=0,received=0,spell=null,loot=null;state.spell=null;
  if(correct){state.correct++;state.combo++;state.mana=Math.min(3,state.mana-move.cost+1);damage=damageFor(state.questionLevel,state.action,state.combo);state.enemy.hp=Math.max(0,state.enemy.hp-damage);state.score+=20+state.combo*5;if(state.action==='guard')state.shield+=12}else state.combo=0;
  if(state.enemy.hp>0){received=Math.max(0,state.enemy.attack-(correct&&state.action==='guard'?state.shield:0));state.hp=Math.max(0,state.hp-received);state.shield=0;
   if(state.difficulty===4&&state.turn%3===0&&state.hp>0){spell=['fog','seal','wind'][state.spellCount++%3];state.spell=spell}
  }else {state.defeated++;state.score+=state.enemy.level*30;state.shield=0;const item=rollLoot(state.enemy.rank,random);if(item){state.inventory[item]++;loot={item,floor:state.floor,rank:state.enemy.rank};state.drops.push(loot)}}
  state.phase=state.hp<=0?'defeat':state.enemy.hp<=0&&state.floor===totalFloors?'victory':'review';
  return {correct,damage,received,spell,defeated:state.enemy.hp===0,loot,action:state.action};
 }
 function advance(state){if(state.phase!=='review')return false;if(state.enemy.hp===0){const healing=state.enemy.elite?20:14;state.floor++;state.stage=Math.ceil(state.floor/5);state.wave=(state.floor-1)%5+1;state.enemy=enemy(state.floor,state.difficulty);state.hp=Math.min(100,state.hp+healing);state.spell=null}state.turn++;state.phase='question';state.action='strike';state.seconds=config[state.difficulty-1].seconds-(state.spell==='wind'?3:0);state.timeLimit=state.seconds;state.lensUsed=false;return true}

 function guidance(difficulty,stage){return difficulty===1?'none':stage<=2?'roots':stage<=4?'colours':'independent'}
 function damageFor(level,action='strike',combo=1){return Math.round([18,24,32,42][Math.max(1,Math.min(4,level))-1]*moves[action].damage/24)+Math.min(6,Math.max(0,combo-1)*2)}
 function options(answer,pool,random=Math.random){const wrong=[...new Set(pool.map(q=>q.code).filter(c=>c!==answer))];for(let i=wrong.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[wrong[i],wrong[j]]=[wrong[j],wrong[i]]}const choices=[answer,...wrong.slice(0,3)];for(let i=choices.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]]}return choices}
 return {foes,zones,items,boss,totalFloors,enemy,lootChance,rollLoot,moves,config,create,select,use,resolve,advance,options,damageFor,guidance};
})();
if(typeof module!=='undefined')module.exports=RPG;
