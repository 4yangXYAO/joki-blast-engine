import { JobQueue } from '../queue/job-queue'

export interface ScheduleEntry {
  id: string
  cron: string
  template_id: string
  account_id: string
  to?: string
  platform: string
  enabled: boolean
  lastTriggeredKey?: string
  created_at: string
  updated_at: string
}

const schedules: ScheduleEntry[] = []

export function resetSchedules() {
  schedules.length = 0
}

export function listSchedules() {
  return schedules
}

export function validateCronExpression(cron: string): boolean {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return false
  return parts.every((part, idx) => validateCronPart(part, idx))
}

function validateCronPart(part: string, index: number): boolean {
  if (part === '*') return true
  if (/^\*\/\d+$/.test(part)) return true
  if (/^\d+$/.test(part)) {
    const value = Number(part)
    const ranges = [
      [0, 59],
      [0, 23],
      [1, 31],
      [1, 12],
      [0, 7],
    ] as const
    const [min, max] = ranges[index]
    return value >= min && value <= max
  }
  return false
}

function cronMatchesDate(cron: string, now: Date): boolean {
  const [minute, hour, day, month, weekday] = cron.trim().split(/\s+/)
  const values = [now.getMinutes(), now.getHours(), now.getDate(), now.getMonth() + 1, now.getDay()]
  const fields = [minute, hour, day, month, weekday]
  return fields.every((field, idx) => matchesField(field, values[idx]))
}

function matchesField(field: string, value: number): boolean {
  if (field === '*') return true
  if (/^\*\/\d+$/.test(field)) {
    const step = Number(field.slice(2))
    return value % step === 0
  }
  return Number(field) === value
}

export function createSchedule(input: {
  cron: string
  template_id: string
  account_id: string
  to?: string
  platform?: string
}): ScheduleEntry {
  const schedule: ScheduleEntry = {
    id: `sch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    cron: input.cron,
    template_id: input.template_id,
    account_id: input.account_id,
    to: input.to,
    platform: input.platform || 'default',
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  schedules.push(schedule)
  return schedule
}

export function updateSchedule(
  id: string,
  patch: Partial<Pick<ScheduleEntry, 'enabled' | 'cron' | 'platform'>>
) {
  const item = schedules.find((s) => s.id === id)
  if (!item) return null
  if (patch.cron !== undefined) item.cron = patch.cron
  if (patch.platform !== undefined) item.platform = patch.platform
  if (patch.enabled !== undefined) item.enabled = patch.enabled
  item.updated_at = new Date().toISOString()
  return item
}

export async function runSchedulerTick(queue: Pick<JobQueue, 'enqueuePostJob'>, now = new Date()) {
  for (const schedule of schedules) {
    if (!schedule.enabled) continue
    if (!validateCronExpression(schedule.cron)) continue
    if (!cronMatchesDate(schedule.cron, now)) continue
    const minuteKey = now.toISOString().slice(0, 16)
    if (schedule.lastTriggeredKey === minuteKey) continue
    schedule.lastTriggeredKey = minuteKey
    await queue.enqueuePostJob({
      platform: schedule.platform,
      to: schedule.to || schedule.account_id,
      message: `Scheduled template ${schedule.template_id}`,
    } as any)
  }
}

let intervalHandle: NodeJS.Timeout | null = null

export function startCronScheduler(queue: Pick<JobQueue, 'enqueuePostJob'>) {
  if (intervalHandle) return intervalHandle
  intervalHandle = setInterval(() => {
    void runSchedulerTick(queue).catch(() => undefined)
  }, 60_000)
  return intervalHandle
}

export function stopCronScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}

export { schedules }
