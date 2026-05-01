'use client'

import { useEffect, useMemo, useState } from 'react'

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://127.0.0.1:3456'

function isFacebookPlatform(platform: string) {
  return platform === 'facebook' || platform === 'facebook-page'
}

const FACEBOOK_ACCOUNT_HELP_TEXT =
  'Paste a Facebook session cookie string here. Do not enter a Page ID, a Page Access Token, or a personal password.'

const INTEGRATION_FIELDS = [
  { key: 'WHATSAPP_CLOUD_API_TOKEN', label: 'WhatsApp Cloud API Token', placeholder: 'EAA...' },
  { key: 'TELEGRAM_BOT_TOKEN', label: 'Telegram Bot Token', placeholder: '123456:ABC...' },
  { key: 'THREADS_ACCESS_TOKEN', label: 'Threads Access Token', placeholder: 'threads token' },
  {
    key: 'TWITTER_BEARER_TOKEN',
    label: 'Twitter Bearer Token',
    placeholder: 'twitter bearer token',
  },
  { key: 'TWITTER_API_KEY', label: 'Twitter API Key', placeholder: 'twitter api key' },
  { key: 'TWITTER_API_SECRET', label: 'Twitter API Secret', placeholder: 'twitter api secret' },
  {
    key: 'INSTAGRAM_ACCESS_TOKEN',
    label: 'Instagram Access Token',
    placeholder: 'instagram token',
  },
  {
    key: 'INSTAGRAM_BUSINESS_ACCOUNT_ID',
    label: 'Instagram Business Account ID',
    placeholder: 'instagram business id',
  },
  {
    key: 'INSTAGRAM_ALLOW_PRIVATE_API',
    label: 'Instagram Allow Private API',
    placeholder: 'true or false',
  },
  { key: 'WHATSAPP_WEBJS_API_KEY', label: 'WhatsApp WebJS API Key', placeholder: 'optional' },
] as const

type FieldKey = (typeof INTEGRATION_FIELDS)[number]['key']
type ConfiguredMap = Partial<Record<FieldKey, boolean>>

type AccountFormState = {
  platform: string
  username: string
  credentials: string
  facebookCookie: string
}

type TemplateFormState = {
  name: string
  content: string
  variables: string
  type: string
}

type JobFormState = {
  cron: string
  templateId: string
  accountId: string
  recipient: string
  platform: string
  message: string
}

type CampaignFormState = {
  name: string
  content: string
  cta_link: string
  platforms: string[] // Array of selected platforms
}

type FacebookCampaignFormState = {
  name: string
  content: string
  cta_link: string
}

function makeEmptyForm() {
  return INTEGRATION_FIELDS.reduce(
    (acc, field) => {
      acc[field.key] = ''
      return acc
    },
    {} as Record<FieldKey, string>
  )
}

