### S3 execute-parallel (Task 2 ∥ Task 5) — wf_68e1dad4-51b (2 agent, 22,747 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| exec:Task 2 | claude-opus-5-5 | 23 | 15,408 | 46 | 2,437,954 | 148 |
| exec:Task 5 | claude-opus-5-5 | 16 | 7,339 | 32 | 1,448,750 | 71 |


wall: 148s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| exec | 2 | 22,747 | 3,886,704 | 148 | 13:26:27 | 13:28:54 |

- **claude-opus-5-5**: 2 agent · 39 calls · out 22,747 · in 78 · cache_read 3,886,704 · cache_create 204,627

### S4 round 1 — wf_668c2e97-744 (18 agent, 71,519 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 20 | 15,217 | 40 | 1,075,113 | 167 |
| review:measurement | claude-opus-5-5 | 18 | 14,277 | 36 | 903,652 | 149 |
| review:conventions | claude-opus-5-5 | 18 | 9,678 | 36 | 810,303 | 109 |
| synthesize:report | claude-sonnet-5-5 | 3 | 9,300 | 6 | 73,984 | 55 |
| triage | claude-sonnet-5-5 | 2 | 5,019 | 4 | 20,152 | 41 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,632 | 4 | 11,845 | 18 |
| refute:route.ts | claude-sonnet-5-5 | 6 | 2,304 | 12 | 91,577 | 36 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,711 | 4 | 12,205 | 9 |
| judge:E13:domain-correctness | claude-sonnet-5-5 | 2 | 1,541 | 4 | 12,467 | 16 |
| judge:E13:spec-alignment | claude-sonnet-5-5 | 2 | 1,388 | 4 | 12,467 | 27 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,328 | 4 | 12,209 | 10 |
| judge:E6:domain-correctness | claude-sonnet-5-5 | 2 | 1,317 | 4 | 8,976 | 23 |
| judge:E13:operational-feasibility | claude-sonnet-5-5 | 2 | 1,257 | 4 | 12,469 | 18 |
| judge:E6:spec-alignment | claude-sonnet-5-5 | 2 | 1,234 | 4 | 12,442 | 16 |
| judge:E6:operational-feasibility | claude-sonnet-5-5 | 2 | 1,045 | 4 | 12,444 | 13 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 971 | 4 | 12,228 | 13 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 844 | 4 | 12,203 | 8 |
| capture:provenance | claude-sonnet-5-5 | 2 | 456 | 4 | 10,838 | 6 |


wall: 307s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,632 | 11,845 | 18 | 13:34:59 | 13:35:17 |
| machine | 4 | 4,854 | 48,845 | 40 | 13:34:59 | 13:35:39 |
| judge | 6 | 7,782 | 71,265 | 29 | 13:34:59 | 13:35:28 |
| review | 3 | 39,172 | 2,789,068 | 168 | 13:34:59 | 13:37:47 |
| triage | 1 | 5,019 | 20,152 | 41 | 13:37:47 | 13:38:29 |
| refute | 1 | 2,304 | 91,577 | 36 | 13:38:29 | 13:39:05 |
| capture | 1 | 456 | 10,838 | 6 | 13:39:05 | 13:39:11 |
| synthesize | 1 | 9,300 | 73,984 | 55 | 13:39:11 | 13:40:06 |

- **claude-opus-5-5**: 3 agent · 56 calls · out 39,172 · in 112 · cache_read 2,789,068 · cache_create 229,802
- **claude-sonnet-5-5**: 11 agent · 27 calls · out 27,493 · in 54 · cache_read 279,661 · cache_create 252,729
- **claude-haiku-5-5**: 4 agent · 8 calls · out 4,854 · in 16 · cache_read 48,845 · cache_create 56,133

