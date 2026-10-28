# Database Design & Entity Relationship TDMS

Layanan TDMS menggunakan PostgreSQL 16 dengan ekstensi **PostGIS** dan arsitektur buku besar berpasangan (*double-entry bookkeeping*).

---

## 1. Skema Tabel Utama

### A. Tabel Trip Pengantaran (`delivery_trips`)
Menyimpan informasi penugasan rute runsheet kepada kurir beserta armada dan metrik jalur.

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `UUID` (PK) | Identifier unik trip |
| `trip_code` | `VARCHAR(32)` (Unique) | Kode unik trip (misal: `TRIP-JKT-20261028-001`) |
| `driver_id` | `UUID` | ID kurir yang bertugas |
| `vehicle_type` | `ENUM` | `MOTORCYCLE`, `VAN`, `TRUCK_CDE`, `TRUCK_CDD` |
| `status` | `ENUM` | `ASSIGNED`, `IN_TRANSIT`, `COMPLETED`, `CANCELLED` |
| `total_distance_m` | `INT` | Total estimasi jarak (meter) |
| `total_duration_s` | `INT` | Total estimasi durasi (detik) |
| `route_geometry` | `TEXT` | Encoded polyline geometri rute |
| `idempotency_key` | `VARCHAR(64)` (Unique) | Kunci idempotensi penugasan |
| `created_at` / `updated_at`| `TIMESTAMPTZ` | Timestamp audit |

### B. Tabel Titik Singgah (`delivery_stops`)
Menyimpan tiap destinasi penjemputan atau pengantaran paket pada sebuah trip.

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| `id` | `UUID` (PK) | Identifier unik stop |
| `trip_id` | `UUID` (FK) | Relasi ke `delivery_trips.id` (Cascade delete) |
| `order_id` | `VARCHAR(64)` | ID order dari WMS / POS |
| `sequence_order` | `INT` | Nomor urut pemberhentian pada runsheet |
| `stop_type` | `ENUM` | `PICKUP`, `DROPOFF`, `RETURN_HUB` |
| `latitude` / `longitude` | `FLOAT` | Koordinat WGS84 tujuan pengantaran |
| `address_masked` | `TEXT` | Alamat detail tersanitasi / terenkripsi |
| `recipient_name` | `VARCHAR(100)` | Nama penerima |
| `time_window_start` | `TIMESTAMPTZ` | Batas awal SLA penerimaan barang |
| `time_window_end` | `TIMESTAMPTZ` | Batas akhir SLA penerimaan barang |
| `status` | `ENUM` | `PENDING`, `ARRIVED`, `DELIVERED`, `FAILED`, `RTO` |
| `is_cod` | `BOOLEAN` | Indikator apakah pesanan membutuhkan uang tunai COD |
| `cod_amount` | `DECIMAL(14,2)` | Nominal COD dalam IDR |
| `geofence_verified` | `BOOLEAN` | Terverifikasi berada dalam radius $\le 50\text{m}$ |
| `pod_photo_url` | `TEXT` | Bukti foto e-POD atau foto kegagalan kirim |
| `pod_signature_url` | `TEXT` | Tanda tangan digital penerima |
| `failure_reason_code` | `VARCHAR(32)` | Kode alasan gagal kirim (`HOUSE_EMPTY`, dll.) |

### C. Akun Buku Besar (`ledger_accounts`)
Bagan akun buku besar finansial untuk rekonsiliasi COD dan biaya operasional.

| Kode Akun | Nama Akun | Tipe Akun | Keterangan |
|---|---|---|---|
| `101-CASH-DRIVER` | Kas di Tangan Kurir | `ASSET` | Saldo uang tunai fisik COD yang dipegang kurir |
| `102-CASH-HUB` | Kas Operasional Hub | `ASSET` | Kas fisik yang telah disetorkan ke kasir hub |
| `110-COD-RECEIVABLE`| Piutang COD | `ASSET` | Nilai tagihan COD yang belum tertagih |
| `201-MERCHANT-PAYABLE`| Utang Merchant | `LIABILITY` | Kewajiban penyaluran dana COD ke pemilik barang |
| `202-DRIVER-REIMBURSEMENT`| Utang Klaim Kurir | `LIABILITY` | Saldo klaim biaya jalan (tol/parkir) kurir |
| `401-DELIVERY-REVENUE`| Pendapatan Pengiriman | `REVENUE` | Ongkos kirim yang diakui |
| `501-TOLL-EXPENSE` | Beban Tol & Parkir | `EXPENSE` | Biaya operasional armada di perjalanan |

### D. Jurnal Mutasi Finansial (`ledger_journal_entries` & `ledger_journal_lines`)
- **`ledger_journal_entries`:** Menyimpan *header* transaksi (`transaction_ref_id`, `entry_type`, `idempotency_key`, `posted_at`).
- **`ledger_journal_lines`:** Menyimpan *detail* mutasi berpasangan (`account_id`, `amount`, `direction: DEBIT/CREDIT`, `driver_id`, `order_id`).
- **Aturan Integritas:** $\sum \text{Debit} = \sum \text{Credit}$ untuk setiap `journal_entry_id`.

### E. Transactional Outbox (`outbox_events`)
Menjamin *at-least-once delivery* pemrosesan event asinkron ke message broker tanpa distributed transaction:
- `aggregate_type`, `aggregate_id`, `event_type`, `topic`, `payload`, `status: PENDING/PUBLISHED`, `attempt_count`, `available_at`.
