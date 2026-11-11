### S4 round 1 — wf_2c2eee60-71b (15 agent, 75,606 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:cd pipeline && npm test | claude-haiku-5-5 | 20 | 20,836 | 40 | 781,284 | 1867 |
| review:bugs | claude-opus-5-5 | 19 | 9,962 | 40 | 1,516,633 | 117 |
| review:conventions | claude-opus-5-5 | 16 | 9,902 | 34 | 810,656 | 108 |
| review:measurement | claude-opus-5-5 | 6 | 8,147 | 12 | 188,478 | 82 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,801 | 4 | 39,827 | 37 |
| machine:cd app && npm test | claude-haiku-5-5 | 6 | 4,135 | 12 | 120,837 | 814 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,031 | 6 | 64,975 | 37 |
| triage | claude-sonnet-5-5 | 2 | 3,543 | 4 | 29,208 | 29 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,965 | 4 | 27,990 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,656 | 4 | 27,984 | 8 |
| machine:bash db/db-thu.sh oneinvest_suite_da1 -- | claude-haiku-5-5 | 2 | 1,312 | 4 | 28,048 | 14 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,149 | 4 | 27,995 | 21 |
| machine:node --test pipeline/lib/danh-ba-vat-the | claude-haiku-5-5 | 3 | 1,069 | 8 | 57,276 | 8 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 754 | 4 | 27,972 | 37 |
| capture:provenance | claude-sonnet-5-5 | 2 | 344 | 4 | 23,584 | 11 |


wall: 2833s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,031 | 64,975 | 37 | 10:29:46 | 10:30:23 |
| machine | 8 | 32,876 | 1,099,386 | 2756 | 10:29:46 | 11:15:43 |
| review | 3 | 28,011 | 2,515,767 | 118 | 10:29:47 | 10:31:44 |
| triage | 1 | 3,543 | 29,208 | 29 | 11:15:43 | 11:16:12 |
| capture | 1 | 344 | 23,584 | 11 | 11:16:12 | 11:16:22 |
| synthesize | 1 | 6,801 | 39,827 | 37 | 11:16:22 | 11:16:59 |

- **claude-haiku-5-5**: 8 agent · 39 calls · out 32,876 · in 80 · cache_read 1,099,386 · cache_create 266,573
- **claude-opus-5-5**: 3 agent · 41 calls · out 28,011 · in 86 · cache_read 2,515,767 · cache_create 246,627
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 14,719 · in 18 · cache_read 157,594 · cache_create 148,750

