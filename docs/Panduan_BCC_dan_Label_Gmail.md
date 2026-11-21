# Panduan: Salinan BCC Email Blast + Label Gmail

Tujuan: kamu bisa melihat sendiri email blast persis seperti yang diterima konsumen (tampilan, nama,
tombol WA, gambar), tanpa memenuhi Inbox.

---

## 1. Cara kerjanya

- Saat mengirim, skrip menambahkan **BCC** ke alamat pantauan. Konsumen **tidak** melihat alamat BCC ini.
- Alamat pantauan bawaan: **alamat pengirim + `+blast`**. Contoh: kalau akun pengirim
  `cs.promo@kpvendor.id`, salinan dikirim ke `cs.promo+blast@kpvendor.id`. Email ke alamat `+blast`
  tetap masuk ke kotak surat yang sama, tapi mudah dipisahkan dengan filter.
- Setiap salinan dicatat di tab `RiwayatKirim` (kolom Catatan berisi `BCC`).

### Kenapa bawaannya tidak SEMUA email di-BCC

Kuota harian Apps Script dihitung **per penerima**, bukan per email. Satu email ke konsumen + BCC = 2 penerima.

| Pengaturan `BCC_SETIAP` | Salinan yang kamu terima | Kuota Apps Script per email | Kapasitas kirim per hari (kuota 1.500, cadangan 50) |
|---|---|---|---|
| `0` | Tidak ada | 1 | ±1.400 (dibatasi `DAILY_CAP`) |
| `50` (bawaan) | 1 dari tiap 50 email **+ email pertama tiap template di setiap putaran** | ±1,02 | ±1.400 (dibatasi `DAILY_CAP`) |
| `1` | Semua email | 2 | **±725** (turun hampir setengah) |

Masalah tampilan (template rusak, gambar hilang, salah ketik) terjadi pada **semua** email dengan template
yang sama, jadi contoh 1 dari 50 sudah cukup untuk menangkapnya. Untuk mengecek email ke **satu konsumen
tertentu**, pakai folder **Sent / Terkirim** (lihat Bagian 5). Di sana sudah ada 100% email yang
terkirim, tanpa memakai kuota tambahan.

---

## 2. Atur di `Code.gs`

Di blok `CONFIG`, bagian **SALINAN BCC UNTUK PANTAUAN**:

```javascript
BCC_EMAIL: '',     // kosong = alamat pengirim + "+blast"; atau isi alamat lain, mis. 'adit@kpvendor.id'
BCC_SETIAP: 50,    // 0 = mati, 1 = semua email, 50 = 1 dari tiap 50 email
```

Setelah mengubah: **Save**, lalu isi ulang `SENDER_NAME` kalau kamu menempel ulang seluruh `Code.gs`.

Cek pengaturannya lewat menu **📧 Email Blast → Lihat ringkasan & sisa kuota**. Baris
"Salinan BCC ke …" menampilkan alamat dan modenya.

---

## 3. Buat label dan filter Gmail (sekali saja)

Lakukan di Gmail **akun pengirim** (atau akun yang kamu isi di `BCC_EMAIL`), lewat browser di laptop.
Nama tombol dalam kurung adalah perkiraan nama di tampilan Bahasa Indonesia.

1. Buka **Gmail** di browser.
2. Di kolom pencarian paling atas, klik ikon **Show search options** (Tampilkan opsi penelusuran),
   ikon garis bertingkat di ujung kanan kolom pencarian.
3. Di kolom **To** (Kepada), isi alamat pantauan, contoh: `cs.promo+blast@kpvendor.id`.
   Kolom lain biarkan kosong.
4. Klik **Create filter** (Buat filter) di kanan bawah.
5. Centang:
   - **Skip the Inbox (Archive it)** (Lewati Kotak Masuk (Arsipkan))
   - **Apply the label** (Terapkan label) → **Choose label…** → **New label…** (Label baru…) →
     ketik `Blast Salinan` → **Create** (Buat)
   - **Never send it to Spam** (Jangan pernah kirim ke Spam)
   - **Also apply filter to matching conversations** (Terapkan juga filter ke percakapan yang cocok),
     kalau pilihan ini muncul.
6. Klik **Create filter** (Buat filter).
7. Label **Blast Salinan** sekarang muncul di panel kiri Gmail. Kalau tidak terlihat, klik **More**
   (Selengkapnya) di panel kiri.

