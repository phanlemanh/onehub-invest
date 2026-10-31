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

### S4 round 1 (chấm lại) — wf_a57af6f9-f79 (22 agent, 65,578 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 22 | 10,960 | 52 | 1,362,880 | 125 |
| review:conventions | claude-opus-5-5 | 19 | 9,437 | 40 | 976,784 | 104 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,745 | 4 | 37,899 | 44 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 7,604 | 6 | 63,999 | 42 |
| review:measurement | claude-opus-5-5 | 8 | 7,025 | 16 | 278,279 | 76 |
| triage | claude-sonnet-5-5 | 2 | 4,384 | 4 | 25,193 | 34 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,251 | 4 | 22,442 | 97 |
| machine:node --test pipeline/parse.test.mjs pipe | claude-haiku-5-5 | 2 | 2,240 | 4 | 22,478 | 11 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,628 | 4 | 22,450 | 8 |
| machine:bash _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 1,603 | 4 | 22,477 | 9 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 1,378 | 4 | 22,436 | 69 |
| machine:bash _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 3 | 1,315 | 8 | 45,506 | 156 |
| machine:node _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 1,035 | 4 | 22,474 | 41 |
| machine:bash _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 998 | 4 | 22,477 | 121 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 938 | 4 | 22,461 | 19 |
| machine:node _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 928 | 4 | 22,477 | 79 |
| machine:node _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 897 | 4 | 22,475 | 99 |
| machine:node _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 861 | 4 | 22,475 | 54 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 810 | 4 | 22,456 | 6 |
| machine:node _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 670 | 4 | 22,477 | 40 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 531 | 4 | 19,298 | 112 |
| capture:provenance | claude-sonnet-5-5 | 2 | 340 | 4 | 18,096 | 5 |


wall: 394s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 7,604 | 63,999 | 42 | 10:00:38 | 10:01:19 |
| machine | 15 | 18,083 | 356,859 | 311 | 10:00:38 | 10:05:49 |
| review | 3 | 27,422 | 2,617,943 | 126 | 10:00:38 | 10:02:44 |
| triage | 1 | 4,384 | 25,193 | 34 | 10:05:49 | 10:06:23 |
| capture | 1 | 340 | 18,096 | 5 | 10:06:23 | 10:06:28 |
| synthesize | 1 | 7,745 | 37,899 | 44 | 10:06:28 | 10:07:12 |

- **claude-opus-5-5**: 3 agent · 49 calls · out 27,422 · in 108 · cache_read 2,617,943 · cache_create 238,370
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 20,073 · in 18 · cache_read 145,187 · cache_create 139,159
- **claude-haiku-5-5**: 15 agent · 31 calls · out 18,083 · in 64 · cache_read 356,859 · cache_create 307,551

### S4 round 2 — wf_940e3926-7a1 (14 agent, 24,060 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 6 | 4,166 | 12 | 203,497 | 32 |
| review:conventions | claude-opus-5-5 | 7 | 2,580 | 16 | 191,517 | 28 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,398 | 4 | 22,409 | 72 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,127 | 4 | 22,415 | 74 |
| review:bugs | claude-opus-5-5 | 6 | 2,034 | 14 | 158,373 | 23 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,972 | 4 | 22,411 | 164 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,914 | 4 | 22,429 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,680 | 4 | 22,423 | 9 |
| machine:bash _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 1,476 | 4 | 22,450 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 999 | 4 | 22,434 | 18 |
| review:measurement | claude-opus-5-5 | 3 | 833 | 6 | 47,345 | 10 |
| machine:bash _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 818 | 4 | 22,450 | 88 |
| machine:node _acceptance/sdt-luu-goc-e164/probes | claude-haiku-5-5 | 2 | 733 | 4 | 22,448 | 55 |
| capture:provenance | claude-sonnet-5-5 | 2 | 330 | 4 | 18,069 | 4 |


wall: 383s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 9 | 14,117 | 201,869 | 347 | 11:27:11 | 11:32:57 |
| review | 3 | 5,447 | 397,235 | 28 | 11:27:11 | 11:27:39 |
| capture | 1 | 330 | 18,069 | 4 | 11:32:57 | 11:33:02 |
| synthesize | 1 | 4,166 | 203,497 | 32 | 11:33:02 | 11:33:34 |

- **claude-sonnet-5-5**: 2 agent · 8 calls · out 4,496 · in 16 · cache_read 221,566 · cache_create 67,595
- **claude-opus-5-5**: 3 agent · 16 calls · out 5,447 · in 36 · cache_read 397,235 · cache_create 113,948
- **claude-haiku-5-5**: 9 agent · 18 calls · out 14,117 · in 36 · cache_read 201,869 · cache_create 184,390

