### S4 round 1 — wf_0e274814-927 (16 agent, 42,545 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 7 | 5,476 | 14 | 189,201 | 56 |
| review:conventions | claude-opus-5-5 | 7 | 5,413 | 14 | 205,334 | 54 |
| synthesize:report | claude-sonnet-5-5 | 2 | 5,401 | 4 | 30,505 | 35 |
| review:measurement | claude-opus-5-5 | 4 | 4,447 | 8 | 82,676 | 47 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,203 | 4 | 21,153 | 20 |
| machine:node --test scripts/*.test.mjs | claude-haiku-5-5 | 2 | 2,700 | 4 | 20,877 | 106 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,653 | 4 | 20,863 | 66 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,272 | 4 | 20,869 | 42 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,019 | 4 | 17,831 | 12 |
| triage | claude-sonnet-5-5 | 2 | 1,848 | 4 | 20,263 | 16 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,815 | 4 | 20,883 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,636 | 4 | 20,877 | 9 |
| machine:node --test scripts/design-floor-vung.te | claude-haiku-5-5 | 2 | 1,415 | 4 | 20,885 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 926 | 4 | 20,888 | 15 |
| machine:node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME | claude-haiku-5-5 | 2 | 900 | 4 | 21,006 | 8 |
| capture:provenance | claude-sonnet-5-5 | 2 | 421 | 4 | 16,628 | 6 |


wall: 210s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,203 | 21,153 | 20 | 11:16:24 | 11:16:44 |
| machine | 9 | 16,336 | 184,979 | 153 | 11:16:24 | 11:18:56 |
| review | 3 | 15,336 | 477,211 | 57 | 11:16:24 | 11:17:21 |
| triage | 1 | 1,848 | 20,263 | 16 | 11:18:56 | 11:19:13 |
| capture | 1 | 421 | 16,628 | 6 | 11:19:13 | 11:19:19 |
| synthesize | 1 | 5,401 | 30,505 | 35 | 11:19:19 | 11:19:54 |

- **claude-opus-5-5**: 3 agent · 18 calls · out 15,336 · in 36 · cache_read 477,211 · cache_create 117,657
- **claude-sonnet-5-5**: 4 agent · 8 calls · out 10,873 · in 16 · cache_read 88,549 · cache_create 107,288
- **claude-haiku-5-5**: 9 agent · 18 calls · out 16,336 · in 36 · cache_read 184,979 · cache_create 177,209

