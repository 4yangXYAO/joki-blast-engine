# 📖 Cara Pakai joki-blast-engine

> Panduan ini ditulis sesederhana mungkin. Kalau kamu bisa pakai WhatsApp, kamu bisa pakai ini!

---

## 🤔 Ini Alat Apa?

**joki-blast-engine** adalah mesin pengirim pesan otomatis.

Kamu bisa kirim pesan ke banyak orang sekaligus di platform:
- 📱 **WhatsApp** (via WAHA atau Cloud API)
- ✈️ **Telegram** (via Bot atau akun pengguna)
- 📸 **Instagram** (via Graph API atau cookie browser)
- 🐦 **Twitter/X** (via API atau cookie browser)
- 🧵 **Threads** (via Graph API atau cookie browser)

---

## 🚀 Langkah 1 — Persiapan Awal (Lakukan Sekali Saja)

### 1.1 Salin file konfigurasi
```
Salin file .env.example → buat file baru bernama .env
Isi nilai-nilainya (lihat bagian "Isi .env" di bawah)
```

### 1.2 Install semua keperluan
Buka terminal di folder project, ketik:
```
npm install
```

### 1.3 Buat database
```
npm run db:init
```

✅ Selesai! Sekarang kamu siap pakai.

---

## ⚙️ Isi File .env

File `.env` adalah "kunci-kunci" yang diperlukan mesin ini.
Minimal yang **wajib** diisi:

```
DATABASE_PATH=data/app.db
API_PORT=3456
API_HOST=127.0.0.1
DASHBOARD_PORT=3001
JWT_SECRET=ganti_dengan_kata_rahasia_mu
LOG_LEVEL=info
```

Untuk platform-nya, lihat tabel di bawah:

---

## 📱 Platform — Mana yang Mau Dipakai?

### WhatsApp via WAHA (Paling Mudah)

> WAHA = aplikasi kecil yang kamu jalankan sendiri, gratis

**Langkah:**
1. Jalankan WAHA di komputermu:
   ```
   docker run -p 3001:3000 devlikeapro/waha
   ```
2. Buka browser → `http://localhost:3001` → scan QR WhatsApp kamu
3. Isi di `.env`:
   ```
   WAHA_BASE_URL=http://localhost:3001
   WAHA_API_KEY=          ← kosongkan kalau tidak di-set
   WAHA_SESSION=default
   ```

---

### ✈️ Telegram — Bot Biasa

> Cocok untuk kirim pesan dari bot ke grup/channel

1. Buka Telegram → cari **@BotFather** → ketik `/newbot` → ikuti instruksi
2. Kamu dapat **token** seperti: `1234567890:ABCdef...`
3. Simpan token itu, nanti dipakai saat tambah akun

---

### ✈️ Telegram — Akun Pengguna (MTProto)

> Cocok untuk kirim pesan sebagai "orang biasa" bukan bot

1. Buka https://my.telegram.org → login
2. Klik **API development tools** → buat aplikasi
3. Kamu dapat `api_id` (angka) dan `api_hash` (huruf+angka)
4. Untuk `sessionString`: hubungi admin untuk generate sekali pakai

---

### 📸 Instagram / 🐦 Twitter / 🧵 Threads via Cookie

> Cookie = bukti bahwa kamu sudah login di browser

**Cara ambil cookie:**
1. Buka Instagram/Twitter/Threads di browser (Chrome/Firefox)
2. Login dengan akun kamu
3. Tekan **F12** → pilih tab **Application**
4. Klik **Cookies** di sebelah kiri → klik nama website
5. Kopi semua cookie (atau pakai ekstensi "EditThisCookie" → Export)

Format cookie yang bisa dipakai:
- **Format teks**: `sessionid=abc123; csrftoken=xyz789`
- **Format JSON**: `[{"name":"sessionid","value":"abc123"}]`

---

## ▶️ Langkah 2 — Jalankan Server

Buka terminal, ketik:
```
npm run dev:api
```

Sekarang server berjalan di: `http://127.0.0.1:3456`

---

## 🖥️ Langkah 3 — Jalankan Dashboard (Tampilan Web)

