# 資料來源與授權

## 用戶提供的倉頡五代碼表

`data/cangjie5_single_main.json` 是用戶上傳的原檔，原樣保留（內含 `_source: cangjie5_dict.json`）。收錄 20,840 字的主碼。`code-data.js` 的五代資料直接由此檔生成。此為本專案獲提供的參考資料，不宣稱其原始出版來源或額外授權。

## 倉頡三代與符號碼

來源：Roy Hiu-yeung Chan／倉頡之友的三代碼表，經 ibus-table-chinese 整理。

https://github.com/kaio/ibus-table-chinese/blob/53a25b8b7e84b34bf1d14f16dd3a2761fadaa9cc/tables/cangjie/cangjie3.txt

完整原檔位於 `data/cangjie3-source.txt`，保留原有檔頭。檔內授權聲明：`Freely redistributable without restriction`。前版標點選例曾取自此表；目前標點練習改依下方記錄的用戶 ZX 符號表。

## 原字筆畫輪廓

`stroke-data.js` 的 116 字筆畫輪廓取自 Hanzi Writer Data，固定來源版本：

https://github.com/chanind/hanzi-writer-data/tree/68d10a4b21150cae5e1ebbd223eed289cf32d90c/data

資料來自 Make Me A Hanzi，由文鼎科技（Arphic Technology）字型提取，遵循 Arphic Public License。完整授權保留於 `licenses/ARPHICPL.TXT`；單檔試玩版亦包含完整授權。本站自行加入部件分組與教學標色，沒有改動原始筆畫輪廓。

## 用戶提供的教學圖片

原字配色示例及 hkcards 三代輔助字形表作為用戶提供的教學參考。`assets/cj-table-kll.png` 是用戶提供的完整原圖，來源 hkcards 倉頡字典（https://www.hkcards.com/），保留原有來源標示及浮水印；原圖權利歸原權利人所有。

`auxiliary-data.js` 僅保存用戶所示三代參考圖的取景座標。透過 SVG image viewport 顯示內建原圖的對應區域，完整原圖檢視保留原有來源標示及浮水印。網站以獨立圖片載入，離線匯出則內嵌相同原圖。


## 生成字庫與 IDS 對應

`colour-library.js` 提供 10,081 個生成模型，與原有示範合計 10,197 字。大部分輪廓來源如下；2026-10-22 新來源與重組字形另列於下節。來源：Make Me A Hanzi（https://github.com/skishore/makemeahanzi），2026-10-21 取得的 dictionary.txt／graphics.txt；完整來源檔 SHA-256 記錄於 `data/colour-source.json` 的 source 欄位。保留輪廓，只增加部件分組及 SVG 裁切標色。

修改後的必要字形子集、IDS 結構與筆畫對應保存在 `data/colour-source.json`。dictionary.txt 衍生資料採 LGPL 3.0 或更新版本；graphics.txt 由 Arphic PL KaitiM GB／Arphic PL UKai 衍生，採 Arphic Public License。上游來源聲明、LGPL、GPL 與 Arphic 完整授權分別保留在 `licenses/MAKE_ME_A_HANZI.txt`、`licenses/LGPL-3.0.txt`、`licenses/GPL-3.0.txt`、`licenses/ARPHICPL.TXT`。生成腳本與部件對應可在本專案中取得。

## 常用度排列

選字順序參考 wordfreq 3.1.1 的中文詞頻，將字詞用 OpenCC 0.1.7 轉為繁體後累計字的使用量，再優先選取有明確筆畫對應的字；並保留全部既有教學示範。此排序不是官方常用字表或學校課綱。

wordfreq © 2022 Robyn Speer，https://github.com/rspeer/wordfreq 。詞頻資料採 Creative Commons Attribution-ShareAlike 4.0（https://creativecommons.org/licenses/by-sa/4.0/）；衍生的選字排序同樣以 CC BY-SA 4.0 提供。完整上游資料來源及署名見 `licenses/WORDFREQ-NOTICE.md`，包含 Marc Brysbaert 等人的 SUBTLEX、OpenSubtitles、Wikipedia 等來源。保留字序，未分發套件或完整詞頻檔。


用戶新提供的十二字標色截圖只作取形參考，沒有直接貼圖或修改截圖。部件以同一批 Arphic 衍生 SVG 輪廓重建；巔的十頭真特別重組自巅的原始部件與巔的山、頁，完整逐筆來源保留於資料檔的 contour_adaptations 及 reference_original_graphics。其餘字保持整字原始輪廓。

本輪新增部件參考同樣只用作取形依據，全部使用既有授權輪廓重建，不直接使用截圖。乙的輪廓取自同一 Make Me A Hanzi 原始資料；其獨立 NU 與部件 N 分別處理。

