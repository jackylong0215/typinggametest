"""Rebuild documented learning glyphs from frozen component plans (fonttools 4.61.1).
No network access or character selection. --check verifies contours without writing.
"""
import json,pathlib,subprocess,sys
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
def fit(child,box,source_graphics=None):
 graphic=source_graphics or G[child]
 l,b,r,t=box;x0,y0,x1,y1=bounds(graphic['strokes']);sx=(r-l)/(x1-x0);sy=(t-b)/(y1-y0);tx=l-sx*x0;ty=b-sy*y0
 out=[]
 for path in graphic['strokes']:
  pen=SVGPathPen(None,ntos=lambda v:f'{v:.2f}'.rstrip('0').rstrip('.'));parse_path(path,TransformPen(pen,(sx,0,0,sy,tx,ty)));out.append(pen.getCommands())
 return out,[[[round(x*sx+tx,3),round(y*sy+ty,3)]for x,y in m]for m in graphic['medians']]
def component_graphics(part):
    """Frozen donor indices preserve canonical stroke roles, including side-form order."""
    donor=part.get('donor')
    if donor:
        graphic=source['reference_original_graphics'][donor['character']] if donor.get('sourceVariant')=='reference_original_graphics' else G[donor['character']]
        indices=donor['strokeIndices']
        assert len(indices)==len(set(indices)) and all(0<=i<len(graphic['strokes']) for i in indices)
        return {'strokes':[graphic['strokes'][i] for i in indices],'medians':[graphic['medians'][i] for i in indices]}
    return source['reference_original_graphics'][part['character']] if part.get('sourceVariant')=='reference_original_graphics' else G[part['character']]
def component_strokes(part):
    return fit(part['character'],part['bounds'],component_graphics(part))
def main():
    if '--place' in sys.argv:
     subprocess.run([sys.executable,str(ROOT/'scripts/compact-component-layout.py'),'--apply'],check=True);return
    for c,record in data['characters'].items():
     paths=[];medians=[];matches=[]
     for side,part in enumerate(record['components']):
      strokes,ms=component_strokes(part);paths+=strokes;medians+=ms;matches += [[side]]*len(strokes)
     graphics={'character':c,'strokes':paths,'medians':medians}
     if '--check' in sys.argv:assert graphics==record['graphics'] and matches==record['dictionary']['matches'],c
     else:record['graphics']=graphics;record['dictionary']['matches']=matches
    if '--check' not in sys.argv:
     data['source'].setdefault('layout','Documented component bounds; reviewed by compact-component-layout.py; path coordinates rounded to 0.01 units.')
     file.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
    print(('Checked'if '--check'in sys.argv else'Rebuilt'),len(data['characters']),'documented component compositions')

if __name__=='__main__':main()
