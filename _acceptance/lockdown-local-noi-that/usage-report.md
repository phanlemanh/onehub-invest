### S4 round 1 — wf_70f317cc-d4e (13 agent, 46,087 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 8 | 10,575 | 16 | 313,491 | 117 |
| review:bugs | claude-opus-5-5 | 13 | 7,783 | 26 | 571,645 | 99 |
| review:conventions | claude-opus-5-5 | 15 | 6,829 | 30 | 667,843 | 97 |
| synthesize:report | claude-sonnet-5-5 | 3 | 5,586 | 6 | 64,750 | 33 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,765 | 4 | 19,927 | 12 |
| triage | claude-sonnet-5-5 | 2 | 2,329 | 4 | 19,827 | 17 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,273 | 4 | 22,298 | 27 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,154 | 4 | 19,933 | 19 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,793 | 4 | 19,929 | 9 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,693 | 4 | 19,947 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,286 | 4 | 19,952 | 12 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 595 | 4 | 19,941 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 426 | 4 | 15,668 | 5 |


wall: 177s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,273 | 22,298 | 27 | 06:02:08 | 06:02:35 |
| machine | 6 | 10,286 | 119,629 | 65 | 06:02:08 | 06:03:13 |
| review | 3 | 25,187 | 1,552,979 | 121 | 06:02:08 | 06:04:10 |
| triage | 1 | 2,329 | 19,827 | 17 | 06:04:10 | 06:04:27 |
| capture | 1 | 426 | 15,668 | 5 | 06:04:27 | 06:04:32 |
| synthesize | 1 | 5,586 | 64,750 | 33 | 06:04:32 | 06:05:05 |

- **claude-opus-5-5**: 3 agent · 36 calls · out 25,187 · in 72 · cache_read 1,552,979 · cache_create 187,256
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 10,614 · in 18 · cache_read 122,543 · cache_create 110,811
- **claude-haiku-5-5**: 6 agent · 12 calls · out 10,286 · in 24 · cache_read 119,629 · cache_create 121,046

