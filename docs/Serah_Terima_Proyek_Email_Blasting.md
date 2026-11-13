# Dokumen Serah Terima: Proyek Email Blasting (Google Sheet + Apps Script + Gmail)

> **Untuk siapa dokumen ini:** akun Claude lain milik pengguna yang akan melanjutkan pekerjaan ini.
> **Isi:** ringkasan lengkap seluruh percakapan panjang antara pengguna (Adit) dan Claude, dari permintaan pertama sampai kondisi terakhir, beserta spesifikasi teknis, prosedur langkah demi langkah, kode final, dan template final.
> **Dibuat:** 12 November 2026. Semua tanggal di dokumen ini adalah tahun 2026 kecuali disebut lain.

---

## Daftar Isi

0. [Cara membaca dokumen ini](#0-cara-membaca-dokumen-ini)
1. [Ringkasan eksekutif](#1-ringkasan-eksekutif)
2. [Tentang pengguna dan preferensi kerja](#2-tentang-pengguna-dan-preferensi-kerja)
3. [Arsitektur sistem (kondisi final)](#3-arsitektur-sistem-kondisi-final)
4. [Kronologi lengkap, fase demi fase](#4-kronologi-lengkap-fase-demi-fase)
5. [Spesifikasi teknis final](#5-spesifikasi-teknis-final)
6. [Template email (final, aturan desain, dan pelajaran)](#6-template-email-final-aturan-desain-dan-pelajaran)
7. [Prosedur langkah demi langkah (SOP)](#7-prosedur-langkah-demi-langkah-sop)
8. [Jebakan umum dan pelajaran](#8-jebakan-umum-dan-pelajaran)
9. [Status terakhir, hal yang belum selesai, dan saran lanjutan](#9-status-terakhir-hal-yang-belum-selesai-dan-saran-lanjutan)
10. [Cara melanjutkan di akun Claude yang baru](#10-cara-melanjutkan-di-akun-claude-yang-baru)
- [Lampiran A: Kode final `Code.gs`](#lampiran-a-kode-final-codegs)
- [Lampiran B: Template 1 (Infinix) `Template.html`](#lampiran-b-template-1-infinix-templatehtml)
- [Lampiran C: Template 2 (TECNO) `Template2.html`](#lampiran-c-template-2-tecno-template2html)

---

## 0. Cara membaca dokumen ini

- Baca **Bagian 1 sampai 3** dulu untuk memahami tujuan dan bentuk sistem.
- **Bagian 4** adalah catatan kronologis: apa yang diminta, apa yang dijawab/dibuat, dan kenapa. Di sini ada semua keputusan dan koreksi.
- **Bagian 5** adalah spesifikasi teknis yang rinci. **Bagian 7** adalah prosedur operasional langkah demi langkah.
- **Bagian 9** berisi status terakhir dan daftar pekerjaan yang belum selesai.
- **Lampiran A sampai C** berisi kode dan template final secara lengkap (siap disalin). Dokumen ini sengaja berisi kode lengkap supaya akun Claude yang baru tidak perlu menebak.
- Konvensi: "sheet `Data`" berarti tab Google Sheet bernama `Data`. "Menu" berarti menu **📧 Email Blast** di Google Sheet.

**Bahasa dan gaya yang dipakai pengguna:** Bahasa Indonesia, santai (aku/kamu), sering mengirim screenshot untuk tanya jawab. Pengguna menyukai jawaban langkah demi langkah dan file panduan Markdown. Lihat Bagian 2 untuk detail preferensi.

---

## 1. Ringkasan eksekutif

**Tujuan proyek.** Pengguna (staf IT support di divisi QA Telemarketing sebuah perusahaan pembiayaan konsumen di Indonesia) ditugaskan membuat sistem **email blasting** untuk mengirim email penawaran (promo, kampanye) ke konsumen. Syaratnya:
- memakai **akun email kantor Google Workspace**,
- data konsumen di **Google Sheet**,
- **gratis** (tanpa layanan email marketing berbayar),
- bisa **dijadwalkan** (template dan jam kirim berbeda per konsumen),
- email bertampilan menarik (**template HTML**) dengan **tombol WhatsApp**.

**Solusi yang dibangun.** Satu skrip **Google Apps Script** yang terikat pada Google Sheet (menu **📧 Email Blast**), yang:
1. membaca baris konsumen di sheet `Data`,
2. memilih **template HTML** per baris (file HTML di Apps Script),
3. mengisi placeholder `{{NamaKolom}}`,
4. mengirim lewat `GmailApp` dari akun Workspace,
5. menulis hasil (`SENT`, `FAILED`, dst.) kembali ke sheet,
6. punya penjadwal (per baris punya `Jadwal`), kirim bertahap (mis. 50 email per 10 menit), batas kirim 24 jam, penanda OptOut dari balasan "STOP", dan pembaca laporan bounce Gmail yang menulis alasan kegagalan ke sheet dan menyimpan daftar alamat bermasalah.

**Kondisi final (akhir percakapan).**
- Template terdaftar: `Template` (Template 1, promo 11.11 Infinix) dan `Template2` (Template 2, promo 11.11 TECNO). Semua template lama (Template 3 sampai 7 versi sebelumnya) sudah **dihapus oleh pengguna**, dan sistem diulang dari nol dengan hanya template HTML (metode draft Gmail dihilangkan).
- Kode final ada di **Lampiran A** (file `email_blast.gs`, 1.265 baris).
- Pengguna pernah terkena **batas kirim Gmail** (±600 email ditolak karena dua blast besar di pagi yang sama, Senin 9 November). Dari situ dibuat: batas kirim 24 jam (`DAILY_CAP`), kirim bertahap, pemulihan `GAGAL_LIMIT`, dan penanda bounce lengkap.
- Terakhir pengguna melaporkan: terkirim 24 jam terakhir **1.246 dari batas 1.400**, kirim bertahap sudah berjalan, dan ada ±2.900 percakapan bounce di Gmail yang ingin ditandai otomatis.
- Pertanyaan terakhir pengguna: meminta ringkasan seluruh percakapan ini untuk dipindahkan ke akun Claude lain (dokumen ini).

---

## 2. Tentang pengguna dan preferensi kerja

**Profil singkat (dari konteks percakapan):**
- Nama: Adit. Bekerja di IT support, divisi QA Telemarketing, di KreditPlus (PT KB Finansia Multi Finance, pembiayaan konsumen, Indonesia). Pekerjaannya juga meliputi materi pelatihan/SOP untuk Telemarketing Officer (TMO).
- Zona waktu: Jakarta (WIB, GMT+07:00).
- Akun pengirim: akun **Google Workspace** pada domain vendor (`kpvendor.id`), **bukan** domain merek Kreditplus. Ini relevan untuk reputasi pengirim (SPF/DKIM/DMARC) dan batas kirim.
- Banner email **dibuat sendiri oleh pengguna** (gambar), Claude membuat template HTML di sekitarnya.

**Preferensi dan aturan yang ditetapkan sepanjang percakapan:**
1. Jawab dalam **Bahasa Indonesia**, langkah demi langkah, rinci. Pengguna sering meminta file **MD** berisi panduan lengkap plus kode siap salin.
2. Solusi harus **gratis** dan memakai Google Workspace yang sudah ada.
3. **Jangan mengarang angka promo** (bunga, cicilan, DP, tenor, periode). Pakai hanya yang tertulis di banner pengguna. Kalau belum ada, beri penanda `XXX` yang jelas lalu minta pengguna mengisi.
4. Perusahaan diatur OJK: sertakan "Syarat & ketentuan berlaku", pernyataan "Kreditplus berizin dan diawasi oleh Otoritas Jasa Keuangan" (di template yang banner-nya memuatnya), dan cara berhenti berlangganan ("balas STOP") di footer. Sarankan pengguna mengonfirmasi teks ke Compliance/Legal.
5. **Template: bagian "langkah" cukup maksimal 2 langkah.** Langkah "Ajukan melalui Aplikasi Kreditplus Mobile" **dihapus** dan jangan dipakai lagi di template berikutnya (berlaku untuk "sekarang dan seterusnya").
6. CTA tombol **WhatsApp Official** (`{{LinkWA}}`). Banner bersifat **bisa diklik** menuju WhatsApp.
7. Tidak memakai emoji mentah di HTML. Tulis emoji bergambar sebagai kode `&#nomor;` (lihat Bagian 8, masalah tanda tanya).
8. Tidak boleh ada teks penanda `GANTI` atau `XXX` yang tersisa saat dikirim (skrip tidak bisa mendeteksinya).
9. Konten yang perlu dihindari: istilah internal seperti "RO" di sisi konsumen.
10. Kolom data per baris yang dipakai template cukup `Nama` dan `LinkWA` (template terakhir tidak butuh kolom lain).

**Gaya kerja Claude yang berhasil:** menguji logika kode dengan simulasi (mock) di Node sebelum menyerahkan, menyimpan file ke folder output dan menyerahkannya, lalu menjelaskan perubahan, langkah pemasangan, dan hal yang perlu dicek. Mengakui kesalahan penjelasan secara terbuka bila ada (contoh di Fase 10).

---

## 3. Arsitektur sistem (kondisi final)

```
 Google Sheet (file spreadsheet)
 ├─ Tab "Data"          : data konsumen + kolom kontrol (Status, Waktu Kirim, Keterangan, Template, Jadwal, OptOut, ...)
 ├─ Tab "DaftarBounce"  : daftar alamat bermasalah (dibuat otomatis oleh skrip)
 └─ Apps Script (Extensions → Apps Script)
     ├─ Code.gs         : seluruh logika (Lampiran A)
     ├─ Template.html   : Template 1 (Lampiran B)
     └─ Template2.html  : Template 2 (Lampiran C)

 Akun Gmail pengirim (Google Workspace)
 ├─ Mengirim email lewat GmailApp.sendEmail (htmlBody)
 ├─ Menerima balasan "STOP" dan laporan bounce ("Mail Delivery Subsystem")
 └─ Filter buatan pengguna: from mailer-daemon → label "Bounce", lewati Inbox (jangan dihapus, jangan ke Trash)
```

**Kolom sheet `Data` (nama header harus persis, huruf besar-kecil):**

| Header | Wajib? | Fungsi |
|---|---|---|
| `Email` | Wajib | Alamat tujuan |
| `Status` | Wajib | Diisi skrip. Kosong/`PENDING` = menunggu |
| `Waktu Kirim` | Wajib | Diisi skrip (`yyyy-MM-dd HH:mm:ss`) |
| `Keterangan` | Wajib | Alasan gagal/dilewati/bounce |
| `OptOut` | Opsional | `YA` = berhenti berlangganan |
| `Template` | Opsional | `1`, `2`, ... atau nama (`Template2`). Kosong = `ACTIVE_TEMPLATE` |
| `Jadwal` | Opsional | Tanggal + jam, mis. `2026-11-11 09:00` atau `11/11/2026 09:00` |
| `Nama`, `LinkWA`, dst. | Sesuai template | Dipakai sebagai placeholder `{{Nama}}`, `{{LinkWA}}` |

Posisi kolom bebas karena skrip membaca nama header.

**Kolom `LinkWA`:** rumus per baris, contoh `="https://wa.me/6281234567890?text="&ENCODEURL("Halo, saya "&A2&" tertarik dengan "&C2)`. Nomor internasional tanpa 0 di depan dan tanpa `+`. Pengguna juga memiliki link resmi `https://wa.link/szn4xf` (satu link untuk semua, tanpa pesan terisi) yang dapat langsung dipakai sebagai pengganti `{{LinkWA}}`.

---

## 4. Kronologi lengkap, fase demi fase

### Fase 1: Permintaan awal dan riset batas kirim
**Permintaan pengguna:** membuat proyek email blasting; semula disuruh memakai email kantor terintegrasi Google Workspace (limit kirim kira-kira 1.000-2.000/hari), data di Google Sheet, kirim otomatis ke email konsumen, tanpa biaya, "dari awal alur sampai bisa dipakai".

**Jawaban Claude:**
- Memilih **Google Apps Script** yang terikat pada Sheet sebagai penghubung gratis.
- Riset dokumentasi resmi **Apps Script Quotas** (untuk akun Google Workspace): **1.500 penerima email per hari** (2.000 jika penerima di domain yang sama), **maksimal 50 penerima per pesan**, kuota direset sekitar **24 jam setelah permintaan pertama**, ukuran isi email sekitar 400 KB. Kesimpulan: karena konsumen adalah penerima eksternal, kapasitas praktis **±1.500 email/hari**.
- Membuat versi awal skrip: menu **📧 Email Blast**, sheet `Data` dengan kolom `Email`, `Status`, `Waktu Kirim`, `Keterangan`, template dari **draft Gmail** berawalan `[BLAST]` (subjek draft = subjek email, placeholder `{{...}}`), pengiriman satu email per konsumen, penandaan `SENT/FAILED/INVALID/DUPLIKAT/OPTOUT`, penjaga kuota, batas waktu eksekusi 5 menit dengan pemicu lanjutan, dan kunci (`LockService`) agar tidak ada proses ganda.
- Saran deliverability: SPF/DKIM/DMARC, mulai dengan batch kecil, opt-out, serta kepatuhan data pribadi (UU PDP) dan konsultasi ke Compliance.

**Permintaan lanjutan:** pengguna meminta panduan dalam bentuk **MD** lengkap dengan langkah demi langkah dan kode siap salin. Claude membuat `Panduan_Email_Blasting_GSheet.md` (Tahap 0 sampai 7, troubleshooting, checklist, lampiran). *(File ini sekarang kedaluwarsa, lihat Bagian 9.)*

### Fase 2: Masalah izin (authorization)
1. Pengguna melihat **"Authorization required"**. Jawaban: klik Continue, pilih akun, kalau muncul "Google hasn't verified this app" klik Advanced lalu Go to ... (unsafe), lalu Allow. Skrip buatan sendiri memang tidak terverifikasi.
2. Setelah itu muncul pesan **"The script does not have permission to perform that action. Required permissions: https://mail.google.com/ || gmail.readonly || gmail.compose || gmail.modify"**. Penyebab: izin Gmail tidak tercentang saat Allow. Catatan penting: "Completed" di execution log tidak membuktikan izin benar, karena skrip menangkap error dan menampilkannya di kotak pesan Sheet.
3. Solusi: hapus akses lama di `myaccount.google.com/permissions`, lalu tambahkan fungsi pengecek izin `otorisasi()` di paling bawah `Code.gs` (setelah kurung kurawal terakhir), jalankan dari editor (dropdown fungsi → Run), centang semua izin.
4. Pengguna menjalankan `otorisasi` dan log menunjukkan error pada `SpreadsheetApp.getActive` (izin Spreadsheet belum masuk). Jawaban: klik **Review permissions** pada dialog "Authorization required", pilih akun, **Continue** pada layar "Untitled project already has some access to 4 services". Nama "Untitled project" hanyalah nama proyek skrip yang belum diganti. Setelah itu `otorisasi` berhasil ("OK, semua izin lengkap").
5. Catatan: kalau admin Workspace memblokir akses aplikasi pihak ketiga/Apps Script, izin tidak bisa diberikan sampai admin mengizinkan. Pengguna berada di IT support sehingga bisa memeriksa Admin Console.
6. Pengguna memastikan akunnya di domain `kpvendor.id`; Claude menyarankan melihat angka kuota di menu ringkasan (jauh di bawah 1.500 berarti bukan Workspace penuh).

### Fase 3: Pertanyaan perilaku dasar
- **Baris baru ditambahkan (baris 4-6) setelah 3 baris yang sudah dites:** baris yang sudah `SENT` tidak dikirim ulang. Hanya baris Status kosong/`PENDING` yang dikirim. Catatan: menu TEST tidak mengubah Status; kalau baris uji hanya dites lewat TEST, Status-nya masih kosong dan akan ikut terkirim saat kirim batch. Jangan menimpa kolom Status saat paste; email yang sama dengan baris `SENT` ditandai `DUPLIKAT`. Cek angka di jendela konfirmasi.
- **Konsumen membalas "STOP":** awalnya manual (isi `OptOut = YA` di barisnya). Lalu Claude menambahkan fitur otomatis `syncOptOut_`: mencari balasan di inbox (30 hari, 100 percakapan, bukan dari diri sendiri), mencocokkan alamat pengirim dengan kolom `Email`, membaca bagian atas balasan (2 paragraf pertama, mengabaikan kutipan) dan jika memuat kata `stop`, `berhenti`, atau `unsubscribe` maka mengisi `OptOut = YA`. Ditambahkan menu **Tandai OptOut dari balasan STOP** dan dipanggil otomatis sebelum tiap pengiriman. Batasan: hanya cocok bila balasan datang dari alamat yang sama dengan di sheet.
- **"Kirim otomatis atau trigger belum aktif?"** Belum otomatis. Pengiriman hanya jalan saat menu diklik, kecuali trigger diaktifkan lewat menu. Cek di ikon jam (Triggers) panel kiri Apps Script. Peringatan: mode otomatis versi awal mengirim semua baris Status kosong, jadi gunakan `HOLD` untuk menahan.

### Fase 4: Template HTML, tombol WhatsApp, gambar
- **Pertanyaan pengguna:** bisakah isi email dipersonalisasi dan dibuat menarik (contoh email internal perusahaan yang dilampirkan), serta ditambah link WhatsApp langsung?
- **Jawaban:** ya. Draft Gmail terbatas untuk tampilan kompleks, jadi dipakai **file HTML** di Apps Script (`HtmlService.createTemplateFromFile(nama).getRawContent()`). Template punya placeholder `{{NamaKolom}}` yang dicocokkan dengan header sheet; skrip menolak mengirim jika ada placeholder yang tidak cocok. Ukuran lebar 600 px, tabel, gaya inline.
- **Link WhatsApp:** kolom `LinkWA` di sheet dengan rumus `wa.me` + `ENCODEURL`, atau satu link resmi `wa.link/...`. Rumus ditaruh di **Google Sheet** (bukan Apps Script). Format nomor `62...` tanpa 0 dan tanpa `+`.
- **Gambar:** harus URL publik. Pilihan: hosting perusahaan, atau Google Drive dengan akses "Anyone with the link". Link Drive tipe `.../file/d/ID/view` **bukan** gambar langsung; ubah menjadi `https://lh3.googleusercontent.com/d/ID_FILE` (paling stabil) atau `https://drive.google.com/uc?export=view&id=ID_FILE`. Kalau berbagi ke luar domain dibatasi admin, konsumen (di luar domain) tidak akan melihat gambar. Pengguna memakai format `lh3...`. Alternatif yang ditawarkan tapi tidak dipakai: menyisipkan gambar langsung (inline) lewat skrip.
- **Logo di email:** logonya punya kotak latar yang tidak menyatu. Opsi: PNG transparan (dipilih pengguna, karena latar kotak tetap terlihat di dark mode Android), atau menyamakan warna latar, atau hapus logo. Header kemudian dibuat rata tengah dan lebih besar (tinggi 52 px). Pengguna lalu memutuskan logo dimasukkan ke dalam banner dan baris logo dihapus.
- **Panduan MD kedua:** `Panduan_Template_HTML_Email_Blasting.md` (tahap menambah file HTML, kolom `LinkWA`, ukuran banner, troubleshooting). *(Kedaluwarsa.)*
- **Ukuran gambar yang disarankan:** banner lebar file 1200 px (tampil 600 px), logo tinggi ±72-104 px PNG transparan, ikon produk 160x160 px PNG transparan, ukuran file < 300 KB.
- **Teks tampil di email:** `Alt+Enter` di sel Sheet menghasilkan baris baru yang di HTML dianggap spasi. Perbaikan: `escapeHtml_` mengganti baris baru dengan `<br>`.

### Fase 5: Beberapa template dan penyempurnaan tampilan
- Dibuat mekanisme **banyak template**: `CONFIG.ACTIVE_TEMPLATE` dan `CONFIG.TEMPLATES` (nama file HTML dan subjek masing-masing). Template 2 pertama (promo elektronik dengan cicilan, kartu kategori produk, kartu "Produk untuk Anda") dibuat dengan kolom `Cicilan`.
- **Masalah HP vs komputer:** kartu produk dua kolom (teks kiri, badge kanan) terpotong di HP karena lebar kartu hanya ±265 px. Perbaikan: tata letak dua baris (produk selebar penuh di atas; di bawahnya cicilan dan badge sejajar), harga dibungkus `white-space:nowrap`, ukuran teks produk 15 px.
- **Badge DP:** warna kuning diganti oranye (`#e8650a`, kontras lebih baik) dengan teks putih, lalu teks diubah menjadi "DP mulai dari 0%". Kotak info "Jika ada pertanyaan..." dibuat rata tengah. Ditambahkan baris **"S&K berlaku."** kecil di kartu produk (warna abu tua `#475569`).
- **Dark mode:** Gmail membalik warna otomatis; ini normal dan tidak bisa dikontrol penuh.

### Fase 6: Penjadwalan per konsumen
**Permintaan:** blast terjadwal, mis. konsumen 1-400 jam 09.00 template 1, 401-800 jam 10.00 template 2, 801-1000 jam 12.00 template 3, atau custom per konsumen.

**Solusi:** dua kolom sheet baru, `Template` dan `Jadwal`. **Penjadwal otomatis** (`schedulerRun`, trigger waktu tiap `SCHEDULER_MINUTES` menit, default 5) mengirim **hanya baris yang punya Jadwal dan jamnya sudah tiba**, memakai template pada kolom `Template` baris itu. Baris tanpa Jadwal tidak disentuh penjadwal (agar data yang baru dipaste tidak terkirim tanpa sengaja); baris itu hanya terkirim lewat menu **Kirim sekarang**.
- Kolom `Template` boleh `1`, `2`, `3`, atau nama lengkap; kosong = template bawaan.
- Jadwal wajib tanggal + jam (jam saja ditolak: `JADWAL_INVALID`). Format `yyyy-MM-dd HH:mm` atau `dd/MM/yyyy HH:mm`. Jadwal yang sudah lewat dianggap sudah waktunya.
- **Zona waktu Sheet harus Jakarta** (File → Settings); zona waktu skrip di `appsscript.json` hanya memengaruhi penulisan `Waktu Kirim`.
- Status baru: `TERJADWAL` (hanya di ringkasan), `JADWAL_INVALID`, `TEMPLATE_ERROR` (template tidak terdaftar/file hilang/placeholder tidak cocok; tidak dicoba ulang otomatis; kosongkan Status untuk mencoba lagi).
- Rangkaian kampanye yang direncanakan pengguna: Template 3 (kirim 11 Nov), Template 4, 5, 6 pada tanggal lain.
- Ditambahkan juga: pengecekan OptOut sebelum kirim, urutan kirim (Jadwal paling awal dulu, lalu urutan baris), `NOTIFY_EMAIL` opsional untuk ringkasan, pemicu lanjutan `continueRun`, serta pembuatan **Template 3 dan 4 yang sudah terdaftar** di kode (desain menyusul).
- **Panduan MD ketiga:** `Panduan_Penjadwalan_Email_Blast.md` (Tahap 0 sampai 9 lengkap dengan kode). *(Kedaluwarsa.)*

**Pertanyaan perilaku penjadwalan yang dijawab:**
- *500 email dijadwalkan jam 11.00, apakah bersamaan?* Tidak. Dikirim **bergantian satu per satu** (jeda 0,15 detik, tiap email ±0,3-1 detik), mulai 11.00-11.05 (karena pengecekan tiap 5 menit). Satu putaran maksimal ±5 menit (±400-500 email) lalu dilanjutkan di pengecekan berikutnya. Perkiraan selesai 5-15 menit untuk 500 email. `Waktu Kirim` mencatat detik kirim tiap email.
- *Masih bisa kirim manual tanpa jadwal?* Ya: kosongkan `Jadwal` lalu menu **Kirim sekarang**.
- *Kirim manual "Running script" lebih dari 5 menit:* wajar. Jendela hasil baru muncul setelah satu putaran (maks ±5 menit). Cek kolom Status (disimpan tiap 25 email), Executions, dan folder Sent. Kalau belum selesai, skrip melanjutkan otomatis ±1 menit kemudian. Jangan klik Kirim sekarang lagi.
- *Kolom mana yang dicek pertama:* **Status** dulu (harus kosong/`PENDING`), lalu **Jadwal**. `Waktu Kirim` tidak pernah dipakai untuk memutuskan apa pun, hanya diisi setelah `SENT`/`FAILED`.

### Fase 7: Rangkaian template kampanye 11.11 dan Black Friday (versi lama, sudah dihapus)
Berikut template yang dibuat berurutan sebelum pengguna mengulang dari nol. Semuanya hanya memakai placeholder `{{Nama}}` dan `{{LinkWA}}`, banner bisa diklik ke WhatsApp, footer berisi STOP. Dokumentasi ini penting karena **desain dan teksnya bisa dipakai ulang**.

| Nama lama | Kampanye | Subjek | Catatan |
|---|---|---|---|
| Template3 | Flash Sale 11.11 (hari-H) | `[HARI INI] Promo 11.11 Spesial Customer Setia!` | Awalnya tema neon gelap (hero "11.11 BIG SALE", 3 produk hero TV 55"/AC Inverter/flagship, tombol WA menyala). Logo dihapus (logo masuk banner). Lalu diubah "lebih fun" (gaya pop/stiker: warna cerah, garis tebal, emoji). Akhirnya pengguna mengunggah desainnya sendiri `Template3_fun_minimalist.html` dan memakainya (disarankan menambah `white-space:nowrap` pada harga). Teks pembuka: "HARI INI PUNCAK PROMO 11.11! Saatnya mewujudkan rumah impian dengan Smart TV 55 inch, AC Inverter, atau Gadget impian. Gunakan sisa limit kredit Anda sekarang..." |
| Template4 | Teaser/Warm-up 11.11, Eksklusif RO | `{{Nama}}, limit kredit Anda siap dipakai promo 11.11!` | Banner "Cek Limit Kredit Siap Pakai Sebelum Festive 11.11" (portrait). Teks pengguna: "plafon kredit Anda di aplikasi [Nama Apps] sudah aktif & siap digunakan tanpa perlu pengajuan ulang." Ditambah kartu status limit, "3 langkah" (lalu diubah jadi 2), rekomendasi Smart TV/Kulkas Inverter/Mesin Cuci, "Kenapa sekarang?", pita teaser. Nama aplikasi ditulis langsung di HTML (`GANTI NAMA APLIKASI`). |
| Template5 | Peak, Malam Puncak 11.11 (kirim Selasa 10 Nov) | `[Besok 11.11] Stok Terbatas! Gunakan limit kredit Anda sekarang` | Merah-emas. Kartu "STOK TERBATAS", hitung mundur HARI INI (Selasa 10 Nov) dan BESOK (Rabu 11 Nov), produk hero dikelompokkan Gadget (Smartphone Flagship, Laptop, Earbuds) dan Home Appliance (Smart TV, Air Fryer, Vacuum), label "DISKON KHUSUS" (mengikuti banner), CTA "Klaim Promo 11.11 via WA Official". Teks isi ditulis Claude (pengguna tidak memberi naskah). |
| Template6 | Puncak Black Friday (kirim Jumat 20 Nov) | `Black Friday Deals: Bawa pulang elektronik pilihan Anda!` | Hitam-emas premium, font serif untuk judul, grid 2 kolom (Kulkas Multidoor, Smart TV Premium) plus kartu lebar Soundbar, cicilan `Rp XXX ribu` (diisi pengguna, banner menampilkan Rp 199 ribu), CTA "Ambil Promo Black Friday via WA". Catatan: Black Friday global 2026 jatuh 27 Nov; email tidak memuat tanggal. |
| Template7 | Promo 11.11 gadget Infinix | `{{Nama}}, limit kredit Anda siap dipakai promo 11.11!` | **Menjadi Template 1 final** (lihat Fase 8). |

**Masalah penting yang ditemukan di fase ini:**
- **Tanda tanya setelah nama ("������"):** emoji 👋 yang ditulis mentah di HTML rusak. Penyebab: emoji 4-byte (di luar BMP) rusak saat melewati Apps Script (muncul 6 karakter pengganti, pola pasangan surrogate). **Solusi:** tulis emoji bergambar sebagai entitas numerik, mis. 👋 = `&#128075;`, 🎉 = `&#127881;`, 🔥 = `&#128293;`, 💬 = `&#128172;`, 👇 = `&#128071;`. Simbol sederhana (✦ • ✨ →) aman, tapi sejak itu semua template memakai entitas HTML, tanpa karakter non-ASCII. Versi teks polos email juga dirapikan: `&amp;` dan `&bull;` didekode, entitas numerik dibuang.
- Pelajaran dari tampilan HP: hindari dua kolom sempit; teks harus selebar penuh kartu; kolom 3 ikon masih aman; harga dibungkus `nowrap`.

### Fase 8: Mengulang dari nol (Template 1 = Infinix)
**Permintaan:** "Aku mulai semuanya dari nol, dan ini template yang pertama. Semua template yang pernah kita buat dihapus saja. Hilangkan metode manual di draft, semua harus menggunakan template."

**Tindakan:** Template Infinix (Template7 lama) dijadikan **`Template`** (Template 1). `Code.gs` diubah:
- `DRAFT_PREFIX` dan jalur draft Gmail **dihapus**. `getTemplate_(name)` kini wajib template terdaftar; jika nama kosong/tidak terdaftar/file hilang, melempar error jelas (tidak diam-diam jatuh ke draft).
- `CONFIG.TEMPLATES` hanya berisi `Template` (subjek `{{Nama}}, limit kredit Anda siap dipakai promo 11.11!`).
- `otorisasi()` tidak lagi memanggil `getDrafts()`, melainkan pencarian inbox 1 item.
- Menu **Kirim sekarang** dan penjadwal **tetap ada** (interpretasi: yang dihapus adalah template draft Gmail, bukan menu kirim manual).
- Langkah reset untuk pengguna: matikan penjadwal, hapus file HTML `Template2`-`Template7` di Apps Script, isi file `Template` dengan desain baru, ganti `Code.gs`, isi `SENDER_NAME`, bersihkan kolom `Template`/`Jadwal`/`Status`/`Waktu Kirim`/`Keterangan` di sheet, hapus draft `[BLAST]`.
- Catatan: panduan MD sebelumnya kedaluwarsa.

**Pertanyaan foto produk Template 1:** blok foto memakai placeholder `GANTI-URL-FOTO-PRODUK.png`. Disarankan satu **gambar kompilasi semua HP** (bukan satu HP), diambil dari banner dan dibuat transparan, atau minta aset resmi, atau **hapus blok foto** sementara (hapus `<tr>` yang berisi `<img ... GANTI-URL-FOTO-PRODUK ...>` lalu ubah padding baris "PILIHAN MODEL" menjadi `padding:16px 14px 4px 14px`).

### Fase 9: Template 2 (TECNO) dan perubahan "2 langkah"
- **Template 2:** dibuat dari banner TECNO "PROMO 11.11 SUPER DEAL". Subjek `[HARI INI] Promo 11.11 Spesial Customer Setia!`. Isi: label "HARI INI" dan "SPESIAL PELANGGAN SETIA", judul "Promo 11.11 Super Deal!", kartu promo dengan header "Beli TECNO CAMON 50 & POVA 8 SERIES dengan KREDITPLUS" dan baris DP (mulai dari Rp 0*), Tenor (12 & 18 Bulan), Bunga (mulai dari Rp 0*), dua kotak seri, kotak "PERIODE PROMO 23 Oktober - 31 Desember 2026", langkah, panel "Ajukan Sekarang!" dengan tombol WhatsApp Official dan tautan `https://kbkp.app/su/TECNOPOVA`, footer OJK. Tidak memerlukan foto produk. Kata **"Bunga mulai dari Rp 0*"** meniru banner persis; disarankan konfirmasi ke Compliance apakah maksudnya "Rp 0" atau "0%".
- **Perubahan langkah:** pengguna meminta langkah "Ajukan melalui Aplikasi Kreditplus Mobile" dihapus "buat sekarang dan seterusnya, cukup 2 langkah". Dilakukan di **kedua** template (Template 1 dan 2): judul menjadi "2 langkah miliki gadget impian", langkah 1 "Chat WhatsApp Official", langkah 2 "Pilih model Infinix favoritmu" (Template 1) atau "Pilih TECNO CAMON 50 atau POVA 8 Series" (Template 2). Preferensi dicatat untuk template berikutnya.

### Fase 10: Insiden bounce dan batas kirim Gmail
**Gejala dan penjelasan bertahap:**
1. Inbox pengirim penuh email "Mail Delivery Subsystem" berjudul "Delivery incomplete". Isinya: `452 4.2.2 The recipient's inbox is out of storage space`. **Artinya:** inbox Gmail penerima penuh; sementara (Gmail mencoba lagi ±45 jam). Itu **bukan error skrip**. Status `SENT` hanya berarti Gmail menerima email dari akun pengirim untuk dikirim; penolakan datang belakangan.
2. Disarankan **filter Gmail**: From `mailer-daemon@googlemail.com` → Skip the Inbox + label baru `Bounce` + "Also apply filter to matching conversations". Filter hanya berlaku untuk email baru kecuali kotak "apply to matching conversations" dicentang; untuk email lama: edit filter di Settings → Filters and Blocked Addresses, atau pencarian `from:mailer-daemon in:inbox` → Select all → "Select all conversations that match this search" → beri label dan arsipkan. Gunakan juga `from:(mailer-daemon OR postmaster)`. **Jangan dihapus ke Trash** karena skrip pembaca bounce perlu membacanya (pencarian Gmail menemukan yang diarsipkan/berlabel, tidak yang di Trash).
3. Pengguna menemukan ±600 email dengan pesan **"You have reached a limit for sending mail. Your message was not sent."** Penjelasan: ini batas jumlah kirim akun, **bukan penilaian spam**. Dari screenshot, email Infinix (Senin 9 Nov 09.33) dan TECNO (09.28) berangkat di pagi yang sama dari satu akun, melewati batas. Sumber Google: batas Workspace **2.000 pesan/hari per akun (1.500 untuk mail merge, 500 untuk trial)**, periode **24 jam bergulir (bukan jam tetap)**, penerima eksternal ±3.000/hari dan unik eksternal ±2.000; email alias/auto-reply juga ikut terhitung; akun yang melampaui batas tidak bisa mengirim sampai 24 jam, dan akun yang mengirim spam bisa dibatasi.
4. **Akar masalah di skrip:** penjaga kuota hanya membaca `MailApp.getRemainingDailyQuota()` (kuota Apps Script), tidak memantau batas Gmail. Skrip terus mengirim, Gmail menerima lalu menolak belakangan, dan baris sudah terlanjur `SENT`. Maka **status `SENT` untuk ±600 email itu salah**.
5. Pertanyaan "apakah emailku kena spam?" dijawab: tidak ada tanda spam di screenshot; periksa dengan email tes ke Gmail/Outlook/Yahoo pribadi, pastikan **SPF/DKIM/DMARC `kpvendor.id`**, dan catat bahwa domain pengirim (`kpvendor.id`) berbeda dari merek (Kreditplus Promo), yang bisa menurunkan kepercayaan.
6. **Tindakan sementara yang disarankan:** matikan penjadwal; jangan kirim lagi sampai batas pulih (±24 jam sejak kirim massal pagi); jangan mengosongkan Status secara manual tanpa alamat pasti.

**Kebingungan angka "PENDING 642 vs SENT":** pengguna menunjukkan ringkasan `PENDING: 642, SENT: 3070, sisa kuota 50` dan bertanya kenapa 642 pending padahal sheet tertulis SENT semua. Claude awalnya menjelaskan bahwa 642 baris itu belum pernah dicoba kirim (dugaan salah). **Koreksi:** pengguna sudah mengidentifikasi ±600 email yang gagal limit dari inbox, lalu **mengosongkan Status dan Jadwal baris-baris itu sendiri**, itulah 642 PENDING. Konfirmasi lain dari pengguna: alamat penerima **terlihat** pada pesan asli di thread bounce (bagian "to").

**Yang dibuat sebagai respons:**
- `DAILY_CAP` (default 1.400): skrip menghitung baris `SENT` dalam 24 jam terakhir dari sheet dan berhenti sebelum mencapai angka ini. Angka tampil di dialog konfirmasi dan **Lihat ringkasan**.
- Pemulihan bounce: menu yang mengubah baris `SENT` yang ditolak limit menjadi `GAGAL_LIMIT` (tidak dikirim sampai dilepas) dan menu **Kirim ulang yang gagal limit (lepas GAGAL_LIMIT)** yang mengosongkan Status baris `GAGAL_LIMIT`.
- Sebuah **Claude Doc** ringkasan dibuat di akun ini ("Pemulihan Kiriman Gagal & Batas Kirim 24 Jam – Email Blast"); dokumen itu terikat pada akun asal sehingga mungkin tidak dapat dibuka dari akun lain. Pengguna sempat tidak memahami isinya, lalu menyatakan kebutuhan sebenarnya (Fase 11).

### Fase 11: Kirim bertahap (50 email per 10 menit)
**Permintaan:** kirim manual ±600 email yang tertahan, **50 email sekali kirim, jeda 10 menit, sampai semua terkirim**.

**Solusi:** menu **2b. Kirim bertahap (jeda otomatis)** dengan `CONFIG.BATCH_SIZE = 50` dan `BATCH_INTERVAL_MIN = 10`. Putaran pertama berjalan langsung; berikutnya berjalan otomatis lewat pemicu satu kali `bertahapRun` di server Google (Sheet boleh ditutup). Status disimpan di Script Properties `BERTAHAP`. Pengaman:
- berhenti jika Gmail melaporkan "reached a limit" setelah proses dimulai (`LIMIT_GMAIL`), cek sebelum tiap putaran berikutnya;
- berhenti di `DAILY_CAP` (`BATAS_HARIAN`) atau kuota Apps Script habis (`KUOTA`);
- bila ada proses lain memegang kunci, mencoba lagi dalam 2 menit;
- menu **Status kirim bertahap** dan **Hentikan kirim bertahap**; ringkasan akhir via `NOTIFY_EMAIL` bila diisi.
Pengguna menjalankannya ("50 email sudah berjalan otomatis"). Catatan: bila batas harian tercapai di tengah jalan, proses **berhenti** dan harus dimulai ulang manual (usulan lanjutan: menunggu otomatis, lihat Bagian 9).

### Fase 12: Penanda bounce lengkap dan daftar bounce
**Permintaan:** skrip membaca bounce (±2.900 percakapan) dan menandai di Keterangan alasannya (Address not found, The recipient's inbox is out of storage space, dll.), agar alamat itu tidak dikirimi lagi sehingga limit tidak terbuang dan label bounce tidak bertambah.

**Solusi:** menu **Tandai bounce dari laporan Gmail** (`tandaiBounce`) yang membaca `from:mailer-daemon newer_than:14d`:
- mengenali jenis bounce (limit, alamat tidak ada, domain salah, inbox penuh, diblokir, kode SMTP lain);
- menulis ke sheet `Data`: `Status` = `BOUNCE` (permanen), `BOUNCE_SEMENTARA` (inbox penuh dll.), atau `GAGAL_LIMIT`, dan alasan di `Keterangan` (diawali `[Bounce]`);
- mencatat alamat bermasalah di tab **`DaftarBounce`** (Email, Jenis PERMANEN/SEMENTARA, Alasan, Tanggal Bounce, Ditambahkan);
- **mulai saat itu, setiap pengiriman melewati alamat di daftar** (PERMANEN selamanya, SEMENTARA selama `BOUNCE_TEMP_DAYS` = 14 hari), dan baris yang belum terkirim ikut langsung ditandai;
- pemindaian per 50 percakapan dengan kursor (`BOUNCE_CURSOR`) dan pemicu lanjutan `bounceLanjut` tiap 1 menit sampai habis, sehingga jumlah besar cukup satu klik; ringkasan akhir menampilkan rincian per alasan;
- opsional pemindaian otomatis tiap jam (`bounceRun`, hanya bounce 3 jam terakhir).
Pencocokan baris memakai alamat penerima pada email asli di thread dan **selisih waktu ≤ 10 menit** antara `Waktu Kirim` dan tanggal email asli (agar bounce lama tidak salah mengenai baris yang sudah dikirim ulang). Thread dengan banyak email asli dicocokkan lewat alamat yang tertulis di isi bounce; bila tetap ambigu, dilewati.
Logika ini diuji dengan simulasi, **belum dengan Gmail asli**, dan hasil pemindaian pertama dari pengguna belum dilaporkan.

### Fase 13: Cara kerja hitungan "Terkirim 24 jam terakhir"
**Pertanyaan:** apakah hitungan reset sekaligus di sore hari atau terus berkurang per jam kirim (contoh: blast 400 jam 12.00 dan 300 jam 13.00; jam 12.10 hari berikutnya harusnya turun 50)?
**Jawaban:** jendela **bergulir per email**: skrip menghitung baris dengan `Waktu Kirim` dalam 24 jam terakhir; tiap email keluar dari hitungan tepat 24 jam setelah waktu kirimnya sendiri, bukan berdasarkan pengiriman terakhir. Ini sama dengan cara Gmail menghitung batasnya. Simulasi: 540 terhitung pukul 11.59, 490 pukul 12.10 (batch 12.00 keluar), 390 pukul 12.30, 200 pukul 13.06, 0 pukul 14.00.
**Perbaikan kode:** baris berstatus `BOUNCE` dan `BOUNCE_SEMENTARA` **tetap dihitung** (email itu diterima Gmail lebih dulu); `GAGAL_LIMIT` dan `FAILED` tidak. **Lihat ringkasan** kini menampilkan: terkirim 24 jam, ruang kirim sekarang, "ruang bertambah +X dalam 1/3/6 jam", dan perkiraan jam semua pulih.
**Dua angka kuota berbeda:** (a) `DAILY_CAP` (dihitung skrip dari sheet, berbasis batas Gmail), (b) "Sisa kuota Apps Script hari ini" (`MailApp.getRemainingDailyQuota`, kuota Apps Script yang menurut Google direset 24 jam setelah permintaan pertama; perilakunya mungkin berbentuk blok). Pengiriman berhenti di angka yang lebih ketat; untuk perencanaan pakai "Ruang kirim sekarang". Kewaspadaan: hitungan hanya dari sheet ini (email lain dari akun yang sama tidak terhitung), jangan mengosongkan Status/Waktu Kirim baris yang sudah terkirim, dan zona waktu Sheet harus Jakarta.

### Fase 14: Permintaan ringkasan
Pengguna meminta seluruh percakapan dirangkum rinci, langkah demi langkah, dalam MD agar dapat dibaca akun Claude lain. Dokumen inilah hasilnya.

---
## 5. Spesifikasi teknis final

### 5.1 Status baris (kolom `Status`)

| Status | Arti | Dikirim? | Sumber |
|---|---|---|---|
| *(kosong)* / `PENDING` | Menunggu | Ya (sesuai aturan Jadwal) | default |
| `SENT` | Email diterima Gmail untuk dikirim | Tidak | skrip |
| `FAILED` | Gagal kirim (alasan di Keterangan) | Tidak | skrip |
| `INVALID` | Format email tidak valid | Tidak | skrip |
| `DUPLIKAT` | Email sama dengan baris yang sudah `SENT` | Tidak | skrip |
| `OPTOUT` | Penerima berhenti berlangganan (`OptOut` = `YA`) | Tidak | skrip |
| `JADWAL_INVALID` | Format Jadwal tidak dikenali | Tidak | skrip |
| `TEMPLATE_ERROR` | Template tidak terdaftar / file hilang / placeholder tidak cocok | Tidak | skrip |
| `GAGAL_LIMIT` | Email diterima Gmail tapi ditolak karena batas kirim akun | Tidak, sampai dilepas | tandai bounce |
| `BOUNCE` | Alamat bermasalah (permanen) | Tidak | tandai bounce / daftar bounce |
| `BOUNCE_SEMENTARA` | Inbox penerima penuh / masalah sementara | Tidak (selama 14 hari) | tandai bounce / daftar bounce |
| `HOLD` atau teks lain | Ditahan manual oleh pengguna | Tidak | pengguna |

Istilah khusus ringkasan: `PENDING` = siap kirim sekarang, `TERJADWAL` = Jadwal di masa depan, `JADWAL_INVALID`.

### 5.2 `CONFIG` (nilai default di kode final)

| Pengaturan | Default | Fungsi |
|---|---|---|
| `SHEET_NAME` | `'Data'` | Nama tab data |
| `SENDER_NAME` | `'Customer Care'` | **Wajib diganti pengguna**: nama pengirim yang tampil |
| `REPLY_TO` | `''` | Alamat balasan (opsional) |
| `FROM_ALIAS` | `''` | Alias "Send mail as" (opsional) |
| `QUOTA_RESERVE` | `50` | Kuota Apps Script yang disisakan |
| `MAX_RUNTIME_MS` | `5*60*1000` | Batas waktu per eksekusi sebelum berhenti dan lanjut |
| `PAUSE_MS` | `150` | Jeda antar email (ms) |
| `ACTIVE_TEMPLATE` | `'Template'` | Template bawaan jika kolom `Template` kosong (wajib terisi) |
| `TEMPLATES` | `Template`, `Template2` | Peta nama file HTML menjadi `{ subject }` |
| `DAILY_CAP` | `1400` | Batas email terhitung dalam 24 jam (0 = nonaktif) |
| `BOUNCE_DAYS` | `14` | Berapa hari laporan bounce dibaca (pemindaian penuh) |
| `BOUNCE_SHEET` | `'DaftarBounce'` | Nama tab daftar bounce |
| `BOUNCE_TEMP_DAYS` | `14` | Lama alamat bounce SEMENTARA dilewati |
| `BATCH_SIZE` | `50` | Email per putaran kirim bertahap |
| `BATCH_INTERVAL_MIN` | `10` | Jeda antar putaran (menit) |
| `SCHEDULER_MINUTES` | `5` | Frekuensi cek penjadwal (hanya 1, 5, 10, 15, 30) |
| `NOTIFY_EMAIL` | `''` | Penerima ringkasan otomatis (opsional; memakai 1 kuota email) |
| `COL_EMAIL`, `COL_STATUS`, `COL_SENT_AT`, `COL_NOTE`, `COL_OPTOUT`, `COL_TEMPLATE`, `COL_SCHEDULE` | `Email`, `Status`, `Waktu Kirim`, `Keterangan`, `OptOut`, `Template`, `Jadwal` | Nama header kolom |

**Pemetaan nomor template:** nilai kolom `Template` `1` berarti `Template`; `2` berarti `Template2`; `3` berarti `Template3`, dst. Nama lengkap juga boleh (tidak peka huruf besar-kecil).

### 5.3 Menu **📧 Email Blast** (urutan di kode final)

| Menu | Fungsi | Perilaku |
|---|---|---|
| 1. Kirim email TEST (baris yang dipilih) | `sendTest` | Kirim 1 email ke pemilik skrip memakai baris yang sedang dipilih (atau baris 2) dan template barisnya; subjek diawali `[TEST]`; tidak mengubah Status |
| 2. Kirim sekarang (yang sudah waktunya) | `sendNow` | Dialog konfirmasi (siap kirim, terjadwal, terkirim 24 jam, kuota). Kirim baris Status kosong dengan Jadwal kosong atau sudah tiba |
| 2b. Kirim bertahap (jeda otomatis) | `kirimBertahap` | Rantai putaran `BATCH_SIZE` setiap `BATCH_INTERVAL_MIN` menit |
| Status kirim bertahap | `statusBertahap` | Menampilkan kemajuan atau hasil terakhir |
| Hentikan kirim bertahap | `hentikanBertahap` | Menghentikan rantai |
| Lihat ringkasan & sisa kuota | `showSummary` | Jumlah per status, hitungan 24 jam, ruang kirim, kapan ruang bertambah, jumlah daftar bounce, kuota Apps Script |
| Tandai OptOut dari balasan STOP | `tandaiOptOut` | Memindai balasan dan mengisi `OptOut` |
| Tandai bounce dari laporan Gmail | `tandaiBounce` | Pemindaian bounce penuh (lanjut otomatis) |
| Aktifkan pemindaian bounce otomatis (tiap jam) / Matikan ... | `enableBounceScan` / `disableBounceScan` | Pemicu `bounceRun` per jam |
| Kirim ulang yang gagal limit (lepas GAGAL_LIMIT) | `kirimUlangGagalLimit` | Mengosongkan Status baris `GAGAL_LIMIT` (dengan konfirmasi) |
| Aktifkan penjadwal otomatis | `enableScheduler` | Pemicu `schedulerRun` tiap `SCHEDULER_MINUTES` menit; memerlukan kolom `Jadwal` |
| Matikan penjadwal otomatis | `disableAuto` | Menghapus pemicu `schedulerRun`, `continueRun`, dan `dailyRun` (versi lama) |

### 5.4 Alur `sendBatch_` (inti pengiriman)

`sendBatch_(opts)` dengan opsi `auto`, `onlyScheduled`, `maxSend`, `noNotify`:
1. Ambil kunci skrip (`LockService`). Jika sibuk: proses otomatis kembali diam-diam (`SIBUK`); manual melempar error.
2. Baca tabel. `planRows_` menyusun baris yang harus diproses: Status kosong/`PENDING`, bukan baris kosong; Jadwal kosong (hanya jika bukan `onlyScheduled`) atau sudah tiba; urut Jadwal paling awal lalu urutan baris. Baris dengan Jadwal salah masuk daftar `invalid`. Kalau tidak ada apa-apa, selesai tanpa kerja berat.
3. Bila ada baris yang jatuh tempo: jalankan `syncOptOut_` (OptOut dari balasan STOP), baca ulang tabel.
4. Hitung ruang: `quotaLeft = MailApp.getRemainingDailyQuota() - QUOTA_RESERVE`; `capLeft = DAILY_CAP - terkirim 24 jam`; `remaining = min(keduanya)`.
5. Untuk tiap baris jatuh tempo, berurutan:
   1. `OptOut` = YA/Y/YES/TRUE/1 → `OPTOUT`
   2. Format email salah → `INVALID`
   3. Email sudah `SENT` di baris lain → `DUPLIKAT`
   4. Email ada di `DaftarBounce` dan masih aktif → `BOUNCE` / `BOUNCE_SEMENTARA` (dilewati)
   5. Muat template baris itu (cache per jenis); gagal → `TEMPLATE_ERROR`
   6. `maxSend` tercapai → berhenti (`BATCH`)
   7. `remaining <= 0` → berhenti (`BATAS_HARIAN` bila cap lebih ketat, else `KUOTA`)
   8. Waktu > `MAX_RUNTIME_MS` → berhenti (`WAKTU`); mode manual membuat pemicu `continueRun` (+1 menit)
   9. Kirim; sukses → `SENT` dan `Waktu Kirim`; error berisi "too many times / limit exceeded / quota" → berhenti (`KUOTA`), baris tetap menunggu; error lain → `FAILED`
6. Simpan hasil ke sheet tiap 25 email dan di akhir (`finally`). Jeda `PAUSE_MS` antar email.
7. Notifikasi email ringkas ke `NOTIFY_EMAIL` untuk proses otomatis (kecuali `noNotify`).

### 5.5 Template dan placeholder
- `getTemplate_(name)`: `name` wajib; `findTemplateKey_` mencocokkan (angka diterjemahkan); file dibaca dengan `HtmlService.createTemplateFromFile(key).getRawContent()`; versi teks polos dibuat dari HTML (buang `<style>`, tag, `&nbsp;`, `&amp;` menjadi `&`, `&bull;` menjadi `-`, entitas numerik dibuang).
- `checkPlaceholders_`: semua `{{Nama}}` di subjek dan HTML harus ada sebagai header kolom; kalau tidak, template dianggap error.
- `fill_`: untuk HTML nilai di-escape (`&`, `<`, `>`, `"`, baris baru menjadi `<br>`); untuk subjek dan teks polos tidak di-escape. Placeholder yang tidak dikenal dibiarkan.
- `deliver_`: `GmailApp.sendEmail(to, subjek, teksPolos, { htmlBody, name: SENDER_NAME, replyTo?, from? , attachments: [] })`.

### 5.6 Penjadwal
- `schedulerRun` = `sendBatch_({auto:true, onlyScheduled:true})`, dipicu tiap `SCHEDULER_MINUTES`. Ketepatan jam ±5 menit. Satu eksekusi maksimal ±5 menit (±400-500 email), sisanya dilanjutkan pengecekan berikutnya.
- `parseJadwal_`: menerima objek Date dari sel bertanggal, atau teks `yyyy-MM-dd HH:mm` dan `dd/MM/yyyy HH:mm`; jam saja (tahun 1899) ditolak. Dibaca dengan zona waktu spreadsheet.

### 5.7 OptOut dari balasan STOP (`syncOptOut_`)
Pencarian Gmail `in:inbox newer_than:30d -from:me` (maks 100 percakapan); alamat pengirim harus cocok dengan kolom `Email`; hanya 2 paragraf pertama non-kutipan (200 karakter) yang dibaca; jika memuat kata utuh `stop`, `berhenti`, atau `unsubscribe` maka `OptOut` = `YA`. Dipanggil sebelum tiap pengiriman dan lewat menu.

### 5.8 Batas kirim 24 jam
- `sentWindow_`: daftar waktu kirim (ms) baris berstatus `SENT`, `BOUNCE`, atau `BOUNCE_SEMENTARA` dengan `Waktu Kirim` dalam 24 jam terakhir (dibaca dari sel mentah; tanggal yang ter-parse otomatis oleh Sheets juga didukung).
- `sentLast24h_` = panjang daftar itu. `kapasitasInfo_` menghitung berapa yang keluar dalam 1, 3, 6 jam dan kapan semua pulih. Ditampilkan oleh `kapasitasTeks_` di ringkasan.
- Fakta Google yang dipakai: batas Workspace 2.000 pesan/hari/akun (1.500 mail merge, 500 trial), jendela 24 jam bergulir; Apps Script: ±1.500 penerima/hari (2.000 dalam domain), 50 penerima per pesan, kuota direset 24 jam setelah permintaan pertama.

### 5.9 Kirim bertahap
- `kirimBertahap` (menu): bila sudah berjalan, tampilkan status; hitung siap kirim; dialog konfirmasi (jumlah putaran dan estimasi menit); set Script Property `BERTAHAP` = `{size, gap, startedAt, batches, sent, failed, skipped}`; jalankan `runBertahap_()`.
- `runBertahap_`: hapus pemicu `bertahapRun`; bila `batches > 0`, cek `limitBounceSince_(startedAt)` (pencarian `from:mailer-daemon "reached a limit for sending mail" newer_than:2d`, cocokkan tanggal pesan terakhir thread ≥ waktu mulai); jalankan `sendBatch_({auto:true, noNotify:true, maxSend:size})`; hasil `SIBUK` → coba lagi +2 menit; `BATCH`/`WAKTU` → jadwalkan putaran berikutnya +`gap` menit; `SELESAI`/`KUOTA`/`BATAS_HARIAN` → `selesaiBertahap_` (simpan `BERTAHAP_HASIL`, hapus `BERTAHAP`, email ringkasan bila `NOTIFY_EMAIL`).
- Alasan berhenti dan teksnya ada di konstanta `BERTAHAP_ALASAN` (`SELESAI`, `KUOTA`, `BATAS_HARIAN`, `LIMIT_GMAIL`, `DIHENTIKAN`).

### 5.10 Penanda bounce
**Klasifikasi `classifyBounce_`** (dicek berurutan pada 2.500 karakter pertama isi laporan):
1. **limit** (ditolak batas kirim akun kita): teks "reached a limit for sending", "sending quota/limit exceeded", "daily user sending", atau kode 5.4.5 → status `GAGAL_LIMIT`.
2. **permanen, domain**: "domain ... couldn't be found / not found", "DNS Error", kode 5.1.2, 5.4.4, "no MX" → Keterangan `Domain tidak ditemukan (alamat email salah)`.
3. **permanen, alamat**: "address not found", `550 5.1.1`, "user unknown", "no such user", "does not exist", "couldn't be found", "recipient address rejected", "invalid recipient", "unknown user", 5.1.10 → `Address not found (alamat email tidak ditemukan)`.
4. **sementara, inbox penuh**: "out of storage space", "inbox is full", "mailbox full", "over quota", "quota exceeded", "insufficient storage", 4.2.2, 5.2.2 → `The recipient's inbox is out of storage space (inbox penerima penuh)`.
5. **permanen, diblokir**: kode 5.7.x, "message blocked", "rejected as spam", "blocked by", "dmarc" → `Ditolak server penerima (diblokir/spam/kebijakan)`.
6. **kode SMTP umum**: `5xx` → permanen `Bounce permanen (kode ...)`, `4xx` → sementara `Bounce sementara (kode ...)`.
7. "delivery incomplete" atau "temporary problem" → sementara `Pengiriman tertunda (sementara)`.
8. Selain itu: tidak dikenali (dihitung di ringkasan).
Prioritas bila satu thread punya beberapa laporan: permanen lebih kuat dari limit, limit lebih kuat dari sementara.

**Pemrosesan `scanBounces_`:**
- Cari email asli yang dikirim dari akun pengirim di thread yang sama; bila ada beberapa, pilih yang alamat penerimanya tertulis di isi bounce, selain itu dilewati.
- Selain `limit`: alamat penerima dicatat/di-upgrade di `DaftarBounce` (PERMANEN atau SEMENTARA). SEMENTARA yang kemudian permanen dinaikkan (`naik`).
- Baris dicocokkan bila Status masih `SENT` dan |`Waktu Kirim` - tanggal email asli| ≤ 10 menit; lalu Status dan Keterangan diisi sesuai jenis (limit mengosongkan `Waktu Kirim`).
- Baris yang belum terkirim tetapi alamatnya aktif di daftar ikut ditandai.
- Pemindaian: halaman 50 percakapan, batas 5.000 percakapan per pemindaian, batas waktu `MAX_RUNTIME_MS - 60 detik`, kursor `BOUNCE_CURSOR`, pemicu lanjutan `bounceLanjut` (+1 menit atau +2 bila sibuk), akumulasi di `BOUNCE_TOTAL`, hasil di `BOUNCE_HASIL`. `bounceRun` (per jam) memakai query `newer_than:3h` tanpa kursor.
- Tab `DaftarBounce`: kolom `Email`, `Jenis`, `Alasan`, `Tanggal Bounce`, `Ditambahkan`. Untuk mengizinkan alamat lagi: hapus barisnya dari tab itu dan kosongkan Status baris di `Data`.

### 5.11 Pemicu dan Script Properties

| Pemicu (handler) | Jenis | Dibuat oleh |
|---|---|---|
| `schedulerRun` | Berulang tiap `SCHEDULER_MINUTES` menit | `enableScheduler` |
| `continueRun` | Sekali, +1 menit | `sendBatch_` mode manual yang kena batas waktu |
| `bertahapRun` | Sekali, +`BATCH_INTERVAL_MIN` menit (atau +2 menit) | `runBertahap_` |
| `bounceLanjut` | Sekali, +1 atau +2 menit | `tandaiBounce` / `bounceLanjut` |
| `bounceRun` | Berulang tiap 1 jam | `enableBounceScan` |
| `dailyRun` | (lama) dihapus oleh `disableAuto` | versi awal |

Script Properties: `BERTAHAP`, `BERTAHAP_HASIL`, `BOUNCE_CURSOR`, `BOUNCE_TOTAL`, `BOUNCE_HASIL`.

### 5.12 Daftar fungsi (peta kode)
`onOpen`, `sendTest`, `sendNow`, `kapasitasTeks_`, `showSummary`, `enableScheduler`, `disableAuto`, `schedulerRun`, `continueRun`, `clearTriggers_`, `sendBatch_`, `planRows_`, `getSheet_`, `readTable_`, `rowVars_`, `templateNameForRow_`, `findTemplateKey_`, `getTemplate_`, `checkPlaceholders_`, `fill_`, `escapeHtml_`, `deliver_`, `scheduleOf_`, `parseJadwal_`, `countStatus_`, `STATUS_TERHITUNG`, `sentWindow_`, `sentLast24h_`, `kapasitasInfo_`, `LIMIT_RE`, `classifyBounce_`, `recipientsOf_`, `pickBounce_`, `pickOriginal_`, `getBounceSheet_`, `readBounceList_`, `writeBounceList_`, `bounceActive_`, `upsertBounce_`, `scanBounces_`, `tambahTotalBounce_`, `bounceTeks_`, `tandaiBounce`, `bounceLanjut`, `bounceRun`, `enableBounceScan`, `disableBounceScan`, `kirimUlangGagalLimit`, `BERTAHAP_ALASAN`, `fmtWaktu_`, `kirimBertahap`, `bertahapRun`, `runBertahap_`, `selesaiBertahap_`, `bertahapTeks_`, `statusBertahap`, `hentikanBertahap`, `limitBounceSince_`, `syncOptOut_`, `tandaiOptOut`, `otorisasi`.

---

## 6. Template email (final, aturan desain, dan pelajaran)

### 6.1 Template yang terdaftar sekarang

**Template 1: `Template` (Promo 11.11, gadget Infinix).** Subjek: `{{Nama}}, limit kredit Anda siap dipakai promo 11.11!`. Isi (urut): banner (bisa diklik ke `{{LinkWA}}`), label "PROMO 11.11" dan "GADGET INFINIX", judul "Limit kredit Anda siap dipakai Promo 11.11!", sapaan `{{Nama}}` dengan 👋 (entitas), teks (limit siap dipakai, promo bunga 0%*, admin fee Rp 0,-*, tenor 12 & 18*), bar tagar "#YakinBisa miliki Gadget impianmu sekarang!", foto produk plus "PILIHAN MODEL" (INFINIX GT 50 PRO, HOT 70, NOTE 60 Series, XPAD 30 PRO, NOTE EDGE; **slot foto belum punya gambar, boleh dihapus**), tiga bar promo (Promo Bunga 0%*, Admin Fee Rp 0,-*, Tenor 12 & 18*), kotak periode promo **01 September 2026 sampai 31 Desember 2026**, "2 langkah miliki gadget impian", panel CTA "Chat WhatsApp Official" plus tautan `https://kbkp.app/su/PROGRAMINFINIX`, "*Syarat & ketentuan berlaku", footer "Kreditplus berizin dan diawasi oleh Otoritas Jasa Keuangan", PT KB Finansia Multi Finance (Kreditplus), cara STOP. Warna: kuning hangat dan arang. Penanda yang harus diganti: `GANTI-DENGAN-URL-BANNER` (dan `GANTI-URL-FOTO-PRODUK` bila slot foto dipertahankan).

**Template 2: `Template2` (Promo 11.11 Super Deal, TECNO).** Subjek: `[HARI INI] Promo 11.11 Spesial Customer Setia!`. Isi: banner (bisa diklik), label "HARI INI" dan "SPESIAL PELANGGAN SETIA", judul "Promo 11.11 Super Deal!", teks pembuka, kartu promo (header "Beli TECNO CAMON 50 & POVA 8 SERIES dengan KREDITPLUS"; DP mulai dari Rp 0*, Tenor 12 & 18 Bulan, Bunga mulai dari Rp 0*), kotak seri CAMON 50 SERIES dan POVA 8 SERIES (teks saja), periode **23 Oktober - 31 Desember 2026**, "2 langkah miliki gadget impian", panel "Ajukan Sekarang!" dengan tombol WhatsApp Official dan tautan `https://kbkp.app/su/TECNOPOVA`, S&K, footer OJK plus `www.kreditplus.com` plus STOP. Warna biru langit dan oranye-kuning. Penanda yang harus diganti: `GANTI-DENGAN-URL-BANNER`.

Kedua template hanya memakai `{{Nama}}` dan `{{LinkWA}}`. Nama perusahaan di footer sudah terisi dari banner (PT KB Finansia Multi Finance).

### 6.2 Aturan teknis desain template HTML (untuk membuat template baru)
1. Lebar maksimum **600 px**, susunan `<table role="presentation">`, gaya **inline** pada tag (jangan bergantung pada `<style>`; `@media` boleh sebagai peningkatan saja).
2. Tanpa JavaScript, form, atau font eksternal. Font Arial/Helvetica (judul serif seperti Georgia boleh untuk tema mewah).
3. Gambar memakai URL `https://` publik, dengan `alt`, `width`/`height`, `style="display:block;border:0;"`. Jangan menaruh info penting hanya di dalam gambar (gambar sering diblokir).
4. Tampilan HP (lebar ±320-360 px): hindari dua kolom sempit berlebar tetap; teks selebar penuh kartu; maksimal 3 kolom ikon; angka penting (harga) dibungkus `white-space:nowrap`; kartu produk tersusun dua baris (nama di atas, harga dan badge di bawah).
5. Tombol berupa tautan `<a>` bergaya tombol. CTA WhatsApp memakai `href="{{LinkWA}}"`. Banner dibungkus `<a href="{{LinkWA}}">`.
6. Placeholder `{{NamaKolom}}` ditulis persis dan **tidak dipecah** oleh tag/format. Jangan pakai `{{` untuk keperluan lain.
7. Tulis `&` sebagai `&amp;`. **Tanpa karakter non-ASCII mentah**; emoji bergambar sebagai `&#nomor;`.
8. Footer: nama perusahaan, kalimat "balas dengan kata STOP", dan bila relevan pernyataan OJK.
9. Pratinjau inbox: `<div style="display:none;...">teks</div>` di awal body.
10. Total HTML di bawah ±100 KB (Gmail memotong email besar).
11. Nilai promo ditulis statis di HTML **hanya jika sama untuk semua konsumen** (pakai penanda `XXX` yang jelas sampai diisi); data per konsumen lewat kolom sheet.
12. Teks promosi harus sesuai banner/ketentuan resmi; jangan menambah klaim baru.
13. Gaya konsisten: bagian langkah maksimal **2 langkah**.

### 6.3 Brief siap tempel untuk desainer/AI pembuat template
(Telah diberikan ke pengguna sebagai Lampiran B pada panduan penjadwalan.) Isinya setara aturan 6.2 di atas ditambah: lebar 600 px, konsep desain, dan daftar kolom data yang tersedia (Nama, Produk, Promo, Cicilan, LinkWA).

---

## 7. Prosedur langkah demi langkah (SOP)

### 7.1 Setup dari nol
1. Buat Google Sheet dengan akun pengirim (Workspace). Ubah nama tab pertama menjadi **`Data`**.
2. Baris 1 (header): `Nama`, `Email`, `Produk`/`Promo`/`Cicilan` (bila dipakai), `LinkWA`, `OptOut`, `Template`, `Jadwal`, `Status`, `Waktu Kirim`, `Keterangan`. Kolom `Email`, `Status`, `Waktu Kirim`, `Keterangan` wajib.
3. Atur zona waktu Sheet: **File → Settings → General → Time zone → (GMT+07:00) Jakarta**. Format kolom `Jadwal`: Format → Number → Custom date and time → `yyyy-mm-dd hh:mm`.
4. Isi data uji dengan **email milikmu sendiri** (3 baris). Isi rumus `LinkWA` dan tarik ke bawah.
5. Buka **Extensions → Apps Script**. Di `Code.gs` hapus isi bawaan lalu paste **Lampiran A**. Ubah `SENDER_NAME` di `CONFIG`. **Save**.
6. Buat file HTML: tombol **+** di samping **Files** → **HTML** → nama `Template` (tanpa .html) → hapus isi bawaan → paste **Lampiran B**. Ganti URL gambar dan penanda `GANTI`. Ulangi untuk `Template2` dengan **Lampiran C** bila dipakai.
7. Kembali ke Sheet, refresh; muncul menu **📧 Email Blast**. Jalankan **1. Kirim email TEST**; saat muncul "Authorization required": **Review permissions → pilih akun → Advanced → Go to ... (unsafe) → centang semua izin (terutama Gmail) → Allow**; jalankan menu lagi. Kalau error izin Gmail muncul: hapus akses lama di `myaccount.google.com/permissions`, jalankan fungsi `otorisasi` dari editor, beri izin lengkap.
8. Periksa email TEST (inbox dan Spam, laptop dan HP): placeholder terisi, gambar tampil, tombol WA membuka chat dengan nomor dan pesan yang benar.
9. Uji batch kecil (3 baris uji) lewat **2. Kirim sekarang**. Hapus data uji, kosongkan Status/Waktu Kirim/Keterangan.
10. Isi data konsumen asli. **Pastikan rumus `LinkWA` ikut ditarik sampai baris terakhir** dan tidak ada `GANTI`/`XXX` tersisa.

### 7.2 Menambah template baru
1. Buat desain HTML (aturan 6.2) dengan file HTML baru, mis. `Template3`. Ganti URL gambar dan nilai penanda.
2. Di `CONFIG.TEMPLATES` tambahkan koma di baris terakhir lalu baris baru: `'Template3': { subject: 'Subjek ... {{Nama}}' }`. **Save**.
3. Pastikan semua `{{kolom}}` di HTML ada sebagai header kolom di `Data`.
4. Uji: pilih satu baris, isi `Template` = `3`, klik **1. Kirim email TEST** (cek juga di HP dan dark mode).
5. Pakai: isi kolom `Template` baris konsumen dengan `3`.

### 7.3 Kirim manual sekarang
1. Kosongkan `Jadwal` (atau jangan diisi) dan `Status` pada baris yang akan dikirim. Isi `Template` bila bukan Template 1.
2. Periksa **Lihat ringkasan** (angka "Terkirim 24 jam terakhir" dan "Ruang kirim sekarang").
3. **2. Kirim sekarang** → cek angka konfirmasi → **Yes**. Satu putaran maksimal ±5 menit; sisanya dilanjutkan otomatis ±1 menit kemudian.

### 7.4 Kirim bertahap (mis. 50 email per 10 menit)
1. Atur `BATCH_SIZE` dan `BATCH_INTERVAL_MIN` di `CONFIG` bila perlu.
2. Pastikan penjadwal mati. **2b. Kirim bertahap** → baca estimasi → **Yes**.
3. Pantau lewat **Status kirim bertahap**; hentikan lewat **Hentikan kirim bertahap**.
4. Bila berhenti dengan `LIMIT_GMAIL`: jalankan **Tandai bounce dari laporan Gmail**, tunggu batas pulih (±24 jam), lalu **Kirim ulang yang gagal limit**.

### 7.5 Penjadwalan
1. Isi kolom `Template` dan `Jadwal` per baris (isi satu blok dengan mengetik di baris pertama blok, memblok rentang, lalu **Ctrl+D**).
2. Pastikan zona waktu Sheet Jakarta dan total jadwal dalam 24 jam di bawah `DAILY_CAP`.
3. **Aktifkan penjadwal otomatis**. Verifikasi di ikon Triggers (ada `schedulerRun`).
4. Ubah jadwal sebelum terkirim: edit sel `Jadwal` selama Status masih kosong. Batalkan: isi Status `HOLD`.
5. Matikan: **Matikan penjadwal otomatis**.

### 7.6 Menangani balasan STOP
Otomatis lewat `syncOptOut_` (sebelum kirim) atau menu **Tandai OptOut dari balasan STOP**. Untuk balasan dari alamat lain, isi `OptOut` = `YA` manual.

### 7.7 Menangani bounce
1. Filter Gmail (sekali): From `mailer-daemon@googlemail.com` (atau `from:(mailer-daemon OR postmaster)`), centang Skip the Inbox, Apply label `Bounce`, dan Also apply to matching conversations. Jangan hapus ke Trash.
2. Jalankan **Tandai bounce dari laporan Gmail** → **Yes**. Biarkan lanjut otomatis sampai ringkasan "SELESAI".
3. Baca ringkasan per alasan, buka tab `DaftarBounce`, dan filter Status `BOUNCE`/`BOUNCE_SEMENTARA`/`GAGAL_LIMIT`.
4. Opsional: **Aktifkan pemindaian bounce otomatis (tiap jam)**.
5. Untuk mencoba lagi alamat tertentu: hapus barisnya dari `DaftarBounce` dan kosongkan Status di `Data`.

### 7.8 Pulih dari batas kirim Gmail
1. Matikan penjadwal dan hentikan kirim bertahap.
2. Tunggu kira-kira 24 jam sejak kirim massal terakhir (jendela bergulir).
3. **Tandai bounce dari laporan Gmail** agar baris yang tercatat `SENT` padahal ditolak menjadi `GAGAL_LIMIT`.
4. Cek **Lihat ringkasan** ("Ruang kirim sekarang"); lalu **Kirim ulang yang gagal limit** dan kirim lewat **Kirim sekarang** atau **Kirim bertahap**.

### 7.9 Merencanakan kuota
- Ruang kirim = `DAILY_CAP` dikurangi "Terkirim 24 jam terakhir". Ringkasan menampilkan juga "+X dalam 1/3/6 jam".
- Hindari dua blast besar berurutan dalam jendela 24 jam. Jaga total semua template digabung di bawah ±1.500 per 24 jam.
- Turunkan `DAILY_CAP` bila akun juga dipakai untuk email lain (mis. 1.200).

### 7.10 Troubleshooting ringkas

| Gejala | Penyebab | Solusi |
|---|---|---|
| Menu tidak muncul | Kode belum disimpan / belum refresh | Save, refresh Sheet |
| `Sheet "Data" tidak ditemukan` | Nama tab beda | Ganti nama tab atau `SHEET_NAME` |
| `Kolom "X" tidak ada di baris 1` | Header salah/hilang | Samakan header |
| `TEMPLATE_ERROR`: belum didaftarkan | Nilai `Template` tidak ada di `CONFIG.TEMPLATES` | Daftarkan atau pakai 1/2 |
| `TEMPLATE_ERROR`: file HTML tidak ditemukan | File belum dibuat/nama beda | Buat file dengan nama persis, kosongkan Status |
| `TEMPLATE_ERROR`: placeholder tidak cocok | `{{...}}` tidak ada di header | Tambah kolom/samakan/ketik ulang tanpa format |
| `JADWAL_INVALID` | Format Jadwal salah (mis. jam saja) | Tulis `2026-11-11 09:00` |
| Email tidak berangkat di penjadwal | Jadwal kosong/belum tiba, Status tidak kosong, zona waktu salah, trigger tidak ada | Cek ringkasan (TERJADWAL), Status, zona waktu, ikon Triggers |
| "Proses kirim lain masih berjalan" | Ada proses lain memegang kunci | Tunggu beberapa menit |
| Gambar tidak tampil | URL tidak publik/format Drive salah/akses dibatasi | Uji di Incognito; pakai `lh3.googleusercontent.com/d/ID`; atau hosting perusahaan |
| "������" setelah nama | Emoji mentah 4-byte | Ganti dengan `&#128075;` dst |
| Tampilan HP terpotong | Dua kolom sempit | Susun penuh lebar, `nowrap` pada harga |
| "Delivery incomplete / 452 4.2.2" | Inbox penerima penuh (sementara) | Biarkan; tandai lewat menu bounce |
| "You have reached a limit for sending mail" | Batas kirim akun | Lihat 7.8 |
| Hitungan 24 jam terasa salah | Status/Waktu Kirim diubah manual, zona waktu | Jangan kosongkan baris terkirim; zona Jakarta |

---

## 8. Jebakan umum dan pelajaran

1. **`SENT` bukan jaminan sampai.** Artinya Gmail menerima email dari akunmu; penolakan penerima datang belakangan lewat laporan bounce.
2. **Kuota Apps Script ≠ batas Gmail.** Penjaga awal hanya melihat kuota Apps Script, sehingga dua blast di satu pagi memicu "limit". `DAILY_CAP` dan hitungan jendela bergulir adalah koreksinya.
3. **Dua blast besar dalam 24 jam dari satu akun berisiko.** Batas Gmail bergulir 24 jam dan menghitung semua email akun itu (termasuk tes, alias, auto-reply).
4. **Emoji 4-byte rusak** (muncul "������"); gunakan entitas numerik.
5. **Kolom sempit di HP:** kartu dua kolom memotong teks; pakai tata letak vertikal.
6. **Logo ber-kotak** tidak menyatu di dark mode; gunakan PNG transparan atau masukkan logo ke banner.
7. **Gambar Drive:** pakai format `lh3.googleusercontent.com/d/ID`; berbagi ke luar domain bisa diblokir admin.
8. **Zona waktu Sheet** menentukan jam kirim jadwal dan perhitungan 24 jam.
9. **Penjadwal hanya menyentuh baris ber-Jadwal.** Baris tanpa Jadwal hanya lewat menu manual.
10. **Jangan mengosongkan Status/Waktu Kirim baris yang sudah terkirim**, karena hitungan 24 jam turun padahal Gmail tetap menghitung.
11. **Jangan menghapus laporan bounce ke Trash** sebelum diproses (pencarian skrip tidak membaca Trash).
12. **Teks promo = klaim pembiayaan.** Salin angka persis dari banner, minta persetujuan Compliance, jangan menambah klaim.
13. **Penanda `GANTI`/`XXX`** tidak bisa dideteksi skrip; selalu cek lewat email TEST.
14. **Menyimpan kode lagi saat proses berjalan** aman: rantai kirim bertahap berbasis Script Properties dan pemicu, tidak terikat versi kode.
15. **Kesalahan penjelasan sebelumnya (pelajaran proses):** dugaan bahwa 642 baris PENDING belum pernah dicoba kirim ternyata salah (itu baris yang dikosongkan manual oleh pengguna). Bila ada angka yang tidak cocok, tanyakan dulu tindakan manual pengguna di sheet.

---

## 9. Status terakhir, hal yang belum selesai, dan saran lanjutan

### 9.1 Kondisi terakhir (menurut pengguna)
- Terkirim 24 jam terakhir: **1.246 dari batas 1.400**.
- **Kirim bertahap sudah berjalan** untuk baris yang tertahan (±642 baris).
- Ada ±**2.900 percakapan bounce** di Gmail; fitur **Tandai bounce dari laporan Gmail** sudah dibuat tetapi **hasil pemindaian pertama belum dilaporkan**.
- Kode terbaru (`email_blast.gs`, 1.265 baris, Lampiran A) sudah diserahkan; belum dikonfirmasi apakah sudah dipasang di Apps Script pengguna.

### 9.2 Hal yang belum selesai atau perlu konfirmasi
1. **Verifikasi dengan Gmail asli** untuk penanda bounce dan kirim bertahap (semua baru diuji dengan simulasi). Bila jumlah "jenis bounce tidak dikenali" besar, minta contoh isi laporan untuk menambah pola.
2. **Template 2 berjudul "[HARI INI]"** tetapi tangkapan layar menunjukkan email tersebut terkirim **Senin 9 November** (bukan 11 November). Perlu dikonfirmasi apakah itu sesuai maksud kampanye.
3. **Konfirmasi Compliance/Legal:** kata "Bunga mulai dari Rp 0*" (Template 2) vs "Promo Bunga 0%*" (Template 1); satuan tenor ("12 & 18" tanpa "bulan" di Template 1, ada "Bulan" di Template 2); isi teks promo dan pernyataan OJK.
4. **Foto produk Template 1:** slot `GANTI-URL-FOTO-PRODUK` belum punya gambar; hapus blok atau isi dengan kompilasi semua HP (PNG transparan, lebar 1200 px).
5. **Deliverability:** pastikan SPF/DKIM/DMARC untuk `kpvendor.id`; pertimbangkan pengiriman dari domain resmi merek atau alias; uji email ke Gmail/Outlook/Yahoo pribadi.
6. **Panduan MD lama kedaluwarsa** (memuat kode dengan draft Gmail dan Template 1-7): `Panduan_Email_Blasting_GSheet.md`, `Panduan_Template_HTML_Email_Blasting.md`, `Panduan_Penjadwalan_Email_Blast.md`. Jangan dipakai untuk kode. Dokumen ini dan lampirannya adalah acuan terbaru. Bisa dibuatkan panduan baru yang bersih bila diminta.
7. **Usulan yang belum dikerjakan:** membuat kirim bertahap **menunggu otomatis dan melanjutkan** ketika ruang kirim terbuka lagi (saat ini berhenti di `BATAS_HARIAN` dan harus dimulai ulang manual).
8. **Template berikutnya:** pengguna berencana meminta template baru dengan konsep berbeda lagi (ikuti aturan 6.2 dan batas 2 langkah).
9. Header komentar di `Code.gs` memiliki urutan baris sedikit berantakan (cosmetic); tidak memengaruhi fungsi.

### 9.3 Berkas yang pernah diserahkan (status)

| Berkas | Status |
|---|---|
| `email_blast.gs` (versi final v9) | **Terbaru**, Lampiran A |
| `Template.html` (Template 1 Infinix, 2 langkah) | **Terbaru**, Lampiran B |
| `Template2.html` (Template 2 TECNO, 2 langkah) | **Terbaru**, Lampiran C |
| `Template3.html` sampai `Template7.html` (desain lama) | **Usang/dihapus** pengguna (Template7 menjadi Template 1) |
| `Panduan_Email_Blasting_GSheet.md`, `Panduan_Template_HTML_Email_Blasting.md`, `Panduan_Penjadwalan_Email_Blast.md` | **Kedaluwarsa** |
| Claude Doc "Pemulihan Kiriman Gagal & Batas Kirim 24 Jam" | Terikat akun lama; isinya sudah tercakup di Bagian 4 Fase 10-11 |

---

## 10. Cara melanjutkan di akun Claude yang baru

1. Unggah dokumen ini ke percakapan baru (atau ke Project). Kode dan template final sudah di Lampiran A-C; file terpisah (`email_blast.gs`, `Template.html`, `Template2.html`) boleh diunggah juga bila tersedia.
2. Tempel pesan pembuka berikut:

```
Aku melanjutkan proyek email blasting (Google Sheet + Apps Script + Gmail) dari dokumen serah terima terlampir.
Mohon baca Bagian 1-3, 5, dan 9 dulu, lalu pakai Lampiran A-C sebagai kondisi kode dan template terbaru.
Balas dalam Bahasa Indonesia, langkah demi langkah, dan jangan mengarang angka promo. Pertanyaanku berikutnya: ...
```

3. Aturan kerja untuk Claude yang baru:
   - Jawab Bahasa Indonesia santai (aku/kamu), rinci dan langkah demi langkah. Sediakan file MD bila diminta.
   - Jangan mengubah perilaku inti tanpa menguji (gunakan simulasi/mock untuk logika baru).
   - Template baru: ikuti Bagian 6.2, maksimal 2 langkah, tanpa emoji mentah, tanpa angka karangan, pastikan hanya `{{Nama}}`/`{{LinkWA}}` (kecuali ada kolom baru yang disepakati), dan daftarkan di `CONFIG.TEMPLATES`.
   - Setiap perubahan kode: sebutkan fungsi/blok yang berubah dan langkah pasang (idealnya berikan seluruh `Code.gs` untuk ditempel).
   - Selalu ingatkan pengguna: isi ulang `SENDER_NAME` setelah mengganti `Code.gs`; matikan penjadwal/kirim bertahap sebelum eksperimen; jaga batas kirim 24 jam.
4. Mulailah dengan menanyakan status terbaru: hasil **Tandai bounce dari laporan Gmail** (ringkasan per alasan, jumlah tidak dikenali), apakah kirim bertahap sudah selesai, angka "Terkirim 24 jam terakhir/Ruang kirim", dan apakah kode terbaru sudah dipasang.

---

## Lampiran A: Kode final `Code.gs`

Salin seluruh isi di bawah ke `Code.gs` di Apps Script, lalu ubah `SENDER_NAME` di blok `CONFIG`. Ini adalah versi final (v9).

```javascript
/**
 * EMAIL BLAST dari Google Sheet (Google Apps Script, gratis)
 * Versi: template per konsumen + penjadwalan jam kirim per konsumen
 *
 * Sheet "Data" (baris 1 = header):
 *  WAJIB    : Email | Status | Waktu Kirim | Keterangan
 *  OPSIONAL : OptOut   (isi YA untuk penerima yang berhenti berlangganan)
 *             Template (1 / 2 / 3 atau nama template; kosong = CONFIG.ACTIVE_TEMPLATE)
 *  Isi email SELALU dari file HTML template di Apps Script (tidak lagi memakai draft Gmail).
 *             Jadwal   (tanggal + jam kirim, contoh 2026-11-02 09:00)
 *  Kolom lain (Nama, Produk, Promo, Cicilan, LinkWA, dst) dipakai sebagai {{placeholder}}.
 *
 * Aturan kirim:
 *  - Menu "Kirim sekarang"  : kirim baris berstatus kosong/PENDING yang Jadwal-nya
 *                             kosong atau sudah tiba.
 *  - Penjadwal otomatis     : tiap beberapa menit, kirim HANYA baris yang punya Jadwal
 *                             dan jamnya sudah tiba (baris tanpa Jadwal tidak disentuh).
 */

const CONFIG = {
  SHEET_NAME: 'Data',
  SENDER_NAME: 'Customer Care',   // GANTI: nama pengirim yang tampil di inbox
  REPLY_TO: '',                   // opsional: alamat balasan
  FROM_ALIAS: '',                 // opsional: alias "Send mail as" di Gmail
  QUOTA_RESERVE: 50,              // sisakan kuota untuk email kerja biasa di akun ini
  MAX_RUNTIME_MS: 5 * 60 * 1000,  // berhenti sebelum batas 6 menit, lanjut otomatis
  PAUSE_MS: 150,                  // jeda antar email

  // ---- TEMPLATE ----
  // Template bawaan untuk baris yang kolom "Template"-nya kosong. Wajib diisi.
  ACTIVE_TEMPLATE: 'Template',
  // Daftar template: nama file HTML di Apps Script (tanpa .html) dan subjek emailnya.
  // Subjek boleh berisi {{NamaKolom}}. Kolom Template di sheet boleh diisi 1, 2, 3, dst
  // (1 = 'Template', 2 = 'Template2', 3 = 'Template3', ...) atau nama lengkapnya.
  TEMPLATES: {
    'Template':  { subject: '{{Nama}}, limit kredit Anda siap dipakai promo 11.11!' },   // Template 1: Promo 11.11 Infinix
    'Template2': { subject: '[HARI INI] Promo 11.11 Spesial Customer Setia!' }           // Template 2: Promo 11.11 TECNO
    // Template baru? Tambahkan koma di akhir baris Template2, lalu tulis baris baru, contoh:
    // 'Template3': { subject: 'Subjek template 3 untuk {{Nama}}' }
  },

  // ---- BATAS KIRIM ----
  // Skrip berhenti mengirim jika email berstatus SENT dalam 24 jam terakhir (dihitung dari sheet)
  // sudah mencapai angka ini. Batas Gmail Workspace sekitar 2.000 per 24 jam bergulir, jadi
  // sisakan ruang untuk email lain dari akun yang sama. Isi 0 untuk menonaktifkan.
  DAILY_CAP: 1400,
  BOUNCE_DAYS: 14,                // berapa hari ke belakang laporan bounce Gmail dibaca (pemindaian penuh)
  BOUNCE_SHEET: 'DaftarBounce',   // tab daftar alamat bermasalah (dibuat otomatis)
  BOUNCE_TEMP_DAYS: 14,           // alamat bounce SEMENTARA (inbox penuh dll) dilewati selama ini

  // ---- KIRIM BERTAHAP (menu "Kirim bertahap") ----
  BATCH_SIZE: 50,                 // jumlah email per putaran
  BATCH_INTERVAL_MIN: 10,         // jeda antar putaran (menit)

  // ---- PENJADWALAN ----
  SCHEDULER_MINUTES: 5,           // seberapa sering penjadwal mengecek: 1, 5, 10, 15, atau 30
  NOTIFY_EMAIL: '',               // opsional: kirim ringkasan ke email ini tiap penjadwal selesai mengirim

  COL_EMAIL: 'Email',
  COL_STATUS: 'Status',
  COL_SENT_AT: 'Waktu Kirim',
  COL_NOTE: 'Keterangan',
  COL_OPTOUT: 'OptOut',
  COL_TEMPLATE: 'Template',
  COL_SCHEDULE: 'Jadwal'
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ===================== MENU ===================== */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('📧 Email Blast')
    .addItem('1. Kirim email TEST (baris yang dipilih)', 'sendTest')
    .addItem('2. Kirim sekarang (yang sudah waktunya)', 'sendNow')
    .addItem('2b. Kirim bertahap (jeda otomatis)', 'kirimBertahap')
    .addItem('Status kirim bertahap', 'statusBertahap')
    .addItem('Hentikan kirim bertahap', 'hentikanBertahap')
    .addSeparator()
    .addItem('Lihat ringkasan & sisa kuota', 'showSummary')
    .addItem('Tandai OptOut dari balasan STOP', 'tandaiOptOut')
    .addSeparator()
    .addItem('Tandai bounce dari laporan Gmail', 'tandaiBounce')
    .addItem('Aktifkan pemindaian bounce otomatis (tiap jam)', 'enableBounceScan')
    .addItem('Matikan pemindaian bounce otomatis', 'disableBounceScan')
    .addItem('Kirim ulang yang gagal limit (lepas GAGAL_LIMIT)', 'kirimUlangGagalLimit')
    .addSeparator()
    .addItem('Aktifkan penjadwal otomatis', 'enableScheduler')
    .addItem('Matikan penjadwal otomatis', 'disableAuto')
    .addToUi();
}

function sendTest() {
  const ui = SpreadsheetApp.getUi();
  try {
    const t = readTable_();
    if (t.values.length < 2) throw new Error('Belum ada data di sheet.');

    // pakai baris yang sedang dipilih; kalau tidak ada, pakai baris data pertama (baris 2)
    let r = 1;
    const active = SpreadsheetApp.getActiveSheet();
    if (active.getName() === CONFIG.SHEET_NAME) {
      const ar = active.getActiveCell().getRow();
      if (ar >= 2 && ar <= t.values.length) r = ar - 1;
    }
    const row = t.values[r];
    const tpl = getTemplate_(templateNameForRow_(t, row));
    checkPlaceholders_(tpl, t.col);

    const me = Session.getEffectiveUser().getEmail();
    deliver_(me, tpl, rowVars_(t.headers, row), '[TEST] ');
    ui.alert('Email test terkirim ke ' + me +
             '\nTemplate: ' + tpl.name + '\nData: baris ' + (r + 1) + ' di sheet.\nCek inbox kamu.');
  } catch (e) {
    ui.alert('Gagal: ' + e.message);
  }
}

function sendNow() {
  const ui = SpreadsheetApp.getUi();
  try {
    const counts = countStatus_();
    const quota = MailApp.getRemainingDailyQuota();
    const recent = sentLast24h_(readTable_(), new Date());
    const ans = ui.alert(
      'Kirim sekarang',
      'Siap dikirim sekarang (Status kosong, Jadwal kosong/sudah tiba): ' + (counts.PENDING || 0) +
      '\nTerjadwal untuk nanti (tidak ikut terkirim): ' + (counts.TERJADWAL || 0) +
      '\nTerkirim 24 jam terakhir: ' + recent + (CONFIG.DAILY_CAP > 0 ? ' (batas ' + CONFIG.DAILY_CAP + ')' : '') +
      '\nSisa kuota Apps Script hari ini: ' + quota +
      '\n\nLanjut kirim ke konsumen?',
      ui.ButtonSet.YES_NO);
    if (ans !== ui.Button.YES) return;

    const r = sendBatch_({});
    const info = {
      SELESAI: 'Semua yang sudah waktunya telah diproses.',
      KUOTA: 'Kuota harian Apps Script habis. Sisanya dikirim setelah kuota kembali (otomatis jika penjadwal aktif).',
      BATAS_HARIAN: 'Batas kirim 24 jam (DAILY_CAP) tercapai. Sisanya menunggu sampai hitungan 24 jam turun (otomatis jika penjadwal aktif).',
      WAKTU: 'Batas waktu 1 eksekusi tercapai. Skrip akan melanjutkan otomatis sekitar 1 menit lagi.'
    }[r.stopReason];
    ui.alert('Selesai.\nTerkirim: ' + r.sent + '\nGagal: ' + r.failed +
             '\nDilewati (invalid/duplikat/opt-out/jadwal salah): ' + r.skipped + '\n\n' + info);
  } catch (e) {
    ui.alert('Gagal: ' + e.message);
  }
}

function kapasitasTeks_() {
  const now = new Date();
  const k = kapasitasInfo_(readTable_(), now);
  let teks = '\nTerkirim 24 jam terakhir: ' + k.count + (CONFIG.DAILY_CAP > 0 ? ' (batas ' + CONFIG.DAILY_CAP + ')' : '');
  if (k.free !== null) teks += '\nRuang kirim sekarang: ' + k.free;
  if (k.count > 0) {
    teks += '\nRuang bertambah: +' + k.in1 + ' dalam 1 jam, +' + k.in3 + ' dalam 3 jam, +' + k.in6 + ' dalam 6 jam' +
            '\nSemua pulih sekitar: ' + Utilities.formatDate(new Date(k.allFree), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  }
  return teks;
}

function showSummary() {
  const counts = countStatus_();
  const lines = Object.keys(counts).map(function (k) { return k + ': ' + counts[k]; });
  SpreadsheetApp.getUi().alert(
    'Ringkasan status\n\n' + lines.join('\n') +
    '\n\n(PENDING = siap kirim sekarang, TERJADWAL = menunggu jamnya)' +
    kapasitasTeks_() +
    '\nDaftar bounce (tab ' + CONFIG.BOUNCE_SHEET + '): ' + readBounceList_().rows.length + ' alamat' +
    '\nSisa kuota Apps Script hari ini: ' + MailApp.getRemainingDailyQuota());
}

/* ===================== PENJADWAL OTOMATIS ===================== */

function enableScheduler() {
  const ui = SpreadsheetApp.getUi();
  try {
    const t = readTable_();
    if (!(CONFIG.COL_SCHEDULE in t.col)) {
      ui.alert('Kolom "' + CONFIG.COL_SCHEDULE + '" belum ada di baris 1 sheet ' + CONFIG.SHEET_NAME +
               '. Tambahkan dulu kolom Jadwal.');
      return;
    }
    const allowed = [1, 5, 10, 15, 30];
    if (allowed.indexOf(CONFIG.SCHEDULER_MINUTES) < 0) {
      ui.alert('SCHEDULER_MINUTES harus salah satu dari: ' + allowed.join(', '));
      return;
    }
    clearTriggers_('schedulerRun');
    ScriptApp.newTrigger('schedulerRun').timeBased().everyMinutes(CONFIG.SCHEDULER_MINUTES).create();
    ui.alert('Penjadwal aktif. Skrip mengecek tiap ' + CONFIG.SCHEDULER_MINUTES +
             ' menit dan mengirim baris yang Jadwal-nya sudah tiba.\n' +
             'Baris tanpa Jadwal tidak akan dikirim otomatis.\n' +
             'Zona waktu sheet: ' + SpreadsheetApp.getActive().getSpreadsheetTimeZone());
  } catch (e) {
    ui.alert('Gagal: ' + e.message);
  }
}

function disableAuto() {
  clearTriggers_('schedulerRun');
  clearTriggers_('continueRun');
  clearTriggers_('dailyRun');      // trigger harian versi lama (jika pernah diaktifkan)
  SpreadsheetApp.getUi().alert('Penjadwal otomatis dimatikan.');
}

function schedulerRun() { sendBatch_({ auto: true, onlyScheduled: true }); }
function continueRun() { sendBatch_({}); }

function clearTriggers_(handler) {
  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === handler; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });
}

/* ===================== INTI PENGIRIMAN ===================== */

function sendBatch_(opts) {
  opts = opts || {};
  const auto = !!opts.auto;
  const onlyScheduled = !!opts.onlyScheduled;

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(auto ? 1000 : 10000)) {
    if (auto) return { sent: 0, failed: 0, skipped: 0, stopReason: 'SIBUK' };
    throw new Error('Proses kirim lain masih berjalan. Coba lagi beberapa menit.');
  }
  try {
    const t0 = Date.now();
    const now = new Date();
    if (!auto) clearTriggers_('continueRun');

    const res = { sent: 0, failed: 0, skipped: 0, stopReason: 'SELESAI' };

    // Pra-cek cepat: kalau tidak ada yang perlu diproses, selesai tanpa kerja berat
    let t = readTable_();
    let plan = planRows_(t, now, onlyScheduled);
    if (!plan.due.length && !plan.invalid.length) return res;

    if (plan.due.length) {
      try { syncOptOut_(); } catch (e) { Logger.log('syncOptOut gagal: ' + e); }
      t = readTable_();                                  // baca ulang setelah OptOut disinkronkan
      plan = planRows_(t, now, onlyScheduled);
    }

    const n = t.values.length - 1;
    const emailI = t.col[CONFIG.COL_EMAIL];
    const statusI = t.col[CONFIG.COL_STATUS];
    const sentI = t.col[CONFIG.COL_SENT_AT];
    const noteI = t.col[CONFIG.COL_NOTE];
    const optI = (CONFIG.COL_OPTOUT in t.col) ? t.col[CONFIG.COL_OPTOUT] : -1;
    const tz = Session.getScriptTimeZone();

    const status = [], sentAt = [], note = [], seen = {};
    for (let i = 0; i < n; i++) {
      const row = t.values[i + 1];
      status.push(row[statusI]);
      sentAt.push(row[sentI]);
      note.push(row[noteI]);
      if (String(row[statusI]).trim().toUpperCase() === 'SENT') {
        seen[String(row[emailI]).trim().toLowerCase()] = true;
      }
    }

    const mark = function (i, s, msg) {
      status[i] = s;
      note[i] = msg || '';
      sentAt[i] = (s === 'SENT' || s === 'FAILED')
        ? Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm:ss') : '';
    };
    const flush = function () {
      const put = function (c, arr) {
        t.sh.getRange(2, c + 1, n, 1).setValues(arr.map(function (v) { return [v]; }));
      };
      put(statusI, status); put(sentI, sentAt); put(noteI, note);
      SpreadsheetApp.flush();
    };

    // template dimuat sekali per jenis, hasilnya (atau error-nya) disimpan
    const tplCache = {};
    const loadTpl = function (name) {
      const key = String(name || '').toLowerCase();
      if (!(key in tplCache)) {
        try {
          const tpl = getTemplate_(name);
          checkPlaceholders_(tpl, t.col);
          tplCache[key] = { tpl: tpl };
        } catch (e) {
          tplCache[key] = { error: String(e && e.message ? e.message : e) };
        }
      }
      return tplCache[key];
    };

    const quotaLeft = MailApp.getRemainingDailyQuota() - CONFIG.QUOTA_RESERVE;
    const capLeft = (CONFIG.DAILY_CAP > 0)
      ? Math.max(0, CONFIG.DAILY_CAP - sentLast24h_(t, now)) : Infinity;
    const capIsTighter = capLeft <= quotaLeft;
    let remaining = Math.min(quotaLeft, capLeft);

    const bounceMap = {};
    readBounceList_().rows.forEach(function (e) { bounceMap[e.email] = e; });
    const nowMs = now.getTime();

    try {
      // baris dengan format Jadwal yang salah
      plan.invalid.forEach(function (i) {
        mark(i, 'JADWAL_INVALID', 'Format Jadwal tidak dikenali. Contoh: 2026-11-02 09:00');
        res.skipped++;
      });

      for (let k = 0; k < plan.due.length; k++) {
        const i = plan.due[k].i;
        const row = t.values[i + 1];
        const email = String(row[emailI]).trim().toLowerCase();

        if (optI >= 0 && /^(ya|yes|y|true|1)$/i.test(String(row[optI]).trim())) {
          mark(i, 'OPTOUT', 'Penerima berhenti berlangganan'); res.skipped++; continue;
        }
        if (!EMAIL_RE.test(email)) {
          mark(i, 'INVALID', 'Format email tidak valid'); res.skipped++; continue;
        }
        if (seen[email]) {
          mark(i, 'DUPLIKAT', 'Email sudah terkirim/ada di baris lain'); res.skipped++; continue;
        }
        const be = bounceMap[email];
        if (be && bounceActive_(be, nowMs)) {
          mark(i, be.jenis === 'SEMENTARA' ? 'BOUNCE_SEMENTARA' : 'BOUNCE', 'Daftar bounce: ' + be.alasan);
          res.skipped++; continue;
        }

        const loaded = loadTpl(templateNameForRow_(t, row));
        if (loaded.error) {
          mark(i, 'TEMPLATE_ERROR', loaded.error.substring(0, 200)); res.failed++; continue;
        }

        if (opts.maxSend && (res.sent + res.failed) >= opts.maxSend) { res.stopReason = 'BATCH'; break; }

        if (remaining <= 0) { res.stopReason = capIsTighter ? 'BATAS_HARIAN' : 'KUOTA'; break; }
        if (Date.now() - t0 > CONFIG.MAX_RUNTIME_MS) { res.stopReason = 'WAKTU'; break; }

        try {
          deliver_(email, loaded.tpl, rowVars_(t.headers, row), '');
          mark(i, 'SENT', '');
          seen[email] = true;
          remaining--;
          res.sent++;
        } catch (e) {
          const msg = String(e && e.message ? e.message : e);
          if (/too many times|limit exceeded|quota/i.test(msg)) {
            res.stopReason = 'KUOTA';   // baris ini tetap menunggu
            break;
          }
          mark(i, 'FAILED', msg.substring(0, 200));
          res.failed++;
        }

        if ((res.sent + res.failed) % 25 === 0) flush();      // simpan progres berkala
        Utilities.sleep(CONFIG.PAUSE_MS);
      }
    } finally {
      flush();
    }

    // Pengiriman manual yang terhenti karena waktu: lanjut otomatis 1 menit lagi.
    // (Penjadwal otomatis tidak butuh ini karena akan mengecek lagi sendiri.)
    if (res.stopReason === 'WAKTU' && !auto) {
      ScriptApp.newTrigger('continueRun').timeBased().after(60 * 1000).create();
    }

    // Ringkasan lewat email (opsional) untuk proses otomatis
    if (auto && !opts.noNotify && CONFIG.NOTIFY_EMAIL && (res.sent + res.failed) > 0) {
      try {
        MailApp.sendEmail(CONFIG.NOTIFY_EMAIL, 'Ringkasan email blast terjadwal',
          'Terkirim: ' + res.sent + '\nGagal: ' + res.failed + '\nDilewati: ' + res.skipped +
          '\nStatus akhir: ' + res.stopReason +
          '\nWaktu: ' + Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm:ss'));
      } catch (e) { Logger.log('Notifikasi gagal: ' + e); }
    }
    return res;
  } finally {
    lock.releaseLock();
  }
}

// Menentukan baris mana yang harus diproses sekarang
function planRows_(t, now, onlyScheduled) {
  const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  const statusI = t.col[CONFIG.COL_STATUS];
  const due = [], invalid = [];
  for (let r = 1; r < t.values.length; r++) {
    const row = t.values[r];
    const st = String(row[statusI]).trim().toUpperCase();
    if (st !== '' && st !== 'PENDING') continue;
    if (row.join('').trim() === '') continue;                 // baris kosong

    const sc = scheduleOf_(t, r, tz);
    if (sc.invalid) { invalid.push(r - 1); continue; }
    if (!sc.when) {                                           // tanpa jadwal
      if (!onlyScheduled) due.push({ i: r - 1, time: 0 });
      continue;
    }
    if (sc.when.getTime() <= now.getTime()) due.push({ i: r - 1, time: sc.when.getTime() });
  }
  due.sort(function (a, b) { return (a.time - b.time) || (a.i - b.i); });   // yang paling awal dulu
  return { due: due, invalid: invalid };
}

/* ===================== HELPER ===================== */

function getSheet_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) throw new Error('Sheet "' + CONFIG.SHEET_NAME + '" tidak ditemukan.');
  return sh;
}

function readTable_() {
  const sh = getSheet_();
  const range = sh.getDataRange();
  const values = range.getDisplayValues();
  const raw = range.getValues();
  const headers = values[0].map(function (h) { return String(h).trim(); });
  const col = {};
  headers.forEach(function (h, i) { col[h] = i; });
  [CONFIG.COL_EMAIL, CONFIG.COL_STATUS, CONFIG.COL_SENT_AT, CONFIG.COL_NOTE].forEach(function (name) {
    if (!(name in col)) throw new Error('Kolom "' + name + '" tidak ada di baris 1 sheet ' + CONFIG.SHEET_NAME + '.');
  });
  return { sh: sh, values: values, raw: raw, headers: headers, col: col };
}

function rowVars_(headers, row) {
  const vars = {};
  headers.forEach(function (h, c) { vars[h] = row[c]; });
  return vars;
}

// Nama template untuk satu baris: kolom Template, atau template bawaan jika kosong
function templateNameForRow_(t, row) {
  let name = (CONFIG.COL_TEMPLATE in t.col) ? String(row[t.col[CONFIG.COL_TEMPLATE]]).trim() : '';
  if (!name) name = String(CONFIG.ACTIVE_TEMPLATE || '').trim();
  return name;
}

// Cocokkan nama (tanpa peduli huruf besar-kecil). Angka 1 = Template, 2 = Template2, dst.
function findTemplateKey_(name) {
  let want = String(name).trim().toLowerCase();
  if (/^\d+$/.test(want)) want = (Number(want) === 1) ? 'template' : 'template' + Number(want);
  const keys = Object.keys(CONFIG.TEMPLATES);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === want) return keys[i];
  }
  return null;
}

function getTemplate_(name) {
  name = String(name || '').trim();
  if (!name) {
    throw new Error('Template belum dipilih. Isi kolom Template di sheet atau CONFIG.ACTIVE_TEMPLATE.');
  }
  const key = findTemplateKey_(name);
  if (!key) {
    throw new Error('Template "' + name + '" belum didaftarkan di CONFIG.TEMPLATES.');
  }
  let html;
  try {
    html = HtmlService.createTemplateFromFile(key).getRawContent();
  } catch (e) {
    throw new Error('File HTML "' + key + '" tidak ditemukan di Apps Script.');
  }
  return {
    name: key,
    subject: CONFIG.TEMPLATES[key].subject,
    html: html,
    text: html.replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&bull;/g, '-')
              .replace(/&#\d+;/g, '')
              .replace(/\s+/g, ' ').trim(),
    attachments: []
  };
}

function checkPlaceholders_(tpl, col) {
  const all = tpl.subject + ' ' + tpl.html;
  const re = /\{\{\s*([^{}]+?)\s*\}\}/g;
  const missing = [];
  let m;
  while ((m = re.exec(all)) !== null) {
    if (!(m[1] in col) && missing.indexOf(m[1]) < 0) missing.push(m[1]);
  }
  if (missing.length) {
    throw new Error('Template "' + tpl.name + '": placeholder tidak cocok dengan header kolom di sheet: ' + missing.join(', '));
  }
}

function fill_(text, vars, escape) {
  return text.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, function (m, key) {
    if (!(key in vars)) return m;
    return escape ? escapeHtml_(vars[key]) : vars[key];
  });
}

function escapeHtml_(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\r?\n/g, '<br>');
}

function deliver_(to, tpl, vars, subjectPrefix) {
  const opts = {
    htmlBody: fill_(tpl.html, vars, true),
    name: CONFIG.SENDER_NAME,
    attachments: tpl.attachments
  };
  if (CONFIG.REPLY_TO) opts.replyTo = CONFIG.REPLY_TO;
  if (CONFIG.FROM_ALIAS) opts.from = CONFIG.FROM_ALIAS;
  GmailApp.sendEmail(to, subjectPrefix + fill_(tpl.subject, vars, false), fill_(tpl.text, vars, false), opts);
}

/* ===================== JADWAL ===================== */

// Mengembalikan { when: Date|null, invalid: boolean } untuk satu baris
function scheduleOf_(t, r, tz) {
  if (!(CONFIG.COL_SCHEDULE in t.col)) return { when: null, invalid: false };
  const c = t.col[CONFIG.COL_SCHEDULE];
  return parseJadwal_(t.raw[r][c], t.values[r][c], tz);
}

function parseJadwal_(raw, disp, tz) {
  if (raw instanceof Date) {
    // sel yang hanya berisi jam (tanpa tanggal) dibaca sebagai tahun 1899
    if (raw.getFullYear() < 2000) return { when: null, invalid: true };
    return { when: raw, invalid: false };
  }
  const s = String(disp || raw || '').trim();
  if (s === '') return { when: null, invalid: false };

  let y, mo, d, h, mi;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2})[:.](\d{2})/);
  if (m) {
    y = m[1]; mo = m[2]; d = m[3]; h = m[4]; mi = m[5];
  } else {
    m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})[ T](\d{1,2})[:.](\d{2})/);
    if (!m) return { when: null, invalid: true };
    d = m[1]; mo = m[2]; y = m[3]; h = m[4]; mi = m[5];
  }
  const pad = function (x) { return ('0' + x).slice(-2); };
  try {
    const dt = Utilities.parseDate(y + '-' + pad(mo) + '-' + pad(d) + ' ' + pad(h) + ':' + mi, tz, 'yyyy-MM-dd HH:mm');
    return { when: dt, invalid: false };
  } catch (e) {
    return { when: null, invalid: true };
  }
}

function countStatus_() {
  const t = readTable_();
  const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  const now = new Date();
  const statusI = t.col[CONFIG.COL_STATUS];
  const counts = { PENDING: 0 };
  for (let r = 1; r < t.values.length; r++) {
    const row = t.values[r];
    if (row.join('').trim() === '') continue;
    let s = String(row[statusI]).trim().toUpperCase();
    if (s === '' || s === 'PENDING') {
      const sc = scheduleOf_(t, r, tz);
      if (sc.invalid) s = 'JADWAL_INVALID';
      else if (sc.when && sc.when.getTime() > now.getTime()) s = 'TERJADWAL';
      else s = 'PENDING';
    }
    counts[s] = (counts[s] || 0) + 1;
  }
  return counts;
}

// Status yang emailnya sudah DITERIMA Gmail untuk dikirim, sehingga ikut dihitung batas kirim Gmail.
// (BOUNCE dan BOUNCE_SEMENTARA tetap dihitung: email itu keluar dulu, baru ditolak penerima.
//  GAGAL_LIMIT dan FAILED tidak dihitung.)
const STATUS_TERHITUNG = { SENT: 1, BOUNCE: 1, BOUNCE_SEMENTARA: 1 };

// Daftar waktu kirim (ms) email yang masuk hitungan 24 jam terakhir. Tiap email keluar dari
// hitungan tepat 24 jam setelah waktu kirimnya sendiri (jendela bergulir, bukan reset jam tertentu).
function sentWindow_(t, now) {
  const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  const statusI = t.col[CONFIG.COL_STATUS];
  const sentI = t.col[CONFIG.COL_SENT_AT];
  const since = now.getTime() - 24 * 60 * 60 * 1000;
  const times = [];
  for (let r = 1; r < t.values.length; r++) {
    if (!STATUS_TERHITUNG[String(t.values[r][statusI]).trim().toUpperCase()]) continue;
    const w = parseJadwal_(t.raw[r][sentI], t.values[r][sentI], tz);
    if (w.when && w.when.getTime() >= since) times.push(w.when.getTime());
  }
  return times;
}

function sentLast24h_(t, now) {
  return sentWindow_(t, now).length;
}

// Ringkasan ruang kirim: berapa yang akan "keluar" dari hitungan dalam 1, 3, dan 6 jam ke depan
function kapasitasInfo_(t, now) {
  const times = sentWindow_(t, now);
  const DAY = 24 * 60 * 60 * 1000, HOUR = 60 * 60 * 1000;
  const leave = function (h) {
    return times.filter(function (x) { return x + DAY <= now.getTime() + h * HOUR; }).length;
  };
  let allFree = 0;
  times.forEach(function (x) { if (x + DAY > allFree) allFree = x + DAY; });
  return {
    count: times.length,
    free: CONFIG.DAILY_CAP > 0 ? Math.max(0, CONFIG.DAILY_CAP - times.length) : null,
    in1: leave(1), in3: leave(3), in6: leave(6), allFree: allFree
  };
}

/* ===================== TANDAI BOUNCE DARI LAPORAN GMAIL ===================== */

const LIMIT_RE = /reached a limit for sending|sending (quota|limit) exceeded|daily user sending|5\.4\.5/i;

// Mengenali jenis bounce dari isi laporan. Mengembalikan { kind, reason } atau null.
// kind: 'limit' (ditolak karena batas kirim akun kita), 'permanen' (alamat/penerima bermasalah),
//       'sementara' (inbox penuh dan sejenisnya)
function classifyBounce_(bodyRaw) {
  const body = String(bodyRaw).substring(0, 2500);
  if (LIMIT_RE.test(body)) return { kind: 'limit', reason: 'Ditolak Gmail: batas kirim akun tercapai' };
  if (/domain[^.\n]{0,80}(couldn.t be found|not found)|dns error|\b5\.1\.2\b|\b5\.4\.4\b|no mx/i.test(body)) {
    return { kind: 'permanen', reason: 'Domain tidak ditemukan (alamat email salah)' };
  }
  if (/address not found|550[ -]5\.1\.1|user unknown|no such user|does not exist|couldn.t be found|recipient address rejected|invalid recipient|unknown user|\b5\.1\.10\b/i.test(body)) {
    return { kind: 'permanen', reason: 'Address not found (alamat email tidak ditemukan)' };
  }
  if (/out of storage space|inbox is full|mailbox (is )?full|over quota|quota exceeded|insufficient storage|\b4\.2\.2\b|\b5\.2\.2\b/i.test(body)) {
    return { kind: 'sementara', reason: "The recipient's inbox is out of storage space (inbox penerima penuh)" };
  }
  if (/\b5\.7\.\d{1,3}\b|message blocked|rejected as spam|blocked by|dmarc/i.test(body)) {
    return { kind: 'permanen', reason: 'Ditolak server penerima (diblokir/spam/kebijakan)' };
  }
  const m = body.match(/\b([245])\d\d[ -]([245])\.\d{1,3}\.\d{1,3}\b/);
  if (m) {
    return m[1] === '5'
      ? { kind: 'permanen', reason: 'Bounce permanen (kode ' + m[0] + ')' }
      : { kind: 'sementara', reason: 'Bounce sementara (kode ' + m[0] + ')' };
  }
  if (/delivery incomplete|temporary problem/i.test(body)) {
    return { kind: 'sementara', reason: 'Pengiriman tertunda (sementara)' };
  }
  return null;
}

function recipientsOf_(msg) {
  return (String(msg.getTo()).match(/[^\s<>,;"']+@[^\s<>,;"']+/g) || [])
    .map(function (x) { return x.toLowerCase(); });
}

// Dari beberapa pesan bounce dalam satu percakapan, ambil yang paling menentukan
function pickBounce_(bounces) {
  const rank = { permanen: 3, limit: 2, sementara: 1 };
  let best = null;
  for (let i = 0; i < bounces.length; i++) {
    const body = String(bounces[i].getPlainBody());
    const c = classifyBounce_(body);
    if (!c) continue;
    if (!best || rank[c.kind] > rank[best.kind]) best = { kind: c.kind, reason: c.reason, msg: bounces[i], body: body };
  }
  return best;
}

// Email asli yang dimaksud bounce. Jika ada beberapa, cocokkan lewat alamat yang tertulis di laporan.
function pickOriginal_(originals, body) {
  if (originals.length === 1) return originals[0];
  const low = String(body).toLowerCase();
  const hit = originals.filter(function (o) {
    return recipientsOf_(o).some(function (a) { return low.indexOf(a) >= 0; });
  });
  return hit.length === 1 ? hit[0] : null;
}

/* ---- Daftar bounce (tab terpisah) ---- */

function getBounceSheet_(create) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CONFIG.BOUNCE_SHEET);
  if (!sh && create) {
    sh = ss.insertSheet(CONFIG.BOUNCE_SHEET);
    sh.getRange(1, 1, 1, 5).setValues([['Email', 'Jenis', 'Alasan', 'Tanggal Bounce', 'Ditambahkan']]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function readBounceList_() {
  const out = { rows: [], index: {} };
  const sh = getBounceSheet_(false);
  if (!sh) return out;
  const rng = sh.getDataRange();
  const disp = rng.getDisplayValues();
  const raw = rng.getValues();
  const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  for (let r = 1; r < disp.length; r++) {
    const em = String(disp[r][0]).trim().toLowerCase();
    if (!em) continue;
    const w = parseJadwal_(raw[r][3], disp[r][3], tz).when;
    out.index[em] = out.rows.length;
    out.rows.push({
      email: em,
      jenis: String(disp[r][1]).trim().toUpperCase(),
      alasan: String(disp[r][2]),
      when: w ? w.getTime() : 0,
      ditambahkan: String(disp[r][4])
    });
  }
  return out;
}

function writeBounceList_(list) {
  const sh = getBounceSheet_(true);
  const tz = Session.getScriptTimeZone();
  const data = list.rows.map(function (e) {
    return [e.email, e.jenis, e.alasan,
            e.when ? Utilities.formatDate(new Date(e.when), tz, 'yyyy-MM-dd HH:mm:ss') : '', e.ditambahkan];
  });
  const last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, 5).clearContent();
  if (data.length) sh.getRange(2, 1, data.length, 5).setValues(data);
}

// PERMANEN selalu dilewati. SEMENTARA dilewati selama BOUNCE_TEMP_DAYS hari sejak bounce.
function bounceActive_(e, nowMs) {
  if (e.jenis !== 'SEMENTARA') return true;
  if (!e.when) return true;
  return (nowMs - e.when) < CONFIG.BOUNCE_TEMP_DAYS * 24 * 60 * 60 * 1000;
}

function upsertBounce_(list, email, jenis, alasan, whenMs, nowStr) {
  const idx = list.index[email];
  if (idx === undefined) {
    list.index[email] = list.rows.length;
    list.rows.push({ email: email, jenis: jenis, alasan: alasan, when: whenMs, ditambahkan: nowStr });
    return 'baru';
  }
  const e = list.rows[idx];
  if (e.jenis === 'SEMENTARA' && jenis === 'PERMANEN') {
    e.jenis = jenis; e.alasan = alasan; e.when = whenMs;
    return 'naik';
  }
  if (e.jenis === 'SEMENTARA' && jenis === 'SEMENTARA' && whenMs > e.when) {
    e.when = whenMs; e.alasan = alasan;
    return 'ubah';
  }
  return 'ada';
}

/* ---- Pemindaian ---- */

function scanBounces_(opts) {
  opts = opts || {};
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(opts.auto ? 1000 : 10000)) {
    if (opts.auto) return null;
    throw new Error('Proses lain sedang berjalan. Coba lagi beberapa menit.');
  }
  try {
    const t0 = Date.now();
    const props = PropertiesService.getScriptProperties();
    const t = readTable_();
    const n = t.values.length - 1;
    const emailI = t.col[CONFIG.COL_EMAIL];
    const statusI = t.col[CONFIG.COL_STATUS];
    const sentI = t.col[CONFIG.COL_SENT_AT];
    const noteI = t.col[CONFIG.COL_NOTE];
    const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
    const scriptTz = Session.getScriptTimeZone();
    const res = {
      threads: 0, limit: 0, permanen: 0, sementara: 0, listBaru: 0, listNaik: 0,
      pendingDiblokir: 0, noMatch: 0, skippedMulti: 0, unknown: 0, partial: false, reasons: {}
    };

    const status = [], sentAt = [], note = [], rowsByEmail = {};
    for (let i = 0; i < n; i++) {
      const row = t.values[i + 1];
      status.push(row[statusI]);
      sentAt.push(row[sentI]);
      note.push(row[noteI]);
      const em = String(row[emailI]).trim().toLowerCase();
      if (em) (rowsByEmail[em] = rowsByEmail[em] || []).push(i);
    }

    const list = readBounceList_();
    const nowStr = Utilities.formatDate(new Date(), scriptTz, 'yyyy-MM-dd HH:mm:ss');
    const mine = [Session.getEffectiveUser().getEmail().toLowerCase()];
    if (CONFIG.FROM_ALIAS) mine.push(String(CONFIG.FROM_ALIAS).toLowerCase());
    const isMine = function (from) {
      const f = String(from).toLowerCase();
      return mine.some(function (a) { return f.indexOf(a) >= 0; });
    };
    const TOLERANCE_MS = 10 * 60 * 1000;
    let changedRows = false, changedList = false;

    const query = opts.query || ('from:mailer-daemon newer_than:' + CONFIG.BOUNCE_DAYS + 'd');
    const PAGE = 50;
    let start = opts.useCursor ? Number(props.getProperty('BOUNCE_CURSOR') || 0) : 0;
    let done = false;
    for (; start < 5000; start += PAGE) {
      if (Date.now() - t0 > CONFIG.MAX_RUNTIME_MS - 60000) { res.partial = true; break; }
      const threads = GmailApp.search(query, start, PAGE);
      if (!threads.length) { done = true; break; }
      const all = GmailApp.getMessagesForThreads(threads);

      for (let k = 0; k < all.length; k++) {
        const bounces = [], originals = [];
        all[k].forEach(function (m) {
          const from = String(m.getFrom()).toLowerCase();
          if (from.indexOf('mailer-daemon') >= 0 || from.indexOf('postmaster') >= 0) bounces.push(m);
          else if (isMine(from)) originals.push(m);
        });
        if (!bounces.length || !originals.length) continue;
        res.threads++;

        const best = pickBounce_(bounces);
        if (!best) { res.unknown++; continue; }
        res.reasons[best.reason] = (res.reasons[best.reason] || 0) + 1;

        const orig = pickOriginal_(originals, best.body);
        if (!orig) { res.skippedMulti++; continue; }
        const origTime = orig.getDate().getTime();
        const bounceTime = best.msg.getDate().getTime();
        const recips = recipientsOf_(orig);

        // Catat alamat bermasalah di daftar bounce (limit bukan masalah alamat)
        if (best.kind !== 'limit') {
          const jenis = best.kind === 'permanen' ? 'PERMANEN' : 'SEMENTARA';
          recips.forEach(function (addr) {
            const r = upsertBounce_(list, addr, jenis, best.reason, bounceTime, nowStr);
            if (r === 'baru') res.listBaru++;
            if (r === 'naik') res.listNaik++;
            if (r !== 'ada') changedList = true;
          });
        }

        // Tandai baris yang masih SENT dan cocok dengan waktu kirim email aslinya
        let matched = false;
        recips.forEach(function (addr) {
          (rowsByEmail[addr] || []).forEach(function (i) {
            if (String(status[i]).trim().toUpperCase() !== 'SENT') return;
            const w = parseJadwal_(t.raw[i + 1][sentI], t.values[i + 1][sentI], tz).when;
            if (!w || Math.abs(w.getTime() - origTime) > TOLERANCE_MS) return;   // bukan pengiriman yang sama
            if (best.kind === 'limit') {
              status[i] = 'GAGAL_LIMIT';
              note[i] = 'Ditolak Gmail: batas kirim tercapai. Kosongkan Status (menu Kirim ulang) setelah batas pulih.';
              sentAt[i] = '';
              res.limit++;
            } else if (best.kind === 'permanen') {
              status[i] = 'BOUNCE';
              note[i] = '[Bounce] ' + best.reason;
              res.permanen++;
            } else {
              status[i] = 'BOUNCE_SEMENTARA';
              note[i] = '[Bounce] ' + best.reason;
              res.sementara++;
            }
            changedRows = true;
            matched = true;
          });
        });
        if (!matched) res.noMatch++;
      }
      if (threads.length < PAGE) { done = true; break; }
    }
    if (!done && !res.partial) res.partial = true;      // batas 5.000 percakapan per pemindaian tercapai

    // Baris yang belum dikirim tapi alamatnya sudah ada di daftar bounce: tandai agar tidak dikirim
    const nowMs = Date.now();
    for (let i = 0; i < n; i++) {
      const st = String(status[i]).trim().toUpperCase();
      if (st !== '' && st !== 'PENDING') continue;
      const row = t.values[i + 1];
      if (row.join('').trim() === '') continue;
      const e = list.rows[list.index[String(row[emailI]).trim().toLowerCase()]];
      if (!e || !bounceActive_(e, nowMs)) continue;
      status[i] = e.jenis === 'SEMENTARA' ? 'BOUNCE_SEMENTARA' : 'BOUNCE';
      note[i] = 'Daftar bounce: ' + e.alasan;
      res.pendingDiblokir++;
      changedRows = true;
    }

    if (changedRows && n >= 1) {
      const put = function (c, arr) {
        t.sh.getRange(2, c + 1, n, 1).setValues(arr.map(function (v) { return [v]; }));
      };
      put(statusI, status); put(sentI, sentAt); put(noteI, note);
    }
    if (changedList) writeBounceList_(list);
    SpreadsheetApp.flush();

    if (opts.useCursor) {
      if (res.partial) props.setProperty('BOUNCE_CURSOR', String(start));
      else props.deleteProperty('BOUNCE_CURSOR');
    }
    return res;
  } finally {
    lock.releaseLock();
  }
}

/* ---- Menu & pemicu ---- */

function tambahTotalBounce_(r) {
  const props = PropertiesService.getScriptProperties();
  const tot = JSON.parse(props.getProperty('BOUNCE_TOTAL') || '{"reasons":{}}');
  ['threads', 'limit', 'permanen', 'sementara', 'listBaru', 'listNaik', 'pendingDiblokir', 'noMatch', 'skippedMulti', 'unknown']
    .forEach(function (k) { tot[k] = (tot[k] || 0) + (r[k] || 0); });
  Object.keys(r.reasons).forEach(function (k) { tot.reasons[k] = (tot.reasons[k] || 0) + r.reasons[k]; });
  props.setProperty('BOUNCE_TOTAL', JSON.stringify(tot));
  return tot;
}

function bounceTeks_(tot, partial) {
  const alasan = Object.keys(tot.reasons)
    .sort(function (a, b) { return tot.reasons[b] - tot.reasons[a]; })
    .map(function (k) { return '  ' + tot.reasons[k] + ' x ' + k; });
  return (partial ? 'BELUM SELESAI (dilanjutkan otomatis tiap 1 menit)\n\n' : 'SELESAI\n\n') +
    'Percakapan bounce dibaca: ' + tot.threads +
    '\nRincian jenis:\n' + (alasan.length ? alasan.join('\n') : '  (belum ada)') +
    '\n\nBaris sheet yang diubah:' +
    '\n  GAGAL_LIMIT (ditolak limit): ' + tot.limit +
    '\n  BOUNCE (alamat bermasalah): ' + tot.permanen +
    '\n  BOUNCE_SEMENTARA (inbox penuh dll): ' + tot.sementara +
    '\n  Baris pending ikut ditandai karena alamatnya ada di daftar: ' + tot.pendingDiblokir +
    '\n\nAlamat baru masuk tab ' + CONFIG.BOUNCE_SHEET + ': ' + tot.listBaru + ' (naik jadi permanen: ' + tot.listNaik + ')' +
    '\nTidak cocok dengan baris SENT (sudah ditangani/dikirim ulang): ' + tot.noMatch +
    '\nTidak bisa dipastikan pemiliknya (percakapan ganda): ' + tot.skippedMulti +
    '\nJenis bounce tidak dikenali: ' + tot.unknown;
}

function tandaiBounce() {
  const ui = SpreadsheetApp.getUi();
  try {
    const ans = ui.alert(
      'Tandai bounce dari laporan Gmail',
      'Skrip membaca laporan "Mail Delivery Subsystem" ' + CONFIG.BOUNCE_DAYS + ' hari terakhir, lalu:\n\n' +
      '- Alamat bermasalah (Address not found, domain salah, diblokir): Status baris menjadi BOUNCE, alasannya ditulis di Keterangan.\n' +
      '- Inbox penerima penuh dan masalah sementara: Status BOUNCE_SEMENTARA, alasannya di Keterangan.\n' +
      '- Ditolak karena batas kirim akun: Status GAGAL_LIMIT.\n' +
      '- Semua alamat bermasalah dicatat di tab ' + CONFIG.BOUNCE_SHEET + ' dan TIDAK dikirimi lagi ' +
      '(permanen selamanya, sementara ' + CONFIG.BOUNCE_TEMP_DAYS + ' hari).\n\n' +
      'Untuk jumlah besar, pemindaian berlanjut otomatis tiap 1 menit sampai selesai.\n\nLanjutkan?',
      ui.ButtonSet.YES_NO);
    if (ans !== ui.Button.YES) return;

    const props = PropertiesService.getScriptProperties();
    props.deleteProperty('BOUNCE_CURSOR');
    props.deleteProperty('BOUNCE_TOTAL');
    clearTriggers_('bounceLanjut');
    const r = scanBounces_({ useCursor: true });
    const tot = tambahTotalBounce_(r);
    if (r.partial) {
      ScriptApp.newTrigger('bounceLanjut').timeBased().after(60 * 1000).create();
    } else {
      props.setProperty('BOUNCE_HASIL', JSON.stringify({ selesai: Date.now(), total: tot }));
    }
    ui.alert(bounceTeks_(tot, r.partial));
  } catch (e) {
    ui.alert('Gagal: ' + e.message);
  }
}

function bounceLanjut() {
  clearTriggers_('bounceLanjut');
  const props = PropertiesService.getScriptProperties();
  const r = scanBounces_({ useCursor: true, auto: true });
  if (!r) {                                            // ada proses lain: coba lagi sebentar lagi
    ScriptApp.newTrigger('bounceLanjut').timeBased().after(2 * 60 * 1000).create();
    return;
  }
  const tot = tambahTotalBounce_(r);
  if (r.partial) {
    ScriptApp.newTrigger('bounceLanjut').timeBased().after(60 * 1000).create();
    return;
  }
  props.setProperty('BOUNCE_HASIL', JSON.stringify({ selesai: Date.now(), total: tot }));
  if (CONFIG.NOTIFY_EMAIL) {
    try { MailApp.sendEmail(CONFIG.NOTIFY_EMAIL, 'Ringkasan tandai bounce', bounceTeks_(tot, false)); }
    catch (e) { Logger.log('Notifikasi gagal: ' + e); }
  }
}

// Pemindaian ringan tiap jam: hanya laporan bounce 3 jam terakhir
function bounceRun() {
  scanBounces_({ auto: true, query: 'from:mailer-daemon newer_than:3h' });
}

function enableBounceScan() {
  clearTriggers_('bounceRun');
  ScriptApp.newTrigger('bounceRun').timeBased().everyHours(1).create();
  SpreadsheetApp.getUi().alert(
    'Pemindaian bounce otomatis aktif (tiap 1 jam).\n' +
    'Alamat yang bounce otomatis masuk tab ' + CONFIG.BOUNCE_SHEET + ' dan tidak dikirimi lagi.');
}

function disableBounceScan() {
  clearTriggers_('bounceRun');
  clearTriggers_('bounceLanjut');
  SpreadsheetApp.getUi().alert('Pemindaian bounce otomatis dimatikan.');
}

// Melepas baris GAGAL_LIMIT kembali ke antrean kirim (Status dikosongkan)
function kirimUlangGagalLimit() {
  const ui = SpreadsheetApp.getUi();
  try {
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) throw new Error('Proses kirim sedang berjalan. Coba lagi beberapa menit.');
    try {
      const t = readTable_();
      const n = t.values.length - 1;
      const statusI = t.col[CONFIG.COL_STATUS];
      const noteI = t.col[CONFIG.COL_NOTE];
      const status = [], note = [];
      let count = 0;
      for (let i = 0; i < n; i++) {
        status.push(t.values[i + 1][statusI]);
        note.push(t.values[i + 1][noteI]);
        if (String(status[i]).trim().toUpperCase() === 'GAGAL_LIMIT') count++;
      }
      if (count === 0) { ui.alert('Tidak ada baris berstatus GAGAL_LIMIT.'); return; }

      const recent = sentLast24h_(t, new Date());
      const ans = ui.alert(
        'Kirim ulang yang gagal limit',
        'Baris GAGAL_LIMIT: ' + count +
        '\nTerkirim 24 jam terakhir: ' + recent + (CONFIG.DAILY_CAP > 0 ? ' (batas ' + CONFIG.DAILY_CAP + ')' : '') +
        '\n\nPastikan:\n- Batas Gmail sudah pulih (kira-kira 24 jam sejak kirim massal terakhir)\n' +
        '- Penjadwal otomatis dalam keadaan MATI kalau kamu mau mengirim manual\n\n' +
        'Lepas semua ke antrean kirim (Status dikosongkan)?',
        ui.ButtonSet.YES_NO);
      if (ans !== ui.Button.YES) return;

      for (let i = 0; i < n; i++) {
        if (String(status[i]).trim().toUpperCase() === 'GAGAL_LIMIT') { status[i] = ''; note[i] = ''; }
      }
      const put = function (c, arr) {
        t.sh.getRange(2, c + 1, n, 1).setValues(arr.map(function (v) { return [v]; }));
      };
      put(statusI, status); put(noteI, note);
      SpreadsheetApp.flush();
      ui.alert(count + ' baris dilepas ke antrean kirim. Kirim lewat menu "Kirim sekarang", atau otomatis lewat penjadwal jika Jadwal terisi. Batas DAILY_CAP tetap berlaku.');
    } finally {
      lock.releaseLock();
    }
  } catch (e) {
    ui.alert('Gagal: ' + e.message);
  }
}

/* ===================== KIRIM BERTAHAP (JEDA OTOMATIS) ===================== */

const BERTAHAP_ALASAN = {
  SELESAI: 'Semua baris yang siap sudah diproses.',
  KUOTA: 'Berhenti: kuota Apps Script habis.',
  BATAS_HARIAN: 'Berhenti: batas kirim 24 jam (DAILY_CAP) tercapai. Jalankan lagi nanti.',
  LIMIT_GMAIL: 'Berhenti: Gmail melaporkan batas kirim tercapai. Jalankan "Cek laporan bounce Gmail", ' +
               'tunggu batas pulih (sekitar 24 jam), lalu "Kirim ulang yang gagal limit".',
  DIHENTIKAN: 'Dihentikan manual.'
};

function fmtWaktu_(ms) {
  return Utilities.formatDate(new Date(ms), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

function kirimBertahap() {
  const ui = SpreadsheetApp.getUi();
  try {
    const props = PropertiesService.getScriptProperties();
    if (props.getProperty('BERTAHAP')) {
      ui.alert('Kirim bertahap sedang berjalan.\n\n' + bertahapTeks_());
      return;
    }
    const counts = countStatus_();
    const ready = counts.PENDING || 0;
    if (ready === 0) { ui.alert('Tidak ada baris yang siap dikirim.'); return; }

    const recent = sentLast24h_(readTable_(), new Date());
    const size = CONFIG.BATCH_SIZE, gap = CONFIG.BATCH_INTERVAL_MIN;
    const batches = Math.ceil(ready / size);
    const minutes = (batches - 1) * gap;
    const ans = ui.alert(
      'Kirim bertahap',
      'Siap dikirim: ' + ready +
      '\nPer putaran: ' + size + ' email, jeda ' + gap + ' menit' +
      '\nPerkiraan: ' + batches + ' putaran, sekitar ' + minutes + ' menit (' + (minutes / 60).toFixed(1) + ' jam)' +
      '\nTerkirim 24 jam terakhir: ' + recent + (CONFIG.DAILY_CAP > 0 ? ' (batas ' + CONFIG.DAILY_CAP + ')' : '') +
      '\n\nPutaran pertama langsung berjalan sekarang. Setelah itu proses berjalan sendiri di server Google, ' +
      'jadi Sheet boleh ditutup.\n\nMulai?',
      ui.ButtonSet.YES_NO);
    if (ans !== ui.Button.YES) return;

    props.setProperty('BERTAHAP', JSON.stringify({
      size: size, gap: gap, startedAt: Date.now(), batches: 0, sent: 0, failed: 0, skipped: 0
    }));
    props.deleteProperty('BERTAHAP_HASIL');
    runBertahap_();
    ui.alert(bertahapTeks_());
  } catch (e) {
    ui.alert('Gagal: ' + e.message);
  }
}

function bertahapRun() { runBertahap_(); }

function runBertahap_() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('BERTAHAP');
  if (!raw) return;
  const st = JSON.parse(raw);
  clearTriggers_('bertahapRun');

  // Sebelum putaran berikutnya: berhenti jika Gmail sudah melaporkan batas kirim sejak proses dimulai
  if (st.batches > 0) {
    let limitHit = false;
    try { limitHit = limitBounceSince_(new Date(st.startedAt)); } catch (e) { Logger.log('Cek limit gagal: ' + e); }
    if (limitHit) { selesaiBertahap_(st, 'LIMIT_GMAIL'); return; }
  }

  const r = sendBatch_({ auto: true, noNotify: true, maxSend: st.size });

  if (r.stopReason === 'SIBUK') {                       // ada proses lain: coba lagi sebentar lagi
    st.nextRun = Date.now() + 2 * 60 * 1000;
    props.setProperty('BERTAHAP', JSON.stringify(st));
    ScriptApp.newTrigger('bertahapRun').timeBased().after(2 * 60 * 1000).create();
    return;
  }

  st.batches++; st.sent += r.sent; st.failed += r.failed; st.skipped += r.skipped;
  st.lastRun = Date.now();

  if (r.stopReason === 'BATCH' || r.stopReason === 'WAKTU') {
    st.nextRun = Date.now() + st.gap * 60 * 1000;
    props.setProperty('BERTAHAP', JSON.stringify(st));
    ScriptApp.newTrigger('bertahapRun').timeBased().after(st.gap * 60 * 1000).create();
    return;
  }
  selesaiBertahap_(st, r.stopReason);                   // SELESAI, KUOTA, atau BATAS_HARIAN
}

function selesaiBertahap_(st, reason) {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty('BERTAHAP');
  clearTriggers_('bertahapRun');
  const hasil = {
    reason: reason, selesai: Date.now(), startedAt: st.startedAt,
    batches: st.batches, sent: st.sent, failed: st.failed, skipped: st.skipped
  };
  props.setProperty('BERTAHAP_HASIL', JSON.stringify(hasil));
  if (CONFIG.NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail(CONFIG.NOTIFY_EMAIL, 'Ringkasan kirim bertahap',
        (BERTAHAP_ALASAN[reason] || reason) +
        '\nPutaran: ' + st.batches + '\nTerkirim: ' + st.sent + '\nGagal: ' + st.failed + '\nDilewati: ' + st.skipped);
    } catch (e) { Logger.log('Notifikasi gagal: ' + e); }
  }
}

function bertahapTeks_() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('BERTAHAP');
  if (raw) {
    const st = JSON.parse(raw);
    return 'BERJALAN' +
      '\nPutaran selesai: ' + st.batches +
      '\nTerkirim: ' + st.sent + ' | Gagal: ' + st.failed + ' | Dilewati: ' + st.skipped +
      (st.nextRun ? '\nPutaran berikutnya sekitar: ' + fmtWaktu_(st.nextRun) : '') +
      '\n\nSisa baris siap kirim akan dilanjutkan otomatis tiap ' + st.gap + ' menit.';
  }
  const rawHasil = props.getProperty('BERTAHAP_HASIL');
  if (rawHasil) {
    const h = JSON.parse(rawHasil);
    return 'SELESAI/BERHENTI pada ' + fmtWaktu_(h.selesai) +
      '\n' + (BERTAHAP_ALASAN[h.reason] || h.reason) +
      '\nPutaran: ' + h.batches + ' | Terkirim: ' + h.sent + ' | Gagal: ' + h.failed + ' | Dilewati: ' + h.skipped;
  }
  return 'Tidak ada proses kirim bertahap yang berjalan.';
}

function statusBertahap() {
  SpreadsheetApp.getUi().alert('Kirim bertahap\n\n' + bertahapTeks_());
}

function hentikanBertahap() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('BERTAHAP');
  if (!raw) { ui.alert('Tidak ada proses kirim bertahap yang berjalan.'); return; }
  selesaiBertahap_(JSON.parse(raw), 'DIHENTIKAN');
  ui.alert('Kirim bertahap dihentikan.\n\n' + bertahapTeks_());
}

// Adakah laporan "batas kirim tercapai" dari Gmail yang masuk setelah waktu tertentu?
function limitBounceSince_(since) {
  const threads = GmailApp.search('from:mailer-daemon "reached a limit for sending mail" newer_than:2d', 0, 20);
  for (let i = 0; i < threads.length; i++) {
    if (threads[i].getLastMessageDate().getTime() >= since.getTime()) return true;
  }
  return false;
}

/* ===================== OPT-OUT OTOMATIS DARI BALASAN STOP ===================== */

function syncOptOut_() {
  const sh = getSheet_();
  const values = sh.getDataRange().getDisplayValues();
  const headers = values[0].map(function (h) { return String(h).trim(); });
  const emailI = headers.indexOf(CONFIG.COL_EMAIL);
  const optI = headers.indexOf(CONFIG.COL_OPTOUT);
  if (emailI < 0 || optI < 0) return 0;

  const rowByEmail = {};
  for (let r = 1; r < values.length; r++) {
    rowByEmail[String(values[r][emailI]).trim().toLowerCase()] = r + 1;
  }

  let count = 0;
  const threads = GmailApp.search('in:inbox newer_than:30d -from:me', 0, 100);
  threads.forEach(function (th) {
    th.getMessages().forEach(function (msg) {
      const m = msg.getFrom().match(/<([^>]+)>/);
      const from = (m ? m[1] : msg.getFrom()).trim().toLowerCase();
      const row = rowByEmail[from];
      if (!row) return;

      // hanya baca bagian atas balasan (2 paragraf pertama), abaikan kutipan email asli
      const top = msg.getPlainBody().split(/\r?\n/)
        .filter(function (l) { return l.trim().charAt(0) !== '>'; }).join('\n')
        .trim().split(/\r?\n\s*\r?\n/).slice(0, 2).join(' ').substring(0, 200);

      if (/\b(stop|berhenti|unsubscribe)\b/i.test(top)) {
        const cell = sh.getRange(row, optI + 1);
        if (String(cell.getValue()).trim().toUpperCase() !== 'YA') {
          cell.setValue('YA');
          count++;
        }
      }
    });
  });
  return count;
}

function tandaiOptOut() {
  const n = syncOptOut_();
  SpreadsheetApp.getUi().alert('Selesai. ' + n + ' penerima baru ditandai OptOut = YA.');
}

/* ===================== PENGECEK IZIN (jalankan sekali dari editor) ===================== */

function otorisasi() {
  GmailApp.search('in:inbox', 0, 1);
  MailApp.getRemainingDailyQuota();
  ScriptApp.getProjectTriggers();
  SpreadsheetApp.getActive();
  Logger.log('OK, semua izin lengkap');
}
```

---

## Lampiran B: Template 1 (Infinix) `Template.html`

Isi file HTML bernama `Template` di Apps Script. Ganti `GANTI-DENGAN-URL-BANNER` (dan `GANTI-URL-FOTO-PRODUK` atau hapus blok foto). Subjek didaftarkan di `CONFIG.TEMPLATES`.

```html
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#fdeeb8;font-family:Arial,Helvetica,sans-serif;color:#1f1b16;">

<!-- Teks pratinjau (tampil di daftar inbox, tidak terlihat di dalam email) -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#fdeeb8;">
  Limit kredit Anda siap dipakai! Promo bunga 0%*, admin fee Rp 0,-*, tenor 12 &amp; 18* untuk gadget Infinix impian. S&amp;K berlaku.
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#fdeeb8" style="background:#fdeeb8;padding:24px 12px;">
<tr>
<td align="center">

  <!-- KARTU UTAMA -->
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #ecd48a;">

    <!-- BANNER (logo ada di dalam banner; lebar file 1200 px, tinggi bebas, JPG). Banner bisa diklik menuju WhatsApp -->
    <tr>
      <td>
        <a href="{{LinkWA}}" target="_blank" style="text-decoration:none;">
          <img src="https://GANTI-DENGAN-URL-BANNER.jpg" alt="Promo 11.11: limit kreditmu siap dipakai. Gadget Infinix dengan promo bunga 0%, admin fee Rp 0, tenor 12 dan 18" width="600" style="display:block;border:0;width:100%;max-width:600px;height:auto;">
        </a>
      </td>
    </tr>

    <!-- LABEL, JUDUL & PENGANTAR -->
    <tr>
      <td align="center" style="padding:24px 20px 4px 20px;">
        <span style="display:inline-block;background:#ffcf33;color:#1f1b16;font-size:11px;line-height:1;font-weight:bold;letter-spacing:1.5px;padding:8px 14px;border-radius:20px;margin:0 3px 6px 3px;">PROMO 11.11</span>
        <span style="display:inline-block;background:#2a2520;color:#ffd34d;font-size:11px;line-height:1;font-weight:bold;letter-spacing:1.5px;padding:8px 14px;border-radius:20px;margin:0 3px 6px 3px;">GADGET INFINIX</span>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 26px 8px 26px;">
        <h1 style="margin:0 0 14px 0;font-size:26px;line-height:1.25;font-weight:bold;color:#1f1b16;text-align:center;">Limit kredit Anda siap dipakai <span style="background:#ffcf33;padding:0 8px;border-radius:6px;white-space:nowrap;">Promo 11.11!</span></h1>
        <p style="margin:0 0 12px 0;font-size:16px;line-height:1.6;color:#1f1b16;">Halo <strong style="color:#b87900;">{{Nama}}</strong>, &#128075;</p>
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#4a4338;">
          Kabar baik untuk Anda! <strong style="color:#1f1b16;">Limit kredit Anda sudah siap dipakai</strong> untuk memiliki gadget Infinix impian di Promo 11.11,
          dengan <strong style="color:#1f1b16;">promo bunga 0%*</strong>, <strong style="color:#1f1b16;">admin fee Rp 0,-*</strong>, dan pilihan <strong style="color:#1f1b16;">tenor 12 &amp; 18*</strong>.
        </p>
        <p style="margin:0;font-size:15px;line-height:1.75;color:#4a4338;">
          Pilih model favoritmu, lalu konsultasikan langsung dengan tim kami lewat WhatsApp Official.
        </p>
      </td>
    </tr>

    <!-- BAR TAGAR -->
    <tr>
      <td style="padding:18px 20px 8px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#2a2520" style="background:#2a2520;border-radius:14px;">
          <tr>
            <td align="center" style="padding:14px 16px;font-size:16px;line-height:1.5;color:#ffffff;">
              <strong style="color:#ffd34d;">#YakinBisa</strong> miliki Gadget impianmu sekarang!
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- FOTO PRODUK + DAFTAR MODEL (foto transparan 1200 x 560 px) -->
    <tr>
      <td style="padding:16px 20px 8px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#fff8e1" style="background:#fff8e1;border:1px solid #ecd48a;border-radius:16px;">
          <tr>
            <td align="center" style="padding:16px 12px 4px 12px;">
              <img src="https://GANTI-URL-FOTO-PRODUK.png" alt="Smartphone dan tablet Infinix" width="520" style="display:block;margin:0 auto;border:0;width:100%;max-width:520px;height:auto;">
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:6px 14px 4px 14px;">
              <p style="margin:0 0 8px 0;font-size:11px;font-weight:bold;letter-spacing:2px;color:#b87900;">PILIHAN MODEL</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 12px 16px 12px;">
              <span style="display:inline-block;background:#ffffff;border:1px solid #d9c27a;color:#1f1b16;font-size:12px;line-height:1;font-weight:bold;padding:8px 12px;border-radius:16px;margin:0 2px 6px 2px;">INFINIX GT 50 PRO</span>
              <span style="display:inline-block;background:#ffffff;border:1px solid #d9c27a;color:#1f1b16;font-size:12px;line-height:1;font-weight:bold;padding:8px 12px;border-radius:16px;margin:0 2px 6px 2px;">HOT 70</span>
              <span style="display:inline-block;background:#ffffff;border:1px solid #d9c27a;color:#1f1b16;font-size:12px;line-height:1;font-weight:bold;padding:8px 12px;border-radius:16px;margin:0 2px 6px 2px;">NOTE 60 Series</span>
              <span style="display:inline-block;background:#ffffff;border:1px solid #d9c27a;color:#1f1b16;font-size:12px;line-height:1;font-weight:bold;padding:8px 12px;border-radius:16px;margin:0 2px 6px 2px;">XPAD 30 PRO</span>
              <span style="display:inline-block;background:#ffffff;border:1px solid #d9c27a;color:#1f1b16;font-size:12px;line-height:1;font-weight:bold;padding:8px 12px;border-radius:16px;margin:0 2px 6px 2px;">NOTE EDGE</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- JUDUL PROMO -->
    <tr>
      <td align="center" style="padding:22px 24px 12px 24px;">
        <p style="margin:0 0 2px 0;font-size:11px;font-weight:bold;letter-spacing:2px;color:#b87900;">KEUNTUNGAN PROMO</p>
        <h2 style="margin:0;font-size:21px;line-height:1.3;color:#1f1b16;">Cicilan lebih ringan, gadget impian di tangan</h2>
      </td>
    </tr>

    <!-- 3 BAR PROMO -->
    <tr>
      <td style="padding:0 20px 10px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#2a2520" style="background:#2a2520;border:2px solid #f0d98a;border-radius:16px;">
          <tr>
            <td valign="middle" style="padding:14px 8px 14px 20px;font-size:16px;line-height:1.3;color:#ffffff;">Promo Bunga</td>
            <td align="right" valign="middle" style="padding:10px 20px 10px 8px;font-size:32px;line-height:1.1;font-weight:bold;color:#ffd34d;white-space:nowrap;">0%<span style="font-size:18px;vertical-align:top;">*</span></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 20px 10px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#2a2520" style="background:#2a2520;border:2px solid #f0d98a;border-radius:16px;">
          <tr>
            <td valign="middle" style="padding:14px 8px 14px 20px;font-size:16px;line-height:1.3;color:#ffffff;">Admin Fee</td>
            <td align="right" valign="middle" style="padding:10px 20px 10px 8px;font-size:32px;line-height:1.1;font-weight:bold;color:#ffd34d;white-space:nowrap;">Rp 0,-<span style="font-size:18px;vertical-align:top;">*</span></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 20px 8px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#2a2520" style="background:#2a2520;border:2px solid #f0d98a;border-radius:16px;">
          <tr>
            <td valign="middle" style="padding:14px 8px 14px 20px;font-size:16px;line-height:1.3;color:#ffffff;">Tenor</td>
            <td align="right" valign="middle" style="padding:10px 20px 10px 8px;font-size:32px;line-height:1.1;font-weight:bold;color:#ffd34d;white-space:nowrap;">12 &amp; 18<span style="font-size:18px;vertical-align:top;">*</span></td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- PERIODE PROMO -->
    <tr>
      <td style="padding:14px 20px 8px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#7a5a05" style="background:#7a5a05;border-radius:16px;">
          <tr>
            <td align="center" style="padding:14px 12px 4px 12px;">
              <span style="display:inline-block;background:#ffffff;color:#7a5a05;font-size:11px;line-height:1;font-weight:bold;letter-spacing:2px;padding:7px 16px;border-radius:12px;">PERIODE PROMO</span>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 12px 16px 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="38%" align="center" valign="middle" style="color:#ffffff;">
                    <div style="font-size:34px;line-height:1.1;font-weight:bold;">01</div>
                    <div style="font-size:11px;line-height:1.4;font-weight:bold;letter-spacing:.5px;">SEPTEMBER<br>2026</div>
                  </td>
                  <td width="24%" align="center" valign="middle" style="font-size:14px;font-style:italic;color:#f0d98a;">sampai</td>
                  <td width="38%" align="center" valign="middle" style="color:#ffffff;">
                    <div style="font-size:34px;line-height:1.1;font-weight:bold;">31</div>
                    <div style="font-size:11px;line-height:1.4;font-weight:bold;letter-spacing:.5px;">DESEMBER<br>2026</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- 3 LANGKAH -->
    <tr>
      <td style="padding:24px 26px 6px 26px;">
        <p style="margin:0 0 2px 0;font-size:11px;font-weight:bold;letter-spacing:2px;color:#b87900;">CARA MUDAH</p>
        <h2 style="margin:0 0 14px 0;font-size:20px;line-height:1.3;color:#1f1b16;">2 langkah miliki gadget impian</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="42" valign="top" style="padding:0 0 14px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="30" height="30" align="center" valign="middle" bgcolor="#ffcf33" style="background:#ffcf33;border-radius:15px;color:#1f1b16;font-size:14px;font-weight:bold;line-height:30px;">1</td></tr></table>
            </td>
            <td valign="top" style="padding:0 0 14px 0;">
              <p style="margin:0 0 2px 0;font-size:15px;line-height:1.4;font-weight:bold;color:#1f1b16;">Chat WhatsApp Official</p>
              <p style="margin:0;font-size:13px;line-height:1.55;color:#6b6354;">Konsultasikan gadget pilihanmu dengan tim kami.</p>
            </td>
          </tr>
          <tr>
            <td width="42" valign="top" style="padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="30" height="30" align="center" valign="middle" bgcolor="#ffcf33" style="background:#ffcf33;border-radius:15px;color:#1f1b16;font-size:14px;font-weight:bold;line-height:30px;">2</td></tr></table>
            </td>
            <td valign="top" style="padding:0;">
              <p style="margin:0 0 2px 0;font-size:15px;line-height:1.4;font-weight:bold;color:#1f1b16;">Pilih model Infinix favoritmu</p>
              <p style="margin:0;font-size:13px;line-height:1.55;color:#6b6354;">GT 50 PRO, HOT 70, NOTE 60 Series, XPAD 30 PRO, atau NOTE EDGE.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:26px 20px 8px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#fff8e1" style="background:#fff8e1;border:2px solid #f0d98a;border-radius:18px;">
          <tr>
            <td align="center" style="padding:24px 20px 22px 20px;">
              <p style="margin:0 0 8px 0;font-size:20px;line-height:1.3;font-weight:bold;color:#1f1b16;"><span style="color:#b87900;">#YakinBisa</span> miliki gadget impianmu!</p>
              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.7;color:#4a4338;">Konsultasikan pilihan gadget dan manfaatkan Promo 11.11 langsung lewat WhatsApp Official kami.</p>
              <a href="{{LinkWA}}" target="_blank" style="display:inline-block;background:#138a3d;color:#ffffff;font-size:16px;font-weight:bold;line-height:1.3;text-decoration:none;padding:16px 28px;border-radius:30px;">
                &#128172; Chat WhatsApp Official
              </a>
              <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:#6b6354;">
                Info lebih lanjut:<br>
                <a href="https://kbkp.app/su/PROGRAMINFINIX" target="_blank" style="color:#8a5a00;font-weight:bold;text-decoration:underline;">https://kbkp.app/su/PROGRAMINFINIX</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- PENUTUP -->
    <tr>
      <td style="padding:22px 26px 26px 26px;">
        <p style="margin:0 0 6px 0;font-size:11px;line-height:1.5;color:#7d7566;">*Syarat &amp; ketentuan berlaku.</p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#6b6354;">
          Salam hangat,<br>
          <strong style="color:#1f1b16;">Tim Customer Care</strong>
        </p>
      </td>
    </tr>

  </table>

  <!-- FOOTER LUAR -->
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
    <tr>
      <td align="center" style="padding:20px 12px 8px 12px;font-size:11px;line-height:1.7;color:#7d7566;">
        <strong>Kreditplus berizin dan diawasi oleh Otoritas Jasa Keuangan.</strong><br>
        Email ini dikirim oleh PT KB Finansia Multi Finance (Kreditplus).<br>
        Jika Anda tidak ingin menerima email penawaran lagi, balas email ini dengan kata <strong>STOP</strong>.
      </td>
    </tr>
  </table>

</td>
</tr>
</table>

</body>
</html>
```

---

## Lampiran C: Template 2 (TECNO) `Template2.html`

Isi file HTML bernama `Template2` di Apps Script. Ganti `GANTI-DENGAN-URL-BANNER`.

```html
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#dff1ff;font-family:Arial,Helvetica,sans-serif;color:#10233f;">

<!-- Teks pratinjau (tampil di daftar inbox, tidak terlihat di dalam email) -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#dff1ff;">
  Hari ini Promo 11.11 Super Deal: TECNO CAMON 50 &amp; POVA 8 Series, DP mulai dari Rp 0*, tenor 12 &amp; 18 bulan. S&amp;K berlaku.
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#dff1ff" style="background:#dff1ff;padding:24px 12px;">
<tr>
<td align="center">

  <!-- KARTU UTAMA -->
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #b9dcf7;">

    <!-- BANNER (logo ada di dalam banner; lebar file 1200 px, tinggi bebas, JPG). Banner bisa diklik menuju WhatsApp -->
    <tr>
      <td>
        <a href="{{LinkWA}}" target="_blank" style="text-decoration:none;">
          <img src="https://GANTI-DENGAN-URL-BANNER.jpg" alt="Promo 11.11 Super Deal. TECNO CAMON 50 dan POVA 8 Series dengan Kreditplus: DP mulai dari Rp 0, tenor 12 dan 18 bulan, bunga mulai dari Rp 0" width="600" style="display:block;border:0;width:100%;max-width:600px;height:auto;">
        </a>
      </td>
    </tr>

    <!-- LABEL, JUDUL & PENGANTAR -->
    <tr>
      <td align="center" style="padding:24px 20px 4px 20px;">
        <span style="display:inline-block;background:#f7931e;color:#ffffff;font-size:11px;line-height:1;font-weight:bold;letter-spacing:1.5px;padding:8px 14px;border-radius:20px;margin:0 3px 6px 3px;">HARI INI</span>
        <span style="display:inline-block;background:#10233f;color:#ffc20e;font-size:11px;line-height:1;font-weight:bold;letter-spacing:1.5px;padding:8px 14px;border-radius:20px;margin:0 3px 6px 3px;">SPESIAL PELANGGAN SETIA</span>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 26px 8px 26px;">
        <h1 style="margin:0 0 14px 0;font-size:26px;line-height:1.25;font-weight:bold;color:#10233f;text-align:center;">Promo 11.11 <span style="background:#ffc20e;padding:0 8px;border-radius:6px;white-space:nowrap;">Super Deal!</span></h1>
        <p style="margin:0 0 12px 0;font-size:16px;line-height:1.6;color:#10233f;">Halo <strong style="color:#1e88e5;">{{Nama}}</strong>, &#128075;</p>
        <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#44556b;">
          <strong style="color:#10233f;">Hari ini Promo 11.11 Super Deal hadir khusus untuk Anda!</strong>
          Sebagai pelanggan setia, saatnya miliki <strong style="color:#10233f;">TECNO CAMON 50 &amp; POVA 8 Series</strong> dengan Kreditplus,
          lengkap dengan <strong style="color:#10233f;">DP mulai dari Rp 0*</strong>, <strong style="color:#10233f;">tenor 12 &amp; 18 bulan</strong>, dan <strong style="color:#10233f;">bunga mulai dari Rp 0*</strong>.
        </p>
        <p style="margin:0;font-size:15px;line-height:1.75;color:#44556b;">
          Chat WhatsApp Official kami untuk konsultasi dan pilih tipe favorit Anda.
        </p>
      </td>
    </tr>

    <!-- KARTU PROMO: DP, TENOR, BUNGA -->
    <tr>
      <td style="padding:18px 20px 8px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="background:#ffffff;border:2px solid #ffc20e;border-radius:18px;overflow:hidden;">
          <tr>
            <td align="center" bgcolor="#ffb300" style="background-color:#ffb300;background-image:linear-gradient(90deg,#ffc20e 0%,#f7931e 100%);padding:13px 14px;font-size:13px;line-height:1.45;font-weight:bold;color:#10233f;">
              Beli TECNO CAMON 50 &amp; POVA 8 SERIES dengan KREDITPLUS
            </td>
          </tr>
          <tr>
            <td style="padding:4px 20px 6px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" style="padding:14px 8px 14px 0;border-bottom:1px solid #e3edf7;">
                    <p style="margin:0;font-size:19px;line-height:1.2;font-weight:bold;color:#10233f;">DP</p>
                    <p style="margin:2px 0 0 0;font-size:12px;line-height:1.3;color:#6b7a90;">Mulai dari</p>
                  </td>
                  <td align="right" valign="middle" style="padding:14px 0 14px 8px;border-bottom:1px solid #e3edf7;white-space:nowrap;">
                    <span style="font-size:15px;font-weight:bold;color:#f7931e;">Rp</span> <span style="font-size:36px;line-height:1;font-weight:bold;color:#f7931e;">0</span><span style="font-size:20px;font-weight:bold;color:#f7931e;vertical-align:top;">*</span>
                  </td>
                </tr>
                <tr>
                  <td valign="middle" style="padding:14px 8px 14px 0;border-bottom:1px solid #e3edf7;">
                    <p style="margin:0;font-size:19px;line-height:1.2;font-weight:bold;color:#10233f;">Tenor</p>
                  </td>
                  <td align="right" valign="middle" style="padding:14px 0 14px 8px;border-bottom:1px solid #e3edf7;white-space:nowrap;">
                    <span style="font-size:32px;line-height:1;font-weight:bold;color:#f7931e;">12 &amp; 18</span><br>
                    <span style="font-size:14px;font-weight:bold;color:#10233f;">Bulan</span>
                  </td>
                </tr>
                <tr>
                  <td valign="middle" style="padding:14px 8px 14px 0;">
                    <p style="margin:0;font-size:19px;line-height:1.2;font-weight:bold;color:#10233f;">Bunga</p>
                    <p style="margin:2px 0 0 0;font-size:12px;line-height:1.3;color:#6b7a90;">Mulai dari</p>
                  </td>
                  <td align="right" valign="middle" style="padding:14px 0 14px 8px;white-space:nowrap;">
                    <span style="font-size:15px;font-weight:bold;color:#f7931e;">Rp</span> <span style="font-size:36px;line-height:1;font-weight:bold;color:#f7931e;">0</span><span style="font-size:20px;font-weight:bold;color:#f7931e;vertical-align:top;">*</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- PILIHAN SERI -->
    <tr>
      <td align="center" style="padding:22px 24px 12px 24px;">
        <p style="margin:0 0 2px 0;font-size:11px;font-weight:bold;letter-spacing:2px;color:#f7931e;">PILIHAN SERI</p>
        <h2 style="margin:0;font-size:21px;line-height:1.3;color:#10233f;">Dua seri, satu promo</h2>
      </td>
    </tr>
    <tr>
      <td style="padding:0 20px 8px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" valign="top" style="padding:0 6px 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#fff4dc" style="background:#fff4dc;border:2px solid #ffc20e;border-radius:16px;">
                <tr>
                  <td align="center" style="padding:20px 10px;">
                    <p style="margin:0 0 6px 0;font-size:11px;font-weight:bold;letter-spacing:2px;color:#f7931e;">TECNO</p>
                    <p style="margin:0 0 4px 0;font-size:20px;line-height:1.2;font-weight:bold;color:#10233f;">CAMON 50</p>
                    <p style="margin:0;font-size:12px;line-height:1.4;font-weight:bold;color:#44556b;">SERIES</p>
                  </td>
                </tr>
              </table>
            </td>
            <td width="50%" valign="top" style="padding:0 0 0 6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#e8f3ff" style="background:#e8f3ff;border:2px solid #1e88e5;border-radius:16px;">
                <tr>
                  <td align="center" style="padding:20px 10px;">
                    <p style="margin:0 0 6px 0;font-size:11px;font-weight:bold;letter-spacing:2px;color:#1e88e5;">TECNO</p>
                    <p style="margin:0 0 4px 0;font-size:20px;line-height:1.2;font-weight:bold;color:#10233f;">POVA 8</p>
                    <p style="margin:0;font-size:12px;line-height:1.4;font-weight:bold;color:#44556b;">SERIES</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- PERIODE PROMO -->
    <tr>
      <td style="padding:14px 20px 8px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffb300" style="background-color:#ffb300;background-image:linear-gradient(90deg,#ffc20e 0%,#f7931e 100%);border-radius:16px;">
          <tr>
            <td align="center" style="padding:16px 14px;">
              <p style="margin:0 0 4px 0;font-size:12px;font-weight:bold;letter-spacing:2px;color:#10233f;">PERIODE PROMO</p>
              <p style="margin:0;font-size:21px;line-height:1.3;font-weight:bold;color:#10233f;">23 Oktober &ndash; 31 Desember 2026</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- 3 LANGKAH -->
    <tr>
      <td style="padding:24px 26px 6px 26px;">
        <p style="margin:0 0 2px 0;font-size:11px;font-weight:bold;letter-spacing:2px;color:#f7931e;">CARA MUDAH</p>
        <h2 style="margin:0 0 14px 0;font-size:20px;line-height:1.3;color:#10233f;">2 langkah miliki gadget impian</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="42" valign="top" style="padding:0 0 14px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="30" height="30" align="center" valign="middle" bgcolor="#f7931e" style="background:#f7931e;border-radius:15px;color:#ffffff;font-size:14px;font-weight:bold;line-height:30px;">1</td></tr></table>
            </td>
            <td valign="top" style="padding:0 0 14px 0;">
              <p style="margin:0 0 2px 0;font-size:15px;line-height:1.4;font-weight:bold;color:#10233f;">Chat WhatsApp Official</p>
              <p style="margin:0;font-size:13px;line-height:1.55;color:#6b7a90;">Konsultasikan pilihan gadget Anda dengan tim kami.</p>
            </td>
          </tr>
          <tr>
            <td width="42" valign="top" style="padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="30" height="30" align="center" valign="middle" bgcolor="#f7931e" style="background:#f7931e;border-radius:15px;color:#ffffff;font-size:14px;font-weight:bold;line-height:30px;">2</td></tr></table>
            </td>
            <td valign="top" style="padding:0;">
              <p style="margin:0 0 2px 0;font-size:15px;line-height:1.4;font-weight:bold;color:#10233f;">Pilih TECNO CAMON 50 atau POVA 8 Series</p>
              <p style="margin:0;font-size:13px;line-height:1.55;color:#6b7a90;">Pilih tipe favorit Anda dari dua seri yang tersedia.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:26px 20px 8px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#e8f3ff" style="background:#e8f3ff;border:2px solid #b9dcf7;border-radius:18px;">
          <tr>
            <td align="center" style="padding:24px 20px 22px 20px;">
              <p style="margin:0 0 8px 0;font-size:20px;line-height:1.3;font-weight:bold;color:#10233f;">Ajukan Sekarang!</p>
              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.7;color:#44556b;">Konsultasikan pilihan Anda dan manfaatkan Promo 11.11 Super Deal langsung lewat WhatsApp Official kami.</p>
              <a href="{{LinkWA}}" target="_blank" style="display:inline-block;background:#138a3d;color:#ffffff;font-size:16px;font-weight:bold;line-height:1.3;text-decoration:none;padding:16px 28px;border-radius:30px;">
                &#128172; Chat WhatsApp Official
              </a>
              <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:#6b7a90;">
                Info selengkapnya:<br>
                <a href="https://kbkp.app/su/TECNOPOVA" target="_blank" style="color:#1565c0;font-weight:bold;text-decoration:underline;">https://kbkp.app/su/TECNOPOVA</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- PENUTUP -->
    <tr>
      <td style="padding:22px 26px 26px 26px;">
        <p style="margin:0 0 6px 0;font-size:11px;line-height:1.5;color:#7d8aa0;">*Syarat &amp; ketentuan berlaku.</p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7a90;">
          Salam hangat,<br>
          <strong style="color:#10233f;">Tim Customer Care</strong>
        </p>
      </td>
    </tr>

  </table>

  <!-- FOOTER LUAR -->
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
    <tr>
      <td align="center" style="padding:20px 12px 8px 12px;font-size:11px;line-height:1.7;color:#5f7391;">
        <strong>Kreditplus berizin dan diawasi oleh Otoritas Jasa Keuangan.</strong><br>
        Email ini dikirim oleh PT KB Finansia Multi Finance (Kreditplus) &bull; www.kreditplus.com<br>
        Jika Anda tidak ingin menerima email penawaran lagi, balas email ini dengan kata <strong>STOP</strong>.
      </td>
    </tr>
  </table>

</td>
</tr>
</table>

</body>
</html>
```

---

*Akhir dokumen serah terima.*
