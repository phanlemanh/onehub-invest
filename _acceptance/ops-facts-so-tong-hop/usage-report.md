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

