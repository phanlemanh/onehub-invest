### S4 round 1 — wf_225f68b0-e07 (15 agent, 54,709 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 10 | 13,556 | 20 | 394,561 | 149 |
| review:measurement | claude-opus-5-5 | 6 | 9,550 | 12 | 152,558 | 99 |
| synthesize:report | claude-sonnet-5-5 | 4 | 6,935 | 8 | 115,880 | 40 |
| review:conventions | claude-opus-5-5 | 6 | 6,565 | 12 | 184,411 | 69 |
| triage | claude-sonnet-5-5 | 2 | 4,735 | 4 | 22,417 | 33 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,603 | 4 | 19,539 | 16 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,074 | 4 | 20,049 | 17 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,861 | 4 | 20,063 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,594 | 4 | 20,057 | 8 |
| machine:node --test scripts/ui-capture-login.tes | claude-haiku-5-5 | 2 | 1,406 | 4 | 20,066 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,362 | 4 | 20,068 | 14 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 775 | 4 | 16,988 | 7 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 709 | 4 | 20,043 | 25 |
| machine:node --test scripts/ui-capture-browser.t | claude-haiku-5-5 | 2 | 570 | 4 | 20,067 | 32 |
| capture:provenance | claude-sonnet-5-5 | 2 | 414 | 4 | 15,786 | 6 |


wall: 236s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,603 | 19,539 | 16 | 02:06:36 | 02:06:52 |
| machine | 8 | 10,351 | 157,401 | 90 | 02:06:36 | 02:08:06 |
| review | 3 | 29,671 | 731,530 | 151 | 02:06:36 | 02:09:07 |
| triage | 1 | 4,735 | 22,417 | 33 | 02:09:09 | 02:09:42 |
| capture | 1 | 414 | 15,786 | 6 | 02:09:44 | 02:09:50 |
| synthesize | 1 | 6,935 | 115,880 | 40 | 02:09:52 | 02:10:32 |

- **claude-opus-5-5**: 3 agent · 22 calls · out 29,671 · in 44 · cache_read 731,530 · cache_create 164,344
- **claude-sonnet-5-5**: 4 agent · 10 calls · out 14,687 · in 20 · cache_read 173,622 · cache_create 114,025
- **claude-haiku-5-5**: 8 agent · 16 calls · out 10,351 · in 32 · cache_read 157,401 · cache_create 148,022

