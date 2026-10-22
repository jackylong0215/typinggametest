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


## 4,884 字與 IDS 對應

`colour-library.js` 提供 4,884 字原始輪廓，與原有示範合計 5,000 字。來源：Make Me A Hanzi（https://github.com/skishore/makemeahanzi），2026-10-21 取得的 dictionary.txt／graphics.txt；完整來源檔 SHA-256 記錄於 `data/colour-source.json` 的 source 欄位。保留輪廓，只增加部件分組及 SVG 裁切標色。

修改後的必要字形子集、IDS 結構與筆畫對應保存在 `data/colour-source.json`。dictionary.txt 衍生資料採 LGPL 3.0 或更新版本；graphics.txt 由 Arphic PL KaitiM GB／Arphic PL UKai 衍生，採 Arphic Public License。上游來源聲明、LGPL、GPL 與 Arphic 完整授權分別保留在 `licenses/MAKE_ME_A_HANZI.txt`、`licenses/LGPL-3.0.txt`、`licenses/GPL-3.0.txt`、`licenses/ARPHICPL.TXT`。生成腳本與部件對應可在本專案中取得。

## 常用度排列

選字順序參考 wordfreq 3.1.1 的中文詞頻，將字詞用 OpenCC 0.1.7 轉為繁體後累計字的使用量，再優先選取有明確筆畫對應的字；並保留全部既有教學示範。此排序不是官方常用字表或學校課綱。

wordfreq © 2022 Robyn Speer，https://github.com/rspeer/wordfreq 。詞頻資料採 Creative Commons Attribution-ShareAlike 4.0（https://creativecommons.org/licenses/by-sa/4.0/）；衍生的選字排序同樣以 CC BY-SA 4.0 提供。完整上游資料來源及署名見 `licenses/WORDFREQ-NOTICE.md`，包含 Marc Brysbaert 等人的 SUBTLEX、OpenSubtitles、Wikipedia 等來源。保留字序，未分發套件或完整詞頻檔。


用戶新提供的十二字標色截圖只作取形參考，沒有直接貼圖或修改截圖。部件以同一批 Arphic 衍生 SVG 輪廓重建；巔的十頭真特別重組自巅的原始部件與巔的山、頁，完整逐筆來源保留於資料檔的 contour_adaptations 及 reference_original_graphics。其餘字保持整字原始輪廓。

本輪新增部件參考同樣只用作取形依據，全部使用既有授權輪廓重建，不直接使用截圖。乙的輪廓取自同一 Make Me A Hanzi 原始資料；其獨立 NU 與部件 N 分別處理。

## 用戶提供的 ZX 符號表

`data/punctuation-user-reference.json` 保存用戶在對話提供的 75 筆 `code`／`stroke`／`symbol` 原表；執行時的 `learning.js` 符號教材以該表為準，取代前版 20 筆 ibus-table 選例。特別保留同形異碼、原表空白、線段及字根名稱，不以其他符號來源覆蓋用戶資料。
