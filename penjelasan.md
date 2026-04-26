# Penjelasan Lengkap Project `joki-blast-engine`

Dokumen ini menjelaskan isi repository secara menyeluruh: tujuan tiap folder, fungsi tiap file penting, alur runtime, serta bagian yang masih berupa scaffold atau placeholder.

## Gambaran Umum

Repository ini terdiri dari dua bagian utama:

1. Backend Node.js/TypeScript di root project, yang menyediakan API, akses SQLite, queue, scheduler, adapter platform sosial, dan worker.
2. Dashboard Next.js di folder `dashboard/`, yang menjadi antarmuka admin sederhana untuk memantau API dan menyiapkan data awal.

Secara desain, backend adalah pusat logika. Dashboard hanya lapisan UI terpisah yang berbicara ke backend melalui HTTP.

## Struktur Tingkat Atas

### File dan folder di root

- `package.json` - Konfigurasi paket utama backend: nama project, dependency, dan script utilitas.
- `tsconfig.json` - Konfigurasi TypeScript untuk backend di root.
- `jest.config.js` - Konfigurasi Jest untuk test backend.
- `Dockerfile` - Image untuk membangun dan menjalankan backend.
- `docker-compose.yml` - Orkestrasi container untuk API, worker, dashboard, dan Redis.
- `README.md` - Dokumentasi ringkas konfigurasi environment dan validasi config.
- `.env.example` - Contoh variabel environment yang dipakai saat development lokal.
- `.eslintrc.json` - Konfigurasi linting.
- `.prettierrc` - Konfigurasi formatting kode.
- `.gitignore` - Daftar file/folder yang tidak masuk git.
- `data/` - Lokasi database SQLite runtime.
- `migrations/` - File SQL untuk inisialisasi dan migrasi schema database.
- `scripts/` - Script utilitas untuk init dan validasi database/config.
- `src/` - Kode sumber backend utama.
- `tests/` - Setup test global.
- `dashboard/` - Aplikasi Next.js terpisah untuk dashboard.
- `.sisyphus/` - Folder catatan internal workspace/proyek; bukan bagian inti runtime aplikasi.
- `node_modules/`, `.next/`, `.git/` - Folder hasil instalasi atau tooling, bukan source code.

## Backend Root

### `package.json`

File ini mendefinisikan paket utama backend.

- `type: commonjs` - Project backend memakai CommonJS.
- Script yang tersedia:
  - `db:init` - menjalankan inisialisasi database via `scripts/db-init.ts`.
  - `db:validate` - menjalankan validasi schema database via `scripts/db-validate.ts`.
  - `validate:config` - memeriksa apakah environment variable wajib tersedia.
- Dependency utama:
  - `express` untuk HTTP API.
  - `better-sqlite3` untuk database SQLite synchronous.
  - `cors` untuk CORS.
  - `zod` untuk validasi data, meskipun dari file yang dibaca belum banyak dipakai.
  - `winston` untuk logging.
- Dev dependency:
  - `typescript`, `ts-node`, dan type definitions.

### `tsconfig.json`

Konfigurasi TypeScript backend.

- `rootDir: ./src` - source utama ada di `src/`.
- `outDir: ./dist` - hasil build TypeScript akan keluar ke `dist/`.
- `strict: true` - mode type-check ketat.
- `paths` dengan alias `@/*` ke `src/*`.
- `include` hanya `src/**/*`, sehingga script di `scripts/` tidak ikut build TypeScript utama.

### `jest.config.js`

Mengatur test backend.

- Menggunakan `ts-jest`.
- Test diambil dari `src/` dan `tests/`.
- Coverage diukur untuk file TypeScript di `src/`, kecuali entrypoint tertentu.
- `tests/setup.ts` dijalankan sebelum test.

### `Dockerfile`

Docker image untuk backend.

- Tahap build memakai `node:20-alpine`.
- `npm ci --only=production` digunakan untuk instal dependency produksi.
- Lalu menjalankan `npm run build` dan menyalin hasil `dist/` ke image final.
- Container akhir menjalankan `node dist/index.js`.

### `docker-compose.yml`

Menjalankan beberapa service sekaligus.

