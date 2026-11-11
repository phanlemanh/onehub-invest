### S4 vòng 1 — wf_02085945-2ab (13 agent, 34,476 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 12 | 7,358 | 24 | 534,948 | 78 |
| review:measurement | claude-opus-5-5 | 4 | 4,044 | 8 | 109,443 | 41 |
| synthesize:report | claude-sonnet-5-5 | 2 | 3,937 | 4 | 35,281 | 23 |
| machine:cd app && npm test | claude-haiku-5-5 | 5 | 3,468 | 10 | 90,351 | 767 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,263 | 6 | 64,682 | 60 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 10 | 3,042 | 20 | 254,189 | 1208 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,057 | 4 | 29,094 | 9 |
| review:bugs | claude-opus-5-5 | 7 | 1,837 | 14 | 228,841 | 23 |
| triage | claude-sonnet-5-5 | 2 | 1,782 | 4 | 28,791 | 13 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,669 | 4 | 29,088 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,103 | 4 | 29,099 | 16 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 579 | 4 | 29,076 | 28 |
| capture:provenance | claude-sonnet-5-5 | 2 | 337 | 4 | 24,578 | 5 |


wall: 2077s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 13,239 | 873,232 | 78 | 06:54:42 | 06:55:59 |
| machine | 6 | 11,918 | 460,897 | 2035 | 06:54:42 | 07:28:37 |
| baseline | 1 | 3,263 | 64,682 | 60 | 06:54:42 | 06:55:41 |
| triage | 1 | 1,782 | 28,791 | 13 | 07:28:37 | 07:28:50 |
| capture | 1 | 337 | 24,578 | 5 | 07:28:50 | 07:28:55 |
| synthesize | 1 | 3,937 | 35,281 | 23 | 07:28:55 | 07:29:18 |

- **claude-opus-5-5**: 3 agent · 23 calls · out 13,239 · in 46 · cache_read 873,232 · cache_create 146,033
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 9,319 · in 18 · cache_read 153,332 · cache_create 143,702
- **claude-haiku-5-5**: 6 agent · 23 calls · out 11,918 · in 46 · cache_read 460,897 · cache_create 225,235

