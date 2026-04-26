"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:3456";

const INTEGRATION_FIELDS = [
  { key: "WHATSAPP_CLOUD_API_TOKEN", label: "WhatsApp Cloud API Token", placeholder: "EAA..." },
  { key: "TELEGRAM_BOT_TOKEN", label: "Telegram Bot Token", placeholder: "123456:ABC..." },
  { key: "THREADS_ACCESS_TOKEN", label: "Threads Access Token", placeholder: "threads token" },
  { key: "TWITTER_BEARER_TOKEN", label: "Twitter Bearer Token", placeholder: "twitter bearer token" },
  { key: "TWITTER_API_KEY", label: "Twitter API Key", placeholder: "twitter api key" },
  { key: "TWITTER_API_SECRET", label: "Twitter API Secret", placeholder: "twitter api secret" },
  { key: "INSTAGRAM_ACCESS_TOKEN", label: "Instagram Access Token", placeholder: "instagram token" },
  { key: "INSTAGRAM_BUSINESS_ACCOUNT_ID", label: "Instagram Business Account ID", placeholder: "instagram business id" },
  { key: "INSTAGRAM_ALLOW_PRIVATE_API", label: "Instagram Allow Private API", placeholder: "true or false" },
  { key: "WHATSAPP_WEBJS_API_KEY", label: "WhatsApp WebJS API Key", placeholder: "optional" },
] as const;

type FieldKey = (typeof INTEGRATION_FIELDS)[number]["key"];
type ConfiguredMap = Partial<Record<FieldKey, boolean>>;

function makeEmptyForm() {
  return INTEGRATION_FIELDS.reduce((acc, field) => {
    acc[field.key] = "";
    return acc;
  }, {} as Record<FieldKey, string>);
}

export default function Page() {
  const [health, setHealth] = useState<{ status?: string }>({ status: "loading" });
  const [configured, setConfigured] = useState<ConfiguredMap>({});
  const [form, setForm] = useState<Record<FieldKey, string>>(makeEmptyForm());
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [healthResponse, settingsResponse] = await Promise.all([
          fetch(`${API_BASE}/v1/health`, { cache: "no-store" }).then((res) => res.json()),
          fetch(`${API_BASE}/v1/settings/integrations`, { cache: "no-store" }).then((res) => res.json()),
        ]);
        setHealth(healthResponse);
        setConfigured(settingsResponse?.configured ?? {});
      } catch {
        setHealth({ status: "offline" });
      }
    };

    void load();
  }, []);

  const configuredCount = useMemo(() => Object.values(configured).filter(Boolean).length, [configured]);

  async function saveTokens() {
    setMessage("Saving...");
    const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value.trim().length > 0));

    try {
      const response = await fetch(`${API_BASE}/v1/settings/integrations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Failed to save tokens");
      }
      const data = await response.json();
      setConfigured(data.configured ?? {});
      setForm(makeEmptyForm());
      setMessage("Saved. You can now use the platform adapters without restarting.");
    } catch (error: any) {
      setMessage(error?.message ?? "Failed to save tokens");
    }
  }

  return (
    <main className="shell">
      <h1>Admin Dashboard</h1>
      <p className="muted">API: {API_BASE}</p>

      <div className="grid">
        <section className="card">
          <h2>API Health</h2>
          <p>Status: <strong>{health.status ?? "unknown"}</strong></p>
          <a className="button" href={`${API_BASE}/v1/health`} target="_blank" rel="noreferrer">Open health endpoint</a>
        </section>

        <section className="card">
          <h2>Integration Tokens</h2>
          <p className="muted">Configured: {configuredCount}/{INTEGRATION_FIELDS.length}</p>
          <p className="muted">Isi token di sini. Field kosong tidak menimpa data lama.</p>
        </section>

        <section className="card">
          <h2>Accounts</h2>
          <p className="muted">Manage social accounts and credentials.</p>
          <a className="button" href="#accounts">Go</a>
        </section>

        <section className="card">
          <h2>Templates</h2>
          <p className="muted">Create reusable content templates.</p>
          <a className="button" href="#templates">Go</a>
        </section>

        <section className="card">
          <h2>Jobs</h2>
          <p className="muted">Schedule and trigger posts.</p>
          <a className="button" href="#jobs">Go</a>
        </section>
      </div>

      <div style={{ marginTop: 24 }} className="row">
        <section className="card" style={{ gridColumn: "1 / -1" }}>
          <h2>Save Integration Tokens</h2>
          <p className="muted">Token disimpan terenkripsi di database lokal dan dibaca backend saat adapter dipakai.</p>
          <div className="grid">
            {INTEGRATION_FIELDS.map((field) => (
              <label key={field.key}>
                {field.label}
                <input
                  className="input"
                  type="password"
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                />
                <small className="muted">Status: {configured[field.key] ? "saved" : "not set"}</small>
              </label>
            ))}
          </div>
          <button className="button" type="button" onClick={saveTokens}>Save Tokens</button>
          {message ? <p className="muted">{message}</p> : null}
        </section>

        <section id="accounts" className="card">
          <h2>Create Account</h2>
          <label>Platform</label>
          <select className="select" defaultValue="telegram">
            <option>telegram</option>
            <option>whatsapp</option>
            <option>twitter</option>
            <option>threads</option>
            <option>instagram</option>
          </select>
          <label>Username</label>
          <input className="input" defaultValue="test_account" />
          <label>Credential</label>
          <input className="input" defaultValue="secret-token" />
          <button className="button" type="button">Save</button>
        </section>

        <section id="templates" className="card">
          <h2>Create Template</h2>
          <label>Name</label>
          <input className="input" defaultValue="Promo" />
          <label>Content</label>
          <textarea className="textarea" rows={4} defaultValue="Check this out {link}" />
          <label>Variables</label>
          <input className="input" defaultValue="link" />
          <button className="button" type="button">Save</button>
        </section>

        <section id="jobs" className="card">
          <h2>Schedule Job</h2>
          <label>Cron</label>
          <input className="input" defaultValue="* * * * *" />
          <label>Template ID</label>
          <input className="input" defaultValue="tpl_1" />
          <label>Account ID</label>
          <input className="input" defaultValue="acc_1" />
          <button className="button" type="button">Schedule</button>
        </section>
      </div>
    </main>
  );
}
