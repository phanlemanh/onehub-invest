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

