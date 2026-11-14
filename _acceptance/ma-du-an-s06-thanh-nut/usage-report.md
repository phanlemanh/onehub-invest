### S4 round 1 — wf_2a83740a-ded (20 agent, 56,020 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 5 | 7,039 | 10 | 185,036 | 77 |
| review:bugs | claude-opus-5-5 | 6 | 6,853 | 12 | 248,450 | 74 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,640 | 4 | 41,697 | 35 |
| review:conventions | claude-opus-5-5 | 11 | 5,834 | 22 | 536,269 | 67 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,868 | 6 | 71,483 | 28 |
| machine:cd pipeline && npm run test:a | claude-haiku-5-5 | 7 | 4,455 | 14 | 163,206 | 906 |
| machine:cd pipeline && npm run test:b | claude-haiku-5-5 | 5 | 3,829 | 10 | 98,009 | 763 |
| triage | claude-sonnet-5-5 | 2 | 3,098 | 4 | 30,981 | 25 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,968 | 4 | 30,208 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,518 | 4 | 30,202 | 7 |
| machine:cd pipeline && bash ../db/db-thu.sh onei | claude-haiku-5-5 | 2 | 1,307 | 4 | 30,239 | 26 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,267 | 4 | 30,213 | 18 |
| refute:noi-du-an-s06.itest.mjs | claude-sonnet-5-5 | 3 | 1,235 | 6 | 61,029 | 12 |
| refute:noi-du-an-s06.itest.mjs | claude-sonnet-5-5 | 4 | 1,157 | 8 | 95,939 | 12 |
| machine:cd pipeline && bash ../db/db-thu.sh onei | claude-haiku-5-5 | 2 | 1,065 | 4 | 30,227 | 27 |
| machine:cd agent && bash ../db/db-thu.sh oneinve | claude-haiku-5-5 | 2 | 964 | 4 | 30,232 | 18 |
| machine:node --test pipeline/tests/noi-du-an-s06 | claude-haiku-5-5 | 2 | 928 | 4 | 30,198 | 6 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 885 | 4 | 3,300 | 473 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 767 | 4 | 26,865 | 37 |
| capture:provenance | claude-sonnet-5-5 | 2 | 343 | 4 | 25,692 | 4 |


wall: 2290s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 19,726 | 969,755 | 79 | 05:51:20 | 05:52:39 |
| baseline | 1 | 4,868 | 71,483 | 28 | 05:51:20 | 05:51:48 |
| machine | 11 | 18,953 | 502,899 | 2212 | 05:51:20 | 06:28:12 |
| triage | 1 | 3,098 | 30,981 | 25 | 06:28:12 | 06:28:36 |
| refute | 2 | 2,392 | 156,968 | 14 | 06:28:36 | 06:28:50 |
| capture | 1 | 343 | 25,692 | 4 | 06:28:50 | 06:28:55 |
| synthesize | 1 | 6,640 | 41,697 | 35 | 06:28:55 | 06:29:30 |

- **claude-opus-5-5**: 3 agent · 22 calls · out 19,726 · in 44 · cache_read 969,755 · cache_create 196,955
- **claude-sonnet-5-5**: 6 agent · 16 calls · out 17,341 · in 32 · cache_read 326,821 · cache_create 225,873
- **claude-haiku-5-5**: 11 agent · 30 calls · out 18,953 · in 60 · cache_read 502,899 · cache_create 399,287

### S4 round 2 — wf_2372f094-d97 (13 agent, 27,544 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 3 | 4,897 | 6 | 87,585 | 29 |
| machine:cd pipeline && npm run test:b | claude-haiku-5-5 | 6 | 4,106 | 12 | 130,476 | 798 |
| machine:cd app && npm test | claude-haiku-5-5 | 5 | 3,623 | 10 | 97,492 | 774 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,774 | 4 | 26,905 | 43 |
| review:bugs | claude-opus-5-5 | 6 | 2,160 | 12 | 172,308 | 27 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,666 | 4 | 30,223 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,664 | 4 | 30,217 | 8 |
| machine:cd pipeline && bash ../db/db-thu.sh onei | claude-haiku-5-5 | 2 | 1,410 | 4 | 30,279 | 18 |
| machine:cd pipeline && npm run test:a | claude-haiku-5-5 | 3 | 1,374 | 6 | 33,886 | 637 |
| review:conventions | claude-opus-5-5 | 4 | 1,326 | 8 | 96,791 | 19 |
| review:measurement | claude-opus-5-5 | 3 | 1,114 | 6 | 61,921 | 15 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,086 | 4 | 30,228 | 17 |
| capture:provenance | claude-sonnet-5-5 | 2 | 344 | 4 | 25,707 | 5 |


wall: 2318s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 8 | 17,703 | 409,706 | 2284 | 06:33:23 | 07:11:26 |
| review | 3 | 4,600 | 331,020 | 30 | 06:33:23 | 06:33:52 |
| capture | 1 | 344 | 25,707 | 5 | 07:11:26 | 07:11:31 |
| synthesize | 1 | 4,897 | 87,585 | 29 | 07:11:31 | 07:12:01 |

- **claude-sonnet-5-5**: 2 agent · 5 calls · out 5,241 · in 10 · cache_read 113,292 · cache_create 79,795
- **claude-haiku-5-5**: 8 agent · 24 calls · out 17,703 · in 48 · cache_read 409,706 · cache_create 316,890
- **claude-opus-5-5**: 3 agent · 13 calls · out 4,600 · in 26 · cache_read 331,020 · cache_create 114,098

