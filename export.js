const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
const output = path.resolve(process.argv[2] || path.join(__dirname, 'dist', '倉頡小島試玩.html'));
const css = read('style.css').replace(/^@import[^\n]*\n/gm, '');
const html = read('index.html')
  .replace('<link rel="stylesheet" href="/style.css">', () => `<style>${css}</style>`)
  .replace('<script src="/code-data.js"></script><script src="/stroke-data.js"></script><script src="/auxiliary-data.js"></script><script src="/learning.js"></script><script src="/extra-colours.js"></script><script src="/colour-library.js"></script><script src="/game-core.js"></script><script src="/reference-image.js"></script><script src="/app.js"></script>', () => `<script>${read('code-data.js')}</script><script>${read('stroke-data.js')}</script><script>${read('auxiliary-data.js')}</script><script>${read('learning.js')}</script><script>${read('extra-colours.js')}</script><script>${read('colour-library.js')}</script><script>${read('game-core.js')}</script><script>${read('reference-image.js')}</script><script>${read('app.js')}</script>`)
  .replace('class="brand" href="/"', 'class="brand" href="#"')
  .replace('</body>', () => `<details class="license-notice"><summary>資料來源與授權</summary><pre>${(['THIRD_PARTY_NOTICES.md','licenses/ARPHICPL.TXT','licenses/MAKE_ME_A_HANZI.txt','licenses/LGPL-3.0.txt','licenses/GPL-3.0.txt','licenses/WORDFREQ-NOTICE.md'].map(read).join('\n\n')).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</pre></details></body>`);
fs.mkdirSync(path.dirname(output), {recursive: true});
fs.writeFileSync(output, html);
console.log(`已匯出：${output}`);
