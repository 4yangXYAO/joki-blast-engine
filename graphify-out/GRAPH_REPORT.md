# Graph Report - .  (2026-04-26)

## Corpus Check
- Corpus is ~20,858 words - fits in a single context window. You may not need a graph.

## Summary
- 243 nodes · 317 edges · 16 communities detected
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Social Adapters|Social Adapters]]
- [[_COMMUNITY_Job Processing|Job Processing]]
- [[_COMMUNITY_Job Processing|Job Processing]]
- [[_COMMUNITY_Job Processing|Job Processing]]
- [[_COMMUNITY_Social Adapters|Social Adapters]]
- [[_COMMUNITY_Social Adapters|Social Adapters]]
- [[_COMMUNITY_Project Structure|Project Structure]]
- [[_COMMUNITY_Project Structure|Project Structure]]
- [[_COMMUNITY_Social Adapters|Social Adapters]]
- [[_COMMUNITY_Social Adapters|Social Adapters]]
- [[_COMMUNITY_Telegram Integrations|Telegram Integrations]]
- [[_COMMUNITY_Telegram Integrations|Telegram Integrations]]
- [[_COMMUNITY_Database Layer|Database Layer]]
- [[_COMMUNITY_Job Processing|Job Processing]]
- [[_COMMUNITY_Configuration|Configuration]]
- [[_COMMUNITY_Project Structure|Project Structure]]

## God Nodes (most connected - your core abstractions)
1. `getDb()` - 16 edges
2. `InstagramAdapter` - 14 edges
3. `ThreadsAdapter` - 14 edges
4. `InstagramCookieAdapter` - 10 edges
5. `ThreadsCookieAdapter` - 9 edges
6. `TwitterCookieAdapter` - 9 edges
7. `TwitterAdapter` - 9 edges
8. `TelegramMTProtoAdapter` - 8 edges
9. `TelegramAdapter` - 8 edges
10. `WhatsAppAdapter` - 8 edges

## Surprising Connections (you probably didn't know these)
- `startServer()` --calls--> `startCronScheduler()`  [INFERRED]
  C:\Users\Administrator\joki-blast-engine\src\api\server.ts → C:\Users\Administrator\joki-blast-engine\src\scheduler\cron-scheduler.ts
- `main()` --calls--> `initDatabase()`  [INFERRED]
  C:\Users\Administrator\joki-blast-engine\scripts\db-init.ts → C:\Users\Administrator\joki-blast-engine\src\db\sqlite.ts
- `main()` --calls--> `initSqlJsDatabase()`  [INFERRED]
  C:\Users\Administrator\joki-blast-engine\scripts\db-init.ts → C:\Users\Administrator\joki-blast-engine\src\db\sqlite.ts
- `main()` --calls--> `runMigrations()`  [INFERRED]
  C:\Users\Administrator\joki-blast-engine\scripts\db-init.ts → C:\Users\Administrator\joki-blast-engine\src\db\sqlite.ts
- `main()` --calls--> `closeDatabase()`  [INFERRED]
  C:\Users\Administrator\joki-blast-engine\scripts\db-init.ts → C:\Users\Administrator\joki-blast-engine\src\db\sqlite.ts

## Communities

### Community 0 - "Social Adapters"
Cohesion: 0.16
Nodes (4): createHttpClient(), parseCookies(), ThreadsCookieAdapter, TwitterCookieAdapter

### Community 1 - "Job Processing"
Cohesion: 0.13
Nodes (4): AccountsRepo, JobsRepo, getDb(), TemplatesRepo

### Community 2 - "Job Processing"
Cohesion: 0.17
Nodes (12): startCronScheduler(), ensureDir(), main(), initializeJobWorker(), main(), createServer(), startServer(), closeDatabase() (+4 more)

### Community 3 - "Job Processing"
Cohesion: 0.18
Nodes (5): JobQueue, RateLimiter, computeBackoffDelay(), isRetryableError(), getPolicyForPlatform()

### Community 4 - "Social Adapters"
Cohesion: 0.24
Nodes (1): InstagramAdapter

### Community 5 - "Social Adapters"
Cohesion: 0.23
Nodes (1): ThreadsAdapter

### Community 6 - "Project Structure"
Cohesion: 0.2
Nodes (3): cronMatchesDate(), runSchedulerTick(), validateCronExpression()

