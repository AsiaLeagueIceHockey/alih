---
title: Separate platform game numbers from official popup game numbers
status: active
date: 2026-09-12
scope: project
---

# Separate platform and official game numbers

## Decision

Keep `alih_schedule.id` as the immutable game identity, preserve the existing season-local `game_no`, and store the ALIH popup number separately in `source_popup_id` and `source_game_no`.

## Context

The 2026-27 schedule was imported from `asiaicehockey.com/schedule` and assigned platform `game_no` values in chronological order. The later-published popup 49 schedule uses a different ordering for simultaneous and same-day games. All 120 events map one-to-one by teams and date/time, but 54 official Game No values differ from the platform numbers.

The platform already uses season-qualified `game_no` in public routes and capture links. Child records are being migrated to `schedule_id`. Replacing 54 platform numbers would create avoidable unique-key swaps and could break existing deep links or references without improving event identity.

## Consequences

- Cross-table relationships and writes use `schedule_id`.
- Public routes continue to use `season + game_no` unless a future route migration is explicitly designed.
- Game sheet URLs use `source_popup_id/source_game_no`.
- UI that needs the official ALIH number displays `source_game_no`.
- `score_url`, `live_url`, and game sheet URLs remain distinct fields/concepts.
- Schedule reconciliation must match event identity, not equal game numbers.

## Alternatives rejected

- Replace platform `game_no` with popup 49 Game No: rejected because 54 values differ, causing unique-key swaps and compatibility risk.
- Use official Game No alone as the primary identity: rejected because numbers restart by season/phase and are source-local.
- Derive game sheet numbers from chronological order: rejected because the official source ordering is not chronological for all same-day games.

## Revisit when

- Public game routes migrate fully to opaque `schedule_id` or a stable slug.
- The league publishes a globally unique immutable game identifier shared by schedule, score, and game sheet systems.
- A new source proves `source_game_no` is not unique within a popup/phase, requiring the source identity to include another field.

## Evidence

See [`../docs/2026-27-popup49-gamesheet-integration.md`](../docs/2026-27-popup49-gamesheet-integration.md) for the 120↔120 reconciliation, mismatch counts, official schedule hash, and implementation gates.
