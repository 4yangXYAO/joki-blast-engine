# Decision 0001: Keep blast flow on a single dashboard page

## Status

Accepted.

## Context

The dashboard originally exposed static sections for accounts, templates, and jobs. That made the UI look complete while the forms did not actually call the backend.

## Decision

Keep the dashboard as a single admin page and wire the visible sections directly to the API:

- Save integration tokens.
- Create accounts.
- Create templates.
- Set a recipient.
- Trigger or schedule blast jobs.

## Reasoning

A single page keeps the blast workflow short and reduces coupling between form state and backend API calls. It also makes it easier to verify the full path in one browser session.

## Consequences

- The dashboard remains simple to operate.
- The blast flow is explicit and visible.
- The page must stay synchronized with backend route changes.
