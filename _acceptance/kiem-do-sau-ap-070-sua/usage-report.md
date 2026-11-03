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

### S4 round 2 — wf_742603ba-d12 (17 agent, 121,551 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 14 | 32,283 | 28 | 1,198,045 | 317 |
| review:measurement | claude-opus-5-5 | 9 | 27,331 | 18 | 631,565 | 264 |
| review:bugs | claude-opus-5-5 | 10 | 25,039 | 22 | 728,623 | 242 |
| synthesize:report | claude-sonnet-5-5 | 4 | 10,231 | 10 | 137,398 | 76 |
| triage | claude-sonnet-5-5 | 2 | 3,798 | 4 | 25,168 | 28 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,591 | 4 | 24,154 | 25 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,976 | 4 | 23,411 | 53 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,586 | 4 | 23,440 | 89 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,394 | 4 | 6,280 | 577 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,124 | 4 | 23,429 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 2,065 | 4 | 23,423 | 9 |
| refute:doi-chieu-that.mjs | claude-sonnet-5-5 | 4 | 1,571 | 8 | 89,007 | 20 |
| machine:node _acceptance/kiem-do-sau-ap-070-sua/ | claude-haiku-5-5 | 2 | 1,509 | 4 | 3,140 | 552 |
| refute:doi-chieu-that.mjs | claude-sonnet-5-5 | 2 | 1,221 | 4 | 22,474 | 17 |
| machine:node --test pipeline/scripts/kiem-do-sau | claude-haiku-5-5 | 2 | 1,220 | 4 | 23,443 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,117 | 4 | 23,465 | 16 |
| capture:provenance | claude-sonnet-5-5 | 2 | 495 | 4 | 19,069 | 11 |


wall: 906s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,591 | 24,154 | 25 | 08:51:13 | 08:51:38 |
| machine | 8 | 15,991 | 150,031 | 763 | 08:51:13 | 09:03:56 |
| review | 3 | 84,653 | 2,558,233 | 317 | 08:51:13 | 08:56:31 |
| triage | 1 | 3,798 | 25,168 | 28 | 09:03:59 | 09:04:26 |
| refute | 2 | 2,792 | 111,481 | 20 | 09:04:28 | 09:04:49 |
| capture | 1 | 495 | 19,069 | 11 | 09:04:51 | 09:05:01 |
| synthesize | 1 | 10,231 | 137,398 | 76 | 09:05:04 | 09:06:19 |

- **claude-opus-5-5**: 3 agent · 33 calls · out 84,653 · in 68 · cache_read 2,558,233 · cache_create 373,230
- **claude-sonnet-5-5**: 6 agent · 16 calls · out 20,907 · in 34 · cache_read 317,270 · cache_create 214,192
- **claude-haiku-5-5**: 8 agent · 16 calls · out 15,991 · in 32 · cache_read 150,031 · cache_create 209,611

