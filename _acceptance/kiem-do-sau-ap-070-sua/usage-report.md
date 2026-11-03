### S4 round 1 — wf_2b9676cf-88a (17 agent, 137,761 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 15 | 36,117 | 30 | 1,214,083 | 598 |
| review:conventions | claude-opus-5-5 | 13 | 31,861 | 28 | 1,010,752 | 311 |
| review:measurement | claude-opus-5-5 | 6 | 31,246 | 14 | 274,811 | 306 |
| synthesize:report | claude-sonnet-5-5 | 2 | 8,880 | 4 | 34,824 | 55 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 16 | 6,984 | 32 | 480,471 | 1815 |
| triage | claude-sonnet-5-5 | 2 | 4,901 | 4 | 25,886 | 37 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,544 | 4 | 24,192 | 24 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 2,158 | 4 | 23,461 | 9 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,075 | 4 | 23,467 | 8 |
| machine:node _acceptance/kiem-do-sau-ap-070-sua/ | claude-haiku-5-5 | 2 | 1,735 | 4 | 3,140 | 571 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,720 | 4 | 20,309 | 50 |
| refute:doi-chieu-that.mjs | claude-sonnet-5-5 | 4 | 1,548 | 8 | 77,920 | 23 |
| machine:node --test pipeline/scripts/kiem-do-sau | claude-haiku-5-5 | 3 | 1,341 | 8 | 47,359 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,189 | 4 | 23,508 | 16 |
| refute:doi-chieu-that.mjs | claude-sonnet-5-5 | 3 | 1,166 | 6 | 49,878 | 15 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 872 | 4 | 23,483 | 87 |
| capture:provenance | claude-sonnet-5-5 | 2 | 424 | 4 | 19,107 | 8 |


wall: 2128s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,544 | 24,192 | 24 | 07:58:22 | 07:58:46 |
| machine | 8 | 18,074 | 645,198 | 1997 | 07:58:22 | 08:31:39 |
| review | 3 | 99,224 | 2,499,646 | 599 | 07:58:22 | 08:08:22 |
| triage | 1 | 4,901 | 25,886 | 37 | 08:31:41 | 08:32:18 |
| refute | 2 | 2,714 | 127,798 | 23 | 08:32:20 | 08:32:43 |
| capture | 1 | 424 | 19,107 | 8 | 08:32:45 | 08:32:53 |
| synthesize | 1 | 8,880 | 34,824 | 55 | 08:32:55 | 08:33:50 |

- **claude-opus-5-5**: 3 agent · 34 calls · out 99,224 · in 72 · cache_read 2,499,646 · cache_create 364,837
- **claude-sonnet-5-5**: 6 agent · 15 calls · out 20,463 · in 30 · cache_read 231,807 · cache_create 185,470
- **claude-haiku-5-5**: 8 agent · 31 calls · out 18,074 · in 64 · cache_read 645,198 · cache_create 227,962

