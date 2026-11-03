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

### S4 round 3 — wf_47e85c3c-810 (15 agent, 125,797 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 11 | 32,647 | 26 | 897,166 | 320 |
| review:measurement | claude-opus-5-5 | 9 | 29,390 | 20 | 614,437 | 279 |
| review:conventions | claude-opus-5-5 | 11 | 27,741 | 22 | 800,885 | 272 |
| synthesize:report | claude-sonnet-5-5 | 2 | 9,078 | 4 | 39,930 | 53 |
| triage | claude-sonnet-5-5 | 2 | 5,992 | 4 | 27,763 | 42 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,493 | 4 | 24,166 | 24 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,780 | 4 | 23,422 | 170 |
| machine:node _acceptance/kiem-do-sau-ap-070-sua/ | claude-haiku-5-5 | 4 | 2,617 | 8 | 55,200 | 617 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,490 | 4 | 3,140 | 449 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,190 | 4 | 23,442 | 10 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,096 | 4 | 3,140 | 386 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 2,061 | 4 | 23,436 | 10 |
| machine:node --test pipeline/scripts/kiem-do-sau | claude-haiku-5-5 | 2 | 1,497 | 4 | 23,456 | 237 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,099 | 4 | 23,447 | 20 |
| capture:provenance | claude-sonnet-5-5 | 3 | 626 | 6 | 41,275 | 9 |


wall: 1168s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,493 | 24,166 | 24 | 09:18:37 | 09:19:01 |
| machine | 8 | 16,830 | 178,683 | 1056 | 09:18:37 | 09:36:13 |
| review | 3 | 89,778 | 2,312,488 | 321 | 09:18:37 | 09:23:58 |
| triage | 1 | 5,992 | 27,763 | 42 | 09:36:15 | 09:36:57 |
| capture | 1 | 626 | 41,275 | 9 | 09:36:59 | 09:37:08 |
| synthesize | 1 | 9,078 | 39,930 | 53 | 09:37:11 | 09:38:05 |

- **claude-opus-5-5**: 3 agent · 31 calls · out 89,778 · in 68 · cache_read 2,312,488 · cache_create 379,899
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 19,189 · in 18 · cache_read 133,134 · cache_create 136,760
- **claude-haiku-5-5**: 8 agent · 18 calls · out 16,830 · in 36 · cache_read 178,683 · cache_create 230,962

