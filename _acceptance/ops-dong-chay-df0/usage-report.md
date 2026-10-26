### S4 round 2 — wf_78280f19-1ab (18 agent, 79,330 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| ui:E7 | claude-sonnet-5-5 | 32 | 22,132 | 64 | 3,513,944 | 271 |
| synthesize:report | claude-sonnet-5-5 | 8 | 15,347 | 16 | 384,911 | 112 |
| review:measurement | claude-opus-5-5 | 12 | 11,750 | 24 | 673,666 | 131 |
| review:bugs | claude-opus-5-5 | 14 | 6,333 | 28 | 615,285 | 85 |
| review:conventions | claude-opus-5-5 | 9 | 4,780 | 18 | 372,579 | 56 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,789 | 4 | 23,867 | 17 |
| triage | claude-sonnet-5-5 | 2 | 2,313 | 4 | 20,979 | 19 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,019 | 4 | 20,872 | 25 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,831 | 4 | 20,950 | 9 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,789 | 4 | 20,837 | 12 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,714 | 4 | 20,912 | 8 |
| judge:E9:operational-feasibility | claude-sonnet-5-5 | 3 | 1,660 | 8 | 50,927 | 14 |
| judge:E9:spec-alignment | claude-sonnet-5-5 | 2 | 1,233 | 4 | 21,308 | 10 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 965 | 4 | 20,860 | 16 |
| judge:E9:domain-correctness | claude-sonnet-5-5 | 2 | 865 | 4 | 17,780 | 7 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 741 | 4 | 20,835 | 31 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 707 | 4 | 20,876 | 9 |
| capture:provenance | claude-sonnet-5-5 | 2 | 362 | 4 | 16,876 | 8 |


wall: 410s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,789 | 23,867 | 17 | 12:47:42 | 12:48:00 |
| machine | 7 | 9,766 | 146,142 | 102 | 12:47:42 | 12:49:24 |
| ui | 1 | 22,132 | 3,513,944 | 271 | 12:47:42 | 12:52:13 |
| judge | 3 | 3,758 | 90,015 | 15 | 12:47:42 | 12:47:58 |
| review | 3 | 22,863 | 1,661,530 | 133 | 12:47:42 | 12:49:56 |
| triage | 1 | 2,313 | 20,979 | 19 | 12:52:13 | 12:52:32 |
| capture | 1 | 362 | 16,876 | 8 | 12:52:32 | 12:52:40 |
| synthesize | 1 | 15,347 | 384,911 | 112 | 12:52:40 | 12:54:32 |

- **claude-sonnet-5-5**: 8 agent · 53 calls · out 46,701 · in 108 · cache_read 4,050,592 · cache_create 361,844
- **claude-opus-5-5**: 3 agent · 35 calls · out 22,863 · in 70 · cache_read 1,661,530 · cache_create 208,434
- **claude-haiku-5-5**: 7 agent · 14 calls · out 9,766 · in 28 · cache_read 146,142 · cache_create 133,747

### S4 round 1 — wf_e0d2953f-a02 (26 agent, 124,145 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| ui:E7 | claude-sonnet-5-5 | 51 | 30,969 | 102 | 5,945,995 | 755 |
| review:conventions | claude-opus-5-5 | 30 | 16,038 | 60 | 1,690,923 | 201 |
| review:bugs | claude-opus-5-5 | 21 | 15,856 | 42 | 1,447,271 | 198 |
| synthesize:report | claude-sonnet-5-5 | 4 | 14,824 | 8 | 150,577 | 90 |
| review:measurement | claude-opus-5-5 | 5 | 7,439 | 10 | 159,345 | 84 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 5,435 | 4 | 23,592 | 30 |
| triage | claude-sonnet-5-5 | 2 | 4,251 | 4 | 23,653 | 31 |
| refute:data-flow-queries.ts | claude-sonnet-5-5 | 5 | 2,837 | 10 | 92,530 | 29 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 2,189 | 4 | 21,201 | 17 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,168 | 4 | 21,167 | 34 |
| machine:cd pipeline && node --test scripts/vocab | claude-haiku-5-5 | 2 | 2,145 | 4 | 21,209 | 11 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 2,105 | 4 | 21,199 | 21 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,773 | 4 | 21,198 | 20 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,733 | 4 | 21,169 | 9 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 1,653 | 4 | 21,208 | 11 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,597 | 4 | 21,187 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,538 | 4 | 21,181 | 8 |
| judge:E9:spec-alignment | claude-sonnet-5-5 | 2 | 1,339 | 4 | 21,640 | 11 |
| refute:ops-dong-chay.test.tsx | claude-sonnet-5-5 | 3 | 1,263 | 6 | 45,507 | 24 |
| judge:E9:operational-feasibility | claude-sonnet-5-5 | 2 | 1,250 | 4 | 21,642 | 14 |
| judge:E9:domain-correctness | claude-sonnet-5-5 | 2 | 1,210 | 4 | 18,112 | 11 |
| refute:ops-dong-chay.test.tsx | claude-sonnet-5-5 | 3 | 1,180 | 6 | 44,427 | 22 |
| refute:ops-dong-chay.test.tsx | claude-sonnet-5-5 | 4 | 1,025 | 8 | 64,790 | 23 |
| refute:ops-dong-chay.test.tsx | claude-sonnet-5-5 | 3 | 944 | 6 | 42,476 | 22 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 940 | 4 | 21,192 | 14 |
| capture:provenance | claude-sonnet-5-5 | 2 | 444 | 4 | 16,944 | 5 |


wall: 910s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,435 | 23,592 | 30 | 11:32:48 | 11:33:18 |
| machine | 10 | 17,841 | 211,911 | 93 | 11:32:48 | 11:34:21 |
| ui | 1 | 30,969 | 5,945,995 | 755 | 11:32:48 | 11:45:23 |
| judge | 3 | 3,799 | 61,394 | 16 | 11:32:48 | 11:33:04 |
| review | 3 | 39,333 | 3,297,539 | 201 | 11:32:48 | 11:36:09 |
| triage | 1 | 4,251 | 23,653 | 31 | 11:45:23 | 11:45:54 |
| refute | 5 | 7,249 | 289,730 | 29 | 11:45:54 | 11:46:23 |
| capture | 1 | 444 | 16,944 | 5 | 11:46:23 | 11:46:28 |
| synthesize | 1 | 14,824 | 150,577 | 90 | 11:46:28 | 11:47:58 |

- **claude-sonnet-5-5**: 13 agent · 85 calls · out 66,971 · in 170 · cache_read 6,511,885 · cache_create 490,957
- **claude-opus-5-5**: 3 agent · 56 calls · out 39,333 · in 112 · cache_read 3,297,539 · cache_create 236,849
- **claude-haiku-5-5**: 10 agent · 20 calls · out 17,841 · in 40 · cache_read 211,911 · cache_create 192,641