### S4 round 2 — wf_878169ed-df4 (16 agent, 36,935 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 5 | 9,845 | 10 | 157,352 | 77 |
| review:conventions | claude-opus-5-5 | 11 | 4,757 | 22 | 259,648 | 52 |
| review:measurement | claude-opus-5-5 | 8 | 4,680 | 16 | 175,031 | 46 |
| review:bugs | claude-opus-5-5 | 10 | 3,586 | 20 | 238,653 | 41 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,134 | 4 | 12,480 | 10 |
| judge:E13:domain-correctness | claude-sonnet-5-5 | 2 | 1,838 | 4 | 12,764 | 19 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,553 | 4 | 12,484 | 7 |
| judge:E6:domain-correctness | claude-sonnet-5-5 | 3 | 1,499 | 8 | 35,871 | 18 |
| triage | claude-sonnet-5-5 | 2 | 1,488 | 4 | 11,721 | 16 |
| judge:E6:operational-feasibility | claude-sonnet-5-5 | 2 | 1,140 | 4 | 12,719 | 13 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,099 | 4 | 12,503 | 13 |
| judge:E6:spec-alignment | claude-sonnet-5-5 | 2 | 970 | 4 | 12,717 | 14 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 927 | 4 | 12,478 | 7 |
| judge:E13:spec-alignment | claude-sonnet-5-5 | 2 | 662 | 4 | 12,764 | 11 |
| capture:provenance | claude-sonnet-5-5 | 2 | 425 | 4 | 8,305 | 10 |
| judge:E13:operational-feasibility | claude-sonnet-5-5 | 2 | 332 | 4 | 12,766 | 15 |


wall: 154s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 4 | 5,713 | 49,945 | 38 | 13:44:47 | 13:45:25 |
| judge | 6 | 6,441 | 99,601 | 20 | 13:44:47 | 13:45:07 |
| review | 3 | 13,023 | 673,332 | 52 | 13:44:47 | 13:45:40 |
| triage | 1 | 1,488 | 11,721 | 16 | 13:45:40 | 13:45:55 |
| capture | 1 | 425 | 8,305 | 10 | 13:45:55 | 13:46:05 |
| synthesize | 1 | 9,845 | 157,352 | 77 | 13:46:05 | 13:47:21 |

- **claude-sonnet-5-5**: 9 agent · 22 calls · out 18,199 · in 46 · cache_read 276,979 · cache_create 220,551
- **claude-opus-5-5**: 3 agent · 29 calls · out 13,023 · in 58 · cache_read 673,332 · cache_create 97,651
- **claude-haiku-5-5**: 4 agent · 8 calls · out 5,713 · in 16 · cache_read 49,945 · cache_create 57,554

### S4 round 3 — wf_9bae5315-4be (22 agent, 82,814 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 14 | 16,236 | 28 | 722,461 | 170 |
| synthesize:report | claude-sonnet-5-5 | 7 | 15,562 | 14 | 300,987 | 105 |
| review:conventions | claude-opus-5-5 | 20 | 11,206 | 40 | 1,049,027 | 126 |
| review:measurement | claude-opus-5-5 | 10 | 10,137 | 20 | 441,459 | 104 |
| triage | claude-sonnet-5-5 | 2 | 5,684 | 4 | 22,900 | 42 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,703 | 4 | 18,395 | 22 |
| refute:run.ts | claude-sonnet-5-5 | 6 | 2,229 | 12 | 107,357 | 57 |
| judge:E13:spec-alignment | claude-sonnet-5-5 | 2 | 2,123 | 4 | 15,867 | 21 |
| judge:E13:domain-correctness | claude-sonnet-5-5 | 2 | 2,062 | 4 | 15,867 | 25 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,802 | 4 | 15,614 | 9 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,766 | 4 | 15,632 | 8 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,545 | 4 | 15,618 | 7 |
| judge:E17:domain-correctness | claude-sonnet-5-5 | 2 | 1,259 | 4 | 16,101 | 12 |
| judge:E17:operational-feasibility | claude-sonnet-5-5 | 2 | 1,250 | 4 | 16,103 | 13 |
| judge:E13:operational-feasibility | claude-sonnet-5-5 | 2 | 1,229 | 4 | 15,869 | 20 |
| judge:E17:spec-alignment | claude-sonnet-5-5 | 2 | 1,179 | 4 | 16,101 | 15 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,110 | 4 | 15,637 | 15 |
| judge:E6:domain-correctness | claude-sonnet-5-5 | 2 | 1,032 | 4 | 12,345 | 15 |
| judge:E6:spec-alignment | claude-sonnet-5-5 | 2 | 900 | 4 | 15,873 | 12 |
| judge:E6:operational-feasibility | claude-sonnet-5-5 | 2 | 858 | 4 | 15,875 | 11 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 586 | 4 | 15,612 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 356 | 4 | 14,283 | 11 |