### Apakah bentrok dengan filter Bounce yang sudah ada?

Tidak. Kedua filter mencocokkan hal yang berbeda:

| Filter | Mencocokkan | Hasil |
|---|---|---|
| Bounce (yang sudah ada) | **From** `mailer-daemon@googlemail.com` | Label `Bounce`, lewati Inbox |
| Blast Salinan (baru) | **To** `…+blast@kpvendor.id` | Label `Blast Salinan`, lewati Inbox |

Laporan bounce dikirim ke alamat pengirim biasa (tanpa `+blast`), jadi tidak akan masuk label `Blast Salinan`.
Satu hal yang normal: kalau email yang di-BCC itu ternyata bounce, Gmail menampilkannya dalam satu
percakapan, sehingga percakapan tersebut bisa terlihat membawa **dua label** sekaligus. Itu tidak
mengganggu skrip. Skrip **Tandai bounce** hanya membaca pesan dari `mailer-daemon`.

**Tetap jangan hapus** email di label `Bounce` ke Trash, karena skrip pembaca bounce membutuhkannya.

---

## 4. Uji sekali sebelum blast besar

1. **Matikan penjadwal otomatis** dan pastikan tidak ada kirim bertahap yang berjalan
   (menu **Status kirim bertahap**).
2. Catat angka **Sisa kuota Apps Script hari ini** dari menu **Lihat ringkasan & sisa kuota**.
3. Di sheet `Data`, isi 2 baris uji dengan **email pribadimu sendiri** (bukan konsumen), Status kosong.
4. Klik **2. Kirim sekarang** → **Yes**. Baris uji pertama selalu dapat salinan BCC
   (email pertama tiap template).
5. Periksa di Gmail akun pengirim:
   - Salinan ada di label **Blast Salinan**.
   - Salinan **tidak** ada di Inbox.
6. Buka lagi **Lihat ringkasan**. Sisa kuota Apps Script seharusnya turun **3** (2 email + 1 BCC).
7. Hapus baris uji dari `Data`.

Kalau langkah 5 atau 6 tidak sesuai, lihat Bagian 6.

---

## 5. Cara memakai untuk pantauan

| Mau cek apa | Ketik di kolom pencarian Gmail |
|---|---|
| Semua salinan blast | `label:blast-salinan` |
| Salinan hari ini | `label:blast-salinan newer_than:1d` |
| Salinan satu template (cari dari subjek) | `label:blast-salinan subject:"VIVO V80"` |
| Email ke **satu konsumen tertentu** (semua email, bukan hanya salinan) | `in:sent to:konsumen@gmail.com` |
| Semua email blast hari ini di folder Terkirim | `in:sent newer_than:1d` |

Yang perlu diperhatikan saat membuka salinan:
- Nama konsumen di sapaan terisi benar (tidak ada `{{Nama}}` yang tersisa).
- Banner dan gambar tampil (tidak ada kotak gambar rusak atau tulisan `GANTI-…`).
- Tombol WhatsApp membuka chat yang benar.
- Tidak ada karakter aneh seperti `������` (tanda emoji rusak).
- Cek juga di **HP** dan di **dark mode**.

---

## 6. Troubleshooting

| Gejala | Kemungkinan penyebab | Solusi |
|---|---|---|
| Salinan tidak datang sama sekali | Plus addressing (`+blast`) dimatikan di Admin Console Workspace | Cek pengaturan plus addressing di Admin Console Gmail, atau isi `BCC_EMAIL` dengan alamat lain tanpa `+` |
| Salinan datang tapi tetap di Inbox | Filter tidak berlaku untuk email yang dikirim akun ke dirinya sendiri | Isi `BCC_EMAIL` dengan **kotak surat lain** (mis. email kerjamu sendiri), lalu buat filter yang sama di kotak surat itu |
| Sisa kuota turun 2 per email padahal `BCC_SETIAP` 50 | Masih memakai `Code.gs` lama, atau `BCC_SETIAP` terisi 1 | Cek baris "Salinan BCC" di **Lihat ringkasan** |
| Kirim berhenti lebih cepat dari biasanya ("kuota Apps Script habis") | `BCC_SETIAP: 1` memakai 2 kuota per email | Kembalikan ke `50`, atau terima kapasitas ±725 email per hari |
| Label baru tidak muncul di panel kiri | Label disembunyikan | Gmail → Settings → Labels → set `Blast Salinan` ke **show** |
