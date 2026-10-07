#!/usr/bin/env python3
"""Smoke-test bundled district GeoJSON against known Mecklenburg points."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "public" / "districts"


def pip_ring(lng: float, lat: float, ring: list) -> bool:
    inside = False
    j = len(ring) - 1
    for i, pt in enumerate(ring):
        xi, yi = pt[0], pt[1]
        xj, yj = ring[j][0], ring[j][1]
        if yi != yj and (yi > lat) != (yj > lat) and lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def pip_geom(lng: float, lat: float, geom: dict) -> bool:
    if geom["type"] == "Polygon":
        rings = geom["coordinates"]
        if not pip_ring(lng, lat, rings[0]):
            return False
        return not any(pip_ring(lng, lat, hole) for hole in rings[1:])
    if geom["type"] == "MultiPolygon":
        return any(pip_geom(lng, lat, {"type": "Polygon", "coordinates": p}) for p in geom["coordinates"])
    return False


def lookup(lng: float, lat: float) -> dict[str, str | None]:
    files = {
        "congress": "congress.json",
        "ncSenate": "nc-senate.json",
        "ncHouse": "nc-house.json",
        "commission": "commission.json",
        "charlotte": "charlotte.json",
    }
    out: dict[str, str | None] = {}
    for key, name in files.items():
        data = json.loads((DIST / name).read_text())
        hit = None
        for feat in data["features"]:
            if pip_geom(lng, lat, feat["geometry"]):
                hit = feat["properties"]["id"]
                break
        out[key] = hit
    return out


CASES = [
    ("uptown Charlotte", -80.8431, 35.2271, {"congress": "NC-12", "charlotte": "charlotte"}),
    ("Matthews", -80.7223, 35.1168, {"congress": "NC-8", "charlotte": None}),
    ("Huntersville", -80.8428, 35.4107, {"congress": "NC-14", "charlotte": None}),
    ("Raleigh (outside)", -78.6382, 35.7796, {"congress": None, "charlotte": None}),
]


def main() -> int:
    failed = 0
    for name, lng, lat, expect in CASES:
        got = lookup(lng, lat)
        print(f"{name}: {got}")
        for key, val in expect.items():
            if got.get(key) != val:
                print(f"  FAIL {key}: expected {val!r} got {got.get(key)!r}", file=sys.stderr)
                failed += 1
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
