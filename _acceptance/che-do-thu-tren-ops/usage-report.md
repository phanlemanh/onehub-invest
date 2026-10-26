### S4 round 1 — wf_fb371845-36f (18 agent, 66,260 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| ui:E8 | claude-sonnet-5-5 | 23 | 12,669 | 46 | 2,058,543 | 186 |
| synthesize:report | claude-sonnet-5-5 | 5 | 9,197 | 10 | 169,542 | 57 |
| review:measurement | claude-opus-5-5 | 8 | 8,132 | 16 | 310,088 | 89 |
| review:conventions | claude-opus-5-5 | 12 | 7,923 | 24 | 539,008 | 90 |
| review:bugs | claude-opus-5-5 | 16 | 7,128 | 32 | 727,288 | 87 |
| triage | claude-sonnet-5-5 | 2 | 3,766 | 4 | 21,008 | 30 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,999 | 4 | 20,155 | 28 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,479 | 4 | 20,277 | 42 |
| machine:node --test scripts/job-exit.test.mjs | claude-haiku-5-5 | 2 | 2,359 | 4 | 20,297 | 13 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,167 | 4 | 20,309 | 18 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,810 | 4 | 20,323 | 8 |
| refute:che-do-thu.test.tsx | claude-sonnet-5-5 | 4 | 1,400 | 8 | 69,996 | 13 |
| refute:che-do-thu.test.tsx | claude-sonnet-5-5 | 3 | 1,025 | 6 | 43,728 | 10 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 939 | 4 | 17,245 | 13 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 706 | 4 | 20,304 | 8 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 583 | 4 | 20,279 | 6 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 553 | 4 | 20,317 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 425 | 4 | 16,046 | 5 |


wall: 290s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,999 | 20,155 | 28 | 11:10:00 | 11:10:28 |
| machine | 8 | 11,596 | 159,351 | 92 | 11:10:00 | 11:11:32 |
| ui | 1 | 12,669 | 2,058,543 | 186 | 11:10:00 | 11:13:06 |
| review | 3 | 23,183 | 1,576,384 | 90 | 11:10:00 | 11:11:30 |
| triage | 1 | 3,766 | 21,008 | 30 | 11:13:06 | 11:13:36 |
| refute | 2 | 2,425 | 113,724 | 13 | 11:13:36 | 11:13:48 |
| capture | 1 | 425 | 16,046 | 5 | 11:13:48 | 11:13:53 |
| synthesize | 1 | 9,197 | 169,542 | 57 | 11:13:53 | 11:14:50 |

- **claude-sonnet-5-5**: 7 agent · 41 calls · out 31,481 · in 82 · cache_read 2,399,018 · cache_create 285,316
- **claude-opus-5-5**: 3 agent · 36 calls · out 23,183 · in 72 · cache_read 1,576,384 · cache_create 190,594
- **claude-haiku-5-5**: 8 agent · 16 calls · out 11,596 · in 32 · cache_read 159,351 · cache_create 150,954

### S4 round 2 — wf_facf150a-521 (15 agent, 44,122 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| ui:E8 | claude-sonnet-5-5 | 28 | 14,602 | 56 | 2,696,990 | 167 |
| synthesize:report | claude-sonnet-5-5 | 4 | 6,484 | 8 | 107,113 | 41 |
| review:bugs | claude-opus-5-5 | 9 | 3,621 | 18 | 314,048 | 42 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,995 | 4 | 20,219 | 26 |
| machine:node --test scripts/job-exit.test.mjs | claude-haiku-5-5 | 2 | 2,421 | 4 | 20,361 | 13 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,048 | 4 | 20,343 | 11 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,999 | 4 | 20,347 | 18 |
| review:measurement | claude-opus-5-5 | 4 | 1,978 | 8 | 83,424 | 21 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,765 | 4 | 20,361 | 7 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,749 | 4 | 20,355 | 8 |
| review:conventions | claude-opus-5-5 | 4 | 1,625 | 8 | 76,690 | 18 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 900 | 4 | 17,309 | 13 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 763 | 4 | 20,368 | 7 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 747 | 4 | 20,341 | 37 |
| capture:provenance | claude-sonnet-5-5 | 2 | 425 | 4 | 16,084 | 5 |


wall: 213s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,995 | 20,219 | 26 | 11:18:15 | 11:18:41 |
| machine | 8 | 12,392 | 159,785 | 93 | 11:18:15 | 11:19:47 |
| ui | 1 | 14,602 | 2,696,990 | 167 | 11:18:15 | 11:21:02 |
| review | 3 | 7,224 | 474,162 | 44 | 11:18:15 | 11:18:58 |
| capture | 1 | 425 | 16,084 | 5 | 11:21:02 | 11:21:07 |
| synthesize | 1 | 6,484 | 107,113 | 41 | 11:21:07 | 11:21:48 |

- **claude-sonnet-5-5**: 4 agent · 36 calls · out 24,506 · in 72 · cache_read 2,840,406 · cache_create 210,233
- **claude-opus-5-5**: 3 agent · 17 calls · out 7,224 · in 34 · cache_read 474,162 · cache_create 125,407
- **claude-haiku-5-5**: 8 agent · 16 calls · out 12,392 · in 32 · cache_read 159,785 · cache_create 152,011

