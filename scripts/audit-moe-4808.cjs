// Usage: node scripts/audit-moe-4808.cjs /path/to/教育部4808常用字.txt
// Read the reference locally; no network requests or application changes.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const referencePath = process.argv[2];
const frozen = JSON.parse(fs.readFileSync(path.join(root, 'data/moe-common-4808.json'), 'utf8'));
const reference = referencePath ? fs.readFileSync(referencePath) : Buffer.from([...frozen.characters].join('\n') + '\n');
const referenceHash = crypto.createHash('sha256').update(reference).digest('hex');
assert.equal(referenceHash, 'f8ed2e0bae517d27c73e3fd5d2b2d6fe08b45f9d1f6c3745361162593c33137e', '字表必須與已交叉核對的來源一致');
const chars = reference.toString('utf8').trim().split(/\r?\n/);
assert.equal(chars.length, 4808);
assert.equal(new Set(chars).size, 4808);
assert.ok(chars.every(c => [...c].length === 1));
const files = ['code-data.js', 'stroke-data.js', 'learning.js', 'extra-colours.js', 'colour-library.js'];
const context = vm.createContext({});
vm.runInContext(files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n') +
  ';globalThis.audit={COLOUR_ORDER,CODE_TABLES,STROKE_DATA,SPLIT_VISUALS};', context);
