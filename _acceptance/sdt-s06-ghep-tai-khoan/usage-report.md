### S4 round 1 — wf_21886516-5c9 (16 agent, 130,907 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 13 | 37,008 | 28 | 1,402,967 | 416 |
| review:measurement | claude-opus-5-5 | 6 | 28,949 | 14 | 319,158 | 351 |
| review:conventions | claude-opus-5-5 | 10 | 26,308 | 22 | 701,157 | 254 |
| synthesize:report | claude-sonnet-5-5 | 4 | 10,358 | 8 | 145,998 | 81 |
| triage | claude-sonnet-5-5 | 2 | 7,768 | 4 | 29,720 | 55 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,234 | 6 | 56,065 | 38 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 3,202 | 4 | 20,304 | 27 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,590 | 4 | 23,448 | 193 |
| machine:node --test pipeline/scripts/gan-sdt-s06 | claude-haiku-5-5 | 2 | 2,321 | 4 | 23,476 | 12 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,281 | 4 | 23,462 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 2,054 | 4 | 23,456 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,169 | 4 | 23,467 | 16 |
| machine:node pipeline/gan-sdt-s06.mjs --thu | claude-haiku-5-5 | 2 | 999 | 4 | 23,472 | 10 |
| machine:bash _acceptance/sdt-s06-ghep-tai-khoan/ | claude-haiku-5-5 | 2 | 728 | 4 | 23,493 | 5 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 601 | 4 | 23,442 | 56 |
| capture:provenance | claude-sonnet-5-5 | 2 | 337 | 4 | 19,104 | 8 |


wall: 568s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,234 | 56,065 | 38 | 21:18:31 | 21:19:09 |
| machine | 9 | 15,945 | 208,020 | 320 | 21:18:31 | 21:23:52 |
| review | 3 | 92,265 | 2,423,282 | 417 | 21:18:31 | 21:25:28 |
| triage | 1 | 7,768 | 29,720 | 55 | 21:25:31 | 21:26:25 |
| capture | 1 | 337 | 19,104 | 8 | 21:26:28 | 21:26:36 |
| synthesize | 1 | 10,358 | 145,998 | 81 | 21:26:38 | 21:27:59 |

- **claude-opus-5-5**: 3 agent · 29 calls · out 92,265 · in 64 · cache_read 2,423,282 · cache_create 398,795
- **claude-sonnet-5-5**: 4 agent · 11 calls · out 22,697 · in 22 · cache_read 250,887 · cache_create 144,760
- **claude-haiku-5-5**: 9 agent · 18 calls · out 15,945 · in 36 · cache_read 208,020 · cache_create 197,018

