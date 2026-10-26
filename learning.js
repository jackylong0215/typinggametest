// Teaching examples use traditional Cangjie III codes. Colour groups are this game's mnemonic.
const GROUPS = [
 {name:'哲理組',keys:'abcdefg',color:'sky',description:'日月金木水火土'},
 {name:'筆畫組',keys:'hijklmn',color:'earth',description:'竹戈十大中一弓'},
 {name:'人體組',keys:'opqr',color:'body',description:'人心手口'},
 {name:'字形組',keys:'stuvwy',color:'shape',description:'尸廿山女田卜'},
 {name:'特殊組',keys:'xz',color:'special',description:'難字形與輔助鍵'}
];
// Auxiliary components name shapes inside a character, not standalone character codes.
const VARIANTS = {
 a:{forms:'日、曰',example:'明 AB · 昌 AA · 早 AJ',note:'扁日「曰」仍屬日。注意：目不是日，目取 BU。'},
 b:{forms:'月、冂、冖、爫、⺆',example:'朋 BB · 采 BD · 受 BBE',note:'包括月形、上包框、覆蓋形及爪字頭。相似外框要配合字形結構判斷。'},
 c:{forms:'金、釒、八',example:'針 CJ · 分 CSH · 公 CI',note:'金字旁和向下分開的八形。「八」獨立輸入取 HO，作部件才取 C。不要把所有兩點都當作金。'},
 d:{forms:'木、朩',example:'林 DD · 本 DM · 村 DDI',note:'木的鉤腳或末筆在組字時可能縮短，仍按木形辨認。'},
 e:{forms:'水、氵、氺、又',example:'沐 ED · 友 KE · 支 JE',note:'又在友、支等字中作水的輔助字形；單字「又」本身輸入 NK。'},
 f:{forms:'火、灬、小、⺌',example:'炎 FF · 尖 FK · 秋 HDF',note:'四點底、小字形及小字頭，均須按所在位置辨認；「小」獨立輸入取 NC（弓、金），作為其他字的輔助形才取 F。'},
 g:{forms:'土、士',example:'吉 GR · 吐 RG · 杜 DG',note:'土與士的橫畫長短不同，在取碼時同屬土。'},
 h:{forms:'竹、⺮、丿、𠂆',example:'白 HA · 竹 H · 斤 HML',note:'竹字頭、斜撇與撇形。竹字頭也要按整字取碼規則處理。'},
 i:{forms:'戈、丶、厶、广',example:'去 GI · 公 CI · 玉 MGI',note:'包括點、私字旁及廣字頭；丶與亠是不同字形。'},
 j:{forms:'十、宀',example:'古 JR · 安 JV · 守 JDI',note:'寶蓋頭宀取十；與月組的冖（禿寶蓋）區分。'},
 k:{forms:'大、乂、攵、疒',example:'交 YCK · 改 SUOK · 病 KMOB',note:'交叉形、反文旁與病字旁。相似的夂形須依結構拆開，例如冬取 HEY，不能直接當作大。'},
 l:{forms:'中、丨、衤',example:'中 L · 申 LWL · 補 LIJB',note:'直豎與衣字旁；衣字旁在完整字中往往還需要其他字根，不是所有部分只取 L。'},
 m:{forms:'一、厂、工',example:'旦 AM · 江 EM · 工 MLM',note:'橫畫、廠字頭及工形。工在江中取 M，單字工則取 MLM。'},
 n:{forms:'弓、亅、乛、㇇',example:'了 NN · 子 ND · 丁 MN',note:'豎鉤與橫鉤形；彎鉤的方向、是否連接其他筆畫會影響拆法。'},
 o:{forms:'人、亻、入、𠆢',example:'休 OD · 入 OH · 付 ODI',note:'人字旁、入形和人字頭。單字入取 OH，這裡學的是字形所屬家族。'},
 p:{forms:'心、忄、⺗、匕、勹',example:'忙 PYV · 忠 LP · 包 PRU',note:'豎心旁、心字底、匕首形及包字頭。七作輔助字形取 P，獨立成字則拆十、乚，取 JU。'},
 q:{forms:'手、扌、龵',example:'打 QMN · 扣 QR · 看 HQBU',note:'提手旁和扁手形。看字上部的手形需按整體結構分拆，不是整個上部一律只取 Q。'},
 r:{forms:'口',example:'如 VR · 品 RRR · 回 WR',note:'口形要與田組的大包圍「囗」區分：回先取外框田，再取內部口。'},
 s:{forms:'尸、匚、匸、刀、刁',example:'司 SMR · 召 SHR · 分 CSH',note:'尸、側包圍與刀形。刀在召、分中取 SH，不能只用 S 代替整把刀。'},
 t:{forms:'廿、艹、卄、卝、丷',example:'苗 TW · 草 TAJ · 兼 TXC',note:'草字頭的寫法會隨字型改變；丷在兼中配合下方形體取 T，兩點並非永遠取廿。',practiceForms:'廿、艹、卄、卝'},
 u:{forms:'山、凵、乚、屮',example:'出 UU · 屯 PU · 兒 HXHU',note:'山形、下包框和向右彎起的鉤形；屮須看組字位置。'},
 v:{forms:'女、巛、幺',example:'如 VR · 女 V · 幻 VIS',note:'巛與幺形可作女的輔助字形；幺在完整拆碼中也可能要補取戈。'},
 w:{forms:'田、囗',example:'男 WKS · 困 WD · 回 WR',note:'大包圍取田。囗是外框，不是口；國先取田，再處理內部。'},
 y:{forms:'卜、亠、辶、⻌、⻍',example:'主 YG · 交 YCK · 這 YYMR',note:'卜、點橫頭及走之底。辶在例字中歸卜，先後順序仍按整字規則。'},
 x:{forms:'臼的難字形、兼的難字形、鹿的難字形、齊的難字形',example:'臼 HX · 兼 TXC · 鹿 IXP · 齊 YX',note:'X 只用於指定的難字形，不是通用替代碼，也不是整個「難」字的編碼。'},
 z:{forms:'重（輔助功能鍵）',example:'本遊戲符號碼：，ZXAB · 。ZXAD',note:'Z 不屬於 24 個基本字根。本遊戲標點練習依用戶提供的 ZX 符號碼表；其他輸入法的快捷方式可能不同。'}
};
const EXTRA_WORDS = `白 ha 百 ma 自 hbu 目 bu 且 bm 古 jr 吉 gr 吐 rg 如 vr 叫 rvl 吃 ron 只 rc 兄 rhu 召 shr 加 ksr 力 ks 刀 sh 分 csh 公 ci 六 yc 交 yck 文 yk 王 mg 玉 mgi 主 yg 去 gi 云 mmi 友 ke 又 nk 支 je 皮 dhe 石 mr 右 kr 左 km 工 mlm 丁 mn 打 qmn 扣 qr 拍 qha 拉 qyt 把 qau 沐 ed 江 em 河 emnr 汗 emj 汁 ej 池 epd 泳 eine 油 elw 洋 etq 住 oyg 何 omnr 伸 olwl 信 oymr 付 odi 代 oip 化 op 花 top 草 taj 苗 tw 茶 tod 芬 tcsh 芳 tyhs 芒 tyv 忙 pyv 怕 pha 情 pqmb 快 pdk 念 oinp 忘 yvp 忠 lp 思 wp 想 dup 家 jmso 守 jdi 宋 jd 宇 jmd 完 jmmu 定 jmyo 子 nd 孔 ndu 孟 ndbt 了 nn 出 uu 回 wr 困 wd 因 wk 固 wjr 采 bd 朵 hnd 李 dnd 村 ddi 杜 dg 果 wd 米 fd 秋 hdf 和 hdr 香 hda 年 oq 春 qka 青 qmb 音 yta 立 yt`.split(' ');
const BEGINNER_WORDS=[];for(let i=0;i<EXTRA_WORDS.length;i+=2)BEGINNER_WORDS.push({char:EXTRA_WORDS[i],code:EXTRA_WORDS[i+1]});
const SPECIAL_WORDS = [
 {char:'倉',code:'oiar',note:'取人、戈、日、口；日形左邊與長撇共用，以虛線表示；長撇其餘部分保留灰色。'},
 {char:'臼',code:'hx',note:'臼的上方取「竹」，難以用基本字根完整表示的凹形部分取「難」。'},
 {char:'兒',code:'hxhu',note:'上方「臼」取竹、難；下方彎腳取竹、山，全碼 HXHU。'},
 {char:'舀',code:'bhx',note:'上方爫是「月」的輔助字形；下方臼取竹、難。'},
 {char:'舅',code:'hxwks',note:'臼取竹、難，下方男取田、大、尸；全字共五碼。'},
 {char:'兼',code:'txc',note:'兼屬特殊難字形，固定記作廿、難、金。不要逐筆硬拆。'},
 {char:'鹿',code:'ixp',note:'鹿的特殊字形取戈、難、心。'},
 {char:'門',code:'an',note:'特殊字形：記作日、弓，不按外觀重複取兩個日。'},
 {char:'鬼',code:'hi',note:'特殊字形：頂撇取竹，右下厶取戈（HI）；中間及彎鉤不另取碼。'},
 {char:'我',code:'hqi',note:'交連字形：取竹、手、戈。'},
 {char:'國',code:'wirm',note:'外框先取田；內部或取戈、口、一。'},
 {char:'想',code:'dup',note:'分成相和心；字首相只取首尾「木、山」，字身心取「心」。相單字則是 DBU。'},
 {char:'樹',code:'dgti',note:'分成木和右部；字首取木，字身取首、次、尾，得到土、廿、戈。'}
];
function groupFor(key){return GROUPS.find(g=>g.keys.includes(key))}
function chips(code){return [...code].map(k=>`<span class="root-chip ${groupFor(k).color}">${ROOTS[k]}<small>${k.toUpperCase()}</small></span>`).join('<span class="chip-plus">＋</span>')}
function rootChart(){return `<section class="root-chart" data-filter="all">${referenceControls()}<p class="chart-note">${versionName()}字碼・24 個基本字根＋X 難字形＋Z 輔助鍵，依 A–Z 排列。點選分組可集中溫習，再按「練習這一組」。從你提供的三代輔助字形原圖逐格取景，包含無法直接輸入的字形；按小圖可練習。編號按參考表由左至右、由上至下排列。輔助字形是字根的一部分，不代表整字輸入碼。</p><div class="colour-legend" role="group" aria-label="字根分組篩選"><button class="root-chip filter-chip selected" data-group="all" aria-pressed="true">全部 <small>26</small></button>${GROUPS.map(g=>`<button class="root-chip filter-chip ${g.color}" data-group="${g.color}" aria-pressed="false">${g.name}<small>${g.keys.length}</small></button>`).join('')}</div><div class="root-key-filter" role="group" aria-label="按字根篩選"><button data-root-filter="all" aria-pressed="true">全部字根</button>${[...'abcdefghijklmnopqrstuvwy'].map(key=>`<button data-root-filter="${key}" aria-pressed="false"><b>${ROOTS[key]}</b><small>${key.toUpperCase()}</small></button>`).join('')}</div><div class="review-bar"><p class="chart-count" aria-live="polite">顯示全部 26 個鍵位 · 24 個基本字根</p><button class="outline" data-review-group>練習全部基本字根 →</button></div><div class="chart-view-switch" role="group" aria-label="字根表檢視方式"><button data-chart-view="overview" aria-pressed="true">整張輔助字形表</button><button data-chart-view="cards" aria-pressed="false">圖鑑與例字</button></div><div class="overview-wrapper">${auxiliaryOverview()}</div><div class="variant-grid" hidden>${[...'abcdefghijklmnopqrstuvwxyz'].map(k=>`<article class="variant-tile ${groupFor(k).color}" data-root-group="${groupFor(k).color}" data-root-key="${k}"><h3>${ROOTS[k]}<small>${k.toUpperCase()} · ${groupFor(k).name}</small></h3><div class="variant-forms">${AUXILIARY_FORMS[k]?auxiliaryFamily(k):`<span>${VARIANTS[k].forms}</span>`}</div><p class="variant-note">${variantText(k,'note')}</p><p class="variant-example">${variantText(k,'example')}</p>${k==='z'?'<small>功能參考，不列入打字題</small>':`<button class="text-button" data-root="${k}">${k==='x'?'練習難字形':'溫習此字根與變形'} →</button>`}</article>`).join('')}</div></section>`}

