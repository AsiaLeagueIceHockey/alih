---
title: Keep roster profiles and season ranking statistics separate
status: active
date: 2026-09-22
scope: project
---

# Keep roster profiles and season ranking statistics separate

## Decision

Use `alih_players` for season roster identity and profile fields, and use `alih_player_stats` as the canonical source for officially published season G/A/PTS rankings; player views combine the two by season, team, and jersey number.

## Context

The official 2026-27 roster import populated 138 profiles, including photos and biographical fields. The league's `point_rank` feed publishes G/A/PTS independently and earlier than the complete `individual.html` and goalie records. Writing ranking rows back into `alih_players` would require an incomplete source to overwrite roster-profile fields and can erase career history or introduce ambiguous name matches.

## Consequences

- Standings and player detail views can show official G/A/PTS as soon as the ranking feed is published.
- Roster photos, bio, slug, and career data are not overwritten by ranking imports.
- GP, plus/minus, PIM, goalie records, and career history remain pending until their authoritative sources are complete.
- The join contract is `(season, team_id, jersey_number)` with normalized-name validation in the batch writer.

## Alternatives rejected

- Upsert point rankings into `alih_players`: rejected because the source is incomplete and can overwrite profile data.
- Copy 2025-26 career histories by name: rejected because same-name and transfer ambiguity could attach a history to the wrong 2026-27 player.
- Hide player statistics until every source is complete: rejected because the league already publishes authoritative current G/A/PTS.

## Revisit when

- The league publishes a stable person identifier shared across roster, individual, goalkeeper, and ranking feeds.
- The official individual and goalkeeper sources are complete for all six teams and can be validated without replacing profile fields.
