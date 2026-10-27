const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const reference = JSON.parse(read('data/moe-common-4808.json'));
const completion = JSON.parse(read('data/moe-colour-completion-20261026.json'));
const baseline = JSON.parse(read('data/colour-baseline-10317.json'));
const referenceCorrections = {...JSON.parse(read('data/colour-corrections-20261026-batch2.json')).characters,...JSON.parse(read('data/colour-corrections-20261026-shared.json')).characters,...JSON.parse(read('data/colour-corrections-20261027-context.json')).characters,...JSON.parse(read('data/colour-corrections-20261027-semantic.json')).characters};
const context = vm.createContext({});
vm.runInContext(['code-data.js', 'stroke-data.js', 'learning.js', 'extra-colours.js', 'colour-library.js'].map(read).join('\n') +
  ';globalThis.library={SPLIT_VISUALS,STROKE_DATA,CODE_TABLES,COLOUR_ORDER};', context);
const lib = context.library;
const hash = v => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');

test('教育部甲表4808個不同字全部可在五代彩色教室使用', () => {
  const chars = [...reference.characters];
  assert.equal(chars.length, 4808);
  assert.equal(new Set(chars).size, 4808);
  assert.equal(crypto.createHash('sha256').update(chars.join('\n') + '\n').digest('hex'), reference.referenceSha256);
  const catalogue = new Set(lib.COLOUR_ORDER);
  for (const char of chars) {
    assert.ok(catalogue.has(char), char);
    assert.ok(lib.STROKE_DATA[char]?.length, char);
    assert.equal(lib.SPLIT_VISUALS[char].parts.map(p => p[1]).join(''), lib.CODE_TABLES['5'][char], char);
    assert.ok(lib.CODE_TABLES['3'][char], char);
  }
});

test('恰好新增625字；原有10317字只接受逐字列明的用戶參考修正', () => {
  assert.equal(Object.keys(baseline).length, 10317);
  assert.equal(completion.added.length, 625);
  assert.equal(new Set(completion.added).size, 625);
  assert.deepEqual(Array.from(lib.COLOUR_ORDER).filter(c => !baseline[c]), completion.added);
  assert.deepEqual(Array.from(lib.COLOUR_ORDER).slice(0, 10317), Object.keys(baseline));
  for (const [char, expected] of Object.entries(baseline)) {
    assert.equal(lib.CODE_TABLES['5'][char], expected.code5, char);
    assert.equal(lib.CODE_TABLES['3'][char], expected.code3, char);
    assert.equal(hash(lib.SPLIT_VISUALS[char]), referenceCorrections[char]?.visualSha256 || expected.visualSha256, char);
    assert.equal(hash(lib.STROKE_DATA[char]), referenceCorrections[char]?.strokesSha256 || expected.strokesSha256, char);
  }
});

test('呂的中撇及吳、彥、勻、產與八形使用對應的實際輪廓', () => {
  const source = JSON.parse(read('data/colour-source.json'));
  for (const [char, strokes] of Object.entries({莒:10, 鋁:15, 閭:15})) {
    assert.equal(lib.STROKE_DATA[char].length, strokes, char);
    assert.ok(source.dictionary[char].decomposition.includes('呂'), char);
    assert.equal(source.moe_original_graphics[char].strokes.length, strokes - 1, char);
  }
  for (const [char, component] of Object.entries({誤:'吳', 諺:'彥', 鈞:'勻', 鏟:'產', 沿:'八', 鉛:'八', 船:'八'})) {
    assert.ok(source.dictionary[char].decomposition.includes(component), char);
    assert.notEqual(hash(source.graphics[char].strokes), hash(source.moe_original_graphics[char].strokes), char);
  }
});
