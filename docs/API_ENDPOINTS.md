# Dokumentasi API Endpoint TDMS

Base URL: `http://localhost:3000/api`  
Swagger UI: `http://localhost:3000/docs`

---

## 1. Modul Geocoding & Address Snapping (`/api/geocoding`)

### A. Forward Geocode
* **Method & Path:** `POST /api/geocoding/forward`
* **Deskripsi:** Mengubah string alamat mentah menjadi koordinat GPS WGS84 (`latitude`, `longitude`).
* **Request Body:**
  ```json
  {
    "rawAddress": "Jl. Jendral Sudirman Kav 52-53, Senayan, Jakarta Selatan"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "latitude": -6.2254,
    "longitude": 106.8091,
    "formattedAddress": "Jl. Jendral Sudirman Kav 52-53, Senayan, Jakarta Selatan",
    "source": "PHOTON"
  }
  ```

### B. Road Snapping
* **Method & Path:** `POST /api/geocoding/snap`
* **Deskripsi:** Menormalkan koordinat GPS ke segmen jalan terdekat via OSRM `/nearest`.
* **Request Body:**
  ```json
  {
    "latitude": -6.2254,
    "longitude": 106.8091,
    "profile": "motorcycle"
  }
  ```

---

## 2. Modul Routing & Matrix (`/api/routing`)

### A. Kalkulasi Rute & Estimasi
* **Method & Path:** `POST /api/routing/quote`
* **Deskripsi:** Menghitung jarak, durasi, dan geometri rute (dengan SLA timeout 300ms & fallback Haversine 1.35x).
* **Request Body:**
  ```json
  {
    "origin": { "latitude": -6.1754, "longitude": 106.8272 },
    "destination": { "latitude": -6.2088, "longitude": 106.8456 },
    "vehicleProfile": "motorcycle"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "distanceMeters": 4200,
    "durationSeconds": 605,
    "geometry": "encoded_polyline_string",
    "source": "OSRM"
  }
  ```

---

## 3. Modul Dynamic Pricing (`/api/pricing`)

### A. Hitung Ongkos Kirim Dinamis
* **Method & Path:** `POST /api/pricing/quote`
* **Deskripsi:** Kalkulasi ongkir berdasarkan jarak billable, jenis armada, surcharge berat, dan peak hour.
* **Request Body:**
  ```json
  {
    "distanceMeters": 8500,
    "durationSeconds": 1200,
    "vehicleType": "MOTORCYCLE",
    "weightGrams": 6500,
    "isPeakHour": true
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "baseFare": 10000,
    "distanceFare": 13750,
    "weightSurcharge": 2000,
    "peakHourMultiplier": 1.25,
    "totalFare": 32188,
    "currency": "IDR"
  }
  ```

---

## 4. Modul Optimasi VRP Solver (`/api/optimization`)

### A. Selesaikan VRPTW & Kapasitas Armada
* **Method & Path:** `POST /api/optimization/solve`
* **Deskripsi:** Batch assignment multi-stop ke armada kurir via VROOM solver (dengan fallback sequential heuristic).
* **Request Body:**
  ```json
  {
    "vehicles": [
      {
        "id": 1,
        "profile": "motorcycle",
        "startLocation": [106.8272, -6.1754],
        "capacity": { "weightGrams": 50000, "volumeCm3": 200000 },
        "timeWindow": [1761638400, 1761667200]
      }
    ],
    "jobs": [
      {
        "orderId": "ORD-101",
        "location": [106.8456, -6.2088],
        "serviceTimeSeconds": 300,
        "weightGrams": 2000,
        "volumeCm3": 5000,
        "codAmount": 50000
      }
    ]
  }
  ```

---

## 5. Modul Dispatch & Concurrency (`/api/dispatch`)

### A. Penugasan Trip ke Kurir
* **Method & Path:** `POST /api/dispatch/trips/:tripId/assign/:driverId`
* **Deskripsi:** Menugaskan trip ke kurir dengan distributed lock dan pengecekan batas kas COD (maks Rp2.000.000).

---

## 6. Modul Delivery & e-POD (`/api/delivery`)

### A. Submit Bukti Pengantaran (e-POD)
* **Method & Path:** `POST /api/delivery/pod`
* **Headers:** `Idempotency-Key: UUIDv4`
* **Deskripsi:** Validasi kehadiran fisik kurir $\le 50\text{ meter}$ via PostGIS, deteksi anti mock GPS, dan otomatis menerbitkan jurnal kas kurir jika COD.
* **Request Body:**
  ```json
  {
    "stopId": "UUID",
    "driverId": "UUID",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "podPhotoUrl": "https://storage.tdms.internal/pod/photo1.jpg",
    "podSignatureUrl": "https://storage.tdms.internal/pod/sig1.png",
    "isMockGps": false,
    "idempotencyKey": "UUIDv4"
  }
  ```

### B. Laporkan Pengantaran Gagal
* **Method & Path:** `POST /api/delivery/stops/:stopId/fail`
* **Headers:** `Idempotency-Key: UUIDv4`
* **Deskripsi:** Mencatat kegagalan kirim dengan Reason Code standar. Jika sudah gagal 2x, status otomatis beralih menjadi `RTO` (Return to Origin).

### C. Handover Scan Paket Retur di Gudang
* **Method & Path:** `POST /api/delivery/rto/orders/:orderId/handover`
* **Headers:** `Idempotency-Key: UUIDv4`

---

## 7. Modul Telemetry & Live Tracking (`/api/tracking`)

### A. Ingesti Ping Lokasi Kurir
* **Method & Path:** `POST /api/tracking/ping`
* **Request Body:**
  ```json
  {
    "driverId": "UUID",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "bearing": 45.0,
    "speed": 35.5,
    "isMock": false
  }
  ```

### B. Query Lokasi Kurir Aktif
* `GET /api/tracking/drivers/:driverId`: Ambil posisi terkini kurir.
* `GET /api/tracking/drivers`: Ambil semua kurir aktif dalam 5 menit terakhir.

---

## 8. Modul Double-Entry Ledger & Kas (`/api/ledger`)

### A. Posting Jurnal Finansial Berpasangan
* **Method & Path:** `POST /api/ledger/journal`
* **Headers:** `Idempotency-Key: UUIDv4`
* **Deskripsi:** Menulis mutasi akuntansi berpasangan (Debit & Credit seimbang).

### B. Cek Saldo Kas Kurir
* **Method & Path:** `GET /api/ledger/drivers/:driverId/cash-in-hand`

### C. Settlement Kas Akhir Hari (EOD)
* **Method & Path:** `POST /api/ledger/settlement/eod`
* **Headers:** `Idempotency-Key: UUIDv4`
* **Deskripsi:** Kasir mencocokkan uang fisik dengan saldo sistem dan mengkredit kas kurir kembali ke 0.

### D. Klaim Biaya Operasional (Tol & Parkir)
* **Method & Path:** `POST /api/ledger/expenses/incidental`
* **Headers:** `Idempotency-Key: UUIDv4`

---

## 9. Modul Transactional Outbox (`/api/outbox`)

### A. Manual / Scheduled Poll Outbox
* **Method & Path:** `POST /api/outbox/poll?batchSize=20`
* **Deskripsi:** Memproses event `PENDING` dan me-relay ke message broker (RabbitMQ/Kafka).
