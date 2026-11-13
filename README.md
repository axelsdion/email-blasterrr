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
| `src/appsscript.json` | Manifest (zona waktu `Asia/Jakarta`, runtime V8) | manifest proyek (opsional) |
| `docs/Serah_Terima_Proyek_Email_Blasting.md` | Dokumen serah terima lengkap | – |
| `CLAUDE.md` | Aturan kerja untuk Claude yang melanjutkan proyek ini | – |

## Arsitektur singkat

```
Google Sheet
├─ Tab "Data"         : data konsumen + kolom kontrol (Status, Waktu Kirim, Keterangan, Template, Jadwal, OptOut)
├─ Tab "DaftarBounce" : alamat bermasalah (dibuat otomatis)
└─ Apps Script        : Code.gs + Template.html + Template2.html
Gmail pengirim (Workspace): kirim via GmailApp, terima balasan STOP & laporan bounce
```

Kolom `Data` (header harus persis): `Email`, `Status`, `Waktu Kirim`, `Keterangan` (wajib);
`OptOut`, `Template`, `Jadwal` (opsional); `Nama`, `LinkWA` (dipakai template sebagai `{{Nama}}`, `{{LinkWA}}`).

## Pasang cepat (manual, tanpa clasp)

1. Buat Google Sheet dengan akun pengirim, ganti nama tab menjadi `Data`, isi header di atas.
2. **File → Settings → Time zone → (GMT+07:00) Jakarta.**
3. **Extensions → Apps Script** → tempel `src/Code.gs` ke `Code.gs`, **ganti `SENDER_NAME`** di `CONFIG`.
4. Tambah file HTML `Template` dan `Template2`, tempel isi `src/Template.html` dan `src/Template2.html`.
5. **Ganti penanda sebelum kirim**: `GANTI-DENGAN-URL-BANNER` (kedua template) dan
   `GANTI-URL-FOTO-PRODUK` (Template 1; isi atau hapus blok fotonya). Skrip **tidak** mendeteksi penanda ini.
6. Refresh Sheet → menu **📧 Email Blast** → **1. Kirim email TEST** → beri semua izin (lihat SOP 7.1 di dokumen).

Opsional dengan [clasp](https://github.com/google/clasp): `clasp clone <scriptId> --rootDir src` lalu `clasp push`.
Hati-hati: `clasp push` menimpa semua file di proyek Apps Script dengan isi `src/`.

## Peringatan penting

- `SENT` hanya berarti Gmail menerima email untuk dikirim, bukan sampai ke penerima. Pantau bounce.
- Jaga total kiriman semua template di bawah `DAILY_CAP` (1.400) per 24 jam bergulir; jangan dua blast besar dalam satu pagi.
- Angka promo harus persis dari banner resmi dan disetujui Compliance/Legal (OJK).
- Fitur penanda bounce dan kirim bertahap baru diuji dengan simulasi, belum diverifikasi dengan Gmail asli.
