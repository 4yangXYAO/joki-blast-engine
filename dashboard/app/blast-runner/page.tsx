'use client'

import { useState } from 'react'
import Link from 'next/link'

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://127.0.0.1:3456'

export default function BlastRunnerPage() {
  const [platform, setPlatform] = useState('facebook')
  const [credential, setCredential] = useState('')
  const [targetSource, setTargetSource] = useState('feed')
  const [maxActions, setMaxActions] = useState(30)
  const [actionMixComment, setActionMixComment] = useState(70)
  const [delayMinSec, setDelayMinSec] = useState(20)
  const [delayMaxSec, setDelayMaxSec] = useState(40)
  const [statusMessage, setStatusMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isWhatsApp = platform === 'whatsapp'

  async function handleStartBlast() {
    setStatusMessage('Starting blast...')
    setIsLoading(true)

    try {
      const payload = {
        platform,
        credential,
        targetSource: isWhatsApp ? 'use target file' : targetSource,
        maxActions,
        actionMix: {
          comment: actionMixComment,
          chat: 100 - actionMixComment,
        },
        delayMinSec,
        delayMaxSec,
      }

      console.log('Sending payload:', payload)

      const response = await fetch('/api/blast/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error ?? `Failed to start blast (${response.status})`)
      }

      setStatusMessage(`Blast started successfully! ${data?.message ? `(${data.message})` : ''}`)
    } catch (error: any) {
      console.error(error)
      setStatusMessage(`Error: ${error?.message ?? 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="shell">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>Blast Runner - Multi Platform</h1>
        <Link href="/" className="button" style={{ marginTop: 0 }}>
          Back to Dashboard
        </Link>
      </div>

      <section className="card" style={{ maxWidth: '800px' }}>
        <h2>Configure Blast</h2>
        
        <label>Platform</label>
        <select 
          className="select" 
          value={platform} 
          onChange={(e) => {
            setPlatform(e.target.value)
            // Reset to default action mix when changing platform
            if (e.target.value === 'whatsapp') {
              setActionMixComment(0) // WhatsApp is 100% chat usually
            } else {
              setActionMixComment(70)
            }
          }}
        >
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="threads">Threads</option>
          <option value="twitter">Twitter</option>
          <option value="whatsapp">WhatsApp</option>
        </select>

        <label>{isWhatsApp ? 'WAHA API Key / WhatsApp Credential' : 'Cookies String'}</label>
        <textarea
          className="textarea"
          rows={4}
          placeholder={isWhatsApp ? 'Enter API Key' : 'Paste full cookie string here...'}
          value={credential}
          onChange={(e) => setCredential(e.target.value)}
        />

        <label>Target Source</label>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ marginRight: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="radio" 
              name="targetSource" 
              value="feed" 
              checked={targetSource === 'feed'} 
              onChange={() => setTargetSource('feed')}
              disabled={isWhatsApp}
            />
            Fetch from feed (auto)
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="radio" 
              name="targetSource" 
              value="file" 
              checked={targetSource === 'file'} 
              onChange={() => setTargetSource('file')}
            />
            Use target file (.txt)
          </label>
        </div>
        {isWhatsApp && targetSource === 'feed' && (
          <p className="muted" style={{ fontSize: '14px', marginTop: '-10px' }}>
            Feed not supported for WhatsApp. Please use a target file or manually input contacts.
          </p>
        )}

        <div className="row" style={{ marginTop: '16px' }}>
          <div>
            <label>Max Actions (1-50)</label>
            <input 
              type="number" 
              className="input" 
              value={maxActions} 
              min={1} 
              max={50}
              onChange={(e) => setMaxActions(Number(e.target.value))} 
            />
          </div>

          <div>
            <label>Action Mix: {actionMixComment}% Comment / {100 - actionMixComment}% Chat</label>
            <input 
              type="range" 
              style={{ width: '100%', marginTop: '16px', marginBottom: '16px' }} 
              value={actionMixComment} 
              min={0} 
              max={100}
              step={10}
              onChange={(e) => setActionMixComment(Number(e.target.value))} 
            />
          </div>
        </div>

        <div className="row">
          <div>
            <label>Delay Min (Seconds)</label>
            <input 
              type="number" 
              className="input" 
              value={delayMinSec} 
              min={1}
              onChange={(e) => setDelayMinSec(Number(e.target.value))} 
            />
          </div>
          <div>
            <label>Delay Max (Seconds)</label>
            <input 
              type="number" 
              className="input" 
              value={delayMaxSec} 
              min={delayMinSec}
              onChange={(e) => setDelayMaxSec(Number(e.target.value))} 
            />
          </div>
        </div>

        <button 
          className="button" 
          onClick={handleStartBlast}
          disabled={isLoading || !credential}
          style={{ width: '100%', marginTop: '20px', padding: '14px', fontSize: '16px', opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? 'Starting...' : 'Start Blast'}
        </button>

        {statusMessage && (
          <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: '#334155' }}>
            <p style={{ margin: 0 }}>{statusMessage}</p>
          </div>
        )}
      </section>
    </main>
  )
}
