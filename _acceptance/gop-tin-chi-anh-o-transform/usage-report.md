### S4 round 1 — wf_38a3dbd1-998 (16 agent, 55,351 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 9 | 9,612 | 18 | 324,243 | 108 |
| review:bugs | claude-opus-5-5 | 10 | 9,322 | 20 | 396,803 | 108 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,475 | 4 | 29,250 | 38 |
| review:conventions | claude-opus-5-5 | 11 | 5,520 | 22 | 389,132 | 71 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,504 | 4 | 21,914 | 21 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,764 | 4 | 21,308 | 56 |
| triage | claude-sonnet-5-5 | 2 | 2,508 | 4 | 21,155 | 20 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 2,353 | 4 | 21,334 | 13 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,235 | 4 | 18,280 | 58 |
| machine:bash db/db-thu.sh oneinvest_p1_n1 && cd | claude-haiku-5-5 | 2 | 2,184 | 4 | 21,492 | 43 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 2,089 | 4 | 21,322 | 12 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,057 | 4 | 21,328 | 12 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,976 | 4 | 21,310 | 15 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,315 | 4 | 21,333 | 16 |
| refute:transform-media.mjs | claude-sonnet-5-5 | 4 | 1,104 | 8 | 68,102 | 13 |
| capture:provenance | claude-sonnet-5-5 | 2 | 333 | 4 | 17,074 | 5 |


wall: 245s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,504 | 21,914 | 21 | 05:59:00 | 05:59:21 |
| machine | 8 | 16,973 | 167,707 | 169 | 05:59:00 | 06:01:49 |
| review | 3 | 24,454 | 1,110,178 | 111 | 05:59:00 | 06:00:50 |
| triage | 1 | 2,508 | 21,155 | 20 | 06:01:49 | 06:02:08 |
| refute | 1 | 1,104 | 68,102 | 13 | 06:02:08 | 06:02:22 |
| capture | 1 | 333 | 17,074 | 5 | 06:02:22 | 06:02:27 |
| synthesize | 1 | 6,475 | 29,250 | 38 | 06:02:27 | 06:03:04 |

- **claude-opus-5-5**: 3 agent · 30 calls · out 24,454 · in 60 · cache_read 1,110,178 · cache_create 159,740
- **claude-sonnet-5-5**: 5 agent · 12 calls · out 13,924 · in 24 · cache_read 157,495 · cache_create 143,628
- **claude-haiku-5-5**: 8 agent · 16 calls · out 16,973 · in 32 · cache_read 167,707 · cache_create 162,552

### S4 round 2 — wf_e6370b2d-4c9 (15 agent, 43,460 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 4 | 7,019 | 8 | 112,736 | 48 |
| review:measurement | claude-opus-5-5 | 6 | 6,779 | 12 | 200,275 | 77 |
| review:bugs | claude-opus-5-5 | 8 | 4,707 | 18 | 229,761 | 60 |
| review:conventions | claude-opus-5-5 | 8 | 3,549 | 18 | 218,515 | 46 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,482 | 4 | 21,722 | 20 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,712 | 4 | 21,116 | 56 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,416 | 4 | 18,088 | 59 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,162 | 4 | 21,118 | 15 |
| machine:bash db/db-thu.sh oneinvest_p1_n1 && cd | claude-haiku-5-5 | 2 | 2,160 | 4 | 21,300 | 42 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,099 | 4 | 21,136 | 11 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,721 | 4 | 21,130 | 10 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 1,540 | 4 | 21,142 | 12 |
| triage | claude-sonnet-5-5 | 2 | 1,486 | 4 | 19,845 | 15 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,284 | 4 | 21,141 | 17 |
| capture:provenance | claude-sonnet-5-5 | 2 | 344 | 4 | 16,882 | 5 |


wall: 235s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,482 | 21,722 | 20 | 06:08:07 | 06:08:27 |
| machine | 8 | 16,094 | 166,171 | 168 | 06:08:07 | 06:10:54 |
| review | 3 | 15,035 | 648,551 | 79 | 06:08:07 | 06:09:26 |
| triage | 1 | 1,486 | 19,845 | 15 | 06:10:54 | 06:11:09 |
| capture | 1 | 344 | 16,882 | 5 | 06:11:09 | 06:11:14 |
| synthesize | 1 | 7,019 | 112,736 | 48 | 06:11:14 | 06:12:02 |

- **claude-sonnet-5-5**: 4 agent · 10 calls · out 12,331 · in 20 · cache_read 171,185 · cache_create 119,003
- **claude-opus-5-5**: 3 agent · 22 calls · out 15,035 · in 48 · cache_read 648,551 · cache_create 141,159
- **claude-haiku-5-5**: 8 agent · 16 calls · out 16,094 · in 32 · cache_read 166,171 · cache_create 161,022

