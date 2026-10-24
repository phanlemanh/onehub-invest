### S4 round 1 — wf_dceb7a9c-9a6 (20 agent, 77,256 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 23 | 13,674 | 46 | 1,224,307 | 209 |
| review:conventions | claude-opus-5-5 | 20 | 11,889 | 40 | 1,097,974 | 176 |
| synthesize:report | claude-sonnet-5-5 | 4 | 9,882 | 8 | 116,776 | 60 |
| review:measurement | claude-opus-5-5 | 6 | 7,753 | 12 | 159,312 | 91 |
| judge:E8:domain-correctness | claude-sonnet-5-5 | 5 | 4,736 | 10 | 127,494 | 33 |
| triage | claude-sonnet-5-5 | 2 | 4,502 | 4 | 22,075 | 32 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,388 | 4 | 20,196 | 56 |
| judge:E8:operational-feasibility | claude-sonnet-5-5 | 3 | 3,268 | 6 | 73,384 | 25 |
| judge:E8:spec-alignment | claude-sonnet-5-5 | 6 | 3,114 | 12 | 169,092 | 24 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,117 | 4 | 16,868 | 16 |
| refute:check-cloud-sync.mjs | claude-sonnet-5-5 | 4 | 1,992 | 8 | 70,576 | 20 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,814 | 4 | 19,921 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,685 | 4 | 19,933 | 8 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,579 | 4 | 19,939 | 8 |
| refute:check-cloud-sync.mjs | claude-sonnet-5-5 | 3 | 1,502 | 6 | 43,452 | 14 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 1,189 | 4 | 19,949 | 31 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,113 | 4 | 19,944 | 11 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 1,062 | 4 | 19,952 | 25 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 665 | 4 | 19,919 | 15 |
| capture:provenance | claude-sonnet-5-5 | 2 | 332 | 4 | 15,663 | 5 |


wall: 335s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,388 | 20,196 | 56 | 09:01:15 | 09:02:11 |
| machine | 8 | 11,224 | 156,425 | 79 | 09:01:15 | 09:02:34 |
| judge | 3 | 11,118 | 369,970 | 33 | 09:01:15 | 09:01:49 |
| review | 3 | 33,316 | 2,481,593 | 211 | 09:01:15 | 09:04:47 |
| triage | 1 | 4,502 | 22,075 | 32 | 09:04:49 | 09:05:21 |
| refute | 2 | 3,494 | 114,028 | 20 | 09:05:23 | 09:05:42 |
| capture | 1 | 332 | 15,663 | 5 | 09:05:44 | 09:05:49 |
| synthesize | 1 | 9,882 | 116,776 | 60 | 09:05:51 | 09:06:51 |

- **claude-opus-5-5**: 3 agent · 49 calls · out 33,316 · in 98 · cache_read 2,481,593 · cache_create 203,011
- **claude-sonnet-5-5**: 9 agent · 31 calls · out 32,716 · in 62 · cache_read 658,708 · cache_create 321,004
- **claude-haiku-5-5**: 8 agent · 16 calls · out 11,224 · in 32 · cache_read 156,425 · cache_create 147,008

