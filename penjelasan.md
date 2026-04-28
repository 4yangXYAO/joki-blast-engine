# Penjelasan Super Sederhana: Joki Blast Engine

Dokumen ini dibuat dengan bahasa yang sangat mudah.
Tujuannya: supaya Anda bisa langsung paham, langsung jalan, dan langsung cek hasil.

## 1) Program ini untuk apa?

Program ini untuk membantu promosi otomatis:
- Anda membuat 1 campaign marketing.
- Sistem kirim konten ke beberapa platform (Twitter, Threads, Instagram, Facebook Pages).
- Link di konten diarahkan ke WhatsApp / Telegram / Webshop.
- Saat ada chat masuk dari WhatsApp atau Telegram, sistem kirim pesan welcome otomatis.
- Setelah itu, negosiasi dilanjutkan manual oleh admin/sales.

Singkatnya: otomatis di awal, manual di tahap closing.

## 2) Bagian utama sistem

Ada 2 bagian besar:

1. Backend API (otak sistem)
- Mengatur campaign, queue job, tracking klik, webhook inbound, auto-reply.

2. Dashboard (UI admin)
- Tempat isi data, buat campaign, pilih platform, dan trigger blast.

## 3) Alur kerja paling gampang dipahami

Urutan normalnya seperti ini:

1. Admin buat campaign di dashboard.
2. Admin pilih platform target.
3. Admin isi CTA link (contoh: link WhatsApp).
4. Admin klik blast.
5. Sistem membuat job posting per platform.
6. User klik link dari posting.
7. Sistem catat klik link.
8. Kalau user chat via WA/Telegram, sistem kirim welcome otomatis.
9. Status lead masuk ke state handoff untuk ditangani manusia.

## 4) Cara menjalankan project (lokal)

Jalankan perintah ini:

```bash
npm install
npm run db:init
npm run dev:api
```

Terminal lain:

```bash
cd dashboard
npm install
npm run dev
```

Lalu buka dashboard:
- http://localhost:3001

## 5) Cara test cepat dari dashboard

Ikuti langkah ini satu per satu:

1. Buka halaman campaign di dashboard.
2. Isi:
- Campaign name
- Campaign content
- CTA link
- Pilih platform
3. Klik "Create Campaign".
4. Klik "Blast Campaign".
5. Pastikan muncul status sukses.

## 6) Cara cek 3 poin penting di plan

Tiga poin ini adalah inti validasi akhir.

### A. Link resolve ke WA/Telegram/Webshop

Yang dicek:
- Link tracking bisa dibuka.
- Sistem redirect ke CTA link tujuan.

Endpoint yang dipakai:
- `GET /v1/track/:token`
- `GET /v1/track/stats/:campaignId`

Hasil yang benar:
- Redirect berjalan.
- Data klik tercatat.

### B. Auto-reply welcome terkirim saat inbound WA/Telegram

Yang dicek:
- Ada inbound message ke webhook.
- Sistem kirim welcome message otomatis 1 kali (idempotent).

Endpoint webhook:
- `POST /v1/webhooks/waha`
- `POST /v1/webhooks/telegram`

Hasil yang benar:
- Lead dibuat.
- Welcome terkirim.
- Tidak spam welcome berulang untuk kontak yang sama.

### C. Handoff manual terlihat di state sistem

Yang dicek:
- Setelah welcome, lead status berubah ke state handoff/awaiting_handoff.
- Tim manusia bisa lanjut negosiasi manual.

Endpoint cek lead:
- `GET /v1/webhooks/leads`

Hasil yang benar:
- Status lead terlihat jelas di data.

## 7) Status saat ini (berdasarkan pengujian yang sudah dilakukan)

Yang sudah beres:
- Phase 1 sampai Phase 5 selesai.
- Test backend + integration lulus.
- Dashboard build lulus.

Yang biasanya belum 100% final:
- Uji live pakai kredensial platform asli.
- Browser validation end-to-end dengan skenario real.

## 8) Daftar endpoint penting (versi ringkas)

Campaign:
- `POST /v1/campaigns`
- `GET /v1/campaigns`
- `GET /v1/campaigns/:id`
- `POST /v1/campaigns/:id/blast`

Tracking:
- `GET /v1/track/:token`
- `GET /v1/track/stats/:campaignId`

Webhook inbound:
- `POST /v1/webhooks/waha`
- `POST /v1/webhooks/telegram`
- `GET /v1/webhooks/leads`

## 9) Jika ada error, cek ini dulu

1. Pastikan backend hidup.
2. Pastikan dashboard hidup.
3. Pastikan database sudah init.
4. Pastikan env/token integrasi benar.
5. Cek log backend saat klik blast / webhook.

## 10) Kesimpulan super singkat

Project ini sudah siap dipakai untuk alur blast + tracking + auto-reply + handoff manual.
Untuk menyatakan "100% live-ready", tinggal final check dengan akun platform asli dan uji browser end-to-end real scenario.