### Community 7 - "Project Structure"
Cohesion: 0.25
Nodes (2): validateSchema(), WhatsAppAdapter

### Community 8 - "Social Adapters"
Cohesion: 0.33
Nodes (1): InstagramCookieAdapter

### Community 9 - "Social Adapters"
Cohesion: 0.31
Nodes (1): TwitterAdapter

### Community 10 - "Telegram Integrations"
Cohesion: 0.39
Nodes (1): TelegramMTProtoAdapter

### Community 11 - "Telegram Integrations"
Cohesion: 0.33
Nodes (1): TelegramAdapter

### Community 12 - "Database Layer"
Cohesion: 0.43
Nodes (1): RuntimeSettingsRepo

### Community 13 - "Job Processing"
Cohesion: 0.33
Nodes (2): createSchedulesRouter(), startApp()

### Community 14 - "Configuration"
Cohesion: 0.6
Nodes (4): decrypt(), deriveKey(), encrypt(), getSecret()

### Community 16 - "Project Structure"
Cohesion: 1.0
Nodes (2): makeEmptyForm(), Page()

## Knowledge Gaps
- **Thin community `Social Adapters`** (15 nodes): `InstagramAdapter`, `.authenticate()`, `.connect()`, `.constructor()`, `.disconnect()`, `.getMessageStatus()`, `.getRateLimitStatus()`, `.isAuthenticated()`, `.listAccounts()`, `.log()`, `.maybeDrainRate()`, `.postMessage()`, `.replyToMessage()`, `.sendMessage()`, `instagram.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Social Adapters`** (15 nodes): `threads.ts`, `ThreadsAdapter`, `.authenticate()`, `.connect()`, `.constructor()`, `.disconnect()`, `.getMessageStatus()`, `.getRateLimitStatus()`, `.isAuthenticated()`, `.listAccounts()`, `.log()`, `.maybeDrainRate()`, `.postMessage()`, `.replyToMessage()`, `.sendMessage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Project Structure`** (11 nodes): `validateSchema()`, `db-validate.ts`, `whatsapp.ts`, `WhatsAppAdapter`, `.connect()`, `.constructor()`, `.disconnect()`, `.getRateLimitStatus()`, `.log()`, `.maybeDrainRate()`, `.sendMessage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Social Adapters`** (11 nodes): `InstagramCookieAdapter`, `.connect()`, `.constructor()`, `.disconnect()`, `.extractCsrf()`, `.getRateLimitStatus()`, `.log()`, `.maybeDrainRate()`, `.replyToMessage()`, `.sendMessage()`, `instagram-cookie.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Social Adapters`** (10 nodes): `twitter.ts`, `TwitterAdapter`, `.connect()`, `.constructor()`, `.disconnect()`, `.getRateLimitStatus()`, `.log()`, `.maybeDrainRate()`, `.replyToMessage()`, `.sendMessage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Telegram Integrations`** (9 nodes): `telegram-mtproto.ts`, `TelegramMTProtoAdapter`, `.connect()`, `.constructor()`, `.disconnect()`, `.getRateLimitStatus()`, `.log()`, `.replyToMessage()`, `.sendMessage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Telegram Integrations`** (9 nodes): `telegram.ts`, `TelegramAdapter`, `.connect()`, `.constructor()`, `.disconnect()`, `.getRateLimitStatus()`, `.postMessage()`, `.replyToMessage()`, `.sendMessage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Layer`** (8 nodes): `RuntimeSettingsRepo`, `.constructor()`, `.getDatabase()`, `.getRow()`, `.getStatuses()`, `.getValue()`, `.upsertMany()`, `runtimeSettingsRepo.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Job Processing`** (6 nodes): `createJobsRouter()`, `createSchedulesRouter()`, `getJobsRepo()`, `startApp()`, `jobs.test.ts`, `jobs.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Project Structure`** (3 nodes): `page.tsx`, `makeEmptyForm()`, `Page()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getDb()` connect `Job Processing` to `Job Processing`, `Database Layer`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `createHttpClient()` connect `Social Adapters` to `Social Adapters`, `Job Processing`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `getDb()` (e.g. with `.create()` and `.findById()`) actually correct?**
  _`getDb()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Should `Job Processing` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._