# email-blasterrr

Punya Mas Adit.

Sistem **email blasting gratis** berbasis **Google Sheet + Google Apps Script + Gmail (Google Workspace)**:
kirim email promo HTML per konsumen dari sheet `Data`, dengan penjadwalan per baris, kirim bertahap,
batas kirim 24 jam bergulir, OptOut dari balasan "STOP", dan penanda bounce otomatis.

> Acuan lengkap (kronologi, keputusan, spesifikasi, SOP, troubleshooting):
> [`docs/Serah_Terima_Proyek_Email_Blasting.md`](docs/Serah_Terima_Proyek_Email_Blasting.md).
> Kode di folder `src/` adalah salinan persis Lampiran A–C dokumen itu (versi final v9).

## Isi repo

| Path | Isi | Di Apps Script |
|---|---|---|
| `src/Code.gs` | Seluruh logika (menu, kirim, penjadwal, kirim bertahap, batas 24 jam, OptOut, bounce) | file `Code.gs` |
| `src/Template.html` | Template 1: Promo 11.11 gadget Infinix | file HTML bernama `Template` |
| `src/Template2.html` | Template 2: Promo 11.11 Super Deal TECNO | file HTML bernama `Template2` |
| `src/Template3.html` | Template 3: vivo V80 Lite 5G 10000mAh (promo 22 Okt – 30 Nov 2026) | file HTML bernama `Template3` |
| `src/appsscript.json` | Manifest (zona waktu `Asia/Jakarta`, runtime V8) | manifest proyek (opsional) |
| `docs/Serah_Terima_Proyek_Email_Blasting.md` | Dokumen serah terima lengkap | – |
| `docs/banners/` | Banner asli per template, acuan teks & angka promo | – |
| `docs/Panduan_BCC_dan_Label_Gmail.md` | Panduan salinan BCC + filter & label Gmail | – |
| `CLAUDE.md` | Aturan kerja untuk Claude yang melanjutkan proyek ini | – |

## Arsitektur singkat

```
Google Sheet
├─ Tab "Data"         : data konsumen + kolom kontrol (Status, Waktu Kirim, Keterangan, Template, Jadwal, OptOut)
├─ Tab "DaftarBounce" : alamat bermasalah (dibuat otomatis)
├─ Tab "DaftarOptOut" : alamat yang minta berhenti (dibuat otomatis)
├─ Tab "RiwayatKirim" : semua kiriman, untuk kirim ulang & hitungan 24 jam (dibuat otomatis)
└─ Apps Script        : Code.gs + Template.html + Template2.html
Gmail pengirim (Workspace): kirim via GmailApp, terima balasan STOP & laporan bounce
```

Kolom `Data` (header harus persis): `Email`, `Status`, `Waktu Kirim`, `Keterangan` (wajib);
`OptOut`, `Template`, `Jadwal` (opsional); `Nama`, `LinkWA` (dipakai template sebagai `{{Nama}}`, `{{LinkWA}}`).

## Pasang cepat (manual, tanpa clasp)

1. Buat Google Sheet dengan akun pengirim, ganti nama tab menjadi `Data`, isi header di atas.
2. **File → Settings → Time zone → (GMT+07:00) Jakarta.**
3. **Extensions → Apps Script** → tempel `src/Code.gs` ke `Code.gs`, **ganti `SENDER_NAME`** di `CONFIG`.
4. Tambah file HTML `Template`, `Template2`, `Template3`, tempel isi file `src/` yang sesuai.
5. **Ganti penanda sebelum kirim**: `GANTI-DENGAN-URL-BANNER` (semua template) dan
   `GANTI-URL-FOTO-PRODUK` (Template 1; isi atau hapus blok fotonya). Skrip **tidak** mendeteksi penanda ini.
6. Refresh Sheet → menu **📧 Email Blast** → **1. Kirim email TEST** → beri semua izin (lihat SOP 7.1 di dokumen).