- `api` - backend HTTP utama di port `3000`.
- `workers` - proses worker yang menjalankan job background.
- `dashboard` - aplikasi Next.js di port `3001`.
- `redis` - dependency queue/runtime untuk skenario yang mengarah ke Redis, walaupun implementasi queue saat ini masih dominan in-memory.
- Volume `./data:/app/data` dipakai untuk menyimpan SQLite database.

### `README.md`

Berisi deskripsi ringkas project, cara validasi config, dan daftar environment variable yang dijelaskan saat itu.

Catatan penting: isi README masih lebih sederhana dibanding isi code saat ini. File `src/config/secrets.ts` sekarang memerlukan beberapa secret tambahan untuk integrasi platform sosial.

### Flow token via UI

- Backend bisa dijalankan tanpa mengisi token platform di `.env`.
- Setelah backend dan dashboard hidup, token diisi dari halaman dashboard.
- Token disimpan di SQLite lokal secara terenkripsi.
- Backend membaca token itu saat adapter dipanggil, jadi tidak perlu restart untuk sekadar menyimpan token.
- Token yang bisa diisi dari UI meliputi WhatsApp, Telegram, Threads, Twitter, Instagram, dan beberapa setting pendukung Instagram/WhatsApp WebJS.

### Kebutuhan instalasi agar project jalan

Untuk menjalankan project ini dengan stabil, yang dibutuhkan adalah:

- Node.js 18+ dan npm.
- Dependency root dengan `npm install` di folder project utama.
- Dependency dashboard dengan `cd dashboard && npm install`.
- File `.env` yang berisi variable wajib dari `src/config/secrets.ts`.
- Di Windows, Visual Studio Build Tools jika ingin memakai `better-sqlite3` native.
- Jika tidak ingin native build, project sudah menyiapkan fallback `sql.js`.

Urutan jalan yang paling aman:

1. Salin `.env.example` ke `.env` dan isi nilainya.
2. Jalankan `npm install` di root.
3. Jalankan `npm run db:init` untuk membuat database dan migrasi.
4. Jalankan `cd dashboard && npm install`.
5. Start backend dan dashboard setelah token atau env sudah siap.

### `.env.example`

Contoh environment variable untuk development.

- `LOG_LEVEL`
- `API_HOST`
- `API_PORT`
- `DASHBOARD_PORT`
- `DATABASE_PATH`
- `JWT_SECRET`

File ini menjadi template untuk `.env` lokal.

## Folder `scripts/`

### `scripts/db-init.ts`

Script inisialisasi database.

- Membuat folder `data/` bila belum ada.
- Membuka database SQLite di `data/app.db`.
- Mengaktifkan WAL mode.
- Membaca semua file `.sql` di `migrations/` secara berurutan dan menjalankannya.
- Cocok dipakai saat bootstrap project dari nol.

### `scripts/db-validate.ts`

Validator schema database, tetapi saat ini masih stub.

- Mengecek apakah database ada.
- Saat ini belum melakukan inspeksi schema yang benar-benar mendalam.
- Lebih tepat dianggap placeholder untuk validasi schema yang lebih lengkap di masa depan.

### `scripts/validate-config.js`

Script validasi environment configuration.

- Membaca `.env.example` jika ada.
- Memuat `ts-node/register` supaya bisa mengimpor file TypeScript.
- Memanggil `src/config/secrets.ts` untuk memastikan variabel wajib tersedia.
- Output suksesnya adalah `Config validation: PASSED`.

## Folder `migrations/`

Folder ini menyimpan SQL schema.

### `migrations/001_create_core_tables.sql`

Schema utama yang cocok dengan repository runtime saat ini.

- Membuat tabel `accounts`.
- Membuat tabel `templates`.
- Membuat tabel `jobs`.
- Membuat tabel `schedules`.
- Membuat tabel `logs`.
- Schema ini dipakai oleh `src/db/sqlite.ts` saat migrasi runtime.

### `migrations/001_init.sql`

Schema SQLite versi lain/awal.

- Membuat tabel dengan nama kapital seperti `Accounts`, `Templates`, `Jobs`, dan seterusnya.
- Strukturnya berbeda dari `001_create_core_tables.sql`.
- File ini tampak seperti schema generasi awal atau eksperimen lama.

