### S4 round 1 — wf_395aa27b-df4 (23 agent, 101,631 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 32 | 20,370 | 64 | 2,918,036 | 218 |
| review:bugs | claude-opus-5-5 | 26 | 19,514 | 52 | 1,893,930 | 211 |
| review:measurement | claude-opus-5-5 | 15 | 16,026 | 30 | 999,947 | 162 |
| synthesize:report | claude-sonnet-5-5 | 4 | 12,563 | 8 | 147,097 | 84 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 7,373 | 4 | 25,257 | 39 |
| triage | claude-sonnet-5-5 | 2 | 5,847 | 4 | 24,569 | 40 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,201 | 4 | 20,848 | 49 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,008 | 4 | 20,862 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,756 | 4 | 20,856 | 8 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,680 | 4 | 17,787 | 150 |
| refute:phat-bieu-cat-chuyen.mjs | claude-sonnet-5-5 | 5 | 1,591 | 10 | 95,657 | 16 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 1,543 | 4 | 20,842 | 32 |
| machine:node pipeline/phat-bieu-cat-chuyen.mjs - | claude-haiku-5-5 | 2 | 1,297 | 4 | 20,880 | 61 |
| machine:bash db/check-idempotent-tam.sh db/migra | claude-haiku-5-5 | 2 | 1,066 | 4 | 20,901 | 9 |
| machine:node pipeline/scripts/dung-lai-canonical | claude-haiku-5-5 | 2 | 970 | 4 | 20,870 | 12 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 946 | 4 | 20,867 | 16 |
| machine:cd pipeline && node --test scripts/phat- | claude-haiku-5-5 | 2 | 899 | 4 | 20,871 | 7 |
| machine:node pipeline/scripts/phat-bieu-chay-tha | claude-haiku-5-5 | 2 | 834 | 4 | 20,878 | 56 |
| refute:phat-bieu.test.mjs | claude-sonnet-5-5 | 2 | 789 | 4 | 16,743 | 9 |
| machine:node pipeline/scripts/nap-lai-ba-luot.mj | claude-haiku-5-5 | 2 | 691 | 4 | 20,877 | 144 |
| machine:node pipeline/scripts/dung-lai-canonical | claude-haiku-5-5 | 2 | 669 | 4 | 20,877 | 65 |
| machine:cd pipeline && node --test scripts/phat- | claude-haiku-5-5 | 2 | 637 | 4 | 20,874 | 179 |
| capture:provenance | claude-sonnet-5-5 | 2 | 361 | 4 | 16,594 | 6 |


wall: 413s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 7,373 | 25,257 | 39 | 00:14:16 | 00:14:55 |
| machine | 14 | 17,197 | 289,090 | 264 | 00:14:16 | 00:18:40 |
| review | 3 | 55,910 | 5,811,913 | 218 | 00:14:16 | 00:17:55 |
| triage | 1 | 5,847 | 24,569 | 40 | 00:18:40 | 00:19:20 |
| refute | 2 | 2,380 | 112,400 | 18 | 00:19:20 | 00:19:39 |
| capture | 1 | 361 | 16,594 | 6 | 00:19:39 | 00:19:45 |
| synthesize | 1 | 12,563 | 147,097 | 84 | 00:19:45 | 00:21:09 |

- **claude-opus-5-5**: 3 agent · 73 calls · out 55,910 · in 146 · cache_read 5,811,913 · cache_create 357,235
- **claude-sonnet-5-5**: 6 agent · 17 calls · out 28,524 · in 34 · cache_read 325,917 · cache_create 193,618
- **claude-haiku-5-5**: 14 agent · 28 calls · out 17,197 · in 56 · cache_read 289,090 · cache_create 264,186

