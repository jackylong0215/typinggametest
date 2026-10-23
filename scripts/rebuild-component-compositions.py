"""Rebuild documented learning glyphs from frozen component plans (fonttools 4.61.1).
No network access or character selection. --check verifies contours without writing.
"""
import collections,json,pathlib,statistics,sys
from fontTools.svgLib.path import parse_path
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
ROOT=pathlib.Path(__file__).resolve().parent.parent
source=json.loads((ROOT/'data/colour-source.json').read_text())
file=ROOT/'data/component-compositions.json';data=json.loads(file.read_text());G=source['graphics'];D=source['dictionary']
def bounds(paths):
 p=BoundsPen(None)
 for path in paths:parse_path(path,p)
 return p.bounds
def fit(child,box):
 l,b,r,t=box;x0,y0,x1,y1=bounds(G[child]['strokes']);sx=(r-l)/(x1-x0);sy=(t-b)/(y1-y0);tx=l-sx*x0;ty=b-sy*y0
 out=[]
 for path in G[child]['strokes']:
  pen=SVGPathPen(None,ntos=lambda v:f'{v:.2f}'.rstrip('0').rstrip('.'));parse_path(path,TransformPen(pen,(sx,0,0,sy,tx,ty)));out.append(pen.getCommands())
 return out,[[[round(x*sx+tx,3),round(y*sy+ty,3)]for x,y in m]for m in G[child]['medians']]
# Empirical cross-axis placement from real same-font compound characters.
# This keeps left 口/土/王 at their usual height instead of stretching them to full height.
placements=collections.defaultdict(list)
for c,d in D.items():
 ids=d.get('decomposition','')
 if c not in G or len(ids)!=3 or ids[0] not in '⿰⿱':continue
 points=[p for m in G[c]['medians']for p in m]
 if not points:continue
 x0=min(x for x,y in points);x1=max(x for x,y in points);y0=min(y for x,y in points);y1=max(y for x,y in points)
 if x1<=x0 or y1<=y0:continue
 for side,child in enumerate(ids[1:]):
  indices=[i for i,m in enumerate(d['matches'])if m and m[0]==side]
  ps=[p for i in indices for p in G[c]['medians'][i]]
  if not ps:continue
  placements[(ids[0],side,child)].append([70+885*(min(x for x,y in ps)-x0)/(x1-x0),20+820*(min(y for x,y in ps)-y0)/(y1-y0),70+885*(max(x for x,y in ps)-x0)/(x1-x0),20+820*(max(y for x,y in ps)-y0)/(y1-y0)])
def main():
    for c,record in data['characters'].items():
     op=record['dictionary']['decomposition'][0];paths=[];medians=[];matches=[]
     for side,part in enumerate(record['components']):
      child=part['character'];box=list(part['bounds'])
      if '--place' in sys.argv:
       samples=placements[(op,side,child)]
       if len(samples)>=3:
        typical=[round(statistics.median(row[i]for row in samples),2)for i in range(4)]
        axes=[1,3]if op=='⿰'else[0,2]
        for i in axes:box[i]=typical[i]
        part['bounds']=box;part['crossAxisPlacementSamples']=len(samples)
      strokes,ms=fit(child,box);paths+=strokes;medians+=ms;matches += [[side]]*len(strokes)
     graphics={'character':c,'strokes':paths,'medians':medians}
     if '--check' in sys.argv:assert graphics==record['graphics'] and matches==record['dictionary']['matches'],c
     else:record['graphics']=graphics;record['dictionary']['matches']=matches
    if '--check' not in sys.argv:
     data['source']['layout']='Documented component bounds; cross-axis placement estimated from same-font original compounds when at least 3 examples exist; path coordinates rounded to 0.01 units.'
     file.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
    print(('Checked'if '--check'in sys.argv else'Rebuilt'),len(data['characters']),'documented component compositions')

if __name__=='__main__':main()