Catatan: ada dua schema migrasi yang tidak sepenuhnya konsisten. Untuk runtime, kode repository sekarang lebih selaras dengan schema lower-case di `001_create_core_tables.sql`.

## Folder `src/`

Folder ini adalah inti aplikasi backend.

### `src/index.ts`

Entry point backend.

- Mengimpor `startServer` dari `src/api/server.ts`.
- Langsung menjalankan server API.

### `src/api/server.ts`

Bootstrap server Express.

- Menginisialisasi Express, CORS, Helmet, dan JSON body parser.
- Menambahkan logging request.
- Menyediakan endpoint health check di `/v1/health`.
- Memuat semua router domain.
- Menginisialisasi database, migrasi, scheduler cron, dan worker job.
- Menangani error global dengan response HTTP 500.

### `src/config/secrets.ts`

Loader dan validator environment variable.

- `REQUIRED_VARS` berisi secret dan config wajib yang harus ada sebelum aplikasi berjalan.
- `loadConfig()` melempar error jika ada variabel wajib yang kosong.
- `getConfig()` membungkus config hasil validasi ke bentuk terstruktur `AppConfig`.
- Mendukung secret tambahan opsional seperti token Instagram, Threads, dan Twitter.

Ini adalah pusat validasi konfigurasi runtime.

### `src/db/sqlite.ts`

Lapisan koneksi SQLite.

- Menyimpan koneksi database sebagai singleton.
- Menjamin folder parent database ada.
- Mengaktifkan pragma `journal_mode = WAL` dan `foreign_keys = ON`.
- Menyediakan helper `getDb()`, `closeDatabase()`, dan `runInTransaction()`.
- `runMigrations()` mengeksekusi file SQL dari folder migrasi dan mencatat migrasi yang sudah diterapkan di tabel `schema_migrations`.

### `src/types/`

Berisi definisi tipe domain.

#### `src/types/db.ts`

Interface untuk entitas database.

- `Account`
- `Template`
- `Job`
- `Post`
- `Schedule`
- `Credential`
- `Log`

Tipe ini merepresentasikan struktur data yang dipakai di SQLite dan layer repository.

#### `src/types/jobs.ts`

Tipe job untuk internal queue.

- `PostJob` untuk mengirim pesan/post.
- `ReplyJob` untuk membalas pesan.
- `Job` adalah union dari keduanya.

### `src/utils/`

Helper umum.

#### `src/utils/logger.ts`

Logger aplikasi berbasis Winston.

- Memakai level log dari `LOG_LEVEL`.
- Format JSON dengan console transport yang berwarna dan sederhana.

#### `src/utils/crypto.ts`

Utility enkripsi dan hashing.

- Menggunakan AES-256-GCM untuk mengenkripsi credential.
- Key diturunkan dari `JWT_SECRET` via SHA-256.
- `encrypt()` menggabungkan IV, auth tag, dan ciphertext lalu mengubahnya ke base64.
- `decrypt()` membalik proses itu.
- `sha256Hex()` dipakai untuk hashing credential atau input sensitif.

### `src/adapters/`

Lapisan integrasi ke platform pihak ketiga.

#### `src/adapters/IAdapter.ts`

Kontrak umum adapter.

- `connect()`
- `sendMessage()`
- `disconnect()`
- `getRateLimitStatus()`

Semua adapter platform diharapkan mengikuti bentuk ini atau menyediakan alias kompatibel.

#### `src/adapters/whatsapp.ts`

Adapter WhatsApp.

- Mendukung mode `cloud-api` dan `webjs`.
- Menyimpan rate limit sederhana in-memory.
- `connect()` memeriksa token Cloud API atau menyiapkan client `whatsapp-web.js` secara lazy.
- `sendMessage()` mengirim pesan lewat path yang dipilih.
- `getRateLimitStatus()` memberi status kuota.
- Cocok untuk test karena banyak dependency dibuat lazy.

#### `src/adapters/telegram.ts`

Adapter Telegram.

- Menggunakan `telegraf` secara lazy require.
- `connect()` menyiapkan bot.
- `sendMessage()` mengirim pesan ke chat tujuan.
- `replyToMessage()` membalas pesan tertentu.
- `postMessage()` adalah alias kompatibilitas.
- `getRateLimitStatus()` masih placeholder.

#### `src/adapters/threads.ts`

Adapter Threads.

