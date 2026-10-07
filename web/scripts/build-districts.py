#!/usr/bin/env python3
"""
Clip, simplify, and convert official district shapefiles to compact GeoJSON
for on-device point-in-polygon lookup.

Sources (see web/public/districts/manifest.json after running):
  - NCSBE / NCGA congressional plan SL 2025-95 (2026 elections)
  - NCSBE / NCGA NC House SL 2023-149
  - NCSBE / NCGA NC Senate SL 2023-146
  - Mecklenburg County GIS commissioner districts
  - U.S. Census TIGER/Line 2024 places (Charlotte)
  - Mecklenburg County GIS county boundary (clip)
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import shapefile
from pyproj import Transformer
from shapely.geometry import mapping, shape
from shapely.ops import transform as shp_transform, unary_union
from shapely.validation import make_valid

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "districts"
GIS = Path("/tmp/gis")

# Slightly padded Mecklenburg box (WGS84) for fast prefilter
MECK_BBOX = (-81.05, 34.98, -80.52, 35.52)

# NAD83 NC State Plane FIPS 3200 (meters) → WGS84
TO_WGS84 = Transformer.from_crs("EPSG:32119", "EPSG:4326", always_xy=True)


def to_wgs84_geom(geom):
    return shp_transform(lambda x, y, z=None: TO_WGS84.transform(x, y), geom)


def simplify(geom, tol=0.00035):
    g = make_valid(geom)
    if g.is_empty:
        return g
    s = g.simplify(tol, preserve_topology=True)
    return s if not s.is_empty else g


def geom_to_gj(geom):
    gj = mapping(geom)
    # Drop Z if present
    def dropz(coords):
        if not coords:
            return coords
        if isinstance(coords[0], (float, int)):
            return list(coords[:2])
        return [dropz(c) for c in coords]

    if "coordinates" in gj:
        gj["coordinates"] = dropz(gj["coordinates"])
    return gj


def load_shapefile_wgs84(shp_path: Path, already_wgs84: bool):
    r = shapefile.Reader(str(shp_path))
    field_names = [f[0] for f in r.fields[1:]]
    out = []
    for sr in r.shapeRecords():
        props = dict(zip(field_names, sr.record))
        gj = sr.shape.__geo_interface__
        geom = shape(gj)
        if geom.is_empty:
            continue
        if not already_wgs84:
            geom = to_wgs84_geom(geom)
        geom = make_valid(geom)
        out.append((props, geom))
    return out


def clip_to_county(geom, county):
    if not geom.intersects(county):
        return None
    clipped = geom.intersection(county)
    if clipped.is_empty:
        return None
    return simplify(clipped)


def write_fc(path: Path, features: list[dict]):
    OUT.mkdir(parents=True, exist_ok=True)
    fc = {"type": "FeatureCollection", "features": features}
    path.write_text(json.dumps(fc, separators=(",", ":")), encoding="utf-8")
    print(f"  wrote {path.name:20s} {path.stat().st_size:7d} bytes  n={len(features)}")


def main():
    county_gj = json.loads((GIS / "county.geojson").read_text())
    county = make_valid(shape(county_gj["features"][0]["geometry"]))
    # buffer slightly so edge addresses still match
    county_clip = county.buffer(0.002)

    # --- Congress ---
    congress = []
    for props, geom in load_shapefile_wgs84(GIS / "congress" / "SL 2025-95.shp", False):
        dist = str(props.get("DISTRICT", "")).lstrip("0") or "0"
        clipped = clip_to_county(geom, county_clip)
        if clipped is None or dist not in {"8", "12", "14"}:
            continue
        congress.append(
            {
                "type": "Feature",
                "properties": {"id": f"NC-{dist}", "kind": "congress", "label": f"U.S. House NC-{dist}"},
                "geometry": geom_to_gj(clipped),
            }
        )

    # --- NC Senate ---
    senate = []
    for props, geom in load_shapefile_wgs84(GIS / "senate" / "SL 2023-146.shp", False):
        dist = str(props.get("DISTRICT", "")).lstrip("0") or "0"
        clipped = clip_to_county(geom, county_clip)
        if clipped is None:
            continue
        senate.append(
            {
                "type": "Feature",
                "properties": {"id": dist, "kind": "ncSenate", "label": f"NC Senate District {dist}"},
                "geometry": geom_to_gj(clipped),
            }
        )

    # --- NC House ---
    house = []
    for props, geom in load_shapefile_wgs84(GIS / "house" / "SL 2023-149.shp", False):
        dist = str(props.get("DISTRICT", "")).lstrip("0") or "0"
        clipped = clip_to_county(geom, county_clip)
        if clipped is None:
            continue
        house.append(
            {
                "type": "Feature",
                "properties": {"id": dist, "kind": "ncHouse", "label": f"NC House District {dist}"},
                "geometry": geom_to_gj(clipped),
            }
        )

    # --- Commission (already WGS84 GeoJSON) ---
    comm_raw = json.loads((GIS / "commission.geojson").read_text())
    commission = []
    for f in comm_raw["features"]:
        geom = simplify(make_valid(shape(f["geometry"])))
        p = f["properties"]
        dist = str(p.get("cc") or p.get("shortname") or "").strip()
        if dist.lower().startswith("d"):
            dist = dist[1:]
        commission.append(
            {
                "type": "Feature",
                "properties": {
                    "id": dist,
                    "kind": "commission",
                    "label": f"County Commission District {dist}",
                },
                "geometry": geom_to_gj(geom),
            }
        )

    # --- Charlotte city (Census TIGER 2024 places) ---
    charlotte = []
    for props, geom in load_shapefile_wgs84(GIS / "places" / "tl_2024_37_place.shp", True):
        if str(props.get("NAME", "")).strip() != "Charlotte":
            continue
        geom = simplify(make_valid(geom), 0.00025)
        charlotte.append(
            {
                "type": "Feature",
                "properties": {"id": "charlotte", "kind": "city", "label": "City of Charlotte"},
                "geometry": geom_to_gj(geom),
            }
        )

    write_fc(OUT / "congress.json", congress)
    write_fc(OUT / "nc-senate.json", senate)
    write_fc(OUT / "nc-house.json", house)
    write_fc(OUT / "commission.json", commission)
    write_fc(OUT / "charlotte.json", charlotte)

    manifest = {
        "lastChecked": "2026-10-07",
        "layers": [
            {
                "id": "congress",
                "file": "congress.json",
                "source": "NCSBE / NCGA Session Law 2025-95 (SB 249), 2026 U.S. House plan",
                "sourceUrl": "https://dl.ncsbe.gov/?prefix=ShapeFiles/USCongress/",
                "date": "2025-10-22",
            },
            {
                "id": "ncSenate",
                "file": "nc-senate.json",
                "source": "NCSBE / NCGA Session Law 2023-146, NC Senate plan",
                "sourceUrl": "https://www.ncsbe.gov/results-data/voting-maps-redistricting",
                "date": "2023-10-25",
            },
            {
                "id": "ncHouse",
                "file": "nc-house.json",
                "source": "NCSBE / NCGA Session Law 2023-149, NC House plan",
                "sourceUrl": "https://www.ncsbe.gov/results-data/voting-maps-redistricting",
                "date": "2023-10-25",
            },
            {
                "id": "commission",
                "file": "commission.json",
                "source": "Mecklenburg County GIS, Board of County Commissioner Districts",
                "sourceUrl": "https://maps.mecklenburgcountync.gov/metadata/item/countycommissioners/",
                "date": "2026-10-07",
            },
            {
                "id": "charlotte",
                "file": "charlotte.json",
                "source": "U.S. Census TIGER/Line 2024 places (Charlotte city)",
                "sourceUrl": "https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html",
                "date": "2024",
            },
        ],
        "clip": "Clipped to Mecklenburg County GIS county boundary; simplified for on-device lookup.",
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("done")


if __name__ == "__main__":
    main()
