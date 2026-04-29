# Facebook Pages Blast Guide

Panduan lengkap untuk melakukan blast ke Facebook Pages menggunakan dashboard joki-blast-engine.

## Prerequisites

- **Facebook Page**: Kamu harus memiliki akses admin ke Facebook Page
- **Facebook Developer Account**: Untuk mendapatkan access token
- **Page Access Token**: Token dari Facebook Graph API v19.0

## Step-by-Step Guide

### 1. Dapatkan Facebook Page ID dan Access Token

#### Cara 1: Menggunakan Facebook Graph Explorer

1. Buka [Facebook Graph Explorer](https://developers.facebook.com/tools/explorer)
2. Di dropdown "Meta Apps", pilih aplikasi kamu (atau buat baru di Facebook Developers)
3. Klik tombol "Generate Access Token"
4. Pilih "pages_read_engagement", "pages_manage_posts", "pages_read_user_profile"
5. Di search field, ketik nama Page kamu
6. Klik pada Page yang muncul
7. Copy `id` (ini adalah Page ID)
8. Di address bar, kunjungi `https://graph.facebook.com/v19.0/{page-id}?fields=name&access_token={token}`
9. Copy access token dari Graph Explorer

#### Cara 2: Menggunakan Meta Business Manager

1. Buka [Meta Business Manager](https://business.facebook.com)
2. Pilih Page kamu
3. Di Settings > Accounts > Instagram Accounts, pilih Page
4. Buka "Channels" > "Access Tokens"
5. Generate atau copy existing token
6. Page ID ada di URL: `https://www.facebook.com/{page-id}/`

### 2. Membuat Facebook Page Account di Dashboard

1. Buka dashboard: `http://localhost:3001`
2. Scroll ke section **"Create Account"**
3. Di dropdown **Platform**, pilih `facebook` atau `facebook-page`
4. Di field **Username**, masukkan nama page (contoh: "My Business Page")
5. Di field **Facebook Page ID**, paste Page ID yang sudah didapat
6. Di field **Facebook Access Token**, paste access token (hidden with password mask)
7. Klik **Save**
8. Catat **Account ID** yang ditampilkan (untuk blast nanti)

Contoh:

```
Platform: facebook
Username: Toko Baju Online
Facebook Page ID: 123456789012345
Facebook Access Token: EAAB...
```

**Output setelah Save:**

```
Account ID: 550e8400-e29b-41d4-a716-446655440000
Account created: 550e8400-e29b-41d4-a716-446655440000
```

### 3. Membuat Campaign untuk Facebook Pages

1. Di dashboard, scroll ke section **"Create Campaign & Blast"**
2. Ada subsection terpisah: **"Facebook Page Blast"**
3. Di dropdown **Facebook Page Account**, pilih akun yang baru dibuat
4. Di field **Campaign Name**, masukkan judul campaign (contoh: "Promo Akhir Tahun")
5. Di field **Campaign Content**, masukkan pesan yang ingin dipost
6. Di field **CTA Link**, masukkan link (contoh: "https://tokobajuonline.com/promo")
7. Klik **Create Facebook Campaign**
8. Catat **Campaign ID** yang ditampilkan

Contoh:

```
Facebook Page Account: Toko Baju Online (facebook)
Campaign Name: Promo Akhir Tahun
Campaign Content: Dapatkan diskon 50% untuk semua item! Terbatas hanya hari ini.
CTA Link: https://tokobajuonline.com/promo
```

**Output setelah Create:**

```
Campaign created: a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6
Selected Facebook campaign: a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6
```

### 4. Blast Campaign ke Facebook Page

1. Tetap di section **"Facebook Page Blast"**
2. Klik tombol **Blast Facebook Campaign**
3. Sistem akan:
   - Enqueue satu PostJob untuk Facebook
   - Mengirim pesan ke Facebook Graph API v19.0
   - Post muncul di Facebook Page feed dalam beberapa detik

**Output setelah Blast:**

```
Blasting Facebook campaign...
Facebook campaign blasted: a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6
```

### 5. Verifikasi Post

1. Buka Facebook Page kamu
2. Lihat di **Timeline** atau **Posts**
3. Post terbaru harusnya muncul dengan konten yang kamu buat
4. Post akan include tracking link otomatis jika CTA Link diisi

## Troubleshooting

### "Token Expired" Error

- **Solusi**: Regenerate access token di Facebook Graph Explorer atau Meta Business Manager
- Token Facebook Page biasanya valid 60 hari
- Buat token permanent di Meta Business Manager untuk jangka panjang

### "Page ID Not Found" Error

- **Solusi**: Pastikan Page ID benar
- Cek di Graph Explorer: `GET /v19.0/{page-id}?access_token={token}`
- Pastikan token punya akses ke Page tersebut

### "Rate Limit Exceeded" Error

- **Solusi**: Tunggu 60 detik sebelum blast lagi
- Facebook membatasi 100 post per menit per Page
- Sistem akan auto-retry dengan exponential backoff

### "Missing Permissions" Error

- **Solusi**: Regenerate token dengan scopes:
  - `pages_read_engagement`
  - `pages_manage_posts`
  - `pages_read_user_profile`

## Multi-Platform Campaign

Jika ingin blast ke multiple platform (Twitter + Threads + Facebook):

1. Buat akun untuk setiap platform
2. Di section **"Create Campaign & Blast"** (non-Facebook)
3. Pilih **Platforms**: ceklis Facebook + Twitter + Threads
4. Di field **Facebook Page Account**, pilih akun Facebook
5. Di field account IDs lainnya, gunakan akun yang sesuai
6. Klik **Blast Campaign**

Sistem akan enqueue satu job per platform secara bersamaan.

## API Reference

Jika menggunakan REST API langsung (bukan dashboard):

### Create Facebook Page Account

```bash
POST /v1/accounts
Content-Type: application/json

{
  "platform": "facebook",
  "username": "Toko Baju Online",
  "credentials": "{\"pageId\":\"123456789012345\",\"accessToken\":\"EAAB...\"}"
}
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Account created successfully"
}
```

### Create Campaign

```bash
POST /v1/campaigns
Content-Type: application/json

{
  "name": "Promo Akhir Tahun",
  "content": "Dapatkan diskon 50% untuk semua item!",
  "cta_link": "https://tokobajuonline.com/promo",
  "platforms": ["facebook"]
}
```

**Response:**

```json
{
  "id": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "name": "Promo Akhir Tahun",
  "status": "draft",
  "platforms": ["facebook"]
}
```

### Blast Campaign

```bash
POST /v1/campaigns/a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6/blast
Content-Type: application/json

{
  "account_ids": {
    "facebook": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Response:**

```json
{
  "campaign_id": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "posts": [
    {
      "platform": "facebook",
      "job_id": "job-1777438701365-s0ipbk"
    }
  ],
  "errors": []
}
```

## Implementation Details

### Credential Format

Facebook credentials disimpan sebagai JSON string:

```json
{
  "pageId": "123456789012345",
  "accessToken": "EAAB..."
}
```

### Graph API Endpoint

Posting ke Facebook Page menggunakan endpoint:

```
POST https://graph.facebook.com/v19.0/{page-id}/feed
  ?message={content}
  &access_token={token}
```

### Error Codes

Sistem memetakan Facebook Graph error codes ke standardized codes:

- `4` → `RATE_LIMIT_EXCEEDED`: Terlalu banyak post
- `190` → `TOKEN_EXPIRED`: Token tidak valid
- Other → `FACEBOOK_POST_ERROR`: Error lainnya

### Retry Logic

- **Max retries**: 5
- **Initial delay**: 1 detik
- **Backoff multiplier**: 2x (exponential)
- Jadi: 1s, 2s, 4s, 8s, 16s

## Best Practices

1. **Test dulu**: Gunakan draft post atau test page sebelum production
2. **Scheduling**: Gunakan cron jobs untuk blast di jam prime time
3. **Rate limits**: Jangan blast > 100 post per menit per page
4. **Content**: Pastikan konten sesuai Facebook policies (no spam, etc)
5. **Monitoring**: Check logs untuk error dan retry attempts
6. **Token rotation**: Refresh token setiap 30-45 hari
7. **Backup accounts**: Siapkan secondary page access token

## Example Workflow

```
1. Create Account (Facebook Page)
   ↓
2. Create Campaign (name, content, CTA link, platforms=[facebook])
   ↓
3. Blast Campaign (select Facebook account ID)
   ↓
4. Post appears on Facebook Page feed
   ↓
5. Track clicks via tracking link
```

## Support

Jika ada error atau pertanyaan:

1. Cek logs backend: `npm run dev:api`
2. Cek error code di API response
3. Verifikasi credentials di Facebook Graph Explorer
4. Lihat test file: `src/adapters/facebook.test.ts`

---

**Last Updated**: April 2026
**Version**: 1.0.0