Buka terminal **BARU** (jangan tutup yang lama), ketik:
```
cd dashboard
npm install
npm run dev
```

Buka browser: `http://localhost:3001`

Di sini kamu bisa:
- Tambah akun platform
- Buat template pesan
- Jadwalkan pengiriman

---

## 👤 Langkah 4 — Tambah Akun

Akun = identitas platform yang mau kamu pakai untuk kirim pesan.

### Cara Termudah — Pakai Dashboard
1. Buka dashboard → klik **Accounts** → klik **Tambah Akun**
2. Pilih platform (whatsapp, telegram, instagram, dll)
3. Isi username dan credential yang diperlukan
4. Klik Simpan ✅

### Cara Manual — Pakai API
Contoh tambah akun WhatsApp (WAHA):
```bash
curl -X POST http://127.0.0.1:3456/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "whatsapp",
    "username": "akun_wa_saya",
    "credentials": ""
  }'
```

Contoh tambah akun Instagram dengan cookie:
```bash
curl -X POST http://127.0.0.1:3456/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram-cookie",
    "username": "nama_akun_ig",
    "credentials": "sessionid=abc123; csrftoken=xyz"
  }'
```

> 🔒 Credential disimpan terenkripsi — tidak ada yang bisa baca isinya kecuali mesinmu sendiri.

---

## 📝 Langkah 5 — Buat Template Pesan

Template = pesan yang bisa dipakai berkali-kali dengan nama/link berbeda.

Contoh template:
```
Halo {nama}, cek penawaran spesial di {link} ya!
```

`{nama}` dan `{link}` akan diganti otomatis saat kirim.

**Via API:**
```bash
curl -X POST http://127.0.0.1:3456/v1/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Promo Lebaran",
    "content": "Halo {nama}, ada promo di {link}!",
    "variables": ["nama", "link"],
    "type": "template"
  }'
```

---

## 📤 Langkah 6 — Kirim Pesan

**Via API:**
```bash
curl -X POST http://127.0.0.1:3456/v1/jobs/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "id_template_kamu",
    "account_id": "id_akun_kamu",
    "platform": "whatsapp",
    "message": "Halo Budi, ada promo di tokoku.com!"
  }'
```

---

## 🔄 Jenis Adapter — Pilih yang Sesuai Kebutuhanmu

| Platform | Adapter | Kapan Dipakai |
|---|---|---|
| WhatsApp | `cloud-api` + WAHA | Kirim WA tanpa scan ulang |
| WhatsApp | `webjs` | Alternatif pakai QR |
| Telegram | `telegram` (bot) | Kirim dari bot ke grup/user |
| Telegram | `telegram-mtproto` | Kirim sebagai akun manusia |
| Instagram | `instagram` | Punya Graph API resmi |
| Instagram | `instagram-cookie` | Pakai akun pribadi (cookie) |
| Twitter/X | `twitter` | Punya API key resmi |
| Twitter/X | `twitter-cookie` | Pakai akun pribadi (cookie) |
| Threads | `threads` | Punya Graph API resmi |
| Threads | `threads-cookie` | Pakai akun pribadi (cookie) |

---

## ❓ Pertanyaan Umum

**Q: Apakah akun/password saya aman?**
A: Iya. Credential disimpan **terenkripsi** di database lokal. Tidak ada yang dikirim ke server luar.

**Q: Bisa pakai banyak akun sekaligus?**
A: Bisa! Tambahkan sebanyak yang kamu mau di bagian Accounts.

**Q: Apa bedanya cookie vs API resmi?**
A: API resmi = lebih stabil, butuh daftar developer. Cookie = lebih mudah, tapi bisa expired kalau kamu logout dari browser.

**Q: Cookie saya expired, gimana?**
A: Login lagi di browser, ambil cookie baru, update di dashboard.

**Q: Ada error saat `npm install`?**
A: Di Windows, kamu perlu install **Visual Studio Build Tools** (cari di Google "VS Build Tools 2022", centang "Desktop development with C++").

---

## 🆘 Butuh Bantuan?

Cek file `README.md` untuk dokumentasi teknis lengkap, atau lihat `penjelasan.md` untuk detail arsitektur sistem.