- Memakai token `THREADS_ACCESS_TOKEN`.
- `connect()` mengautentikasi token.
- `postMessage()` dan `replyToMessage()` memakai Graph API Meta.
- `getMessageStatus()` dan `listAccounts()` mengambil data dari API.
- `sendMessage()` adalah alias ke `postMessage()`.

#### `src/adapters/twitter.ts`

Adapter Twitter/X.

- Menggunakan `twitter-api-v2` secara lazy.
- Bisa memakai bearer token atau kombinasi key/secret.
- `sendMessage()` membuat tweet.
- `replyToMessage()` membalas tweet.
- `getRateLimitStatus()` memakai placeholder in-memory.

#### `src/adapters/instagram.ts`

Adapter Instagram.

- Memakai Instagram Graph API sebagai jalur utama.
- Ada feature flag opsional untuk private API fallback.
- `connect()` memeriksa token dan ID akun bisnis Instagram.
- `postMessage()` membuat media container lalu mem-publish ke feed.
- `replyToMessage()` mem-post komentar balasan pada media/comment thread.
- `getMessageStatus()` dan `listAccounts()` mengambil data dari Graph API.
- `sendMessage()` adalah alias ke `postMessage()`.

### `src/repos/`

Lapisan akses database untuk tabel-tabel inti.

#### `src/repos/accountsRepo.ts`

Repository untuk tabel `accounts`.

- `create()` menambah akun baru dengan UUID.
- `findById()` mencari akun per ID.
- `list()` mengambil seluruh akun.
- `delete()` menghapus akun.

#### `src/repos/templatesRepo.ts`

Repository untuk tabel `templates`.

- `create()` menyimpan template beserta daftar variabel JSON.
- `list()` membaca template dan mengubah field `variables` kembali menjadi array.
- `findById()` mengambil satu template.
- `delete()` menghapus template.

#### `src/repos/jobsRepo.ts`

Repository untuk tabel `jobs`.

- `create()` membuat job dengan payload JSON dan status awal `pending`.
- `findById()` mengambil job tertentu.
- `listPending()` membaca semua job yang masih pending.
- `markFailed()` menandai job gagal.

### `src/routes/`

Router Express untuk endpoint HTTP.

#### `src/routes/accounts.ts`

Endpoint untuk akun sosial.

- `GET /v1/accounts` - daftar akun.
- `POST /v1/accounts` - buat akun baru dan enkripsi credential.
- `PUT /v1/accounts/:id` - update akun dengan pendekatan delete lalu insert ulang.
- `DELETE /v1/accounts/:id` - hapus akun.

#### `src/routes/templates.ts`

Endpoint template konten.

- `GET /v1/templates` - daftar template.
- `POST /v1/templates` - buat template baru.
- `POST /v1/templates/import` - import template dari CSV text.
- `PUT /v1/templates/:id` - update template.
- `DELETE /v1/templates/:id` - hapus template.

File ini juga memiliki helper validasi variabel dan parser CSV sederhana.

#### `src/routes/jobs.ts`

Endpoint job dan schedule.

- `POST /v1/jobs/schedule` - membuat schedule berdasarkan cron expression.
- `POST /v1/jobs/trigger` - membuat job manual lalu memasukkannya ke queue.
- `GET /v1/schedules` - daftar schedule aktif.
- `PUT /v1/schedules/:id` - update schedule.
- Mengekspor `defaultJobQueue`, `jobsRouter`, `schedulesRouter`, dan helper cron scheduler.

#### `src/routes/posts.ts`

Router placeholder untuk fitur post yang belum diisi.

- Saat ini hanya mengekspor router kosong.

#### `src/routes/adapters.ts`

Router placeholder untuk endpoint adapter.

- Saat ini juga kosong.

#### `src/routes/webhooks.ts`

Router placeholder untuk webhook callback dari platform eksternal.

- Belum ada route aktif di dalamnya.

### `src/queue/`

Logika antrean job, retry, dan rate limit.

#### `src/queue/job-queue.ts`

Queue job utama.

- Implementasi sekarang dominan in-memory.
- Ada deteksi BullMQ, tetapi path real Redis belum benar-benar diaktifkan di file ini.
- Menyediakan `enqueuePostJob()` dan `enqueueReplyJob()`.
- Mendukung processor callback via `setProcessor()`.
- Jika job gagal, queue memakai retry policy dan rate limiter.
- Job yang tidak berhasil sampai batas akhir masuk ke `dlq`.

