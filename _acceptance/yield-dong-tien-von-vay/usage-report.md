### S4 round 1 — wf_c391375f-e84 (23 agent, 112,232 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 38 | 18,954 | 76 | 2,717,679 | 265 |
| synthesize:report | claude-sonnet-5-5 | 4 | 15,357 | 8 | 143,391 | 91 |
| review:measurement | claude-opus-5-5 | 19 | 12,743 | 38 | 1,065,258 | 168 |
| ui:E17 | claude-sonnet-5-5 | 25 | 12,043 | 50 | 2,048,778 | 136 |
| ui:E16 | claude-sonnet-5-5 | 22 | 11,768 | 44 | 1,760,395 | 138 |
| review:bugs | claude-opus-5-5 | 16 | 8,159 | 32 | 729,299 | 117 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 5,416 | 4 | 22,344 | 30 |
| triage | claude-sonnet-5-5 | 2 | 4,201 | 4 | 22,759 | 30 |
| judge:E15:domain-correctness | claude-sonnet-5-5 | 5 | 3,275 | 10 | 102,671 | 26 |
| judge:E15:spec-alignment | claude-sonnet-5-5 | 3 | 2,919 | 6 | 44,617 | 21 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,723 | 4 | 17,296 | 31 |
| judge:E15:operational-feasibility | claude-sonnet-5-5 | 4 | 2,235 | 8 | 68,495 | 18 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,994 | 4 | 20,456 | 17 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,690 | 4 | 20,498 | 8 |
| machine:BASE_URL=${BASE_URL:-http://localhost:34 | claude-haiku-5-5 | 2 | 1,660 | 4 | 20,408 | 15 |
| machine:cd app && node --test eslint-plugin-oneh | claude-haiku-5-5 | 2 | 1,379 | 4 | 20,393 | 8 |
| refute:page.tsx | claude-sonnet-5-5 | 3 | 1,054 | 6 | 44,881 | 12 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,029 | 4 | 20,378 | 15 |
| machine:node /Users/manhphan/.claude/plugins/cac | claude-haiku-5-5 | 2 | 982 | 4 | 20,444 | 7 |
| machine:cd app && node --test eslint-plugin-oneh | claude-haiku-5-5 | 2 | 956 | 4 | 20,392 | 7 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 675 | 4 | 20,402 | 6 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 601 | 4 | 20,418 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 419 | 4 | 16,393 | 6 |


wall: 412s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,416 | 22,344 | 30 | 01:34:47 | 01:35:16 |
| machine | 10 | 13,689 | 201,085 | 93 | 01:34:47 | 01:36:19 |
| ui | 2 | 23,811 | 3,809,173 | 138 | 01:34:47 | 01:37:05 |
| judge | 3 | 8,429 | 215,783 | 26 | 01:34:47 | 01:35:13 |
| review | 3 | 39,856 | 4,512,236 | 265 | 01:34:47 | 01:39:12 |
| triage | 1 | 4,201 | 22,759 | 30 | 01:39:14 | 01:39:44 |
| refute | 1 | 1,054 | 44,881 | 12 | 01:39:46 | 01:39:58 |
| capture | 1 | 419 | 16,393 | 6 | 01:40:00 | 01:40:06 |
| synthesize | 1 | 15,357 | 143,391 | 91 | 01:40:08 | 01:41:39 |

- **claude-opus-5-5**: 3 agent · 73 calls · out 39,856 · in 146 · cache_read 4,512,236 · cache_create 244,248
- **claude-sonnet-5-5**: 10 agent · 72 calls · out 58,687 · in 144 · cache_read 4,274,724 · cache_create 403,036
- **claude-haiku-5-5**: 10 agent · 20 calls · out 13,689 · in 40 · cache_read 201,085 · cache_create 187,536


### S4 round 2 — wf_b2453b8a-4cd (21 agent, 73,810 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| ui:E17 | claude-sonnet-5-5 | 25 | 17,148 | 50 | 2,311,890 | 180 |
| synthesize:report | claude-sonnet-5-5 | 4 | 10,154 | 8 | 122,407 | 65 |
| ui:E16 | claude-sonnet-5-5 | 16 | 7,562 | 32 | 1,221,159 | 95 |
| review:bugs | claude-opus-5-5 | 11 | 6,171 | 22 | 303,809 | 80 |
| review:measurement | claude-opus-5-5 | 9 | 5,719 | 18 | 326,178 | 79 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 4,701 | 4 | 21,603 | 26 |
| judge:E15:operational-feasibility | claude-sonnet-5-5 | 4 | 3,037 | 8 | 68,999 | 21 |
| judge:E15:domain-correctness | claude-sonnet-5-5 | 3 | 2,603 | 6 | 39,889 | 18 |
| judge:E15:spec-alignment | claude-sonnet-5-5 | 3 | 2,339 | 6 | 43,645 | 18 |
| review:conventions | claude-opus-5-5 | 7 | 2,249 | 14 | 168,587 | 36 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,007 | 4 | 20,238 | 11 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,764 | 4 | 20,256 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,713 | 4 | 20,318 | 9 |
| machine:cd app && node --test eslint-plugin-oneh | claude-haiku-5-5 | 2 | 1,330 | 4 | 20,248 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,052 | 4 | 20,233 | 16 |
| machine:cd app && node --test eslint-plugin-oneh | claude-haiku-5-5 | 2 | 990 | 4 | 20,247 | 7 |
| machine:BASE_URL=${BASE_URL:-http://localhost:34 | claude-haiku-5-5 | 2 | 827 | 4 | 20,263 | 9 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 786 | 4 | 17,151 | 31 |
| triage | claude-sonnet-5-5 | 2 | 645 | 4 | 18,747 | 7 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 599 | 4 | 20,242 | 15 |
| capture:provenance | claude-sonnet-5-5 | 2 | 414 | 4 | 16,145 | 6 |


wall: 267s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,701 | 21,603 | 26 | 01:46:12 | 01:46:38 |
| machine | 9 | 11,068 | 179,196 | 100 | 01:46:12 | 01:47:52 |
| ui | 2 | 24,710 | 3,533,049 | 183 | 01:46:12 | 01:49:15 |
| judge | 3 | 7,979 | 152,533 | 23 | 01:46:12 | 01:46:36 |
| review | 3 | 14,139 | 798,574 | 82 | 01:46:12 | 01:47:34 |
| triage | 1 | 645 | 18,747 | 7 | 01:49:17 | 01:49:24 |
| capture | 1 | 414 | 16,145 | 6 | 01:49:26 | 01:49:32 |
| synthesize | 1 | 10,154 | 122,407 | 65 | 01:49:34 | 01:50:39 |

- **claude-sonnet-5-5**: 9 agent · 61 calls · out 48,603 · in 122 · cache_read 3,864,484 · cache_create 371,862
- **claude-opus-5-5**: 3 agent · 27 calls · out 14,139 · in 54 · cache_read 798,574 · cache_create 124,847
- **claude-haiku-5-5**: 9 agent · 18 calls · out 11,068 · in 36 · cache_read 179,196 · cache_create 168,752

