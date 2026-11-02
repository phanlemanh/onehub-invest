### S4 round 5 — wf_2a8c03ed-44e (18 agent, 93,599 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 9 | 25,988 | 18 | 628,577 | 270 |
| review:conventions | claude-opus-5-5 | 9 | 18,961 | 18 | 604,807 | 191 |
| review:measurement | claude-opus-5-5 | 5 | 16,266 | 12 | 191,935 | 163 |
| synthesize:report | claude-sonnet-5-5 | 2 | 8,175 | 4 | 33,616 | 43 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,685 | 6 | 54,619 | 221 |
| triage | claude-sonnet-5-5 | 2 | 3,728 | 4 | 25,163 | 26 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,541 | 4 | 21,923 | 226 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,172 | 4 | 0 | 502 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,971 | 4 | 21,941 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,722 | 4 | 21,935 | 9 |
| machine:cd pipeline && DATABASE_URL=${CT_DB_URL: | claude-haiku-5-5 | 2 | 1,552 | 4 | 22,026 | 19 |
| machine:cd pipeline && DATABASE_URL=${PB_DB_URL: | claude-haiku-5-5 | 2 | 1,197 | 4 | 22,031 | 10 |
| refute:066_can_theo_tin.sql | claude-sonnet-5-5 | 3 | 1,006 | 6 | 43,773 | 12 |
| refute:066_can_theo_tin.sql | claude-sonnet-5-5 | 4 | 953 | 8 | 69,893 | 13 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 932 | 4 | 21,946 | 21 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 764 | 4 | 21,921 | 57 |
| machine:node _acceptance/can-theo-tin-khi-phan-x | claude-haiku-5-5 | 2 | 657 | 4 | 21,971 | 28 |
| capture:provenance | claude-sonnet-5-5 | 2 | 329 | 4 | 17,582 | 5 |


wall: 993s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,685 | 54,619 | 221 | 22:48:31 | 22:52:12 |
| machine | 9 | 13,508 | 175,694 | 898 | 22:48:31 | 23:03:29 |
| review | 3 | 61,215 | 1,425,319 | 271 | 22:48:31 | 22:53:03 |
| triage | 1 | 3,728 | 25,163 | 26 | 23:03:31 | 23:03:57 |
| refute | 2 | 1,959 | 113,666 | 13 | 23:03:59 | 23:04:12 |
| capture | 1 | 329 | 17,582 | 5 | 23:04:14 | 23:04:19 |
| synthesize | 1 | 8,175 | 33,616 | 43 | 23:04:22 | 23:05:05 |

- **claude-opus-5-5**: 3 agent · 23 calls · out 61,215 · in 48 · cache_read 1,425,319 · cache_create 292,553
- **claude-sonnet-5-5**: 6 agent · 16 calls · out 18,876 · in 32 · cache_read 244,646 · cache_create 175,729
- **claude-haiku-5-5**: 9 agent · 18 calls · out 13,508 · in 36 · cache_read 175,694 · cache_create 201,172

### S4 round 6 — wf_c2fa84f1-cea (20 agent, 87,097 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 8 | 18,112 | 18 | 495,461 | 186 |
| review:conventions | claude-opus-5-5 | 8 | 16,533 | 18 | 448,336 | 170 |
| review:measurement | claude-opus-5-5 | 4 | 16,320 | 10 | 145,880 | 165 |
| synthesize:report | claude-sonnet-5-5 | 2 | 8,477 | 4 | 32,880 | 46 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,684 | 6 | 55,024 | 220 |
| triage | claude-sonnet-5-5 | 2 | 3,164 | 4 | 25,069 | 23 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,505 | 4 | 22,140 | 24 |
| refute:066_can_theo_tin.sql | claude-sonnet-5-5 | 5 | 2,168 | 10 | 96,631 | 21 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,141 | 4 | 19,004 | 306 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,928 | 4 | 22,158 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,711 | 4 | 22,152 | 9 |
| machine:cd pipeline && DATABASE_URL=${CT_DB_URL: | claude-haiku-5-5 | 2 | 1,520 | 4 | 22,243 | 27 |
| refute:ap-hai-lan.mjs | claude-sonnet-5-5 | 3 | 1,449 | 8 | 44,567 | 15 |
| refute:can-theo-tin.itest.mjs | claude-sonnet-5-5 | 4 | 1,318 | 8 | 87,213 | 16 |
| machine:cd pipeline && DATABASE_URL=${PB_DB_URL: | claude-haiku-5-5 | 2 | 1,152 | 4 | 22,248 | 11 |
| refute:066_can_theo_tin.sql | claude-sonnet-5-5 | 3 | 1,067 | 6 | 44,353 | 12 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,013 | 4 | 22,163 | 16 |
| machine:node _acceptance/can-theo-tin-khi-phan-x | claude-haiku-5-5 | 2 | 892 | 4 | 22,188 | 28 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 606 | 4 | 22,138 | 54 |
| capture:provenance | claude-sonnet-5-5 | 2 | 337 | 4 | 17,799 | 5 |


wall: 602s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,684 | 55,024 | 220 | 00:59:55 | 01:03:35 |
| machine | 9 | 13,468 | 196,434 | 501 | 00:59:55 | 01:08:15 |
| review | 3 | 50,965 | 1,089,677 | 188 | 00:59:55 | 01:03:03 |
| triage | 1 | 3,164 | 25,069 | 23 | 01:08:17 | 01:08:40 |
| refute | 4 | 6,002 | 272,764 | 21 | 01:08:42 | 01:09:02 |
| capture | 1 | 337 | 17,799 | 5 | 01:09:04 | 01:09:09 |
| synthesize | 1 | 8,477 | 32,880 | 46 | 01:09:11 | 01:09:57 |

- **claude-opus-5-5**: 3 agent · 20 calls · out 50,965 · in 46 · cache_read 1,089,677 · cache_create 274,583
- **claude-sonnet-5-5**: 8 agent · 24 calls · out 22,664 · in 50 · cache_read 403,536 · cache_create 236,048
- **claude-haiku-5-5**: 9 agent · 18 calls · out 13,468 · in 36 · cache_read 196,434 · cache_create 184,533