#### `src/queue/rate-limiter.ts`

Rate limiter token bucket per platform.

- Memiliki quota untuk `whatsapp`, `telegram`, `twitter`, `threads`, `instagram`, dan `default`.
- `canProceed()` mengecek apakah token tersedia.
- `consume()` mengurangi token.
- `blockFor()` memblokir platform untuk waktu tertentu.
- `waitForToken()` menunggu sampai token tersedia.

#### `src/queue/retry.ts`

Helper retry.

- `computeBackoffDelay()` menghitung delay exponential backoff dengan jitter.
- `isRetryableError()` menentukan error yang layak dicoba ulang.

#### `src/queue/retry-policies.ts`

Kebijakan retry per platform.

- Menentukan `maxRetries`, `baseDelay`, `multiplier`, dan `jitter`.
- Ada policy khusus untuk WhatsApp, Telegram, Twitter, Threads, Instagram, dan default.

### `src/scheduler/`

Scheduler berbasis cron sederhana.

#### `src/scheduler/cron-scheduler.ts`

Scheduler in-memory untuk job terjadwal.

- Menyimpan daftar schedule di array lokal.
- `validateCronExpression()` memeriksa format cron 5 kolom.
- `createSchedule()` menambahkan schedule baru.
- `updateSchedule()` mengubah schedule yang ada.
- `runSchedulerTick()` memeriksa apakah schedule cocok dengan waktu sekarang dan jika ya, menambahkan job ke queue.
- `startCronScheduler()` menjalankan tick tiap 60 detik.
- `stopCronScheduler()` menghentikan interval.

### `src/workers/`

Proses background worker.

#### `src/workers/index.ts`

Bootstrap worker minimal.

- Saat ini hanya menulis log bahwa worker sedang start.
- Belum berisi orkestrasi proses yang lengkap.

#### `src/workers/job-worker.ts`

Processor job yang menghubungkan queue dengan adapter.

- Mendaftarkan processor ke queue.
- Memilih adapter berdasarkan `platform` pada payload job.
- Menangani `PostJob` dan `ReplyJob`.
- Dirancang supaya mudah di-test dengan dependency injection.
- Jika adapter tidak punya method yang dibutuhkan, worker melempar error yang sesuai.

### `src/middleware/`

Saat ini folder ini hanya berisi `.gitkeep`.

- Artinya middleware tambahan belum diimplementasikan.
- Folder disiapkan untuk ekspansi fitur di masa depan.

## Folder `tests/`

### `tests/setup.ts`

Setup global untuk test.

- Mengatur `NODE_ENV=test`.
- Mengarahkan database ke `:memory:`.
- Mengatur secret dummy untuk test.

## Test di `src/`

Test tersebar di beberapa modul sumber.

- `src/adapters/whatsapp.test.ts` - menguji adapter WhatsApp.
- `src/adapters/threads.test.ts` - menguji adapter Threads dengan mock axios.
- `src/adapters/instagram.test.ts` - menguji adapter Instagram dengan mock axios.
- `src/queue/job-queue.test.ts` - menguji enqueue dan processor job.
- `src/queue/rate-limiter.test.ts` - menguji token bucket dan blocking.
- `src/queue/retry.test.ts` - menguji backoff dan retryable error.
- `src/routes/accounts.test.ts` - test dasar crypto dan placeholder route accounts.
- `src/routes/jobs.test.ts` - menguji schedule, trigger, dan scheduler tick.
- `src/routes/templates.test.ts` - test stub untuk templates.
- `src/adapters/*` dan `src/queue/*` adalah area test paling aktif saat ini.

## Folder `dashboard/`

Dashboard adalah aplikasi Next.js terpisah.

### `dashboard/package.json`

Konfigurasi paket dashboard.

- Menggunakan Next.js 14.
- Dependensi utama: `next`, `react`, `react-dom`.
- Script:
  - `dev` - jalankan Next dev server di port `3001`.
  - `build` - build production.
  - `start` - menjalankan hasil build.

### `dashboard/next.config.mjs`

Konfigurasi Next.js.