// Stroke indices follow the pinned Hanzi Writer Data contours; all indices remain in the original glyph.
const SPLIT_VISUALS = {
 '倉':{layout:'人 → 戈 → 日 → 口',ignored:[6],colours:['#59615a','#e9852d','#1483ba','#79b92d'],parts:[['上方的人形','o',[0,1]],['中間的點，取戈','i',[2]],['中間的日形','a',[3,4,5]],['下方的口','r',[7,8,9]]],sharedStrokeGuides:[{"stroke":6,"part":2,"median":[[379,506],[406,477],[411,459],[388,314],[360,211],[312,118],[287,86],[202,15],[167,0]],"lo":270,"hi":530}],explanation:'日形左邊與長撇共用；虛線補出日形左側，完整長撇仍留在原位。'},
 '明':{layout:'先左後右',parts:[['左邊的日','a',[0,1,2,3]],['右邊的月','b',[4,5,6,7]]]},
 '林':{layout:'先左後右',parts:[['左邊的木','d',[0,1,2,3]],['右邊的木','d',[4,5,6,7]]]},
 '休':{layout:'先左後右',parts:[['亻是人的變形','o',[0,1]],['右邊的木','d',[2,3,4,5]]]},
 '沐':{layout:'先左後右',parts:[['氵是水的變形','e',[0,1,2]],['右邊的木','d',[3,4,5,6]]]},
 '朋':{layout:'先左後右',parts:[['左邊的月','b',[0,1,2,3]],['右邊的月','b',[4,5,6,7]]]},
 '如':{layout:'先左後右',parts:[['左邊的女','v',[0,1,2]],['右邊的口','r',[3,4,5]]]},
 '好':{layout:'先左後右',parts:[['左邊的女','v',[0,1,2]],['右邊的子，拆作弓、木','nd',[3,4,5]]]},
 '安':{layout:'先上後下',parts:[['宀是十的變形','j',[0,1,2]],['下方的女','v',[3,4,5]]]},
 '宋':{layout:'先上後下',parts:[['宀是十的變形','j',[0,1,2]],['下方的木','d',[3,4,5,6]]]},
 '昌':{layout:'先上後下',parts:[['上方的日','a',[0,1,2,3]],['下方的日','a',[4,5,6,7]]]},
 '炎':{layout:'先上後下',parts:[['上方的火','f',[0,1,2,3]],['下方的火','f',[4,5,6,7]]]},
 '杏':{layout:'先上後下',parts:[['上方的木','d',[0,1,2,3]],['下方的口','r',[4,5,6]]]},
 '呆':{layout:'先上後下',parts:[['上方的口','r',[0,1,2]],['下方的木','d',[3,4,5,6]]]},
 '尖':{layout:'先上後下',parts:[['小是火的輔助字形','f',[0,1,2]],['下方的大','k',[3,4,5]]]},
 '森':{layout:'先上，再左下、右下',parts:[['上方的木','d',[0,1,2,3]],['左下的木','d',[4,5,6,7]],['右下的木','d',[8,9,10,11]]]},
 '品':{layout:'先上，再左下、右下',parts:[['上方的口','r',[0,1,2]],['左下的口','r',[3,4,5]],['右下的口','r',[6,7,8]]]},
 '晶':{layout:'先上，再左下、右下',parts:[['上方的日','a',[0,1,2,3]],['左下的日','a',[4,5,6,7]],['右下的日','a',[8,9,10,11]]]},
 '困':{layout:'先外後內，與寫字筆順不同',parts:[['外框囗取田，包含最後的封口橫','w',[0,1,6]],['框內的木','d',[2,3,4,5]]]},
 '回':{layout:'先外後內，與寫字筆順不同',parts:[['外框囗取田','w',[0,1,5]],['框內的口','r',[2,3,4]]]}
};
const PUNCTUATION_REFERENCE = [{"code":"ZXAA","stroke":"Z難日日","symbol":" "},{"code":"ZXAB","stroke":"Z難日月","symbol":"，"},{"code":"ZXAC","stroke":"Z難日金","symbol":"、"},{"code":"ZXAD","stroke":"Z難日木","symbol":"。"},{"code":"ZXAE","stroke":"Z難日水","symbol":"．"},{"code":"ZXAF","stroke":"Z難日火","symbol":"‧"},{"code":"ZXAG","stroke":"Z難日土","symbol":"；"},{"code":"ZXAH","stroke":"Z難日竹","symbol":"："},{"code":"ZXAI","stroke":"Z難日戈","symbol":"？"},{"code":"ZXAJ","stroke":"Z難日十","symbol":"！"},{"code":"ZXAK","stroke":"Z難日大","symbol":"︰"},{"code":"ZXAL","stroke":"Z難日中","symbol":"…"},{"code":"ZXAM","stroke":"Z難日一","symbol":"‥"},{"code":"ZXAN","stroke":"Z難日弓","symbol":"﹐"},{"code":"ZXAO","stroke":"Z難日人","symbol":"﹑"},{"code":"ZXAP","stroke":"Z難日心","symbol":"．"},{"code":"ZXAQ","stroke":"Z難日手","symbol":"‧"},{"code":"ZXAR","stroke":"Z難日口","symbol":"﹔"},{"code":"ZXAS","stroke":"Z難日戶","symbol":"﹕"},{"code":"ZXAT","stroke":"Z難日甘","symbol":"﹖"},{"code":"ZXAU","stroke":"Z難日山","symbol":"﹗"},{"code":"ZXAV","stroke":"Z難日女","symbol":"｜"},{"code":"ZXAW","stroke":"Z難日田","symbol":"—"},{"code":"ZXAX","stroke":"Z難日難","symbol":"│"},{"code":"ZXAY","stroke":"Z難日卜","symbol":"──"},{"code":"ZXBA","stroke":"Z難月日","symbol":"│"},{"code":"ZXBB","stroke":"Z難月月","symbol":"─"},{"code":"ZXBC","stroke":"Z難月金","symbol":"┆"},{"code":"ZXBD","stroke":"Z難月木","symbol":"﹏"},{"code":"ZXBE","stroke":"Z難月水","symbol":"("},{"code":"ZXBF","stroke":"Z難月火","symbol":")"},{"code":"ZXBG","stroke":"Z難月土","symbol":"⁀"},{"code":"ZXBH","stroke":"Z難月竹","symbol":"‿"},{"code":"ZXBI","stroke":"Z難月戈","symbol":"{"},{"code":"ZXBJ","stroke":"Z難月十","symbol":"}"},{"code":"ZXBK","stroke":"Z難月大","symbol":"﹋"},{"code":"ZXBL","stroke":"Z難月中","symbol":"﹌"},{"code":"ZXBM","stroke":"Z難月一","symbol":"["},{"code":"ZXBN","stroke":"Z難月弓","symbol":"]"},{"code":"ZXBO","stroke":"Z難月人","symbol":"︹"},{"code":"ZXBP","stroke":"Z難月心","symbol":"︺"},{"code":"ZXBQ","stroke":"Z難月手","symbol":"【"},{"code":"ZXBR","stroke":"Z難月口","symbol":"】"},{"code":"ZXBS","stroke":"Z難月戶","symbol":"〔"},{"code":"ZXBT","stroke":"Z難月甘","symbol":"〕"},{"code":"ZXBU","stroke":"Z難月山","symbol":"《"},{"code":"ZXBV","stroke":"Z難月女","symbol":"》"},{"code":"ZXBW","stroke":"Z難月田","symbol":"︽"},{"code":"ZXBX","stroke":"Z難月難","symbol":"︾"},{"code":"ZXBY","stroke":"Z難月卜","symbol":"〈"},{"code":"ZXCA","stroke":"Z難金日","symbol":"〉"},{"code":"ZXCB","stroke":"Z難金月","symbol":"︵"},{"code":"ZXCC","stroke":"Z難金金","symbol":"︶"},{"code":"ZXCD","stroke":"Z難金木","symbol":"┌"},{"code":"ZXCE","stroke":"Z難金水","symbol":"┘"},{"code":"ZXCF","stroke":"Z難金火","symbol":"┐"},{"code":"ZXCG","stroke":"Z難金土","symbol":"└"},{"code":"ZXCH","stroke":"Z難金竹","symbol":"『"},{"code":"ZXCI","stroke":"Z難金戈","symbol":"』"},{"code":"ZXCJ","stroke":"Z難金十","symbol":"┐"},{"code":"ZXCK","stroke":"Z難金大","symbol":"┘"},{"code":"ZXCL","stroke":"Z難金中","symbol":"("},{"code":"ZXCM","stroke":"Z難金一","symbol":")"},{"code":"ZXCN","stroke":"Z難金弓","symbol":"{"},{"code":"ZXCO","stroke":"Z難金人","symbol":"}"},{"code":"ZXCP","stroke":"Z難金心","symbol":"〔"},{"code":"ZXCQ","stroke":"Z難金手","symbol":"〕"},{"code":"ZXCR","stroke":"Z難金口","symbol":"‘"},{"code":"ZXCS","stroke":"Z難金戶","symbol":"’"},{"code":"ZXCT","stroke":"Z難金甘","symbol":"“"},{"code":"ZXCU","stroke":"Z難金山","symbol":"”"},{"code":"ZXCV","stroke":"Z難金女","symbol":"﹑"},{"code":"ZXCW","stroke":"Z難金田","symbol":"〞"},{"code":"ZXCX","stroke":"Z難金難","symbol":"‵"},{"code":"ZXCY","stroke":"Z難金卜","symbol":"′"}];
const PUNCTUATION_NAMES = {" ":"空白符","，":"逗號","、":"頓號","。":"句號","．":"全形點","‧":"間隔點","；":"分號","：":"冒號","？":"問號","！":"驚嘆號","︰":"直排點號","…":"刪節號","‥":"雙點省略號","﹐":"小逗號","﹑":"小頓號","﹔":"小分號","﹕":"小冒號","﹖":"小問號","﹗":"小驚嘆號","｜":"全形豎線","—":"長破折線","│":"垂直細線","──":"雙水平細線","─":"水平細線","┆":"垂直虛線","﹏":"低波浪線","(":"開圓括號",")":"閉圓括號","⁀":"上弧線","‿":"下弧線","{":"開大括號","}":"閉大括號","﹋":"波浪線","﹌":"雙波浪線","[":"開方括號","]":"閉方括號","︹":"直排開括號","︺":"直排閉括號","【":"開實心方頭括號","】":"閉實心方頭括號","〔":"開六角括號","〕":"閉六角括號","《":"開書名號","》":"閉書名號","︽":"直排開書名號","︾":"直排閉書名號","〈":"開篇名號","〉":"閉篇名號","︵":"直排開圓括號","︶":"直排閉圓括號","┌":"左上角線","┘":"右下角線","┐":"右上角線","└":"左下角線","『":"內層開引號","』":"內層閉引號","‘":"左單引號","’":"右單引號","“":"左雙引號","”":"右雙引號","〞":"雙撇號","‵":"反撇號","′":"撇號"};
const PUNCTUATION_NOTES = {"，":["句子裡的短暫停頓。","今天陽光很好，我們一起去玩。"],"。":["一句話說完了。","我喜歡學中文。"],"、":["並列詞語之間的停頓。","我帶了鉛筆、橡皮和尺。"],"？":["用在問句結尾。","你準備好了嗎？"],"！":["表達強烈感受。","你做得太棒了！"],"；":["分隔意思相關的分句。","哥哥喜歡畫畫；妹妹喜歡唱歌。"],"：":["引出說明或話語。","今日任務：一起練倉頡。"]," ":["畫面以 ␠ 代表原表的空白；請輸入四個字母，再按空白鍵送出。","A B"],"…":["中文刪節號常連用兩個。","他想了又想……終於有答案。"],"—":["中文破折號常連用兩個。","我的夢想——成為老師。"],"『":["內層引文的開始。","她說：「老師說『加油』。」"],"』":["內層引文的結束。","她說：「老師說『加油』。」"],"《":["書籍名稱的開始。","我正在讀《小王子》。"],"》":["書籍名稱的結束。","我正在讀《小王子》。"]};
const PUNCTUATION = PUNCTUATION_REFERENCE.map(row=>{
 const teaching=PUNCTUATION_NOTES[row.symbol]||['依用戶提供的符號表練習這個字形。',`符號「${row.symbol}」的輸入練習。`],variants=PUNCTUATION_REFERENCE.filter(p=>p.symbol===row.symbol);
 return {char:row.symbol,code:row.code.toLowerCase(),stroke:row.stroke,name:PUNCTUATION_NAMES[row.symbol],kind:'punct',note:teaching[0]+(variants.length>1?` 同形符號有 ${variants.length} 種碼，本題指定 ${row.code}。`:''),sentence:teaching[1],group:row.code.slice(0,3).toLowerCase()};
});
function displayCharacter(question){return question.kind==='punct'&&question.char===' '?'␠':question.char}
function punctuationGuide(){return `<p class="chart-note">依你提供的 ZX 符號表，完整收錄 75 筆，包括空白、點號、括號、直排字形與線段。輸入四碼後按空白鍵。␠ 代表原表空白；同形異碼分開列出，答題以本題指定的那一列判定。字根標示保留原表的 Z／戶／甘寫法。</p><div class="punctuation-toolbar"><label for="punctuation-search">找符號、字碼或字根<input id="punctuation-search" type="search" placeholder="例如：ZXAP、間隔點、Z難日戶" autocomplete="off"></label><div role="group" aria-label="符號組別"><button data-punctuation-filter="all" aria-pressed="true">全部 75</button>${['zxa','zxb','zxc'].map(g=>`<button data-punctuation-filter="${g}" aria-pressed="false">${g.toUpperCase()} 組</button>`).join('')}</div><output id="punctuation-count" aria-live="polite">75 筆符號碼</output></div><div class="punctuation-guide">${PUNCTUATION.map(p=>`<article data-punctuation-card data-punctuation-group="${p.group}" data-punctuation-query="${htmlEscape([p.char,p.code,p.name,p.stroke].join(' '))}"><b aria-label="${p.name}">${htmlEscape(displayCharacter(p))}</b><div><strong>${p.name}</strong><code>${p.code.toUpperCase()}</code><small class="punctuation-stroke">原表：${p.stroke}</small><p>${p.note}</p><small>${htmlEscape(p.sentence)}</small></div><button class="text-button" data-punctuation="${p.code}">試試看 →</button></article>`).join('')}</div><button class="primary" id="punctuation-go">開始標點練習 →</button>`}

function variantText(key,field){
 let text=VARIANTS[key][field];
 if(currentVersion==='5'&&field==='example')text=text.replace(/([\u3400-\u9fff])\s+([A-Z]{1,5})/g,(match,char)=>CODE_TABLES['5'][char]?`${char} ${CODE_TABLES['5'][char].toUpperCase()}`:match);
 if(currentVersion==='5')text=text.replace(/又 NK/g,'又 E').replace(/「又」本身輸入 NK/g,'「又」本身輸入 E').replace(/入取 OH/g,'入取 O');
 return text;
}