wall: 386s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,703 | 18,395 | 22 | 00:36:45 | 00:37:07 |
| machine | 5 | 6,809 | 78,113 | 45 | 00:36:45 | 00:37:29 |
| judge | 9 | 11,892 | 140,001 | 30 | 00:36:45 | 00:37:15 |
| review | 3 | 37,579 | 2,212,947 | 171 | 00:36:45 | 00:39:36 |
| triage | 1 | 5,684 | 22,900 | 42 | 00:39:36 | 00:40:18 |
| refute | 1 | 2,229 | 107,357 | 57 | 00:40:18 | 00:41:15 |
| capture | 1 | 356 | 14,283 | 11 | 00:41:15 | 00:41:26 |
| synthesize | 1 | 15,562 | 300,987 | 105 | 00:41:26 | 00:43:11 |

- **claude-opus-5-5**: 3 agent · 44 calls · out 37,579 · in 88 · cache_read 2,212,947 · cache_create 220,626
- **claude-sonnet-5-5**: 14 agent · 37 calls · out 38,426 · in 74 · cache_read 603,923 · cache_create 355,497
- **claude-haiku-5-5**: 5 agent · 10 calls · out 6,809 · in 20 · cache_read 78,113 · cache_create 77,412

### S4 round 4 — wf_567f231c-93e (12 agent, 36,532 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 5 | 8,597 | 10 | 153,466 | 60 |
| review:conventions | claude-opus-5-5 | 10 | 5,682 | 20 | 303,120 | 61 |
| review:measurement | claude-opus-5-5 | 8 | 5,633 | 16 | 216,057 | 58 |
| review:bugs | claude-opus-5-5 | 6 | 4,797 | 12 | 143,868 | 51 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,311 | 4 | 14,852 | 16 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,794 | 4 | 12,587 | 8 |
| triage | claude-sonnet-5-5 | 2 | 1,744 | 4 | 15,733 | 14 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,530 | 4 | 15,648 | 7 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,459 | 4 | 15,662 | 7 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 1,395 | 4 | 15,642 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,151 | 4 | 15,667 | 11 |
| capture:provenance | claude-sonnet-5-5 | 2 | 439 | 4 | 11,399 | 9 |


wall: 144s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,311 | 14,852 | 16 | 00:53:41 | 00:53:57 |
| machine | 5 | 7,329 | 75,206 | 41 | 00:53:41 | 00:54:22 |
| review | 3 | 16,112 | 663,045 | 61 | 00:53:41 | 00:54:42 |
| triage | 1 | 1,744 | 15,733 | 14 | 00:54:42 | 00:54:57 |
| capture | 1 | 439 | 11,399 | 9 | 00:54:57 | 00:55:05 |
| synthesize | 1 | 8,597 | 153,466 | 60 | 00:55:05 | 00:56:05 |

- **claude-sonnet-5-5**: 4 agent · 11 calls · out 13,091 · in 22 · cache_read 195,450 · cache_create 108,778
- **claude-opus-5-5**: 3 agent · 24 calls · out 16,112 · in 48 · cache_read 663,045 · cache_create 124,687
- **claude-haiku-5-5**: 5 agent · 10 calls · out 7,329 · in 20 · cache_read 75,206 · cache_create 80,308