- Saat ini hanya mengaktifkan `reactStrictMode`.

### `dashboard/tsconfig.json`

Konfigurasi TypeScript khusus dashboard.

- Mode `bundler`.
- Alias `@/*` di-root dashboard.
- `noEmit: true` karena kompilasi di-handle Next.

### `dashboard/app/layout.tsx`

Root layout dashboard.

- Mengimpor stylesheet global.
- Mendefinisikan metadata dasar halaman.
- Menjadi wrapper HTML utama untuk semua page dashboard.

### `dashboard/app/page.tsx`

Halaman utama dashboard.

- Mengecek health endpoint backend di `GET /v1/health`.
- Menampilkan kartu ringkas untuk API health, accounts, templates, dan jobs.
- Menyediakan form UI statis untuk membuat akun, template, dan schedule.
- Saat ini form belum terhubung ke backend, jadi fungsinya masih presentasional.

### `dashboard/app/globals.css`

Styling global dashboard.

- Menentukan warna dasar gelap.
- Menata kartu, button, input, grid, dan layout responsif.
- Masih menggunakan font stack standar.

### `dashboard/src/`

Folder ini ada sebagai scaffold, tetapi isinya masih kosong.

- `dashboard/src/app/accounts/`
- `dashboard/src/app/analytics/`
- `dashboard/src/app/jobs/`
- `dashboard/src/app/schedules/`
- `dashboard/src/app/templates/`
- `dashboard/src/components/ui/`
- `dashboard/src/lib/`

Artinya struktur UI lanjutan sudah disiapkan, tetapi belum ada implementasi di sana.

### `dashboard/public/`

Folder asset statis dashboard.

- Saat ini kosong.

## File Placeholder dan Penanda Folder

Beberapa folder memiliki file `.gitkeep`.

- Fungsinya hanya agar folder tetap ikut tersimpan di git walaupun belum ada file nyata.
- Contoh folder yang masih kosong namun sudah disiapkan: `src/api/`, `src/config/`, `src/middleware/`, `src/workers/`, `src/routes/`, `src/utils/`, `src/queue/`, `migrations/`, `data/`, `tests/`.

## Alur Runtime Singkat

1. `src/index.ts` menjalankan `startServer()`.
2. `src/api/server.ts` memuat konfigurasi, menginisialisasi database, dan menjalankan migrasi.
3. Router Express dipasang untuk accounts, templates, jobs, schedules, adapters, webhooks, dan health check.
4. `JobQueue` diinisialisasi untuk memproses job secara in-memory.
5. `initializeJobWorker()` mendaftarkan processor yang memanggil adapter platform sosial.
6. `startCronScheduler()` mengecek schedule setiap menit dan mengubahnya menjadi job.
7. Dashboard Next.js memanggil health endpoint backend dan menampilkan UI admin sederhana.

## Catatan Penting Tentang Kematangan Project

- Ada beberapa file yang masih placeholder, terutama `src/routes/posts.ts`, `src/routes/adapters.ts`, `src/routes/webhooks.ts`, dan `src/workers/index.ts`.
- Ada dua file migrasi schema dengan model tabel yang berbeda, jadi perlu perhatian jika ingin menganggap satu schema sebagai sumber kebenaran tunggal.
- `README.md` dan `src/config/secrets.ts` belum sepenuhnya sinkron soal daftar environment variable wajib.
- Dashboard saat ini masih UI dasar dan belum benar-benar melakukan CRUD ke backend.
- Root `package.json` yang terbaca di repo ini belum menampilkan script build utama, sementara Dockerfile mengasumsikan build output `dist/` akan tersedia.

## Ringkasan

Secara singkat, project ini adalah engine backend untuk otomasi posting atau pengiriman pesan lintas platform sosial, dengan SQLite sebagai penyimpanan lokal, queue dan scheduler in-memory sebagai fondasi job processing, adapter per platform, dan dashboard Next.js sebagai antarmuka admin.

Jika proyek ini terus dikembangkan, area yang paling logis untuk dilanjutkan adalah:

- menyatukan schema migrasi database,
- melengkapi router yang masih kosong,
- menghubungkan dashboard ke API nyata,
- dan merapikan script build/deploy agar selaras dengan Dockerfile serta Compose.
