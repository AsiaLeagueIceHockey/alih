# 2026-27 launch Phase 1 baseline

Recorded: 2026-09-10 KST
Supabase project: `nvlpbdyqfzmlrjauvhxx`
Purpose: prove that 2025-26 data remains unchanged across later migrations.

## Git baseline

| Repository | Branch | HEAD | origin/main |
|---|---|---|---|
| `alih` | `codex/2026-27-operations` | `22c99e0b2e9ef548e58fcaf9bc4b48af5b9beddb` | `22c99e0b2e9ef548e58fcaf9bc4b48af5b9beddb` |
| `alih-batch` | `codex/2026-27-operations` | `797bb9db3498cfd83f5647a136c0c51c4068dcdc` | `797bb9db3498cfd83f5647a136c0c51c4068dcdc` |

Tracked and allowed untracked worktree artifacts were backed up outside the repositories. `.omo/`, environment files, caches, and secrets were excluded.

- `alih`: `/private/tmp/alih-phase1.JcUK8n`
- `alih-batch`: `/private/tmp/alih-batch-phase1.YEMKqz`

Each backup contains a binary diff, allowed-untracked archive, source-file SHA-256 manifest, artifact SHA-256 manifest, status, HEAD, and origin/main records. These temporary paths are not a substitute for committing the reviewed work.

## 2025-26 preservation hashes

The following hashes use deterministic `jsonb` text ordered by primary key. Columns introduced by a future migration are excluded from the relevant hash.

| Dataset | Rows | Baseline hash |
|---|---:|---|
| `alih_schedule` where season = `2025-26` | 129 | `aeabc43517f1da77efb7c46c2417e2b6` |
| `alih_game_details` | 129 | `9a92b9a020502beeaf3b2858dc7ea5c6` |
| `alih_players` where season = `2025-26` | 143 | `38450e7c21295511a18bc3c9f335759a` |
| `alih_standings` where season = `2025-26` | 6 | `9d12b46fe24ecec9ef5bcb4c940a123f` |
| `alih_cheers` | 62 | `4cc76ad88703331884e190d8e34d29c5` |

Re-run the same query after every production migration. A changed row count or hash blocks the next gate until investigated. Do not “fix” a mismatch by deleting or overwriting historical rows.

## Schedule baseline

| Season | Rows | Distinct `game_no` | Non-scheduled rows |
|---|---:|---:|---:|
| `2025-26` | 129 | 129 | 129 |
| `2026-27` | 120 | 120 | 0 |

`alih_schedule.score_url` does not yet exist in production. Its absence is expected before the additive schedule migration.

## Next gate

Phase 2 may redesign migrations and code, but it must not write production data. Before production expand migrations, record the same hashes again and compare them after each migration.

## Progress after baseline

Phase 2 and the static portion of Phase 3 were completed locally without production writes.

- Archived `sql/v14` through `sql/v18` are explicitly marked as drafts that must not be applied.
- Canonical expand/contract migration design now lives in `supabase/migrations/202609100001` through `202609100009`.
- The schedule migration no longer pairs rows by sorted array index; it uses exact schedule identity and guard assertions.
- Frontend build succeeded and targeted lint had zero errors.
- Batch Python/Node syntax checks succeeded with explicit `TARGET_SEASON`.
- Deno is not installed locally, so Edge Function runtime typecheck remains an explicit Phase 4 blocker; no function was deployed.
- The user supplied one administrator bootstrap account on 2026-09-10. The email is intentionally not recorded here; resolve it only in the approved one-time production bootstrap step after the private admin migration exists.
