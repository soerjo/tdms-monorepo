# TDMS (Transportation & Delivery Management Service) Monorepo

Backend Microservice, Event-Driven Logistics & Routing Engine berbasis **NestJS 11**, **OSRM**, **VROOM**, **PostGIS**, dan **Double-Entry Financial Ledger**.

---

## 1. Arsitektur & Topologi

* **Framework:** NestJS 11 (Node.js / Bun runtime)
* **Database & Spasial:** PostgreSQL 16 + PostGIS extension (`GEOGRAPHY(Point, 4326)`)
* **Routing Engine:** OSRM (Open Source Routing Machine) MLD algorithm + Custom Lua profile (`motorcycle.lua`, `van.lua`)
* **VRP Solver:** VROOM (VRPTW & Capacity constraints)
* **Cache & Distributed Lock:** Redis 7 (H3 spatial index, Redlock)
* **Financial Ledger:** Immutable double-entry bookkeeping (balanced debit/credit)

---

## 2. Struktur Monorepo

```text
tdms-monorepo/
├── apps/
│   └── tdms-api/                     # NestJS 11 API Gateway & Core Engine
│       ├── src/
│       │   ├── modules/
│       │   │   ├── routing/          # OSRM client, H3 cache, Haversine fallback
│       │   │   ├── dispatch/         # Runsheet, Redis lock, driver assignment
│       │   │   ├── delivery/         # e-POD submission, geofence, COD auto-ledger
│       │   │   ├── ledger/           # Double-entry ledger, COD limits, settlement
│       │   │   └── outbox/           # Transactional outbox event writer
│       │   └── common/guards/        # IdempotencyGuard (UUIDv4)
│       └── prisma/schema.prisma      # PostGIS & Ledger models
├── packages/
│   ├── common/                       # Shared DTOs, Enums, Interfaces
│   └── tsconfig/                     # Base & NestJS TypeScript configs
└── docker/
    ├── docker-compose.yml            # Postgres PostGIS, Redis, OSRM, VROOM
    └── osrm/motorcycle.lua           # Custom routing rules (no-highway, gang-access)
```

---

## 3. Menjalankan Layanan

### Prasyarat
* Bun $\ge$ 1.2
* Docker & Docker Compose

### Langkah Instalasi
```bash
# 1. Install dependencies
bun install

# 2. Build packages & apps
bun run build

# 3. Jalankan infrastruktur pendukung (Postgres, Redis, OSRM, VROOM)
bun run docker:up

# 4. Generate Prisma Client
bun run prisma:generate

# 5. Jalankan backend service
bun --filter @tdms/api dev
```
