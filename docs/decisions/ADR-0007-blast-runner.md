# ADR-0007: Blast Runner — Sequential Multi-Platform Orchestrator

## Status

**Accepted** — 2026-05-01

## Context

The system had individual cookie-based adapters for Facebook, Instagram, Twitter, Threads, and WhatsApp, plus a job queue and worker for processing individual jobs. However, there was no orchestration layer to batch-execute actions across targets with natural delays, action randomization, and execution limits.

## Decision

### Why a simple sequential loop instead of queue-based blast?

The existing job queue (`JobQueue`) processes jobs individually and is designed for isolated, retryable tasks. A blast run is a coordinated sequence of actions that:
- Must run one at a time (anti-spam)
- Requires random delays between actions (20–40s for comments, 35–60s for DMs)
- Randomizes action types (70% comment / 30% chat)
- Has a hard cap at 30 actions per run
- Must complete as a single unit of work

Using the queue would fragment this coordination — delays would need to be encoded as job metadata, action randomization would need to happen at enqueue time, and the 30-action cap would require tracking state across multiple queue consumers.

A simple sequential loop is simpler, more predictable, and easier to debug.

### Global lock

Only one blast can run at a time (global `isRunning` flag). This prevents cross-platform collision and ensures controlled resource usage.

### Delay strategy

| Action | Delay Range | Rationale |
|--------|------------|-----------|
| Comment | 20–40 seconds | Mimics human browsing + commenting cadence |
| Chat/DM | 35–60 seconds | DMs are more monitored; longer delays reduce detection risk |

### Action randomization

70% comment / 30% chat was chosen to:
- Maximize visible engagement (comments are public)
- Supplement with DMs for higher-value outreach
- Avoid predictable patterns that platforms can detect

## Consequences

- Blast runs are blocking operations (one at a time)
- Real-time progress is logged to console (`[blast] 10/30`)
- The API returns the full `BlastResult` after completion (synchronous)
- Platform finders are fragile (internal APIs) and may need maintenance when platforms change endpoints
