const fs = require('node:fs');
const path = require('node:path');
const read = name => {const text=fs.readFileSync(path.join(__dirname,name),'utf8');return name==='auxiliary-data.js'?text.replace('./assets/cj-table-kll.png','data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'assets/cj-table-kll.png')).toString('base64')):text};
const output = path.resolve(process.argv[2] || path.join(__dirname, 'dist', '倉頡小島試玩.html'));
const css = read('style.css').replace(/^@import[^\n]*\n/gm, '');
const html = read('index.html')
  .replace('<link rel="stylesheet" href="/style.css">', () => `<style>${css}</style>`)
  .replace(/<script src="\/([^"]+)"><\/script>/g, (_, name) => `<script>${read(name).replaceAll('</script','<'+String.fromCharCode(92)+'/script')}</script>`)
  .replace('class="brand" href="/"', 'class="brand" href="#"')
  .replace('</body>', () => `<details class="license-notice"><summary>資料來源與授權</summary><pre>${(['THIRD_PARTY_NOTICES.md','licenses/ARPHICPL.TXT','licenses/MAKE_ME_A_HANZI.txt','licenses/LGPL-3.0.txt','licenses/GPL-3.0.txt','licenses/GPL-2.0.txt','licenses/CJKVI_IDS.md','licenses/WORDFREQ-NOTICE.md'].map(read).join('\n\n')).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</pre></details></body>`);
fs.mkdirSync(path.dirname(output), {recursive: true});
fs.writeFileSync(output, html);
console.log(`已匯出：${output}`);
