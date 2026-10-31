### S4 round 1 — wf_eae0b0bf-5ed (22 agent, 66,789 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 21 | 12,569 | 44 | 1,171,882 | 138 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 7,604 | 6 | 63,899 | 44 |
| review:measurement | claude-opus-5-5 | 7 | 7,456 | 14 | 303,938 | 79 |
| review:conventions | claude-opus-5-5 | 15 | 7,008 | 32 | 677,311 | 79 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,722 | 4 | 37,681 | 37 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 3,571 | 4 | 22,406 | 13 |
| triage | claude-sonnet-5-5 | 2 | 3,035 | 4 | 23,762 | 21 |
| machine:node --test pipeline/parse.test.mjs pipe | claude-haiku-5-5 | 2 | 2,121 | 4 | 22,428 | 10 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,001 | 4 | 22,388 | 54 |
| machine:node _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 1,762 | 4 | 22,424 | 42 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,706 | 4 | 22,400 | 8 |
| machine:bash _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 1,573 | 4 | 22,427 | 9 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 1,423 | 4 | 22,386 | 74 |
| machine:node _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 1,291 | 4 | 22,427 | 12 |
| machine:node _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 1,252 | 4 | 22,425 | 12 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 3 | 1,250 | 8 | 45,393 | 18 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 892 | 4 | 22,392 | 74 |
| machine:bash _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 856 | 4 | 22,423 | 39 |
| machine:node _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 817 | 4 | 22,425 | 49 |
| machine:bash _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 796 | 4 | 22,427 | 11 |
| machine:node _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 749 | 4 | 22,427 | 40 |
| capture:provenance | claude-sonnet-5-5 | 2 | 335 | 4 | 18,046 | 5 |


wall: 304s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 7,604 | 63,899 | 44 | 09:50:35 | 09:51:19 |
| machine | 15 | 22,060 | 359,198 | 241 | 09:50:35 | 09:54:36 |
| review | 3 | 27,033 | 2,153,131 | 139 | 09:50:35 | 09:52:54 |
| triage | 1 | 3,035 | 23,762 | 21 | 09:54:36 | 09:54:58 |
| capture | 1 | 335 | 18,046 | 5 | 09:54:58 | 09:55:02 |
| synthesize | 1 | 6,722 | 37,681 | 37 | 09:55:02 | 09:55:39 |

- **claude-opus-5-5**: 3 agent · 43 calls · out 27,033 · in 90 · cache_read 2,153,131 · cache_create 225,425
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 17,696 · in 18 · cache_read 143,388 · cache_create 137,402
- **claude-haiku-5-5**: 15 agent · 31 calls · out 22,060 · in 64 · cache_read 359,198 · cache_create 303,968

