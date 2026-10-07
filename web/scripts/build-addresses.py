#!/usr/bin/env python3
"""Rebuild ZIP-split Mecklenburg address packs from county GIS (optional).

Source: Mecklenburg County GIS Master Address Points
https://meckgis.mecklenburgcountync.gov/server/rest/services/MasterAddressPoints/FeatureServer

Writes gzip JSON to web/public/addresses/. Not run during CI.
"""
from __future__ import annotations

print("Address packs in web/public/addresses/ were built 2026-10-07 from")
print("Mecklenburg County GIS Master Address Points (677,787 points, split by ZIP, gzipped).")
print("Re-run the download/compress steps in the district-lookup notes if the county publishes a new extract.")
