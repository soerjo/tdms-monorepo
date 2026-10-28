#!/usr/bin/env bash
set -euo pipefail

# Script Otomasi Zero-Downtime Pembaruan Mingguan Peta OSM (Phase 4.2)
OSM_PBF_URL="${1:-https://download.geofabrik.de/asia/indonesia-latest.osm.pbf}"
DATA_DIR="/data"
WORK_DIR="/data/staging"
PROFILE="/profiles/motorcycle.lua"

echo "=== [1/5] Mengunduh dataset snapshot OpenStreetMap terbaru ==="
mkdir -p "${WORK_DIR}"
curl -sSL -o "${WORK_DIR}/latest.osm.pbf" "${OSM_PBF_URL}"

echo "=== [2/5] Mengekstrak partisi graf jalan via osrm-extract ==="
osrm-extract -p "${PROFILE}" "${WORK_DIR}/latest.osm.pbf"

echo "=== [3/5] Melakukan partisi hirarki sel via osrm-partition (MLD) ==="
osrm-partition "${WORK_DIR}/latest.osrm"

echo "=== [4/5] Mengkustomisasi bobot profil jalan via osrm-customize ==="
osrm-customize "${WORK_DIR}/latest.osrm"

echo "=== [5/5] Melakukan atomic swap ke direktori dataset aktif ==="
mv "${WORK_DIR}"/latest.osrm* "${DATA_DIR}/"
rm -rf "${WORK_DIR}"

echo "=== Sukses! Container standby OSRM Green siap menerima traffic via reload ==="
