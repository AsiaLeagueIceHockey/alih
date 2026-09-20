---
title: Bound live display and reconcile official finished results
status: active
date: 2026-09-20
scope: project
---

# Bound live display and reconcile official finished results

## Decision

Treat a non-finished schedule as live only from faceoff until three hours after faceoff. After that window, show `resultPending` until an official result writer marks the game finished. Reconcile finished scores from popup 49 on a limited evening cadence.

## Context

The live polling and Push path remained disabled after the 2026-27 launch. Schedule rows therefore stayed `Scheduled` after faceoff. The frontend inferred live state from any past start time, so one stale row could remain live indefinitely. The existing official result reconciler was fail-closed but its scheduled workflow ran in dry-run mode only.

## Consequences

- A stale database status cannot make yesterday's game occupy the live section.
- The UI communicates delayed official data instead of presenting a false live state.
- Official completed scores recover without enabling minute-by-minute polling.
- Result writes remain season-scoped, source-mapped, conflict-detecting, and limited to official finished games.
- Reminder/start/goal/end Push remains a separate canary-gated lifecycle.

## Alternatives rejected

- Trust `game_status` without a time bound: rejected because the production writer can be disabled or delayed.
- Mark every game finished locally after four hours: rejected because the client must not invent scores or official completion.
- Restore all-day per-minute polling: rejected because it previously exhausted database IO and cron/HTTP logs.

## Revisit when

- A monitored live-game writer has completed canary validation and has reliable health alerts.
- The league exposes a signed or push-based live status feed with explicit completion guarantees.
