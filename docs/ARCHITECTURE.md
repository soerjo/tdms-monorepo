# Arsitektur & Infrastruktur TDMS (Transportation & Delivery Management Service)

## 1. Topologi Sistem & Ekosistem Layanan
TDMS bertindak sebagai backbone orkestrasi logistik, routing engine mandiri berbasis OpenStreetMap, dan buku besar finansial terdesentralisasi (double-entry ledger) untuk pengiriman last-mile dan middle-mile.

```text
[POS / Order Service / WMS]
             │
             ▼ (REST / Webhook)
┌─────────────────────────────────────────────────────────────┐
│                 TDMS Core Gateway & Engine                  │
│  - Idempotency & Concurrency Guard (Redis Distributed Lock) │
│  - Dynamic Pricing & Fare Estimator Engine                  │
│  - Double-Entry Financial Ledger Service                    │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
     (Sync Matrix/Route)              (Event Streaming)
               │                              │
               ▼                              ▼
┌──────────────────────────────┐   ┌──────────────────────────┐
│   Routing & Solver Cluster   │   │  Message Broker / Queue  │
│  - OSRM Backend (Custom Lua) │   │  - RabbitMQ / Kafka      │
│  - VROOM (VRPTW & Capacity)  │   │  - Dead Letter Queue     │
│  - Photon/Pelias (Geocoding) │   │  - Outbox Pattern Poller │
└──────────────┬───────────────┘   └──────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐   ┌──────────────────────────┐
│  PostgreSQL + PostGIS (ACID) │   │   Redis GEO & Caching    │
│  - Multi-Stop Runsheets      │   │  - Driver Live Locations │
│  - Double-Entry Journal      │   │  - H3 Geohash Matrix TTL │
│  - Spatial Geofence Checks   │   │  - Distributed Locks     │
└──────────────────────────────┘   └──────────────────────────┘
```

## 2. Detail Infrastruktur

### A. OSRM Cluster & Zero-Downtime Pipeline
- **Engine:** OSRM (Open Source Routing Machine) v5.27.1.
- **Algorithm:** MLD (Multi-Level Dijkstra) untuk fleksibilitas update peta berkala tanpa re-kontrakting yang memakan waktu lama.
- **Memory Mapping:** Dataset `.osrm` dipetakan ke memori secara read-only (`mmap`).
- **Blue-Green Container Swap:** Snapshot `.osm.pbf` baru diekstrak di background container, dites dengan sanity check `/nearest` dan `/table`, lalu traffic dialihkan tanpa downtime.
- **Failover / Fallback:** Jika latency OSRM > 300ms atau container down, otomatis dialihkan ke fallback Haversine dengan faktor kelengkungan jalan 1.35x.

### B. VRP Solver Cluster (VROOM)
- **Container:** `vroomvrp/vroom-docker:v1.14.0`.
- **Kapabilitas:** Memecahkan CVRP (Capacitated VRP) dan VRPTW (VRP with Time Windows).
- **Target KPI:** Optimasi batch 100+ stop multi-kendaraan $\le$ 2.5 detik.

### C. Database & Spatial Engine
- **RDBMS:** PostgreSQL 16 dengan ekstensi PostGIS 3.4.
- **Spatial Type:** Tipe data spasial `GEOGRAPHY(Point, 4326)` untuk validasi radius 50 meter secara akurat tanpa distorsi proyeksi derajat.

### D. Redis Caching & Distributed Locks
- **Redis 7-Alpine:** Digunakan untuk distributed lock (`lock:trip:assign:{tripId}`) guna mencegah *race condition* penugasan kurir.
- **H3 Spatial Index:** Resolusi 8 (~460 meter) untuk cache matriks jarak antar-cluster order.
- **Redis GEO:** Menyimpan telemetry kurir real-time dengan TTL dinamis.