export default function Page() {
  const [health, setHealth] = useState<{ status?: string }>({ status: 'loading' })
  const [configured, setConfigured] = useState<ConfiguredMap>({})
  const [form, setForm] = useState<Record<FieldKey, string>>(makeEmptyForm())
  const [message, setMessage] = useState('')
  const [accountForm, setAccountForm] = useState<AccountFormState>({
    platform: 'whatsapp',
    username: 'test_account',
    credentials: 'secret-token',
    facebookCookie: '',
  })
  const [templateForm, setTemplateForm] = useState<TemplateFormState>({
    name: 'Promo',
    content: 'Check this out {link}',
    variables: 'link',
    type: 'template',
  })
  const [jobForm, setJobForm] = useState<JobFormState>({
    cron: '* * * * *',
    templateId: '',
    accountId: '',
    recipient: '',
    platform: 'whatsapp',
    message: 'Halo dari dashboard',
  })
  const [createdAccountId, setCreatedAccountId] = useState<string>('')
  const [createdTemplateId, setCreatedTemplateId] = useState<string>('')
  const [actionState, setActionState] = useState<string>('')
  const [accounts, setAccounts] = useState<
    Array<{ id: string; platform: string; username?: string; status?: string }>
  >([])
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; type: string }>>([])
  const [campaignForm, setCampaignForm] = useState<CampaignFormState>({
    name: 'Summer Sale',
    content: 'Check out our summer sale! Limited time offer.',
    cta_link: 'https://wa.me/62812345678',
    platforms: ['twitter', 'threads'],
  })
  const [facebookCampaignForm, setFacebookCampaignForm] = useState<FacebookCampaignFormState>({
    name: 'Facebook Promo',
    content: 'Halo Facebook Page! Ada promo baru yang siap jalan.',
    cta_link: 'https://example.com',
  })
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; status: string }>>(
    []
  )
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('')
  const [facebookCampaignId, setFacebookCampaignId] = useState<string>('')
  const [facebookAccountId, setFacebookAccountId] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      try {
        const [healthResponse, settingsResponse] = await Promise.all([
          fetch(`${API_BASE}/v1/health`, { cache: 'no-store' }).then((res) => res.json()),
          fetch(`${API_BASE}/v1/settings/integrations`, { cache: 'no-store' }).then((res) =>
            res.json()
          ),
        ])
        setHealth(healthResponse)
        setConfigured(settingsResponse?.configured ?? {})
        await refreshCollections()
      } catch {
        setHealth({ status: 'offline' })
      }
    }

    void load()
  }, [])

  // Auto-refresh collections periodically so dashboard updates without manual reload
  useEffect(() => {
    const id = setInterval(() => {
      void refreshCollections()
    }, 10000)
    return () => clearInterval(id)
  }, [])

  async function refreshCollections() {
    try {
      const [accountsResponse, templatesResponse, campaignsResponse] = await Promise.all([
        fetch(`${API_BASE}/v1/accounts`, { cache: 'no-store' }).then((res) => res.json()),
        fetch(`${API_BASE}/v1/templates`, { cache: 'no-store' }).then((res) => res.json()),
        fetch(`${API_BASE}/v1/campaigns`, { cache: 'no-store' }).then((res) => res.json()),
      ])
      setAccounts(Array.isArray(accountsResponse) ? accountsResponse : [])
      setTemplates(Array.isArray(templatesResponse) ? templatesResponse : [])
      setCampaigns(Array.isArray(campaignsResponse) ? campaignsResponse : [])
      const facebookAccounts = Array.isArray(accountsResponse)
        ? accountsResponse.filter((account: { platform?: string }) =>
            isFacebookPlatform(String(account?.platform ?? ''))
          )
        : []
      if (!facebookAccountId && facebookAccounts.length > 0) {
        setFacebookAccountId(facebookAccounts[0].id)
      }
      if (!createdAccountId && Array.isArray(accountsResponse) && accountsResponse.length > 0) {
        setCreatedAccountId(accountsResponse[0].id)
      }
      if (!createdTemplateId && Array.isArray(templatesResponse) && templatesResponse.length > 0) {
        setCreatedTemplateId(templatesResponse[0].id)
      }
      if (!selectedCampaignId && Array.isArray(campaignsResponse) && campaignsResponse.length > 0) {
        setSelectedCampaignId(campaignsResponse[0].id)
      }
    } catch {
      setAccounts([])
      setTemplates([])
      setCampaigns([])
    }
  }

  const configuredCount = useMemo(
    () => Object.values(configured).filter(Boolean).length,
    [configured]
  )

  const facebookAccounts = useMemo(
    () => accounts.filter((account) => isFacebookPlatform(account.platform)),
    [accounts]
  )

  async function saveTokens() {
    setMessage('Saving...')
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, value]) => value.trim().length > 0)
    )

    try {
      const response = await fetch(`${API_BASE}/v1/settings/integrations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error('Failed to save tokens')
      }
      const data = await response.json()
      setConfigured(data.configured ?? {})
      setForm(makeEmptyForm())
      setMessage('Saved. You can now use the platform adapters without restarting.')
    } catch (error: any) {
      setMessage(error?.message ?? 'Failed to save tokens')
    }
  }

  async function createAccount() {
    setActionState('Creating account...')
    try {
      const credentials = isFacebookPlatform(accountForm.platform)
        ? accountForm.facebookCookie.trim()
        : accountForm.credentials

      if (isFacebookPlatform(accountForm.platform)) {
        if (!accountForm.facebookCookie.trim()) {
          throw new Error('Facebook session cookie is required')
        }
      } else if (!accountForm.credentials.trim()) {
        throw new Error('Credential is required')
      }

      const response = await fetch(`${API_BASE}/v1/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: accountForm.platform,
          username: accountForm.username,
          credentials,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to create account')
      }
      setCreatedAccountId(data.id)
      if (isFacebookPlatform(accountForm.platform)) {
        setFacebookAccountId(data.id)
      }
      setJobForm((current) => ({ ...current, accountId: data.id, platform: accountForm.platform }))
      setActionState(`Account created: ${data.id}`)
      await refreshCollections()
    } catch (error: any) {
      setActionState(error?.message ?? 'Failed to create account')
    }
  }

  async function createTemplate() {
    setActionState('Creating template...')
    try {
      const variables = templateForm.variables
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      const response = await fetch(`${API_BASE}/v1/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateForm.name,
          content: templateForm.content,
          variables,
          type: templateForm.type,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to create template')
      }
      setCreatedTemplateId(data.id)
      setJobForm((current) => ({ ...current, templateId: data.id }))
      setActionState(`Template created: ${data.id}`)
      await refreshCollections()
    } catch (error: any) {
      setActionState(error?.message ?? 'Failed to create template')
    }
  }

  async function scheduleJob() {
    setActionState('Scheduling job...')
    try {
      const response = await fetch(`${API_BASE}/v1/jobs/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cron: jobForm.cron,
          template_id: jobForm.templateId || createdTemplateId,
          account_id: jobForm.accountId || createdAccountId,
          to: jobForm.recipient,
          platform: jobForm.platform,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to schedule job')
      }
      setActionState(`Job scheduled: ${data.id ?? data.cron ?? 'ok'}`)
    } catch (error: any) {
      setActionState(error?.message ?? 'Failed to schedule job')
    }
  }

  async function blastNow() {
    setActionState('Triggering blast...')
    try {
      const response = await fetch(`${API_BASE}/v1/jobs/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: jobForm.templateId || createdTemplateId,
          account_id: jobForm.accountId || createdAccountId,
          to: jobForm.recipient,
          platform: jobForm.platform,
          message: jobForm.message,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to trigger blast')
      }
      setActionState(`Blast triggered: ${data.job_id}`)
    } catch (error: any) {
      setActionState(error?.message ?? 'Failed to trigger blast')
    }
  }

  async function createCampaign() {
    setActionState('Creating campaign...')
    try {
      const response = await fetch(`${API_BASE}/v1/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignForm.name,
          content: campaignForm.content,
          cta_link: campaignForm.cta_link,
          platforms: campaignForm.platforms,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to create campaign')
      }
      setSelectedCampaignId(data.id)
      setActionState(`Campaign created: ${data.id}`)
      await refreshCollections()
    } catch (error: any) {
      setActionState(error?.message ?? 'Failed to create campaign')
    }
  }

  async function createFacebookCampaign() {
    setActionState('Creating Facebook campaign...')
    try {
      const response = await fetch(`${API_BASE}/v1/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: facebookCampaignForm.name,
          content: facebookCampaignForm.content,
          cta_link: facebookCampaignForm.cta_link,
          platforms: ['facebook'],
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to create Facebook campaign')
      }
      setFacebookCampaignId(data.id)
      setSelectedCampaignId(data.id)
      setActionState(`Facebook campaign created: ${data.id}`)
      await refreshCollections()
    } catch (error: any) {
      setActionState(error?.message ?? 'Failed to create Facebook campaign')
    }
  }

  async function blastFacebookCampaign() {
    setActionState('Blasting Facebook campaign...')
    try {
      const targetCampaignId = facebookCampaignId || selectedCampaignId
      if (!targetCampaignId) {
        throw new Error('No Facebook campaign selected')
      }
      if (!facebookAccountId) {
        throw new Error('No Facebook Page account selected')
      }
      const response = await fetch(`${API_BASE}/v1/campaigns/${targetCampaignId}/blast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_ids: {
            facebook: facebookAccountId,
          },
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to blast Facebook campaign')
      }
      setActionState(`Facebook campaign blasted: ${data.campaign_id ?? 'ok'}`)
      await refreshCollections()
    } catch (error: any) {
      setActionState(error?.message ?? 'Failed to blast Facebook campaign')
    }
  }

  async function blastCampaign() {
    setActionState('Blasting campaign...')
    try {
      if (!selectedCampaignId) {
        throw new Error('No campaign selected')
      }
      const selectedCampaign = campaigns.find((campaign: any) => campaign.id === selectedCampaignId)
      const targetPlatforms =
        Array.isArray((selectedCampaign as any)?.platforms) &&
        (selectedCampaign as any).platforms.length > 0
          ? ((selectedCampaign as any).platforms as string[])
          : campaignForm.platforms
      const accountIds = targetPlatforms.reduce<Record<string, string>>((acc, platform) => {
        if (platform === 'facebook') {
          if (!facebookAccountId) {
            throw new Error('Select a Facebook Page account before blasting')
          }
          acc.facebook = facebookAccountId
          return acc
        }
        acc[platform] = createdAccountId
        return acc
      }, {})
      const response = await fetch(`${API_BASE}/v1/campaigns/${selectedCampaignId}/blast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_ids: accountIds }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to blast campaign')
      }
      setActionState(`Campaign blasted: ${data.campaign_id ?? 'ok'}`)
      await refreshCollections()
    } catch (error: any) {
      setActionState(error?.message ?? 'Failed to blast campaign')
    }
  }

  return (
    <main className="shell">
      <h1>Admin Dashboard</h1>
      <p className="muted">API: {API_BASE}</p>

      <div className="grid">
        <section className="card">
          <h2>API Health</h2>
          <p>
            Status: <strong>{health.status ?? 'unknown'}</strong>
          </p>
          <a className="button" href={`${API_BASE}/v1/health`} target="_blank" rel="noreferrer">
            Open health endpoint
          </a>
        </section>

        <section className="card">
          <h2>Integration Tokens</h2>
          <p className="muted">
            Configured: {configuredCount}/{INTEGRATION_FIELDS.length}
          </p>
          <p className="muted">Isi token di sini. Field kosong tidak menimpa data lama.</p>
        </section>

        <section className="card">
          <h2>Accounts</h2>
          <p className="muted">Manage social accounts and credentials.</p>
          <a className="button" href="#accounts">
            Go
          </a>
        </section>

        <section className="card">
          <h2>Templates</h2>
          <p className="muted">Create reusable content templates.</p>
          <a className="button" href="#templates">
            Go
          </a>
        </section>

        <section className="card">
          <h2>Campaigns</h2>
          <p className="muted">Create and blast marketing campaigns.</p>
          <a className="button" href="#jobs">
            Go
          </a>
        </section>

        <section className="card">
          <h2>Blast Runner</h2>
          <p className="muted">Multi-platform auto blast with randomized actions.</p>
          <a className="button" href="/blast-runner">
            Open
          </a>
        </section>

        <section className="card">
          <h2>Jobs (Legacy)</h2>
          <p className="muted">Schedule and trigger posts (old flow).</p>
          <a className="button" href="#jobs-old">
            Go
          </a>
        </section>
      </div>

      <div style={{ marginTop: 24 }} className="row">
        <section className="card" style={{ gridColumn: '1 / -1' }}>
          <h2>Save Integration Tokens</h2>
          <p className="muted">
            Token disimpan terenkripsi di database lokal dan dibaca backend saat adapter dipakai.
          </p>
          <div className="grid">
            {INTEGRATION_FIELDS.map((field) => (
              <label key={field.key}>
                {field.label}
                <input
                  className="input"
                  type="password"
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                />
                <small className="muted">
                  Status: {configured[field.key] ? 'saved' : 'not set'}
                </small>
              </label>
            ))}
          </div>
          <button className="button" type="button" onClick={saveTokens}>
            Save Tokens
          </button>
          {message ? <p className="muted">{message}</p> : null}
        </section>

        <section id="accounts" className="card">
          <h2>Create Account</h2>
          <p className="muted">
            For Facebook, paste the full browser session cookie string. The cookie is stored
            encrypted and used to authenticate with m.facebook.com.
          </p>
          <label>Platform</label>
          <select
            className="select"
            value={accountForm.platform}
            onChange={(event) =>
              setAccountForm((current) => ({ ...current, platform: event.target.value }))
            }
          >
            <option value="telegram">telegram</option>
            <option value="whatsapp">whatsapp</option>
            <option value="twitter">twitter</option>
            <option value="threads">threads</option>
            <option value="instagram">instagram</option>
            <option value="facebook">facebook</option>
            <option value="facebook-page">facebook-page</option>
          </select>
          <label>Username</label>
          <input
            className="input"
            value={accountForm.username}
            onChange={(event) =>
              setAccountForm((current) => ({ ...current, username: event.target.value }))
            }
          />
          {isFacebookPlatform(accountForm.platform) ? (
            <>
              <small className="muted">
                Use the full Facebook session cookie string from a logged-in browser session. It
                should include values like <strong>c_user</strong>, <strong>xs</strong>, and
                <strong>datr</strong>.
              </small>
              <label>Facebook Session Cookie</label>
              <textarea
                className="input"
                rows={4}
                placeholder="c_user=...; xs=...; datr=...; sb=..."
                value={accountForm.facebookCookie}
                onChange={(event) =>
                  setAccountForm((current) => ({
                    ...current,
                    facebookCookie: event.target.value,
                  }))
                }
              />
              <small className="muted">
                Paste the cookie exactly as copied from the browser. Do not trim away parts of the
                string.
              </small>
              <small className="muted">{FACEBOOK_ACCOUNT_HELP_TEXT}</small>
            </>
          ) : (
            <>
              <label>Credential</label>
              <input
                className="input"
                value={accountForm.credentials}
                onChange={(event) =>
                  setAccountForm((current) => ({ ...current, credentials: event.target.value }))
                }
              />
            </>
          )}
          <button className="button" type="button" onClick={createAccount}>
            Save
          </button>
          <p className="muted">Latest account ID: {createdAccountId || 'none'}</p>
        </section>

        <section id="templates" className="card">
          <h2>Create Template</h2>
          <label>Name</label>
          <input
            className="input"
            value={templateForm.name}
            onChange={(event) =>
              setTemplateForm((current) => ({ ...current, name: event.target.value }))
            }
          />
          <label>Content</label>
          <textarea
            className="textarea"
            rows={4}
            value={templateForm.content}
            onChange={(event) =>
              setTemplateForm((current) => ({ ...current, content: event.target.value }))
            }
          />
          <label>Variables</label>
          <input
            className="input"
            value={templateForm.variables}
            onChange={(event) =>
              setTemplateForm((current) => ({ ...current, variables: event.target.value }))
            }
          />
          <label>Type</label>
          <input
            className="input"
            value={templateForm.type}
            onChange={(event) =>
              setTemplateForm((current) => ({ ...current, type: event.target.value }))
            }
          />
          <button className="button" type="button" onClick={createTemplate}>
            Save
          </button>
          <p className="muted">Latest template ID: {createdTemplateId || 'none'}</p>
        </section>

        <section id="jobs" className="card">
          <h2>Create Campaign & Blast</h2>
          <h3>Facebook Page Blast</h3>
          <p className="muted">
            This path is for Facebook Pages only and expects a Facebook Page account created in the
            Accounts section.
          </p>
          <label>Facebook Page Account</label>
          <select
            className="select"
            value={facebookAccountId}
            onChange={(event) => setFacebookAccountId(event.target.value)}
          >
            <option value="">Select a Facebook Page account</option>
            {facebookAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.username ?? account.id} ({account.platform})
              </option>
            ))}
          </select>
          <small className="muted">
            Select the Facebook Page account created above. If the list is empty, create the Page
            account first by entering the Page ID and Page Access Token.
          </small>
          <label>Campaign Name</label>
          <input
            className="input"
            value={facebookCampaignForm.name}
            onChange={(event) =>
              setFacebookCampaignForm((current) => ({ ...current, name: event.target.value }))
            }
          />
          <label>Campaign Content</label>
          <textarea
            className="textarea"
            rows={3}
            value={facebookCampaignForm.content}
            onChange={(event) =>
              setFacebookCampaignForm((current) => ({ ...current, content: event.target.value }))
            }
          />
          <label>CTA Link</label>
          <input
            className="input"
            value={facebookCampaignForm.cta_link}
            onChange={(event) =>
              setFacebookCampaignForm((current) => ({ ...current, cta_link: event.target.value }))
            }
          />
          <div className="row">
            <button className="button" type="button" onClick={createFacebookCampaign}>
              Create Facebook Campaign
            </button>
            <button className="button" type="button" onClick={blastFacebookCampaign}>
              Blast Facebook Campaign
            </button>
          </div>
          <p className="muted">Selected Facebook campaign: {facebookCampaignId || 'none'}</p>
          <hr style={{ borderColor: '#334155', margin: '20px 0' }} />
          <label>Campaign Name</label>
          <input
            className="input"
            value={campaignForm.name}
            onChange={(event) =>
              setCampaignForm((current) => ({ ...current, name: event.target.value }))
            }
          />
          <label>Campaign Content</label>
          <textarea
            className="textarea"
            rows={3}
            value={campaignForm.content}
            onChange={(event) =>
              setCampaignForm((current) => ({ ...current, content: event.target.value }))
            }
          />
          <label>CTA Link</label>
          <input
            className="input"
            value={campaignForm.cta_link}
            onChange={(event) =>
              setCampaignForm((current) => ({ ...current, cta_link: event.target.value }))
            }
          />
          <label>Platforms</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {['twitter', 'threads', 'instagram', 'facebook'].map((platform) => (
              <label key={platform} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="checkbox"
                  checked={campaignForm.platforms.includes(platform)}
                  onChange={(event) => {
                    const platforms = campaignForm.platforms.includes(platform)
                      ? campaignForm.platforms.filter((p) => p !== platform)
                      : [...campaignForm.platforms, platform]
                    setCampaignForm((current) => ({ ...current, platforms }))
                  }}
                />
                {platform}
              </label>
            ))}
          </div>
          <div className="row">
            <button className="button" type="button" onClick={createCampaign}>
              Create Campaign
            </button>
            <button className="button" type="button" onClick={blastCampaign}>
              Blast Campaign
            </button>
          </div>
          <p className="muted">Selected campaign: {selectedCampaignId || 'none'}</p>
        </section>

        <section id="jobs-old" className="card">
          <h2>Blast / Schedule Job (Legacy)</h2>
          <label>Cron</label>
          <input
            className="input"
            value={jobForm.cron}
            onChange={(event) =>
              setJobForm((current) => ({ ...current, cron: event.target.value }))
            }
          />
          <label>Template ID</label>
          <input
            className="input"
            value={jobForm.templateId}
            onChange={(event) =>
              setJobForm((current) => ({ ...current, templateId: event.target.value }))
            }
          />
          <label>Account ID</label>
          <input
            className="input"
            value={jobForm.accountId}
            onChange={(event) =>
              setJobForm((current) => ({ ...current, accountId: event.target.value }))
            }
          />
          <label>Recipient / Target</label>
          <input
            className="input"
            value={jobForm.recipient}
            onChange={(event) =>
              setJobForm((current) => ({ ...current, recipient: event.target.value }))
            }
          />
          <label>Platform</label>
          <select
            className="select"
            value={jobForm.platform}
            onChange={(event) =>
              setJobForm((current) => ({ ...current, platform: event.target.value }))
            }
          >
            <option value="whatsapp">whatsapp</option>
            <option value="telegram">telegram</option>
            <option value="twitter">twitter</option>
            <option value="threads">threads</option>
            <option value="instagram">instagram</option>
          </select>
          <label>Message</label>
          <textarea
            className="textarea"
            rows={3}
            value={jobForm.message}
            onChange={(event) =>
              setJobForm((current) => ({ ...current, message: event.target.value }))
            }
          />
          <div className="row">
            <button className="button" type="button" onClick={scheduleJob}>
              Schedule
            </button>
            <button className="button" type="button" onClick={blastNow}>
              Blast now
            </button>
          </div>
        </section>

        <section className="card" style={{ gridColumn: '1 / -1' }}>
          <h2>Current Records</h2>
          <div className="grid">
            <div>
              <h3>Accounts</h3>
              <ul>
                {accounts.slice(0, 5).map((account) => (
                  <li key={account.id}>
                    {account.platform} - {account.username ?? account.id} -{' '}
                    {account.status ?? 'active'}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Templates</h3>
              <ul>
                {templates.slice(0, 5).map((template) => (
                  <li key={template.id}>
                    {template.name} - {template.type}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {actionState ? <p className="muted">{actionState}</p> : null}
        </section>
      </div>
    </main>
  )
}
