"""Review/compact reconstructed left-right glyphs using same-font outline samples.
Default/--check validates frozen plans; --apply writes plans, adapted proof cuts and review.
Requires FontTools only for this development-time reconstruction, never in the browser.
"""
import collections,copy,hashlib,importlib.util,json,pathlib,statistics,sys
ROOT=pathlib.Path(__file__).resolve().parent.parent
sp=importlib.util.spec_from_file_location('composition_builder',ROOT/'scripts/rebuild-component-compositions.py')
b=importlib.util.module_from_spec(sp);sp.loader.exec_module(b)
S=b.source;DATA=b.data;OLD=copy.deepcopy(DATA);stats=collections.defaultdict(list)
if DATA['source'].get('layoutVersion')=='contextual-20261027':
 # Native side forms have their own height and can interleave horizontally.
 # The frozen donor plans supersede the former independent-character cell grid.
 for c,r in DATA['characters'].items():
  paths=[];medians=[]
  for part in r['components']:
   ps,ms=b.component_strokes(part);paths.extend(ps);medians.extend(ms)
  checked=b.apply_semantic_contours(c,{'strokes':paths,'medians':medians})
  assert checked['strokes']==r['graphics']['strokes'] and checked['medians']==r['graphics']['medians'],c
 print('Checked '+str(len(DATA['characters']))+' frozen contextual component layouts')
 sys.exit(0)
