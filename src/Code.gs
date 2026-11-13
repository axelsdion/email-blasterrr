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
