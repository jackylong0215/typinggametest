"""Compile reviewed root templates through Make Me A Hanzi's stroke-to-IDS matches.
No stroke-count interpolation, nearest code, or arbitrary equal-size colouring.
Run with Python 3, no third-party dependencies. Frozen inputs live in data/colour-source.json.
"""
import collections, functools, json, pathlib, subprocess
ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = json.loads((ROOT/'data/colour-source.json').read_text())
D, G, T = SOURCE['dictionary'], SOURCE['graphics'], SOURCE['templates']
COMPOSITIONS=json.loads((ROOT/'data/component-compositions.json').read_text()) if (ROOT/'data/component-compositions.json').exists() else {'characters':{}}
for char,record in COMPOSITIONS['characters'].items():
    D.setdefault(char,record['dictionary']);G.setdefault(char,record['graphics'])
C = json.loads((ROOT/'data/cangjie5_single_main.json').read_text())['chars']
R = SOURCE['roots']
for overrides in [SOURCE.get('code_corrections',{}).get('5',{})]:C.update(overrides)
# Preserve the individually edited examples, including the user's corrections.
js = "const fs=require('fs'),vm=require('vm'),c=vm.createContext({});vm.runInContext(['learning.js','extra-colours.js'].map(p=>fs.readFileSync(p,'utf8')).join('\\n')+';globalThis.v=SPLIT_VISUALS',c);process.stdout.write(JSON.stringify(c.v))"
V = json.loads(subprocess.check_output(['node','-e',js],cwd=ROOT))
TARGET=SOURCE.get('target',5000)
used=set()

def tree(text):
    it=iter(text)
    def parse():
        c=next(it)
        return [parse() for _ in range(3 if c in '⿲⿳' else 2)] if c in '⿰⿱⿴⿵⿶⿷⿸⿹⿺⿻⿲⿳' else c
    try:return parse()
    except (StopIteration,TypeError):return None

def leaves(node,path=()):
    if isinstance(node,str):yield path,node
    elif node:
        for i,child in enumerate(node):yield from leaves(child,path+(i,))

def select(atoms,code):
    """Only accept one unambiguous ordered selection of already identified root shapes."""
    solutions=[]
    def search(start,j,chosen):
        if len(solutions)>128:return
        if j==len(code):solutions.append(chosen);return
        for i in range(start,len(atoms)):
            if atoms[i]['key']==code[j]:search(i+1,j+1,chosen+[i])
    search(0,0,[])
    if len(solutions)==1:return [atoms[i] for i in solutions[0]]
    # Consecutive identical root codes are a repeated-stroke run (e.g. 言's 二).
    # Choose the head occurrence for an inner code and the tail occurrence for the final code.
    # Ambiguity across different runs remains rejected.
    if not solutions:return None
    run=[];run_id=-1;last=None
    for atom in atoms:
        if atom['key']!=last:run_id+=1;last=atom['key']
        run.append(run_id)
    signatures={tuple(run[i] for i in solution) for solution in solutions}
    if len(signatures)!=1:return None
    # When repeated 匕 shapes are shortened to one code (態、熊), take
    # the last 匕 of that component, not the first one above it.
    def selection_cost(indices):
        costs=[]
        for j,i in enumerate(indices):
            repeated_bi=atoms[i]['component']=='匕' and sum(a['component']=='匕' and run[k]==run[i] for k,a in enumerate(atoms))>1
            costs.append(-i if j==len(indices)-1 or repeated_bi else i)
        return tuple(costs)
    chosen=min(solutions,key=selection_cost)
    return [atoms[i] for i in chosen]


def from_template(char,template):
    used.add(char)
    atoms=[{'component':char,'name':p[0],'key':p[1],'regions':[]} for p in template['parts']]
    splits={p['stroke']:p for p in template.get('splitStrokes',[])}
    multiple={p['stroke']:p['segments'] for p in template.get('strokeRegions',[])}
    for part,(_,key,indices) in enumerate(template['parts']):
        if len(key)!=1:return None
        for stroke in indices:
            if stroke>=len(D[char]['matches']):return None
            split=splits.get(stroke)
            if stroke in multiple:
                for lo,hi,owner in multiple[stroke]:
                    if owner>=0:atoms[owner]['regions'].append([stroke,lo,hi])
            elif split:
                for side,lo,hi in [('above',split['boundary'],1200),('below',-200,split['boundary'])]:
                    if split[side]>=0:atoms[split[side]]['regions'].append([stroke,lo,hi,split.get('axis','y')]+([split['floor']] if 'floor' in split else []))
            else:atoms[part]['regions'].append([stroke,-200,1200])
    return atoms if all(a['regions'] for a in atoms) else None