Opsional dengan [clasp](https://github.com/google/clasp): `clasp clone <scriptId> --rootDir src` lalu `clasp push`.
Hati-hati: `clasp push` menimpa semua file di proyek Apps Script dengan isi `src/`.

## Peringatan penting

- `SENT` hanya berarti Gmail menerima email untuk dikirim, bukan sampai ke penerima. Pantau bounce.
- Jaga total kiriman semua template di bawah `DAILY_CAP` (1.400) per 24 jam bergulir; jangan dua blast besar dalam satu pagi.
- Angka promo harus persis dari banner resmi dan disetujui Compliance/Legal (OJK).
- Fitur penanda bounce dan kirim bertahap baru diuji dengan simulasi, belum diverifikasi dengan Gmail asli.

## Perubahan sejak dokumen serah terima

- **Menu 2b. Kirim bertahap** sekarang menanyakan jumlah email per putaran (1–400) dan jeda antar putaran
  (1–720 menit) setiap kali diklik. Kotak dikosongkan = pakai nilai bawaan; pilihan terakhir diingat
  (Script Property `BERTAHAP_PREF`). `CONFIG.BATCH_SIZE` / `BATCH_INTERVAL_MIN` kini hanya nilai bawaan pertama.
  Konfirmasi memberi peringatan bila ruang kirim 24 jam lebih kecil dari jumlah siap kirim, atau putaran > 100 email.
- **Template 3 (vivo V80 Lite 5G)** ditambahkan dan didaftarkan di `CONFIG.TEMPLATES`
  (subjek `{{Nama}}, VIVO V80 Lite 5G 10000mAh kini di Kreditplus!`). Periode promo berakhir **30 November 2026**.
- **Data bisa di-recycle (kirim ulang ke alamat yang sama).** `DUPLIKAT` tidak lagi berarti "pernah dikirim",
  tetapi "dikirimi kurang dari `MIN_RESEND_DAYS` (bawaan 7) hari lalu". Status tetap `SENT`; Keterangan berisi
  `Kiriman ke-1`, `Kiriman ke-2 (pertama …)`, `Kiriman ke-3 (pertama …, sebelumnya …)`.
  Semua kiriman dicatat di tab baru **`RiwayatKirim`** (dibuat otomatis, diisi awal dari baris SENT/BOUNCE yang ada).
- **Cek ke daftar bounce & opt-out sebelum kirim.** Menu baru **Cek data baru (DaftarBounce & OptOut)**, dan dijalankan
  otomatis di awal **Kirim sekarang** / **Kirim bertahap**: baris yang belum dikirim langsung ditandai `BOUNCE`,
  `BOUNCE_SEMENTARA`, atau `OPTOUT` sehingga angka "siap kirim" sudah bersih.
- **Opt-out permanen.** Balasan STOP dan kolom `OptOut = YA` disimpan di tab baru **`DaftarOptOut`**, jadi tetap
  berlaku walaupun barisnya dihapus dan data ditempel ulang.
- **Hitungan 24 jam tidak turun saat baris `Data` dihapus**: diambil yang terbesar dari sheet `Data` dan `RiwayatKirim`.
  Kiriman yang ditolak batas Gmail diberi catatan `GAGAL_LIMIT` di `RiwayatKirim` dan tidak dihitung.
- **Semua bounce = blacklist.** `BOUNCE_TEMP_DAYS` kini bawaan `0`: alamat di `DaftarBounce` tidak pernah dikirimi
  lagi, termasuk jenis SEMENTARA (inbox penuh, pengiriman tertunda). Bounce karena batas kirim akun kita sendiri
  (`GAGAL_LIMIT`) tetap tidak masuk daftar. Isi angka > 0 untuk kembali ke aturan lama (SEMENTARA dicoba lagi).
- **Salinan BCC untuk pantauan.** Email blast di-BCC ke alamat pengirim + `+blast` (atau `CONFIG.BCC_EMAIL`).
  Bawaan `BCC_SETIAP: 50` = 1 dari tiap 50 email + email pertama tiap template per putaran; `1` = semua email
  (memakai 2 kuota Apps Script per email, kapasitas ±725/hari); `0` = mati. Panduan filter & label Gmail:
  [`docs/Panduan_BCC_dan_Label_Gmail.md`](docs/Panduan_BCC_dan_Label_Gmail.md).
