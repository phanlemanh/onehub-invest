### S4 round 1 — wf_ca051c36-409 (17 agent, 47,290 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 15 | 9,176 | 30 | 650,234 | 108 |
| synthesize:report | claude-sonnet-5-5 | 3 | 6,318 | 6 | 66,935 | 36 |
| review:bugs | claude-opus-5-5 | 10 | 5,955 | 20 | 332,316 | 68 |
| review:measurement | claude-opus-5-5 | 5 | 5,714 | 10 | 130,686 | 66 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,852 | 4 | 19,967 | 35 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,572 | 4 | 20,230 | 21 |
| triage | claude-sonnet-5-5 | 2 | 2,224 | 4 | 19,842 | 17 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,121 | 4 | 17,179 | 18 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,953 | 4 | 20,250 | 10 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,794 | 4 | 20,232 | 10 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,556 | 4 | 20,244 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,186 | 4 | 20,255 | 13 |
| judge:E8:spec-alignment | claude-sonnet-5-5 | 2 | 1,016 | 4 | 20,418 | 8 |
| judge:E8:operational-feasibility | claude-sonnet-5-5 | 3 | 942 | 6 | 42,100 | 9 |
| judge:E8:domain-correctness | claude-sonnet-5-5 | 2 | 889 | 4 | 16,890 | 9 |
| machine:cd app && node --import tsx ../scripts/d | claude-haiku-5-5 | 2 | 686 | 4 | 20,263 | 7 |
| capture:provenance | claude-sonnet-5-5 | 2 | 336 | 4 | 15,973 | 5 |


wall: 172s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,852 | 19,967 | 35 | 12:12:58 | 12:13:33 |
| machine | 7 | 11,868 | 138,653 | 92 | 12:12:58 | 12:14:30 |
| judge | 3 | 2,847 | 79,408 | 11 | 12:12:58 | 12:13:09 |
| review | 3 | 20,845 | 1,113,236 | 108 | 12:12:58 | 12:14:46 |
| triage | 1 | 2,224 | 19,842 | 17 | 12:14:48 | 12:15:05 |
| capture | 1 | 336 | 15,973 | 5 | 12:15:07 | 12:15:12 |
| synthesize | 1 | 6,318 | 66,935 | 36 | 12:15:14 | 12:15:50 |

- **claude-opus-5-5**: 3 agent · 30 calls · out 20,845 · in 60 · cache_read 1,113,236 · cache_create 166,946
- **claude-sonnet-5-5**: 7 agent · 16 calls · out 14,577 · in 32 · cache_read 202,125 · cache_create 172,750
- **claude-haiku-5-5**: 7 agent · 14 calls · out 11,868 · in 28 · cache_read 138,653 · cache_create 131,314

