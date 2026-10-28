# Kepatuhan UU PDP & Arsitektur Keamanan TDMS

## 1. PII Masking (Nomor Telepon & Identitas)
Sesuai dengan ketentuan Undang-Undang Perlindungan Data Pribadi (UU PDP):
- Nomor telepon pelanggan disamarkan sebelum ditampilkan pada aplikasi kurir atau log monitoring (contoh: `+6281****7890`).
- Driver tidak memiliki akses langsung terhadap nomor riil pelanggan.

## 2. Field-Level Encryption (Alamat & Titik Koordinat)
- Kolom sensitif seperti detail alamat (`address_masked`) dan koordinat presisi pelanggan dienkripsi menggunakan algoritma simetris berstandar militer: **AES-256-GCM**.
- Setiap enkripsi menghasilkan *Initialization Vector* (IV) unik 16-byte dan *Authentication Tag* 16-byte untuk menjamin kerahasiaan (*confidentiality*) dan keaslian data (*integrity*).
- Format payload terenkripsi: `iv_hex:auth_tag_hex:ciphertext_hex`.

## 3. Anti-Fraud & Mock GPS Detection
- Metadata perangkat kurir diperiksa pada saat submit ping lokasi dan bukti pengantaran (e-POD).
- Jika flag mock provider bernilai `true`, request langsung ditolak dengan status error keamanan.
- Anomali lonjakan kecepatan ($> 160\text{ km/h}$) otomatis ditandai untuk investigasi manual oleh supervisor operasional.