const {COLOUR_ORDER, CODE_TABLES, STROKE_DATA, SPLIT_VISUALS} = context.audit;
const catalogue = new Set(COLOUR_ORDER);
assert.equal(catalogue.size, COLOUR_ORDER.length);
const rows = chars.map((char, i) => {
  const visualCode = SPLIT_VISUALS[char]?.parts.map(p => p[1]).join('') || '';
  const validModel = catalogue.has(char) && !!STROKE_DATA[char]?.length && !!visualCode;
  return {
    id: 'A' + String(i + 1).padStart(5, '0'), char,
    unicode: 'U+' + char.codePointAt(0).toString(16).toUpperCase(),
    cj5: CODE_TABLES['5'][char] || '', cj3: CODE_TABLES['3'][char] || '',
    colour5: validModel && visualCode === CODE_TABLES['5'][char],
    colour3: validModel && visualCode === CODE_TABLES['3'][char],
    visualCode,
  };
});
const missing5 = rows.filter(r => !r.colour5);
const missing3 = rows.filter(r => !r.colour3);
const threeOnly = rows.filter(r => r.colour5 && !r.colour3);
const count = (field) => rows.filter(r => r[field]).length;
const inputHashes = Object.fromEntries(files.map(f => [f, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex')]));
const summary = {
  date: '2026-10-26',
  dataRevisionSha256: inputHashes['colour-library.js'],
  inputHashes,
  source: {
    title: '教育部《常用國字標準字體表》：民國71年9月1日公告，4808字',
    official: 'https://language.moe.gov.tw/result.aspx?classify_sn=23&subclassify_sn=437&content_sn=46',
    reference: 'https://github.com/irvin/moe-common-phrases-of-zhtw/blob/08977555e16c27f5d198551dc99e9395810a3e77/教育部1982常用字/教育部4808常用字.txt',
    referenceSha256: referenceHash,
    crossCheck: 'https://github.com/TraditionalChinese/TW-ABCN/blob/39e40cedd439de994a0344b6ac996011b5783c24/臺灣TW-ABCN正字甲乙丙表.xlsx',
    crossCheckSha256: '239a0fb2f4fa4ed176eb38c85f81df5dc3c28f15011bc0bc45564e99d3262595',
    crossCheckResult: 'A常用字4808 工作表的全部字號、字元及順序一致；此交叉核對於本次稽核時另行執行。',
    accessNote: '本環境未能直接存取教育部網站；使用附教育部原始說明的固定版本鏡像，並與獨立甲表整理交叉核對。',
  },
  total: chars.length,
  catalogueTotal: catalogue.size,
  cj5Codes: count('cj5'), cj3Codes: count('cj3'),
  colour5: count('colour5'), colour3: count('colour3'),
  missing5: missing5.length, missing3: missing3.length,
  threeOnly: threeOnly.length,
  missingFiveCharacters: missing5.map(r => r.char).join(''),
  threeOnlyCharacters: threeOnly.map(r => r.char).join(''),
};
assert.equal(summary.colour5 + summary.missing5, summary.total);
assert.equal(summary.colour3 + summary.missing3, summary.total);
const output = path.join(root, 'reports');
fs.mkdirSync(output, {recursive: true});
const write = (name, value) => fs.writeFileSync(path.join(output, name), value);
const csv = data => '\ufeff' + ['教育部字號,中文字,Unicode,倉頡五代,倉頡三代,五代彩色字形,三代彩色字形,缺少原因', ...data.map(r =>
  [r.id, r.char, r.unicode, r.cj5.toUpperCase(), r.cj3.toUpperCase(), r.colour5 ? '有' : '缺', r.colour3 ? '有' : '缺',
    r.colour5 ? '已有五代模型；取碼與三代不同' : '未收錄彩色模型'].join(','))].join('\n') + '\n';
write('moe-4808-missing-five.csv', csv(missing5));
write('moe-4808-three-only.csv', csv(threeOnly));
write('moe-4808-summary.json', JSON.stringify(summary, null, 2) + '\n');
const groups = data => Array.from({length: Math.ceil(data.length / 25)}, (_, i) => {
  const group = data.slice(i * 25, (i + 1) * 25);
  return `| ${i * 25 + 1}–${i * 25 + group.length} | ${group.map(r => r.char).join('　')} |`;
}).join('\n');
const report = `# 教育部 4,808 常用字收錄核對

核對日期：${summary.date}。字庫 SHA-256：\`${summary.dataRevisionSha256}\`。

## 核對結果

| 項目 | 已收錄 | 缺少 | 覆蓋率 |
| --- | ---: | ---: | ---: |
| 倉頡五代字碼 | ${summary.cj5Codes} | ${summary.total - summary.cj5Codes} | ${(summary.cj5Codes / summary.total * 100).toFixed(2)}% |
| 倉頡三代字碼 | ${summary.cj3Codes} | ${summary.total - summary.cj3Codes} | ${(summary.cj3Codes / summary.total * 100).toFixed(2)}% |
| 五代彩色字形 | ${summary.colour5} | ${summary.missing5} | ${(summary.colour5 / summary.total * 100).toFixed(2)}% |
| 三代彩色字形 | ${summary.colour3} | ${summary.missing3} | ${(summary.colour3 / summary.total * 100).toFixed(2)}% |

網站彩色字庫共 ${summary.catalogueTotal.toLocaleString('en-US')} 字，其中 ${summary.colour5.toLocaleString('en-US')} 字屬於教育部甲表。上述「缺少」是彩色拆字模型的缺口；這些字的三代及五代碼表均已有字碼。三代的缺口包含五代缺少的 ${summary.missing5} 字，另加 ${summary.threeOnly} 個已有五代模型、但三代取碼不同的字。

這是收錄覆蓋檢查，不代表已逐字驗證現有模型是否符合教育部標準字形、部件比例或標色正確性；亦不將暫時網路載入失敗算為未收錄。

## 資料來源與方法

- [教育部原始資料頁](${summary.source.official})。
- [4,808 字文字鏡像及教育部原始說明](${summary.source.reference})，固定版本 \`08977555e16c27f5d198551dc99e9395810a3e77\`。
- [甲表獨立整理 XLSX](${summary.source.crossCheck})，固定版本 \`39e40cedd439de994a0344b6ac996011b5783c24\`。已核對「A常用字4808」工作表：4,808 個字號、字元及順序全部一致，沒有重複字或空白字。
- 本環境未能直接存取教育部網站；採用上述鏡像交叉核對。鏡像附的教育部說明指出，此資料對應民國71年9月1日公告的常用國字標準字體表。原始字表權利歸教育部；未將其標示為本專案的開放授權資料。
- 按 Unicode 字元精確比對，不進行簡繁轉換、異體字替換或相容字正規化。字號依甲表順序從 A00001 至 A04808。
- 載入網站全部字碼、人工模型及生成模型，套用現行修正，檢查 \`COLOUR_ORDER\`、筆畫及模型取碼是否與所選代碼一致。沒有只統計生成模型的稽核表，也沒有把尚未下載的分片當作缺字。
- 來源與網站輸入檔案 SHA-256 記錄於 [JSON 摘要](moe-4808-summary.json)。

重跑：在專案根目錄執行 \`node scripts/audit-moe-4808.cjs\`；亦可另提供原始文字字表路徑。程式會驗證字表雜湊及字數，再重新產生報告。

## 五代缺字

${missing5.length ? `[下載完整缺字 CSV](moe-4808-missing-five.csv)。\n\n| 清單序位 | 缺字 |\n| --- | --- |\n${groups(missing5)}` : '五代已收齊 4,808 字，缺字為 0。本輪補入原先缺少的 625 字，詳見 [新增 625 字清單](moe-4808-added-20261026.csv)。'}

## 三代另缺的 ${summary.threeOnly} 字

這些字已有五代彩色模型；因三代取碼不同，目前三代模式不展示該模型。連同上方 ${summary.missing5} 字，三代合計缺 ${summary.missing3} 字。

[下載這 ${summary.threeOnly} 字的 CSV](moe-4808-three-only.csv)。

| 清單序位 | 字元 |
| --- | --- |
${groups(threeOnly)}
`;
write('moe-4808-coverage.md', report);
console.log(JSON.stringify({total: summary.total, catalogue: summary.catalogueTotal, cj5Codes: summary.cj5Codes, cj3Codes: summary.cj3Codes, colour5: summary.colour5, colour3: summary.colour3, missing5: summary.missing5, missing3: summary.missing3, threeOnly: summary.threeOnly}, null, 2));
