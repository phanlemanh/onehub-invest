### S4 round 1 — wf_ec8a1e71-d57 (19 agent, 57,052 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 12 | 7,451 | 24 | 567,137 | 90 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 16 | 7,206 | 32 | 562,806 | 1659 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 9 | 6,425 | 18 | 263,876 | 1240 |
| synthesize:report | claude-sonnet-5-5 | 2 | 5,213 | 4 | 43,541 | 28 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,961 | 6 | 81,833 | 44 |
| review:measurement | claude-opus-5-5 | 4 | 3,698 | 8 | 127,694 | 41 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,859 | 4 | 35,197 | 179 |
| machine:bash db/db-thu.sh oneinvest_suite_ht3sd | claude-haiku-5-5 | 2 | 2,647 | 4 | 35,251 | 109 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,615 | 4 | 3,300 | 561 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,331 | 4 | 35,207 | 13 |
| triage | claude-sonnet-5-5 | 2 | 2,327 | 4 | 34,912 | 18 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,897 | 4 | 35,211 | 10 |
| review:conventions | claude-opus-5-5 | 5 | 1,693 | 10 | 168,445 | 24 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,408 | 4 | 35,209 | 21 |
| machine:cd app && env -u DATABASE_URL CI=true no | claude-haiku-5-5 | 2 | 1,051 | 4 | 35,221 | 10 |
| refute:do-lam-giau.test.tsx | claude-sonnet-5-5 | 4 | 1,040 | 8 | 107,107 | 9 |
| machine:bash db/db-thu.sh oneinvest_suite_ht3dl | claude-haiku-5-5 | 2 | 1,019 | 4 | 35,252 | 65 |
| machine:f=$(git diff --name-only $(git merge-bas | claude-haiku-5-5 | 2 | 890 | 4 | 35,413 | 7 |
| capture:provenance | claude-sonnet-5-5 | 2 | 321 | 4 | 30,650 | 3 |


wall: 3741s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 12,842 | 863,276 | 93 | 07:38:44 | 07:40:16 |
| machine | 11 | 30,348 | 1,111,943 | 3682 | 07:38:44 | 08:40:05 |
| baseline | 1 | 4,961 | 81,833 | 44 | 07:38:44 | 07:39:28 |
| triage | 1 | 2,327 | 34,912 | 18 | 08:40:05 | 08:40:23 |
| refute | 1 | 1,040 | 107,107 | 9 | 08:40:23 | 08:40:33 |
| capture | 1 | 321 | 30,650 | 3 | 08:40:33 | 08:40:36 |
| synthesize | 1 | 5,213 | 43,541 | 28 | 08:40:36 | 08:41:04 |

- **claude-opus-5-5**: 3 agent · 21 calls · out 12,842 · in 42 · cache_read 863,276 · cache_create 155,149
- **claude-haiku-5-5**: 11 agent · 43 calls · out 30,348 · in 86 · cache_read 1,111,943 · cache_create 474,462
- **claude-sonnet-5-5**: 5 agent · 13 calls · out 13,862 · in 26 · cache_read 298,043 · cache_create 213,887

### S4 round 2 — wf_e3133a39-f24 (21 agent, 64,188 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 14 | 9,314 | 28 | 752,467 | 116 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 15 | 6,993 | 30 | 497,253 | 1597 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 6,378 | 6 | 89,152 | 103 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,036 | 4 | 45,743 | 32 |
| review:conventions | claude-opus-5-5 | 10 | 5,148 | 20 | 471,132 | 68 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 14 | 4,806 | 28 | 463,817 | 1275 |
| review:measurement | claude-opus-5-5 | 8 | 4,682 | 16 | 343,673 | 63 |
| triage | claude-sonnet-5-5 | 2 | 3,096 | 4 | 35,996 | 22 |
| machine:bash db/db-thu.sh oneinvest_suite_ht3sd | claude-haiku-5-5 | 2 | 2,682 | 4 | 35,251 | 193 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 6 | 2,102 | 12 | 150,480 | 724 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 2,034 | 4 | 35,211 | 11 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,872 | 4 | 35,207 | 12 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,500 | 4 | 35,209 | 22 |
| machine:cd pipeline && bash ../db/db-thu.sh onei | claude-haiku-5-5 | 2 | 1,295 | 4 | 35,234 | 87 |
| machine:cd app && env -u DATABASE_URL CI=true no | claude-haiku-5-5 | 2 | 1,211 | 4 | 35,221 | 11 |
| refute:sellers-chip.test.tsx | claude-sonnet-5-5 | 4 | 1,083 | 8 | 102,272 | 10 |
| machine:bash db/db-thu.sh oneinvest_suite_ht3dl | claude-haiku-5-5 | 2 | 1,056 | 4 | 35,252 | 145 |
| machine:f=$(git diff --name-only $(git merge-bas | claude-haiku-5-5 | 2 | 923 | 4 | 35,493 | 8 |
| machine:node _acceptance/hai-ca-app-dung-tren-du | claude-haiku-5-5 | 2 | 913 | 4 | 35,208 | 24 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 737 | 4 | 35,197 | 247 |
| capture:provenance | claude-sonnet-5-5 | 2 | 327 | 4 | 30,650 | 4 |


wall: 3957s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 6,378 | 89,152 | 103 | 08:50:37 | 08:52:21 |
| review | 3 | 19,144 | 1,567,272 | 120 | 08:50:37 | 08:52:37 |
| machine | 13 | 28,124 | 1,464,033 | 3888 | 08:50:37 | 09:55:26 |
| triage | 1 | 3,096 | 35,996 | 22 | 09:55:26 | 09:55:48 |
| refute | 1 | 1,083 | 102,272 | 10 | 09:55:48 | 09:55:58 |
| capture | 1 | 327 | 30,650 | 4 | 09:55:58 | 09:56:02 |
| synthesize | 1 | 6,036 | 45,743 | 32 | 09:56:02 | 09:56:34 |

- **claude-opus-5-5**: 3 agent · 32 calls · out 19,144 · in 64 · cache_read 1,567,272 · cache_create 196,885
- **claude-haiku-5-5**: 13 agent · 55 calls · out 28,124 · in 110 · cache_read 1,464,033 · cache_create 539,727
- **claude-sonnet-5-5**: 5 agent · 13 calls · out 16,920 · in 26 · cache_read 303,813 · cache_create 216,913

