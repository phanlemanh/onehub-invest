### S4 round 1 — wf_082c874b-844 (22 agent, 78,865 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 27 | 17,811 | 56 | 2,146,150 | 202 |
| review:measurement | claude-opus-5-5 | 12 | 11,750 | 26 | 729,280 | 129 |
| review:conventions | claude-opus-5-5 | 16 | 9,660 | 34 | 1,035,113 | 109 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 8,149 | 6 | 72,947 | 263 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,335 | 4 | 42,591 | 41 |
| triage | claude-sonnet-5-5 | 2 | 3,000 | 4 | 28,124 | 22 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 2,915 | 4 | 26,547 | 58 |
| machine:node _acceptance/lay-mau-khu-trung-theo- | claude-haiku-5-5 | 3 | 2,631 | 6 | 53,049 | 35 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,006 | 4 | 26,540 | 10 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 1,981 | 4 | 3,189 | 460 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,795 | 4 | 23,337 | 271 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,534 | 4 | 26,534 | 8 |
| machine:bash _acceptance/lay-mau-khu-trung-theo- | claude-haiku-5-5 | 2 | 1,313 | 4 | 26,566 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,200 | 4 | 26,545 | 16 |
| machine:cd pipeline && node --test scripts/eval- | claude-haiku-5-5 | 2 | 1,090 | 4 | 26,552 | 7 |
| machine:bash -o pipefail -c 'cd pipeline && node | claude-haiku-5-5 | 2 | 800 | 4 | 26,608 | 6 |
| machine:bash -o pipefail -c 'cd pipeline && node | claude-haiku-5-5 | 2 | 751 | 4 | 26,607 | 6 |
| machine:bash -o pipefail -c 'cd pipeline && node | claude-haiku-5-5 | 2 | 736 | 4 | 26,606 | 6 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 729 | 4 | 26,522 | 26 |
| machine:bash -o pipefail -c 'cd pipeline && node | claude-haiku-5-5 | 2 | 727 | 4 | 26,607 | 6 |
| machine:node _acceptance/lay-mau-khu-trung-theo- | claude-haiku-5-5 | 2 | 621 | 4 | 26,564 | 36 |
| capture:provenance | claude-sonnet-5-5 | 2 | 331 | 4 | 22,130 | 6 |


wall: 874s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 8,149 | 72,947 | 263 | 03:12:27 | 03:16:50 |
| machine | 15 | 20,829 | 398,373 | 800 | 03:12:27 | 03:25:47 |
| review | 3 | 39,221 | 3,910,543 | 203 | 03:12:27 | 03:15:50 |
| triage | 1 | 3,000 | 28,124 | 22 | 03:25:48 | 03:26:10 |
| capture | 1 | 331 | 22,130 | 6 | 03:26:12 | 03:26:18 |
| synthesize | 1 | 7,335 | 42,591 | 41 | 03:26:21 | 03:27:01 |

- **claude-opus-5-5**: 3 agent · 55 calls · out 39,221 · in 116 · cache_read 3,910,543 · cache_create 327,487
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 18,815 · in 18 · cache_read 165,792 · cache_create 152,608
- **claude-haiku-5-5**: 15 agent · 31 calls · out 20,829 · in 62 · cache_read 398,373 · cache_create 380,100

### S4 round 2 — wf_2358ca43-935 (17 agent, 35,158 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 6 | 6,192 | 12 | 234,339 | 41 |
| review:bugs | claude-opus-5-5 | 12 | 5,905 | 26 | 516,441 | 70 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 5,174 | 6 | 64,644 | 222 |
| review:conventions | claude-opus-5-5 | 4 | 2,860 | 8 | 85,293 | 30 |
| review:measurement | claude-opus-5-5 | 7 | 2,755 | 14 | 246,959 | 33 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,274 | 4 | 26,621 | 10 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,574 | 4 | 26,615 | 7 |
| triage | claude-sonnet-5-5 | 2 | 1,417 | 4 | 25,649 | 11 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,047 | 4 | 23,418 | 300 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 937 | 4 | 26,626 | 15 |
| machine:bash -o pipefail -c 'cd pipeline && node | claude-haiku-5-5 | 2 | 920 | 4 | 26,689 | 7 |
| machine:node _acceptance/lay-mau-khu-trung-theo- | claude-haiku-5-5 | 2 | 901 | 4 | 26,643 | 31 |
| machine:bash -o pipefail -c 'cd pipeline && node | claude-haiku-5-5 | 2 | 891 | 4 | 26,688 | 7 |
| machine:node _acceptance/lay-mau-khu-trung-theo- | claude-haiku-5-5 | 2 | 751 | 4 | 26,645 | 38 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 735 | 4 | 3,189 | 463 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 499 | 4 | 26,603 | 24 |
| capture:provenance | claude-sonnet-5-5 | 2 | 326 | 4 | 22,211 | 6 |


wall: 893s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,174 | 64,644 | 222 | 03:31:42 | 03:35:24 |
| machine | 10 | 10,529 | 239,737 | 829 | 03:31:42 | 03:45:31 |
| review | 3 | 11,520 | 848,693 | 72 | 03:31:42 | 03:32:54 |
| triage | 1 | 1,417 | 25,649 | 11 | 03:45:33 | 03:45:45 |
| capture | 1 | 326 | 22,211 | 6 | 03:45:46 | 03:45:52 |
| synthesize | 1 | 6,192 | 234,339 | 41 | 03:45:54 | 03:46:35 |

- **claude-sonnet-5-5**: 4 agent · 13 calls · out 13,109 · in 26 · cache_read 346,843 · cache_create 143,583
- **claude-opus-5-5**: 3 agent · 23 calls · out 11,520 · in 48 · cache_read 848,693 · cache_create 151,822
- **claude-haiku-5-5**: 10 agent · 20 calls · out 10,529 · in 40 · cache_read 239,737 · cache_create 263,897