def transform_boundary(child,child_stroke,parent,parent_stroke,indices,boundary,axis="y"):
    if boundary in (-200,1200):return boundary
    coordinate=0 if axis=="x" else 1
    # Fit an affine coordinate transform from all corresponding median points of this component.
    # Correspondence is supplied by IDS matches, never inferred by stroke proximity.
    pairs=[]
    for i,parent_i in enumerate(indices):
        if i>=len(G[child]['medians']):return None
        cm,pm=G[child]['medians'][i],G[parent]['medians'][parent_i]
        if not cm or not pm:return None
        for fraction in (0,.25,.5,.75,1):
            def at(m,f):
                lengths=[0]
                for p,q in zip(m,m[1:]):lengths.append(lengths[-1]+((q[0]-p[0])**2+(q[1]-p[1])**2)**.5)
                target=f*lengths[-1]
                for j in range(1,len(m)):
                    if lengths[j]>=target:
                        t=(target-lengths[j-1])/(lengths[j]-lengths[j-1] or 1)
                        return m[j-1][coordinate]+t*(m[j][coordinate]-m[j-1][coordinate])
                return m[-1][coordinate]
            pairs.append((at(cm,fraction),at(pm,fraction)))
    x=sum(p[0] for p in pairs)/len(pairs);y=sum(p[1] for p in pairs)/len(pairs)
    denominator=sum((p[0]-x)**2 for p in pairs)
    if denominator<1:return None
    scale=sum((p[0]-x)*(p[1]-y) for p in pairs)/denominator
    if scale<=0:return None
    result=round(y+scale*(boundary-x),2)
    return result if (-124<result<(1024 if axis=="x" else 900)) else None

@functools.lru_cache(None)
def derive(char,depth=0,strategy='expanded'):
    if depth>16 or char not in D or char not in G:return None
    used.add(char)
    n=len(D[char]['matches'])
    if depth==0 and char in SOURCE.get('standalone_templates',{}):return from_template(char,SOURCE['standalone_templates'][char])
    if char in T:return from_template(char,T[char])
    if char in R:return [{'component':char,'name':char,'key':R[char],'regions':[[i,-200,1200] for i in range(n)]}]
    if depth>0 and strategy=='known' and char in SOURCE.get('preserved_constructions',{}):return SOURCE['preserved_constructions'][char]
    if char in V and all(len(p[1])==1 for p in V[char]['parts']):return from_template(char,V[char])
    result=[]
    for path,leaf in leaves(tree(D[char]['decomposition'])):
        indices=[i for i,m in enumerate(D[char]['matches']) if m is not None and tuple(m[:len(path)])==path]
        if not indices:continue
        if leaf==char:return None
        variant=SOURCE.get('component_variants',{}).get(leaf,{}).get(str(len(indices)))
        if variant and (variant['context']=='any' or (path==(0,) and D[char]['decomposition'].startswith('⿰' if variant['context']=='left' else '⿱'))):
            # Explicit same-stroke-count variants; e.g. 戠 shares one horizontal
            # in 織/識/職. These groups are checked against named reference forms.
            for name,key,strokes in variant['parts']:
                result.append({'component':leaf,'name':name,'key':key,'variant':str(len(indices)),
                               'regions':[[indices[i],-200,1200]for i in strokes]})
            continue
        if leaf in R and leaf not in T:
            # A root variant may have a different stroke count (e.g. 艹).
            # IDS identifies the whole root region; no child-stroke pairing is needed.
            result.append({'component':leaf,'name':leaf,'key':R[leaf],'regions':[[i,-200,1200] for i in indices]})
            continue
        child=derive(leaf,depth+1,strategy)
        if child is None:
            result.append({'component':leaf,'name':leaf,'key':'?','regions':[[i,-200,1200] for i in indices]})
            continue
        if len(indices)!=len(D[leaf]['matches']):return None
        for atom in child:
            regions=[]
            for region in atom['regions']:
                stroke,lo,hi=region[:3];axis=region[3] if len(region)>3 else 'y'
                low=transform_boundary(leaf,stroke,char,indices[stroke],indices,lo,axis)
                high=transform_boundary(leaf,stroke,char,indices[stroke],indices,hi,axis)
                if low is None or high is None:return None
                floor=transform_boundary(leaf,stroke,char,indices[stroke],indices,region[4],'y') if len(region)>4 else None
                if len(region)>4 and floor is None:return None
                regions.append([indices[stroke],low,high,axis]+([floor]if floor is not None else []))
            result.append({**atom,'regions':regions})
    if not result:return None
    return select(result,C[char]) if (depth==0 or strategy=='reduced') and char in C else result

