# CLAUDE.md – Proyek Email Blasting (Google Sheet + Apps Script + Gmail)

Baca dulu `docs/Serah_Terima_Proyek_Email_Blasting.md` Bagian 1–3, 5, dan 9. Kode terbaru ada di `src/`
(identik dengan Lampiran A–C dokumen itu). Bila dokumen dan `src/` berbeda, `src/` di branch terbaru yang berlaku.

## Cara menjawab pengguna
- Bahasa Indonesia santai (aku/kamu), rinci, langkah demi langkah. Sediakan file MD bila diminta.
- Untuk perubahan kode: sebutkan fungsi/blok yang berubah dan langkah pasang (idealnya seluruh `Code.gs` siap tempel).
- Selalu ingatkan: isi ulang `SENDER_NAME` setelah mengganti `Code.gs`; matikan penjadwal/kirim bertahap sebelum eksperimen; jaga batas kirim 24 jam.
- Bila angka di sheet tidak cocok, tanyakan dulu tindakan manual pengguna di sheet sebelum menyimpulkan.

## Aturan kode
- Jangan ubah perilaku inti tanpa menguji logika baru dengan simulasi/mock (Node) terlebih dahulu.
- Kuota Apps Script ≠ batas Gmail. Batas kirim dijaga oleh `DAILY_CAP` (jendela 24 jam bergulir dari kolom `Waktu Kirim`).
- `BOUNCE` dan `BOUNCE_SEMENTARA` tetap dihitung dalam 24 jam; `GAGAL_LIMIT` dan `FAILED` tidak.

## Aturan template HTML (Bagian 6.2 dokumen)
- Lebar maks 600 px, `<table role="presentation">`, gaya inline, tanpa JS/form/font eksternal.
- Tanpa karakter non-ASCII mentah; emoji sebagai entitas numerik (mis. `&#128075;`). `&` ditulis `&amp;`.
- Ramah HP: hindari dua kolom sempit, harga dibungkus `white-space:nowrap`.
- CTA dan banner menuju `{{LinkWA}}`. Placeholder cukup `{{Nama}}` dan `{{LinkWA}}` kecuali ada kolom baru yang disepakati.
- Bagian langkah **maksimal 2 langkah**; langkah "Ajukan melalui Aplikasi Kreditplus Mobile" tidak dipakai lagi.
- **Jangan mengarang angka promo.** Pakai hanya yang ada di banner; bila belum ada, pakai penanda `XXX` dan minta pengguna mengisi.
- Footer: nama perusahaan, "balas STOP", pernyataan OJK bila relevan, "Syarat & ketentuan berlaku".
- Jangan pakai istilah internal (mis. "RO") di sisi konsumen.
- Template baru didaftarkan di `CONFIG.TEMPLATES` (`'Template3': { subject: '...' }`).
