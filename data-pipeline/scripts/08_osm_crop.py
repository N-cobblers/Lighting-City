"""把台灣 OpenStreetMap 裁成雙北範圍、只留道路，給本機 OSRM 用。輸出 data/osrm/metro.osm.pbf。
用法：python scripts/08_osm_crop.py [根目錄]
先下載 https://download.geofabrik.de/asia/taiwan-latest.osm.pbf 到 data/osrm/（不進版控）。
"""
import sys, json, osmium
from shapely.geometry import shape
from shapely.ops import unary_union
S = sys.argv[1] if len(sys.argv) > 1 else '.'
src, dst = f'{S}/data/osrm/taiwan-latest.osm.pbf', f'{S}/data/osrm/metro.osm.pbf'
gj = json.load(open(f'{S}/geo/towns.geojson', encoding='utf-8'))
metro = unary_union([shape(f['geometry']) for f in gj['features'] if f['properties']['COUNTYNAME'] in ('台北市', '新北市')])
x0, y0, x1, y1 = metro.bounds; B = 0.02  # 外擴約 2 公里，讓跨界路線不被切斷
x0, y0, x1, y1 = x0 - B, y0 - B, x1 + B, y1 + B
print('bbox', round(x0, 3), round(y0, 3), round(x1, 3), round(y1, 3))
inside = lambda l: l.valid() and x0 <= l.lon <= x1 and y0 <= l.lat <= y1
n = 0
with osmium.BackReferenceWriter(dst, ref_src=src, overwrite=True) as w:
    for o in osmium.FileProcessor(src, osmium.osm.NODE | osmium.osm.WAY).with_locations():
        if o.is_way() and 'highway' in o.tags and any(inside(nd.location) for nd in o.nodes):
            w.add_way(o); n += 1
print('ways', n, '→', dst)