def compile_visual(char,atoms):
    if ''.join(a['key'] for a in atoms)!=C[char]:return None
    root_names=dict(zip('abcdefghijklmnopqrstuvwxyz','日月金木水火土竹戈十大中一弓人心手口尸廿山女田難卜重'))
    parts=[[a['name'] if a['component']==char and (char in T or char in SOURCE.get('standalone_templates',{})) else f'「{a["component"]}」中的{root_names[a["key"]]}形',a['key'],[]] for a in atoms]
    regions=collections.defaultdict(list)
    for part,atom in enumerate(atoms):
        for region in atom['regions']:
            stroke,lo,hi=region[:3];axis=region[3] if len(region)>3 else 'y'
            regions[stroke].append((part,lo,hi,axis,region[4]if len(region)>4 else None))
    ignored=[];splits=[];multiple=[]
    for stroke in range(len(G[char]['strokes'])):
        rs=regions[stroke]
        if not rs:ignored.append(stroke);continue
        axis=rs[0][3];floor=rs[0][4];axis_field={'axis':axis} if axis!='y' else {}
        if floor is not None:axis_field['floor']=floor
        if any(r[4]!=floor for r in rs):return None
        if any(r[3]!=axis for r in rs):return None
        rs=[r[:3]for r in rs]
        parts[rs[0][0]][2].append(stroke)
        if len(rs)==1 and rs[0][1:]==(-200,1200):continue
        if len(rs)>2:
            rs.sort(key=lambda r:r[1])
            if any(a[2]>b[1]+.1 for a,b in zip(rs,rs[1:])):return None
            segments=[];cursor=-200
            for part,lo,hi in rs:
                if lo>cursor:segments.append([cursor,lo,-1])
                segments.append([lo,hi,part]);cursor=hi
            if cursor<1200:segments.append([cursor,1200,-1])
            multiple.append({'stroke':stroke,'segments':segments,**axis_field})
            continue
        if len(rs)==1:
            part,lo,hi=rs[0]
            if lo==-200:splits.append({'stroke':stroke,'boundary':hi,'above':-1,'below':part,**axis_field})
            elif hi==1200:splits.append({'stroke':stroke,'boundary':lo,'above':part,'below':-1,**axis_field})
            else:
                multiple.append({'stroke':stroke,'segments':[[-200,lo,-1],[lo,hi,part],[hi,1200,-1]],**axis_field})
        else:
            rs.sort(key=lambda r:r[1]);bottom,top=rs
            if bottom[2]>top[1]+.1:return None
            if bottom[1]!=-200 or top[2]!=1200 or abs(bottom[2]-top[1])>.1:
                # Two taken regions may share a stroke with an untaken end (髏).
                segments=([[-200,bottom[1],-1]] if bottom[1]>-200 else [])
                segments += [[bottom[1],bottom[2],bottom[0]]]
                if top[1]>bottom[2]:segments.append([bottom[2],top[1],-1])
                segments.append([top[1],top[2],top[0]])
                if top[2]<1200:segments.append([top[2],1200,-1])
                multiple.append({'stroke':stroke,'segments':segments,**axis_field})
                continue
            splits.append({'stroke':stroke,'boundary':top[1],'above':top[0],'below':bottom[0],**axis_field})
    # A split-only part may have no owning path; it still has visible clipped regions.
    visual={'layout':'原字部件逐碼取形','parts':parts,'ignored':ignored,
            'explanation':'依字形先辨認部件，再按倉頡取碼順序觀察。灰色筆畫不另取碼；取碼順序與書寫筆順不同。'}
    if splits:visual['splitStrokes']=splits
    if multiple:visual['strokeRegions']=multiple
    return visual