hash_json=lambda x:hashlib.sha256(json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
# Learn actual ink bounds, not just median endpoints. Exclude every reconstructed glyph.
for c,d in S['dictionary'].items():
 ids=d.get('decomposition','')
 if c in DATA['characters'] or len(ids)!=3 or ids[0]!='⿰' or c not in S['graphics']:continue
 g=S['graphics'][c]
 for side,child in enumerate(ids[1:]):
  indices=[i for i,m in enumerate(d['matches'])if m and m[0]==side]
  if not indices:continue
  box=b.bounds([g['strokes'][i]for i in indices])
  if box:stats[(side,child)].append(box)
def median(rows,index):return statistics.median(r[index]for r in rows)
def estimate(side,child):
 rows=stats[(side,child)]
 if len(rows)>=3:
  box=[median(rows,i)for i in range(4)]
  return box[2]-box[0],box[1],box[3],len(rows)
 # A complete, less-common component uses the same font's typical side width.
 rows=[x for (s,c),rs in stats.items()if s==side for x in rs]
 width=statistics.median(x[2]-x[0]for x in rows)
 return width,(-5 if side else 35),(825 if side else 805),len(stats[(side,child)])
def plan(record):
 assert record['dictionary']['decomposition'].startswith('⿰')
 p=record['components'];a=estimate(0,p[0]['character']);z=estimate(1,p[1]['character'])
 ratio=max(.22,min(.58,a[0]/(a[0]+z[0])))
 ys=[[a[1],a[2]],[z[1],z[2]]]
 if p[0]['character']==p[1]['character']:
  ratio=.5;y0=sum(y[0]for y in ys)/2;y1=sum(y[1]for y in ys)/2;ys=[[y0,y1],[y0,y1]]
 # The two sides are a single glyph: constrain centre drift before fitting the body.
 centres=[sum(y)/2 for y in ys];mid=sum(centres)/2
 for i,y in enumerate(ys):
  target=max(mid-30,min(mid+30,centres[i]));shift=target-centres[i];ys[i]=[v+shift for v in y]
 lo=min(y[0]for y in ys);hi=max(y[1]for y in ys);span=hi-lo
 target_span=max(740,min(850,span));scale=min(1.35,target_span/span);centre=max(390,min(440,(lo+hi)/2))
 ys=[[(v-(lo+hi)/2)*scale+centre for v in y]for y in ys]
 centres=[sum(y)/2 for y in ys];mid=sum(centres)/2
 for i,y in enumerate(ys):
  target=max(mid-40,min(mid+40,centres[i]));ys[i]=[v+target-centres[i]for v in y]
 gap=12;width=895-gap;split=65+width*ratio
 boxes=[[65,ys[0][0],split,ys[0][1]],[split+gap,ys[1][0],960,ys[1][1]]]
 return [[round(v,2)for v in box]for box in boxes],[a[3],z[3]]
def graphic_for(c,part,record,side):
 child=part['character'];n=sum(m==[side]for m in record['dictionary']['matches'])
 if len(S['graphics'][child]['strokes'])!=n:
  old=S.get('reference_original_graphics',{}).get(child)
  assert old and len(old['strokes'])==n,(c,child,n)
  part['sourceVariant']='reference_original_graphics';return old
 if part.get('sourceVariant')=='reference_original_graphics':return S['reference_original_graphics'][child]
 return S['graphics'][child]
def map_value(value,axis,old,new):
 if value in (-200,1200):return value
 i=0 if axis=='x' else 1;return round(new[i]+(value-old[i])*(new[i+2]-new[i])/(old[i+2]-old[i]),2)
def transform_template(template,matches,old,new):
 for cut in template.get('splitStrokes',[]):
  side=matches[cut['stroke']][0];cut['boundary']=map_value(cut['boundary'],cut.get('axis','y'),old[side],new[side])
  if 'floor'in cut:cut['floor']=map_value(cut['floor'],'y',old[side],new[side])
  if 'xLimit'in cut:cut['xLimit']=map_value(cut['xLimit'],'x',old[side],new[side])
 for cut in template.get('strokeRegions',[]):
  side=matches[cut['stroke']][0]
  cut['segments']=[[map_value(lo,'y',old[side],new[side]),map_value(hi,'y',old[side],new[side]),part]for lo,hi,part in cut['segments']]
review_file=ROOT/'data/colour-layout-review-20261023.json'
previous_review=json.loads(review_file.read_text()) if review_file.exists() else {}
review=copy.deepcopy(previous_review.get('characters',{}));changed=0
for c,r in DATA['characters'].items():
 boxes,samples=plan(r);old_boxes=[p['bounds']for p in r['components']]
 if '--apply' not in sys.argv:
  assert old_boxes==boxes,(c,old_boxes,boxes)
  for side,part in enumerate(r['components']):graphic_for(c,part,r,side)
  continue
 if old_boxes==boxes:continue
 paths=[];ms=[]
 for side,part in enumerate(r['components']):
  g=graphic_for(c,part,r,side);ps,med=b.fit(part['character'],boxes[side],g);paths+=ps;ms+=med
  part['bounds']=boxes[side];part['outlinePlacementSamples']=samples[side]
 new_graphic={'character':c,'strokes':paths,'medians':ms};matches=r['dictionary']['matches']
 assert len(paths)==len(matches),c
 original_review=review.get(c,{})
 review[c]={'oldBounds':original_review.get('oldBounds',old_boxes),'newBounds':boxes,'samples':samples,'sourceVariants':[p.get('sourceVariant','graphics')for p in r['components']], 'oldContoursSha256':original_review.get('oldContoursSha256',hash_json(r['graphics']['strokes'])),'newContoursSha256':hash_json(paths)}
 if c in S['graphics']:
  assert S['graphics'][c]==r['graphics'],c
  S['graphics'][c]=new_graphic
 r['graphics']=new_graphic
 for atom in S['preserved_constructions'][c]:
  mapped=[]
  for region in atom['regions']:
   stroke,lo,hi=region[:3];axis=region[3]if len(region)>3 else 'y';side=matches[stroke][0]
   out=[stroke,map_value(lo,axis,old_boxes[side],boxes[side]),map_value(hi,axis,old_boxes[side],boxes[side])]
   if len(region)>3:out.append(axis)
   if len(region)>4:out.append(map_value(region[4],'y',old_boxes[side],boxes[side])if region[4]is not None else None)
   if len(region)>5:out.append(map_value(region[5],'x',old_boxes[side],boxes[side]))
   mapped.append(out)
  atom['regions']=mapped
 for group in ['standalone_templates','templates']:
  if c in S.get(group,{}):transform_template(S[group][c],matches,old_boxes,boxes)
 for guide in S.get('shared_stroke_guides',{}).get(c,[]):guide['median']=ms[guide['stroke']]
 changed+=1
if '--apply'in sys.argv and changed:
 DATA['source']['layout']='2026-10-23: same-font original outline samples determine relative widths; 12-unit ink gap; pairwise centre alignment; shared body height up to 850 with at most 1.35× vertical enlargement for compact components. Reconstructed contours only; code and stroke membership preserved.'
 (ROOT/'data/component-compositions.json').write_text(json.dumps(DATA,ensure_ascii=False,separators=(',',':'))+'\n')
 S['composition_layout_revision_20261023']={'characters':list(review),'method':DATA['source']['layout'],'review':'data/colour-layout-review-20261023.json'}
 (ROOT/'data/colour-source.json').write_text(json.dumps(S,ensure_ascii=False,separators=(',',':'))+'\n')
 (ROOT/'data/colour-layout-review-20261023.json').write_text(json.dumps({'previousPlansSha256':previous_review.get('previousPlansSha256',hash_json(OLD)),'method':DATA['source']['layout'],'characters':review},ensure_ascii=False,separators=(',',':'))+'\n')
print(('Updated '+str(changed) if '--apply'in sys.argv else 'Checked '+str(len(DATA['characters'])))+' reconstructed glyph layouts')
