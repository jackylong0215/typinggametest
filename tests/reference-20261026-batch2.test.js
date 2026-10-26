const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..'), read = p => fs.readFileSync(path.join(root, p), 'utf8');
const c = vm.createContext({});
vm.runInContext(['code-data.js','stroke-data.js','learning.js','extra-colours.js','colour-library.js'].map(read).join('\n') +
  ';globalThis.d={v:SPLIT_VISUALS,s:STROKE_DATA,c:CODE_TABLES};', c);
const source = JSON.parse(read('data/colour-source.json'));
const parts = char => Array.from(c.d.v[char].parts, p => Array.from(p[2]));

test('侵與浸以彐外框取尸、長中橫取一，冖完全留灰', () => {
  for (const [char, offset] of [['侵',0],['浸',1]]) {
    assert.deepEqual(parts(char)[1], [2+offset,4+offset]);
    assert.deepEqual(parts(char)[2], [3+offset]);
    assert.deepEqual(Array.from(c.d.v[char].ignored), [5+offset,6+offset]);
    const line = source.graphics[char].medians[3+offset];
    assert.ok(Math.max(...line.map(p=>p[0]))-Math.min(...line.map(p=>p[0]))>450, char);
  }
});

test('后以兩撇取竹；而的丆含頂橫下撇；戶改用所的撇頭完整戶形', () => {
  assert.deepEqual(parts('后'), [[0,1],[2],[3,4,5]]);
  assert.deepEqual(parts('而')[0], [0,1]);
  assert.deepEqual(parts('戶'), [[0,3],[1,2]]);
  const roof = source.graphics['戶'].medians[0];
  assert.ok(roof.at(-1)[0]<roof[0][0], '戶是向左下的撇，不是向右下的點');
  for (const [char, code] of Object.entries({丈:'jk',侵:'osme',吏:'jlk',后:'hmr',而:'mbll',戶:'hs',毛:'hqu',九:'kn'})) {
    assert.equal(c.d.v[char].parts.map(p=>p[1]).join(''),code,char);
    assert.equal(c.d.c['5'][char],code,char);
  }
});

test('毛的上下裁切只作用於中豎，向上鉤尖整段歸山', () => {
  const app = read('app.js');
  vm.runInContext('function glyphClipRect'+app.split('function glyphClipRect')[1].split('function glyphPaths')[0]+';globalThis.clip=glyphSplitRegion;', c);
  const split = c.d.v['毛'].splitStrokes[0];
  assert.equal(split.boundary,260);
  assert.equal(split.xLimit,650);
  const rectangles = text => Array.from(text.matchAll(/<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/g), m => m.slice(1).map(Number));
  const upper = rectangles(c.clip(split,true)), lower = rectangles(c.clip(split,false));
  const inside = (rs,x,y) => rs.some(([a,b,w,h])=>x>=a&&x<a+w&&y>=b&&y<b+h);
  assert.ok(inside(upper,435,400));
  assert.ok(!inside(upper,930,290));
  assert.ok(inside(lower,930,290));
  for(let x=-199.5;x<1200;x+=35)for(let y=-199.5;y<1200;y+=35)assert.notEqual(inside(upper,x,y),inside(lower,x,y));
});

test('丈、九的橫畫分界及吏的十中大三段保留參考所需的交連', () => {
  assert.equal(c.d.v['丈'].splitStrokes[0].boundary,430);
  assert.equal(c.d.v['九'].splitStrokes[0].boundary,500);
  assert.equal(c.d.v['九'].splitStrokes[0].floor,300);
  assert.deepEqual(JSON.parse(JSON.stringify(c.d.v['吏'].strokeRegions[0].segments)),[[-200,340,2],[340,570,1],[570,1200,0]]);
});
