### S4 round 1 — wf_0d41e217-0c3 (19 agent, 40,528 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 4 | 6,456 | 8 | 99,132 | 42 |
| review:bugs | claude-opus-5-5 | 7 | 6,348 | 14 | 197,620 | 70 |
| review:conventions | claude-opus-5-5 | 8 | 5,096 | 16 | 230,000 | 60 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,690 | 4 | 23,750 | 21 |
| review:measurement | claude-opus-5-5 | 5 | 3,068 | 10 | 108,569 | 37 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,578 | 4 | 20,028 | 21 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,162 | 4 | 20,034 | 17 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,654 | 4 | 20,042 | 8 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,542 | 4 | 20,030 | 9 |
| machine:node scripts/check-mcp-tools.mjs mutatio | claude-haiku-5-5 | 2 | 1,181 | 4 | 20,055 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,170 | 4 | 20,053 | 12 |
| judge:E6:operational-feasibility | claude-sonnet-5-5 | 2 | 1,003 | 4 | 20,350 | 8 |
| judge:E6:spec-alignment | claude-sonnet-5-5 | 3 | 856 | 6 | 46,916 | 8 |
| machine:node scripts/check-mcp-tools.mjs histori | claude-haiku-5-5 | 2 | 801 | 4 | 20,052 | 8 |
| triage | claude-sonnet-5-5 | 2 | 732 | 4 | 18,083 | 7 |
| judge:E6:domain-correctness | claude-sonnet-5-5 | 2 | 629 | 4 | 16,820 | 7 |
| machine:node scripts/check-mcp-tools.mjs static | claude-haiku-5-5 | 2 | 580 | 4 | 20,050 | 6 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 570 | 4 | 20,048 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 412 | 4 | 15,771 | 5 |


wall: 146s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,690 | 23,750 | 21 | 10:41:47 | 10:42:07 |
| machine | 9 | 12,238 | 180,392 | 85 | 10:41:47 | 10:43:12 |
| judge | 3 | 2,488 | 84,086 | 11 | 10:41:47 | 10:41:57 |
| review | 3 | 14,512 | 536,189 | 71 | 10:41:47 | 10:42:58 |
| triage | 1 | 732 | 18,083 | 7 | 10:43:14 | 10:43:21 |
| capture | 1 | 412 | 15,771 | 5 | 10:43:23 | 10:43:29 |
| synthesize | 1 | 6,456 | 99,132 | 42 | 10:43:31 | 10:44:12 |

- **claude-sonnet-5-5**: 7 agent · 17 calls · out 13,778 · in 34 · cache_read 240,822 · cache_create 189,247
- **claude-opus-5-5**: 3 agent · 20 calls · out 14,512 · in 40 · cache_read 536,189 · cache_create 119,544
- **claude-haiku-5-5**: 9 agent · 18 calls · out 12,238 · in 36 · cache_read 180,392 · cache_create 161,388

