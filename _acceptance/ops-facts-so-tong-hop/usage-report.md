### S4 round 1 — wf_340f32dd-d74 (15 agent, 54,212 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 14 | 11,465 | 28 | 758,136 | 150 |
| review:measurement | claude-opus-5-5 | 10 | 9,160 | 20 | 449,747 | 116 |
| review:conventions | claude-opus-5-5 | 14 | 7,170 | 28 | 573,901 | 105 |
| synthesize:report | claude-sonnet-5-5 | 3 | 7,013 | 6 | 63,793 | 39 |
| refute:ops-facts-so-tong-hop.test.mjs | claude-sonnet-5-5 | 8 | 2,607 | 16 | 179,822 | 28 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,602 | 4 | 19,861 | 21 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,285 | 4 | 19,055 | 33 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,019 | 4 | 19,863 | 11 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,015 | 4 | 16,810 | 17 |
| triage | claude-sonnet-5-5 | 2 | 1,972 | 4 | 20,105 | 14 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,727 | 4 | 19,875 | 9 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,597 | 4 | 19,881 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,216 | 4 | 19,886 | 12 |
| refute:ops-facts-so-tong-hop.test.mjs | claude-sonnet-5-5 | 3 | 1,018 | 6 | 39,811 | 11 |
| capture:provenance | claude-sonnet-5-5 | 2 | 346 | 4 | 15,605 | 5 |


wall: 248s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,285 | 19,055 | 33 | 11:44:06 | 11:44:39 |
| machine | 6 | 11,176 | 116,176 | 87 | 11:44:06 | 11:45:33 |
| review | 3 | 27,795 | 1,781,784 | 152 | 11:44:06 | 11:46:38 |
| triage | 1 | 1,972 | 20,105 | 14 | 11:46:40 | 11:46:55 |
| refute | 2 | 3,625 | 219,633 | 29 | 11:46:57 | 11:47:26 |
| capture | 1 | 346 | 15,605 | 5 | 11:47:28 | 11:47:33 |
| synthesize | 1 | 7,013 | 63,793 | 39 | 11:47:35 | 11:48:14 |

- **claude-opus-5-5**: 3 agent · 38 calls · out 27,795 · in 76 · cache_read 1,781,784 · cache_create 213,530
- **claude-sonnet-5-5**: 6 agent · 20 calls · out 15,241 · in 40 · cache_read 338,191 · cache_create 161,943
- **claude-haiku-5-5**: 6 agent · 12 calls · out 11,176 · in 24 · cache_read 116,176 · cache_create 111,905

### S4 round 2 — wf_c08b9b1c-ffe (12 agent, 35,813 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 4 | 8,689 | 8 | 116,692 | 57 |
| review:measurement | claude-opus-5-5 | 10 | 8,252 | 20 | 448,298 | 112 |
| review:conventions | claude-opus-5-5 | 6 | 3,967 | 12 | 139,501 | 56 |
| review:bugs | claude-opus-5-5 | 11 | 3,625 | 22 | 400,189 | 78 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,100 | 4 | 19,890 | 17 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,705 | 4 | 19,886 | 9 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,659 | 4 | 19,904 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,652 | 4 | 19,898 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,619 | 4 | 19,909 | 14 |
| triage | claude-sonnet-5-5 | 2 | 1,464 | 4 | 18,630 | 13 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 731 | 4 | 19,884 | 16 |
| capture:provenance | claude-sonnet-5-5 | 2 | 350 | 4 | 18,542 | 5 |


wall: 192s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 6 | 9,466 | 119,371 | 83 | 11:50:08 | 11:51:31 |
| review | 3 | 15,844 | 987,988 | 112 | 11:50:08 | 11:52:00 |
| triage | 1 | 1,464 | 18,630 | 13 | 11:52:01 | 11:52:14 |
| capture | 1 | 350 | 18,542 | 5 | 11:52:16 | 11:52:21 |
| synthesize | 1 | 8,689 | 116,692 | 57 | 11:52:23 | 11:53:20 |

- **claude-sonnet-5-5**: 3 agent · 8 calls · out 10,503 · in 16 · cache_read 153,864 · cache_create 104,527
- **claude-opus-5-5**: 3 agent · 27 calls · out 15,844 · in 54 · cache_read 987,988 · cache_create 149,730
- **claude-haiku-5-5**: 6 agent · 12 calls · out 9,466 · in 24 · cache_read 119,371 · cache_create 108,997

