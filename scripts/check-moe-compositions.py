"""Verify frozen MOE glyph reconstructions and original AnimCJK contours, without writes."""
import hashlib
import importlib.util
import json
import pathlib
import re
import xml.etree.ElementTree as ET
from fontTools.svgLib.path import parse_path
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = pathlib.Path(__file__).resolve().parent.parent
source = json.loads((ROOT / 'data/colour-source.json').read_text())
completion = source['moe_completion_20261026']
spec = importlib.util.spec_from_file_location('geometry', ROOT / 'scripts/rebuild-component-compositions.py')
geometry = importlib.util.module_from_spec(spec)
spec.loader.exec_module(geometry)

for char, plan in completion['compositionPlans'].items():
    if plan['method'] in ('same_font_components', 'contextual_components'):
        paths, medians = [], []
        for part in plan['components']:
            ps, ms = geometry.component_strokes(part)
            paths.extend(ps)
            medians.extend(ms)
    else:
        ref = plan['reference']
        original = source['moe_original_graphics'].get(ref, source['graphics'][ref])
        ps, ms = geometry.fit(plan['replacement'], plan['bounds'], source['graphics'][plan['replacement']])
        if 'replacementIndices' in plan:
            paths, medians = list(original['strokes']), list(original['medians'])
            for i, p, m in zip(plan['replacementIndices'], ps, ms):
                paths[i], medians[i] = p, m
        else:
            paths = [original['strokes'][i] for i in plan['retainedStrokeIndices']] + ps
            medians = [original['medians'][i] for i in plan['retainedStrokeIndices']] + ms
    checked = geometry.apply_semantic_contours(char, {'strokes': paths, 'medians': medians})
    paths, medians = checked['strokes'], checked['medians']
    actual = source['graphics'][char]
    assert paths == actual['strokes'] and medians == actual['medians'], char

for char in completion['importedOriginalContours']:
    info = source['additional_graphics_sources'][char]
    file = ROOT / info['file']
    assert hashlib.sha256(file.read_bytes()).hexdigest() == info['sha256'], char
    assert 'Arphic Public License' in file.read_text(), char
    paths = []
    for el in ET.parse(file).getroot().iter('{http://www.w3.org/2000/svg}path'):
        if re.fullmatch(f'z{ord(char)}d[0-9]+', el.get('id', '')):
            pen = SVGPathPen(None)
            parse_path(el.attrib['d'], TransformPen(pen, (1, 0, 0, -1, 0, 900)))
            paths.append(pen.getCommands())
    assert paths == source['graphics'][char]['strokes'], char

print(f"PASS {len(completion['compositionPlans'])} glyph plans and {len(completion['importedOriginalContours'])} original SVGs")

revision = source.get('reference_revision_20261026_batch2', {})
for char, plan in revision.get('contourPlans', {}).items():
    donor = source['graphics'][plan['sourceCharacter']]
    part = {'strokes': [donor['strokes'][i] for i in plan['sourceStrokeIndices']],
            'medians': [donor['medians'][i] for i in plan['sourceStrokeIndices']]}
    paths, medians = geometry.fit(plan['sourceCharacter'], plan['bounds'], part)
    actual = source['graphics'][char]
    for i, p, m in zip(plan['targetStrokeIndices'], paths, medians):
        assert actual['strokes'][i] == p and actual['medians'][i] == m, char
print(f"PASS {len(revision.get('contourPlans', {}))} latest reference contour adaptations")

for char in source.get('semantic_contour_corrections_20261027', {}):
    actual = source['graphics'].get(char, geometry.data['characters'].get(char, {}).get('graphics'))
    expected = geometry.apply_semantic_contours(char, {'strokes': list(actual['strokes']), 'medians': list(actual['medians'])})
    assert expected == {'strokes': actual['strokes'], 'medians': actual['medians']}, char
print(f"PASS {len(source.get('semantic_contour_corrections_20261027', {}))} semantic glyph variants")
