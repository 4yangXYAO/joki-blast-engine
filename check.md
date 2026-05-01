# Detailed Project Diagram

```mermaid
flowchart TD
	U[Admin / Operator] --> DASH[Dashboard UI / Next.js]
	DASH --> API[HTTP API Routes]

	API --> SET[Runtime Settings API]
	API --> ACC[Accounts API]
	API --> TMP[Templates API]
	API --> JOB[Jobs API]
	API --> CAM[Campaigns API]

	SET --> RSR[RuntimeSettingsRepo]
	ACC --> ARR[AccountsRepo]
	TMP --> TPR[TemplatesRepo]
	JOB --> JPR[JobsRepo]
	CAM --> CPR[CampaignsRepo]

	RSR --> DB[(SQLite / sql.js fallback)]
	ARR --> DB
	TPR --> DB
	JPR --> DB
	CPR --> DB

	API --> Q[Job Queue]
	Q --> W[Worker / Job Executor]

	W --> SEL{Job Type}
	SEL -->|CommentJob| CMT[Facebook Comment Action]
	SEL -->|ChatJob| CHAT[Facebook Chat Action]
	SEL -->|PostJob| PST[Facebook / Platform Post Action]
	SEL -->|Campaign Job| CMP[Campaign Orchestrator]

	CMT --> FB1[Facebook comment.ts]
	CHAT --> FB2[Facebook chat.ts]
	PST --> FB3[FacebookAdapter / facebook.ts]
	CMP --> Q

	FB1 --> HTTP[HTTP Client + Cookies Parser]
	FB2 --> HTTP
	FB3 --> HTTP

	HTTP --> FB[Facebook Internal Endpoints]

	FB1 --> LOG[Logging / logs table]
	FB2 --> LOG
	FB3 --> LOG
	W --> LOG
	LOG --> DB

	DASH --> HEALTH[API Health / Status Card]
	HEALTH --> API

	DASH --> CFG[Integration Tokens]
	CFG --> RSR

	DASH --> ACT[Create Account / Template / Job]
	ACT --> ARR
	ACT --> TPR
	ACT --> JPR

	FB1 -. uses .-> AUTH[Cookie Session + CSRF Tokens]
	FB2 -. uses .-> AUTH
	FB3 -. uses .-> AUTH
	AUTH -. stored in .-> ARR

	subgraph Core[Root Backend]
		API
		RSR
		ARR
		TPR
		JPR
		CPR
		Q
		W
		LOG
	end

	subgraph Surface[Dashboard Surface]
		DASH
		HEALTH
		CFG
		ACT
	end
```

## Diagram Notes

- `Dashboard UI` is the user-facing surface in `dashboard/`.
- `HTTP API Routes` create and manage settings, accounts, templates, campaigns, and jobs.
- `RuntimeSettingsRepo` stores runtime/integration tokens such as WhatsApp, Telegram, Threads, Twitter, and Instagram.
- `AccountsRepo` stores encrypted account credentials, including Facebook cookie-based accounts.
- `Job Queue` hands work to the `Worker / Job Executor`.
- The worker selects the correct action based on job type: `CommentJob`, `ChatJob`, `PostJob`, or campaign-related jobs.
- Facebook actions use the existing cookie-based helpers and adapters in `src/adapters/providers/meta/facebook/`.
- All execution results are written to the `logs` table and persisted in SQLite.

## Execution Flow

1. Operator uses the dashboard to save settings, create accounts, create templates, and enqueue jobs.
2. API routes persist data through repository classes.
3. The queue receives a job and the worker picks it up.
4. The worker loads encrypted credentials, resolves the adapter or helper, and executes the action.
5. The adapter fetches tokens from Facebook, sends the request, and returns success or failure.
6. The worker writes logs and updates job/campaign status in the database.
