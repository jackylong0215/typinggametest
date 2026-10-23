"""Expand with documented left-right same-font components, never enclosing/shared strokes.
Development dependencies: fonttools==4.61.1, wordfreq==3.1.1,
opencc-python-reimplemented==0.1.7. Runtime builds only need the frozen JSON.
Supply the pinned CJKVI ids.txt locally; this script never fetches network data.
"""
import argparse,hashlib,importlib.util,json,pathlib,statistics,subprocess
from opencc import OpenCC
from wordfreq import get_frequency_dict
ROOT=pathlib.Path(__file__).resolve().parent.parent

def module(name,filename):
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/filename)
    mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod

def snapshot():
    js="""const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),c=vm.createContext({});
vm.runInContext(['code-data.js','stroke-data.js','learning.js','extra-colours.js','colour-library.js'].map(p=>fs.readFileSync(p,'utf8')).join('\\n')+';globalThis.v=SPLIT_VISUALS;globalThis.s=STROKE_DATA',c);
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');let out={};
for(const [ch,v]of Object.entries(c.v))out[ch]={code:v.parts.map(p=>p[1]).join(''),geometrySha256:hash({parts:v.parts.map(p=>[p[1],p[2]]),ignored:v.ignored||[],splits:v.splitStrokes||[],regions:v.strokeRegions||[]}),strokesSha256:hash(c.s[ch])};
process.stdout.write(JSON.stringify(out));"""
    return json.loads(subprocess.check_output(['node','-e',js],cwd=ROOT))

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ids-file',type=pathlib.Path,required=True)
    parser.add_argument('--target',type=int,required=True)
    parser.add_argument('--dry-run',action='store_true')
    args=parser.parse_args()
    source_path=ROOT/'data/colour-source.json';source=json.loads(source_path.read_text())
    comp_path=ROOT/'data/component-compositions.json';compositions=json.loads(comp_path.read_text())
    audit=json.loads((ROOT/'data/colour-audit.json').read_text())
    original=snapshot();previous=len(original)
    if args.target<=previous:raise SystemExit(f'Target must exceed current {previous} models')
    digest=hashlib.sha256(args.ids_file.read_bytes()).hexdigest()
    if digest!=compositions['source']['sha256']:raise SystemExit('IDS source hash differs from pinned source; review it before expanding')
    solver=module('colour_solver','build-colour-library.py')
    geometry=module('colour_geometry','rebuild-component-compositions.py')
    solver.SOURCE['preserved_constructions']=audit['characters']
    candidates={}
    for line in args.ids_file.read_text().splitlines():
        if line.startswith('#'):continue
        fields=line.split('\t')
        if len(fields)<3:continue
        char,ids=fields[1:3]
        if char in solver.C and char not in solver.G and len(ids)==3 and ids[0]=='⿰' and all(c in geometry.G and c in geometry.D for c in ids[1:]):candidates[char]=ids
    cc=OpenCC('s2t');frequency={}
    for word,value in get_frequency_dict('zh').items():
        for c in cc.convert(word):frequency[c]=max(frequency.get(c,0),value)
    order=sorted(candidates,key=lambda c:(cc.convert(c)==c,frequency.get(c,0),-ord(c)),reverse=True)
    added={}
    for char in order:
        ids=candidates[char];a,b=ids[1:]
        cut=350 if a in '亻氵扌忄犭糹纟言讠釒钅礻衤爿' else 650 if b in '刂阝卩力頁页見见' else 490
        boxes=[(65,30,cut,830),(cut+45,30,960,830)]
        parts=[];paths=[];medians=[];matches=[]
        for side,child in enumerate((a,b)):
            box=list(boxes[side]);samples=geometry.placements[('⿰',side,child)]
            part={'character':child}
            if len(samples)>=3:
                for axis in (1,3):box[axis]=round(statistics.median(row[axis]for row in samples),2)
                part['crossAxisPlacementSamples']=len(samples)
            if box[2]<=box[0] or box[3]<=box[1]:break
            part['bounds']=box;parts.append(part)
            strokes,ms=geometry.fit(child,box);paths+=strokes;medians+=ms;matches += [[side]]*len(strokes)
        if len(parts)!=2:continue
        d={'character':char,'decomposition':ids,'matches':matches}
        g={'character':char,'strokes':paths,'medians':medians}
        solver.D[char]=d;solver.G[char]=g
        for strategy in ('expanded','known','reduced'):
            atoms=solver.derive(char,0,strategy)
            visual=solver.compile_visual(char,atoms)if atoms else None
            if visual:break
        else:
            solver.D.pop(char);solver.G.pop(char);continue
        added[char]={'dictionary':d,'graphics':g,'components':parts}
        if previous+len(added)==args.target:break
    if previous+len(added)!=args.target:raise SystemExit(f'Only {previous+len(added)} accepted models available; no files written')
    print(json.dumps({'previous':previous,'added':len(added),'total':args.target,'firstCharacters':''.join(list(added)[:100]),'dryRun':args.dry_run},ensure_ascii=False))
    if args.dry_run:return
    # Preserve all published models, rather than rederive them after expansion.
    baseline=ROOT/f'data/colour-baseline-{previous}.json'
    if baseline.exists():raise SystemExit(f'Baseline {baseline.name} already exists; review before overwriting')
    baseline.write_text(json.dumps(original,ensure_ascii=False,separators=(',',':'))+'\n')
    source['preserved_constructions']=audit['characters']
    source['ranking']+=list(added)
    source['target']=args.target
    source['source']['selection']=f'Existing {previous} published models frozen; {len(added)} documented left-right same-font reconstructions appended with unique code selection.'
    source.setdefault('expansion_history',[]).append({'date':'2026-10-23','previous':previous,'added':list(added),'total':args.target,'method':'Pinned literal left-right IDS; existing same-font components; unambiguous code selection; empirical cross-axis placement; published models frozen.'})
    compositions['characters'].update(added)
    source['expansion']={'previous':previous,'target':args.target,'sharedTemplates':len(source.get('expansion_shared_templates',[])),'reconstructedGlyphs':len(compositions['characters']),'compositionRestriction':'Literal left-right structures only; separate original components, no top-bottom, enclosing or shared-stroke compositions.'}
    comp_path.write_text(json.dumps(compositions,ensure_ascii=False,separators=(',',':'))+'\n')
    source_path.write_text(json.dumps(source,ensure_ascii=False,separators=(',',':'))+'\n')

if __name__=='__main__':main()
