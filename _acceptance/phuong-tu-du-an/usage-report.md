### S4 round 1 — wf_449e292d-4f3 (15 agent, 49,191 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 15 | 8,386 | 30 | 678,515 | 89 |
| review:bugs | claude-opus-5-5 | 8 | 6,770 | 16 | 292,845 | 72 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 13 | 6,685 | 26 | 358,143 | 1394 |
| review:measurement | claude-opus-5-5 | 6 | 6,461 | 14 | 235,120 | 68 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,775 | 4 | 34,591 | 26 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 2,760 | 6 | 63,448 | 32 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,687 | 4 | 29,191 | 34 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,578 | 4 | 3,300 | 426 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,969 | 4 | 29,209 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,715 | 4 | 29,203 | 8 |
| triage | claude-sonnet-5-5 | 2 | 1,307 | 4 | 28,189 | 11 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,195 | 4 | 29,214 | 16 |
| refute:phuong-tu-du-an.test.mjs | claude-sonnet-5-5 | 2 | 789 | 4 | 28,096 | 8 |
| refute:phuong-tu-du-an.test.mjs | claude-sonnet-5-5 | 3 | 777 | 6 | 54,749 | 8 |
| capture:provenance | claude-sonnet-5-5 | 2 | 337 | 4 | 24,687 | 5 |


wall: 1937s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 21,617 | 1,206,480 | 89 | 13:24:42 | 13:26:12 |
| machine | 6 | 16,829 | 478,260 | 1886 | 13:24:42 | 13:56:08 |
| baseline | 1 | 2,760 | 63,448 | 32 | 13:24:42 | 13:25:14 |
| triage | 1 | 1,307 | 28,189 | 11 | 13:56:08 | 13:56:19 |
| refute | 2 | 1,566 | 82,845 | 9 | 13:56:19 | 13:56:29 |
| capture | 1 | 337 | 24,687 | 5 | 13:56:29 | 13:56:33 |
| synthesize | 1 | 4,775 | 34,591 | 26 | 13:56:33 | 13:57:00 |

- **claude-opus-5-5**: 3 agent · 29 calls · out 21,617 · in 60 · cache_read 1,206,480 · cache_create 197,257
- **claude-haiku-5-5**: 6 agent · 23 calls · out 16,829 · in 46 · cache_read 478,260 · cache_create 222,361
- **claude-sonnet-5-5**: 6 agent · 14 calls · out 10,745 · in 28 · cache_read 233,760 · cache_create 201,863

### S4 round 2 — wf_4596c0d8-905 (12 agent, 35,679 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 14 | 9,059 | 32 | 750,024 | 108 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 11 | 5,839 | 22 | 290,294 | 1276 |
| review:measurement | claude-opus-5-5 | 6 | 5,113 | 16 | 257,186 | 58 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,070 | 4 | 35,278 | 24 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,413 | 4 | 3,300 | 456 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,014 | 4 | 29,244 | 8 |
| review:conventions | claude-opus-5-5 | 7 | 1,912 | 14 | 204,124 | 26 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,633 | 4 | 29,238 | 7 |
| triage | claude-sonnet-5-5 | 2 | 1,333 | 4 | 27,466 | 11 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,227 | 4 | 29,249 | 19 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 658 | 4 | 29,226 | 31 |
| capture:provenance | claude-sonnet-5-5 | 2 | 408 | 4 | 24,722 | 4 |


wall: 1836s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 16,084 | 1,211,334 | 110 | 14:44:37 | 14:46:27 |
| machine | 6 | 13,784 | 410,551 | 1798 | 14:44:37 | 15:14:35 |
| triage | 1 | 1,333 | 27,466 | 11 | 15:14:35 | 15:14:46 |
| capture | 1 | 408 | 24,722 | 4 | 15:14:46 | 15:14:50 |
| synthesize | 1 | 4,070 | 35,278 | 24 | 15:14:50 | 15:15:13 |

- **claude-opus-5-5**: 3 agent · 27 calls · out 16,084 · in 62 · cache_read 1,211,334 · cache_create 196,573
- **claude-haiku-5-5**: 6 agent · 21 calls · out 13,784 · in 42 · cache_read 410,551 · cache_create 222,913
- **claude-sonnet-5-5**: 3 agent · 6 calls · out 5,811 · in 12 · cache_read 87,466 · cache_create 107,795

