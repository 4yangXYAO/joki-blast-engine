// TypeScript interfaces representing the database schema for joki-blast-engine
// These interfaces map to the SQLite tables defined in migrations/001_init.sql

export interface Account {
  id: string // TEXT UUID
  platform: string
  username: string
  email: string
  status: string
  created_at: string // DATETIME ISO string
  updated_at: string // DATETIME ISO string
}

export interface Template {
  id: string
  account_id: string
  name: string
  content: string
  variables: string // JSON string
  type: string
  created_at: string
}

export interface Job {
  id: string
  template_id: string
  account_id: string
  platform: string
  status: string
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  error_msg: string | null
  retries: number
  max_retries: number
}

export interface Post {
  id: string
  job_id: string
  account_id: string
  platform: string
  content: string
  post_url: string | null
  engagement_count: number
  created_at: string
}

export interface Schedule {
  id: string
  template_id: string
  account_id: string
  cron_expr: string
  enabled: boolean
  created_at: string
}

export interface Credential {
  id: string
  account_id: string
  type: string
  encrypted_value: string
  expires_at: string | null
}

export interface Log {
  id: string
  job_id: string | null
  level: string
  message: string
  context_json: string | null
  created_at: string
}

export interface Campaign {
  id: string
  name: string
  content: string
  cta_link: string | null
  platforms: string // JSON array of platform strings
  status: string // 'draft' | 'published' | 'completed'
  created_at: string
}

export interface CampaignPost {
  id: string
  campaign_id: string
  platform: string
  job_id: string | null
  status: string // 'pending' | 'submitted' | 'posted' | 'failed'
  created_at: string
}

export interface LinkClick {
  id: number
  token: string
  campaign_id: string | null
  platform: string | null
  clicked_at: string
}

export interface Lead {
  id: string
  inbound_platform: string
  contact: string
  campaign_id: string | null
  welcome_sent: number // 0 | 1
  status: string // 'new' | 'welcome_sent' | 'negotiating' | 'converted'
  created_at: string
  updated_at: string
}
