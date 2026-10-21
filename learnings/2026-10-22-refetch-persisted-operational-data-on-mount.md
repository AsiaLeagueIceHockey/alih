---
date: 2026-10-22
category: pattern
source: harness-implement
---

# Refetch persisted operational data when its page mounts

## Situation

After the standings writer corrected production, an already-used browser still
showed HL Anyang's stale zero-game row after reload. React Query state is
persisted in localStorage for 24 hours, and the standings query treated the
restored value as fresh for one hour.

## What we learned

Persisted cache freshness can hide a successful production data repair. For
small operational datasets where correctness matters more than one lightweight
request, a route mount should revalidate even when restored data is still within
its stale window.

## Next time

Use `refetchOnMount: 'always'` for compact schedule, standings, or live-result
queries that must reflect server-side corrections immediately. Verify repairs
in both a clean browser and a browser with an existing persisted cache.
