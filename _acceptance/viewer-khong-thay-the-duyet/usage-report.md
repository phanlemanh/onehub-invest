### S4 round 1 — wf_1a6be5cd-dc7 (16 agent, 69,438 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| ui:E9 | claude-sonnet-5-5 | 30 | 16,225 | 60 | 2,749,516 | 306 |
| review:measurement | claude-opus-5-5 | 10 | 11,672 | 20 | 498,416 | 147 |
| synthesize:report | claude-sonnet-5-5 | 3 | 8,772 | 6 | 75,879 | 54 |
| review:conventions | claude-opus-5-5 | 17 | 6,025 | 36 | 817,792 | 101 |
| review:bugs | claude-opus-5-5 | 15 | 4,636 | 32 | 719,428 | 86 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,068 | 4 | 21,299 | 19 |
| triage | claude-sonnet-5-5 | 2 | 2,914 | 4 | 21,353 | 24 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,572 | 4 | 17,919 | 52 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,408 | 4 | 21,000 | 39 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,066 | 4 | 21,014 | 10 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,044 | 4 | 20,967 | 11 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,999 | 4 | 21,008 | 11 |
| machine:node --test scripts/dev-ops-account.test | claude-haiku-5-5 | 2 | 1,767 | 4 | 20,975 | 10 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 1,688 | 4 | 20,983 | 11 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,070 | 4 | 20,990 | 16 |
| capture:provenance | claude-sonnet-5-5 | 2 | 512 | 4 | 16,748 | 6 |


wall: 390s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,068 | 21,299 | 19 | 08:30:33 | 08:30:52 |
| machine | 8 | 15,614 | 164,856 | 139 | 08:30:33 | 08:32:53 |
| ui | 1 | 16,225 | 2,749,516 | 306 | 08:30:33 | 08:35:39 |
| review | 3 | 22,333 | 2,035,636 | 149 | 08:30:33 | 08:33:03 |
| triage | 1 | 2,914 | 21,353 | 24 | 08:35:39 | 08:36:03 |
| capture | 1 | 512 | 16,748 | 6 | 08:36:03 | 08:36:09 |
| synthesize | 1 | 8,772 | 75,879 | 54 | 08:36:09 | 08:37:03 |

- **claude-sonnet-5-5**: 5 agent · 39 calls · out 31,491 · in 78 · cache_read 2,884,795 · cache_create 248,634
- **claude-opus-5-5**: 3 agent · 42 calls · out 22,333 · in 88 · cache_read 2,035,636 · cache_create 216,660
- **claude-haiku-5-5**: 8 agent · 16 calls · out 15,614 · in 32 · cache_read 164,856 · cache_create 159,250

### S4 round 2 — wf_ba472db1-cc7 (16 agent, 64,547 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| ui:E9 | claude-sonnet-5-5 | 45 | 20,257 | 90 | 4,434,354 | 415 |
| synthesize:report | claude-sonnet-5-5 | 6 | 10,221 | 12 | 247,477 | 83 |
| review:bugs | claude-opus-5-5 | 15 | 7,312 | 32 | 687,278 | 108 |
| review:conventions | claude-opus-5-5 | 8 | 3,329 | 16 | 249,778 | 48 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,275 | 4 | 21,231 | 21 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,716 | 4 | 17,845 | 56 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,511 | 4 | 20,897 | 42 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,192 | 4 | 20,893 | 13 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,175 | 4 | 20,946 | 10 |
| review:measurement | claude-opus-5-5 | 5 | 1,987 | 10 | 113,864 | 30 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,983 | 4 | 20,940 | 10 |
| triage | claude-sonnet-5-5 | 2 | 1,916 | 4 | 20,466 | 17 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 1,619 | 4 | 20,909 | 11 |
| machine:node --test scripts/dev-ops-account.test | claude-haiku-5-5 | 2 | 1,504 | 4 | 20,901 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,211 | 4 | 20,916 | 15 |
| capture:provenance | claude-sonnet-5-5 | 2 | 339 | 4 | 16,980 | 7 |


wall: 522s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,275 | 21,231 | 21 | 09:09:00 | 09:09:20 |
| machine | 8 | 15,911 | 164,247 | 147 | 09:09:00 | 09:11:27 |
| ui | 1 | 20,257 | 4,434,354 | 415 | 09:09:00 | 09:15:54 |
| review | 3 | 12,628 | 1,050,920 | 111 | 09:09:00 | 09:10:50 |
| triage | 1 | 1,916 | 20,466 | 17 | 09:15:54 | 09:16:11 |
| capture | 1 | 339 | 16,980 | 7 | 09:16:11 | 09:16:18 |
| synthesize | 1 | 10,221 | 247,477 | 83 | 09:16:18 | 09:17:42 |

- **claude-sonnet-5-5**: 5 agent · 57 calls · out 36,008 · in 114 · cache_read 4,740,508 · cache_create 273,519
- **claude-opus-5-5**: 3 agent · 28 calls · out 12,628 · in 58 · cache_read 1,050,920 · cache_create 162,940
- **claude-haiku-5-5**: 8 agent · 16 calls · out 15,911 · in 32 · cache_read 164,247 · cache_create 158,477

