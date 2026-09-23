---
date: 2026-09-23
category: bug
source: harness-ship
---

# Refresh persisted player stats when a profile opens

## Situation

The scheduled importer corrected a player's cumulative record in Supabase, but
the public profile continued to show zeroes from React Query's 24-hour
persisted cache.

## What we learned

Shortening `staleTime` is not enough for already persisted results. Detail
queries backed by asynchronously imported official stats must refetch on mount
so a fresh visit reconciles the browser cache with the source of truth.

## Next time

When adding a persisted query for batch-updated data, set an explicit refresh
boundary such as `refetchOnMount: 'always'` and verify the deployed page with a
browser that already contains an older cached result.
