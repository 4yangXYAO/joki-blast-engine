# Decision 0002: Resolve adapters from stored accounts

## Status

Accepted.

## Context

The queue worker originally used a dummy adapter factory, which meant jobs could not be executed against real account credentials.

## Decision

The worker now loads the stored account, decrypts its credentials, and constructs the appropriate adapter for the platform.

## Reasoning

This makes job execution real instead of simulated and keeps credentials centralized in SQLite rather than in UI state or hardcoded logic.

## Consequences

- Account creation is now part of the blast path.
- Platform-specific credentials can be stored once and reused.
- Worker startup depends on the account repository and encryption helpers.