## 用戶提供的 ZX 符號表

`data/punctuation-user-reference.json` 保存用戶在對話提供的 75 筆 `code`／`stroke`／`symbol` 原表；執行時的 `learning.js` 符號教材以該表為準，取代前版 20 筆 ibus-table 選例。特別保留同形異碼、原表空白、線段及字根名稱，不以其他符號來源覆蓋用戶資料。

## AnimCJK 與重組字形（2026-10-22）

喫、羣、溼、嚐、髏使用 AnimCJK 的 SVG 筆畫：
https://github.com/parsimonhi/animCJK/tree/3e1253b341cc7be14c3540bb3c045e6163557777/svgsZhHant

AnimCJK 2016–2026 Copyright FM-SH。這些筆畫由 Make Me A Hanzi 與 Arphic PL KaitiM GB／Big5 字型衍生，採 Arphic Public License。原 SVG（含原版權聲明）保存在 `data/reference-sources/`，授權全文見 `licenses/ARPHICPL.TXT`。處理僅將 SVG 向下的 Y 軸轉成本站向上的座標系，再加上分組及裁切標色。

牀、峯、揹、緹、綾、譁使用 Make Me A Hanzi 同字型的部件輪廓，依用戶參考的字形佈局重組，屬本站修改後的衍生字形。各部件來源及仿射目標位置保存在 `data/colour-source.json` 的 `contour_adaptations`，同樣遵循 Arphic Public License。這些字不應被描述為未修改的完整原字輪廓。

## CJKVI／CHISE 結構與新增部件重製（2026-10-22）

`data/component-compositions.json` 的 676 筆左右結構描述來自 CJKVI Database／CHISE IDS Database 的 `ids.txt`：
https://github.com/cjkvi/cjkvi-ids/blob/86b4d16159f0079437870408f0ca186e529015db/ids.txt

Copyright (c) 2014–2017 CJKVI Database. Based on CHISE IDS Database. 這些結構資料依上游所述 CHISE／GPLv2 條款分開歸屬，來源說明見 `licenses/CJKVI_IDS.md`，GPLv2 全文見 `licenses/GPL-2.0.txt`。來源檔 SHA-256、版本、IDS 描述、原部件及重製座標保存在資料檔內。

重製輪廓由既有 Make Me A Hanzi／Arphic 同字型部件作仿射變換，沿用 Arphic Public License；座標保留至 0.01 單位。這些是本站修改的學習字形，不應視作未修改的完整原字筆畫。`scripts/rebuild-component-compositions.py` 提供可重現重組與核對；一般網站建置只使用凍結資料。使用的 FontTools 為 MIT 授權的開發工具，未作網站執行時依賴。

## 一萬字擴展（2026-10-23）

本批增加 154 個使用現有 Make Me A Hanzi 原字輪廓的模型，與 1,634 個由現有同字型部件重製的左右合體字。CJKVI／CHISE 結構版本未變，仍為 `86b4d16159f0079437870408f0ca186e529015db`；`data/component-compositions.json` 現累計 2,310 個方案，保留每字 IDS、原部件及目標座標。IDS 仍依前述 GPLv2 條款歸屬，修改後筆畫輪廓仍依 Arphic Public License。新增的重製字形不是取得的完整原字輪廓。

擴展選字使用先前已列明的 wordfreq 3.1.1 與 OpenCC 0.1.7；FontTools 4.61.1 僅用於開發時重製輪廓，網站不載入這些依賴。原有用戶參考及所有來源標示保持不變。


2026-10-23：新增東、凍、棟、陳、腖、鶇六個模型，均使用上述已凍結的 Make Me A Hanzi 原字筆畫與部件對應，沒有新增外部輪廓來源。欞及共用部件標色只調整分組與裁切，保留原輪廓。

2026-10-23 第二批：新增贏、函、面模型，並按用戶參考圖修正盒、兔、鬼、冤、卑、非的獨立字取碼；全部沿用已凍結的 Make Me A Hanzi 原字輪廓，沒有新增外部輪廓來源。


2026-10-23 第三批：食字旁及新增參考字沿用已凍結 Make Me A Hanzi 輪廓。為字改用 AnimCJK 的點頭字形：`data/reference-sources/animcjk-28858.svg`，來源 https://github.com/parsimonhi/animCJK/blob/master/svgsZhHant/28858.svg ，原 SVG 著作權聲明完整保留，適用 Arphic Public License（`licenses/ARPHICPL.TXT`）。僅以 y→900−y 轉換座標，來源 SHA-256 與原字備份記錄於 `data/colour-source.json`。
