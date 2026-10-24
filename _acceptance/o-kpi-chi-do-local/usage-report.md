### S4 round 1 — wf_875e1719-be0 (26 agent, 115,486 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 9 | 17,970 | 18 | 405,012 | 180 |
| review:bugs | claude-opus-5-5 | 20 | 15,007 | 40 | 1,220,798 | 171 |
| synthesize:report | claude-sonnet-5-5 | 4 | 14,543 | 8 | 142,860 | 85 |
| ui:E10 | claude-sonnet-5-5 | 23 | 13,618 | 46 | 1,956,948 | 186 |
| review:conventions | claude-opus-5-5 | 16 | 12,674 | 32 | 995,066 | 146 |
| triage | claude-sonnet-5-5 | 2 | 6,434 | 4 | 25,243 | 43 |
| judge:E8:operational-feasibility | claude-sonnet-5-5 | 2 | 4,200 | 4 | 20,710 | 31 |
| judge:E8:spec-alignment | claude-sonnet-5-5 | 2 | 3,816 | 4 | 20,708 | 27 |
| judge:E8:domain-correctness | claude-sonnet-5-5 | 2 | 3,188 | 4 | 17,180 | 23 |
| refute:collections-view.tsx | claude-sonnet-5-5 | 9 | 2,382 | 18 | 244,934 | 34 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,297 | 4 | 19,234 | 32 |
| refute:collections-view.tsx | claude-sonnet-5-5 | 6 | 2,185 | 12 | 142,238 | 27 |
| refute:o-kpi-chi-do-local.test.tsx | claude-sonnet-5-5 | 8 | 1,932 | 16 | 174,495 | 27 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,811 | 4 | 20,027 | 10 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,709 | 4 | 20,031 | 17 |
| refute:o-kpi-chi-do-local.test.tsx | claude-sonnet-5-5 | 5 | 1,597 | 10 | 98,035 | 22 |
| refute:o-kpi-chi-do-local.test.tsx | claude-sonnet-5-5 | 4 | 1,546 | 8 | 77,250 | 18 |
| refute:o-kpi-chi-do-local.test.tsx | claude-sonnet-5-5 | 3 | 1,412 | 6 | 41,256 | 18 |
| refute:o-kpi-chi-do-local.test.tsx | claude-sonnet-5-5 | 3 | 1,382 | 6 | 45,965 | 14 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,264 | 4 | 20,050 | 14 |
| refute:o-kpi-chi-do-local.test.tsx | claude-sonnet-5-5 | 4 | 1,198 | 8 | 68,284 | 16 |
| refute:o-kpi-chi-do-local.test.tsx | claude-sonnet-5-5 | 5 | 1,141 | 10 | 84,622 | 16 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 739 | 4 | 16,968 | 16 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 584 | 4 | 20,058 | 6 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 516 | 4 | 20,090 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 341 | 4 | 15,814 | 5 |


wall: 361s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,297 | 19,234 | 32 | 14:33:23 | 14:33:55 |
| machine | 6 | 6,623 | 117,224 | 77 | 14:33:23 | 14:34:41 |
| ui | 1 | 13,618 | 1,956,948 | 186 | 14:33:23 | 14:36:29 |
| judge | 3 | 11,204 | 58,598 | 32 | 14:33:23 | 14:33:55 |
| review | 3 | 45,651 | 2,620,876 | 181 | 14:33:23 | 14:36:25 |
| triage | 1 | 6,434 | 25,243 | 43 | 14:36:31 | 14:37:14 |
| refute | 9 | 14,775 | 977,079 | 34 | 14:37:16 | 14:37:50 |
| capture | 1 | 341 | 15,814 | 5 | 14:37:52 | 14:37:57 |
| synthesize | 1 | 14,543 | 142,860 | 85 | 14:37:59 | 14:39:24 |

- **claude-opus-5-5**: 3 agent · 45 calls · out 45,651 · in 90 · cache_read 2,620,876 · cache_create 257,273
- **claude-sonnet-5-5**: 17 agent · 86 calls · out 63,212 · in 172 · cache_read 3,195,776 · cache_create 624,894
- **claude-haiku-5-5**: 6 agent · 12 calls · out 6,623 · in 24 · cache_read 117,224 · cache_create 112,118