def build():
    # Models describe five-generation codes. The UI guards against reusing them for different three-generation codes.
    selected={};proof={}
    for char in SOURCE['ranking']:
        if char in V or char not in C:continue
        atoms=SOURCE.get('preserved_constructions',{}).get(char)
        if atoms:visual=compile_visual(char,atoms)
        else:
            # Each strategy uses the same explicit shapes and rejects ambiguous root selection.
            # Existing validated child constructions can resolve ambiguity in expanded atoms.
            visual=None
            for strategy in ['expanded','known','reduced']:
                atoms=derive(char,0,strategy)
                visual=compile_visual(char,atoms) if atoms else None
                if visual:break
        if not visual:continue
        selected[char]=visual;proof[char]=atoms
        if len(selected)+len(V)==TARGET:break
    if len(selected)+len(V)!=TARGET:raise RuntimeError(f'Only {len(selected)+len(V)} verified constructions available')
    # Check every taken region, skipped stroke, code, and bound before publishing.
    for char,visual in selected.items():
        ids=[i for p in visual['parts'] for i in p[2]]+visual['ignored']
        assert sorted(ids)==list(range(len(G[char]['strokes']))),char
        assert len(set(ids))==len(ids),char
        assert ''.join(p[1] for p in visual['parts'])==C[char],char
        for split in visual.get('splitStrokes',[]):
            assert split['above']!=split['below'] and 0<split['boundary']<900,char
    output='// Generated by scripts/build-colour-library.py; see data/colour-audit.json.\n'
    output+='const USER_CODE_CORRECTIONS='+json.dumps(SOURCE.get('code_corrections',{}),ensure_ascii=False,separators=(',',':'))+';\nfor(const [version,corrections] of Object.entries(USER_CODE_CORRECTIONS))Object.assign(CODE_TABLES[version],corrections);\n'
    output+='Object.assign(STROKE_DATA,'+json.dumps({c:G[c]['strokes'] for c in selected},ensure_ascii=False,separators=(',',':'))+');\n'
    output+='Object.assign(SPLIT_VISUALS,'+json.dumps(selected,ensure_ascii=False,separators=(',',':'))+');\n'
    output+='const COLOUR_ORDER='+json.dumps(list(dict.fromkeys([c for c in SOURCE['ranking'] if c in V or c in selected]+list(V))),ensure_ascii=False,separators=(',',':'))+';\n'
    output+='const COLOUR_REFERENCE_CHARS='+json.dumps(SOURCE.get('reference_chars',[]),ensure_ascii=False,separators=(',',':'))+';\n'
    output+='const COLOUR_CORRECTION_CHARS='+json.dumps(SOURCE.get('correction_chars',[]),ensure_ascii=False,separators=(',',':'))+';\n'
    (ROOT/'colour-library.js').write_text(output)
    (ROOT/'data/colour-audit.json').write_text(json.dumps({'total':TARGET,'new':len(selected),'method':'IDS stroke correspondence + explicit single-root templates + unique code selection; no proportional stroke colouring','source':SOURCE['source'],'code_corrections':SOURCE.get('code_corrections',{}),'references':SOURCE.get('reference_chars',[]),'contour_adaptations':SOURCE.get('contour_adaptations',{}),'reconstructed':list(COMPOSITIONS['characters']),'composition_source':COMPOSITIONS.get('source'),'characters':proof},ensure_ascii=False,separators=(',',':'))+'\n')
    print(f'Compiled {len(selected)} new glyphs; total {len(V)+len(selected)}. Output {len(output.encode()):,} bytes.')

if __name__=='__main__':build()
