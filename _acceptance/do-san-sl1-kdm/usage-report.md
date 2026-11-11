### S4 round 1 — wf_d0215d59-c34 (23 agent, 86,204 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node --test scripts/*.test.mjs | claude-haiku-5-5 | 11 | 11,787 | 22 | 359,849 | 913 |
| review:conventions | claude-opus-5-5 | 13 | 8,914 | 26 | 615,040 | 92 |
| review:measurement | claude-opus-5-5 | 7 | 8,814 | 14 | 254,025 | 83 |
| review:bugs | claude-opus-5-5 | 12 | 8,660 | 24 | 550,215 | 89 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,306 | 4 | 39,512 | 39 |
| machine:node --test scripts/kiem-tin-rao-gan-khu | claude-haiku-5-5 | 6 | 6,397 | 12 | 162,584 | 328 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 14 | 5,249 | 28 | 401,679 | 1445 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 5,016 | 6 | 69,142 | 128 |
| machine:cd app && npm test | claude-haiku-5-5 | 10 | 3,707 | 20 | 256,328 | 1157 |
| triage | claude-sonnet-5-5 | 2 | 3,211 | 4 | 30,722 | 22 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,684 | 4 | 25,400 | 58 |
| refute:kiem-tin-rao-gan-khu-vuc.test.mjs | claude-sonnet-5-5 | 5 | 2,195 | 10 | 140,301 | 18 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,106 | 4 | 28,718 | 8 |
| refute:kiem-tin-rao-gan-khu-vuc.test.mjs | claude-sonnet-5-5 | 5 | 1,968 | 10 | 125,169 | 17 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,700 | 4 | 28,712 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,136 | 4 | 28,723 | 28 |
| refute:khong-db-chung.sh | claude-sonnet-5-5 | 2 | 1,008 | 4 | 27,842 | 9 |
| refute:khong-db-chung.sh | claude-sonnet-5-5 | 3 | 991 | 6 | 56,295 | 9 |
| refute:khong-db-chung.sh | claude-sonnet-5-5 | 3 | 783 | 6 | 56,269 | 7 |
| machine:node --test --test-name-pattern=KDM-PX1 | claude-haiku-5-5 | 2 | 774 | 4 | 28,754 | 5 |
| machine:bash _acceptance/do-san-sl1-kdm/probes/k | claude-haiku-5-5 | 2 | 764 | 4 | 28,741 | 5 |
| machine:node scripts/kiem-tin-rao-gan-khu-vuc.mj | claude-haiku-5-5 | 2 | 709 | 4 | 28,739 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 325 | 4 | 24,197 | 3 |


wall: 2786s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,016 | 69,142 | 128 | 23:16:52 | 23:19:00 |
| machine | 11 | 37,013 | 1,378,227 | 2703 | 23:16:52 | 00:01:55 |
| review | 3 | 26,388 | 1,419,280 | 92 | 23:16:52 | 23:18:24 |
| triage | 1 | 3,211 | 30,722 | 22 | 00:01:55 | 00:02:17 |
| refute | 5 | 6,945 | 405,876 | 19 | 00:02:17 | 00:02:36 |
| capture | 1 | 325 | 24,197 | 3 | 00:02:36 | 00:02:39 |
| synthesize | 1 | 7,306 | 39,512 | 39 | 00:02:39 | 00:03:18 |

- **claude-haiku-5-5**: 11 agent · 55 calls · out 37,013 · in 110 · cache_read 1,378,227 · cache_create 377,986
- **claude-opus-5-5**: 3 agent · 32 calls · out 26,388 · in 64 · cache_read 1,419,280 · cache_create 168,584
- **claude-sonnet-5-5**: 9 agent · 27 calls · out 22,803 · in 54 · cache_read 569,449 · cache_create 305,562

### S4 round 2 — wf_d69008f1-c49 (17 agent, 91,325 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node --test scripts/*.test.mjs | claude-haiku-5-5 | 17 | 18,087 | 34 | 649,372 | 1400 |
| machine:node --test scripts/kiem-tin-rao-gan-khu | claude-haiku-5-5 | 16 | 15,931 | 32 | 566,555 | 1395 |
| review:bugs | claude-opus-5-5 | 12 | 12,379 | 24 | 619,141 | 129 |
| review:measurement | claude-opus-5-5 | 6 | 8,597 | 12 | 201,054 | 90 |
| review:conventions | claude-opus-5-5 | 10 | 7,830 | 20 | 414,174 | 82 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 13 | 5,753 | 26 | 357,608 | 1313 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,557 | 6 | 67,594 | 146 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,277 | 4 | 36,402 | 26 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,942 | 4 | 25,412 | 68 |
| machine:cd app && npm test | claude-haiku-5-5 | 8 | 2,632 | 16 | 189,339 | 962 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,085 | 4 | 28,730 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,541 | 4 | 28,724 | 7 |
| triage | claude-sonnet-5-5 | 2 | 1,465 | 4 | 28,407 | 11 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,234 | 4 | 28,735 | 27 |
| machine:bash _acceptance/do-san-sl1-kdm/probes/k | claude-haiku-5-5 | 2 | 957 | 4 | 28,753 | 5 |
| machine:node --test --test-name-pattern=KDM-PX1 | claude-haiku-5-5 | 2 | 730 | 4 | 28,766 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 328 | 4 | 24,209 | 3 |


wall: 2425s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 10 | 51,892 | 1,931,994 | 2384 | 00:17:55 | 00:57:39 |
| review | 3 | 28,806 | 1,234,369 | 130 | 00:17:55 | 00:20:05 |
| baseline | 1 | 4,557 | 67,594 | 146 | 00:17:55 | 00:20:21 |
| triage | 1 | 1,465 | 28,407 | 11 | 00:57:39 | 00:57:50 |
| capture | 1 | 328 | 24,209 | 3 | 00:57:50 | 00:57:53 |
| synthesize | 1 | 4,277 | 36,402 | 26 | 00:57:53 | 00:58:19 |

- **claude-haiku-5-5**: 10 agent · 66 calls · out 51,892 · in 132 · cache_read 1,931,994 · cache_create 364,414
- **claude-opus-5-5**: 3 agent · 28 calls · out 28,806 · in 56 · cache_read 1,234,369 · cache_create 191,594
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 10,627 · in 18 · cache_read 156,612 · cache_create 146,511

### S4 vòng 5 — wf_e287354a-4a3 (12 agent, 33,732 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:cd pipeline && npm test | claude-haiku-5-5 | 12 | 5,752 | 24 | 324,738 | 1165 |
| review:bugs | claude-opus-5-5 | 9 | 4,984 | 18 | 340,158 | 56 |
| review:measurement | claude-opus-5-5 | 5 | 4,920 | 10 | 146,775 | 51 |
| synthesize:report | claude-sonnet-5-5 | 4 | 4,348 | 8 | 128,295 | 36 |
| machine:cd app && npm test | claude-haiku-5-5 | 5 | 3,538 | 10 | 94,024 | 758 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,035 | 4 | 29,123 | 8 |
| triage | claude-sonnet-5-5 | 2 | 1,974 | 4 | 27,967 | 19 |
| review:conventions | claude-opus-5-5 | 7 | 1,646 | 14 | 203,022 | 19 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,602 | 4 | 29,117 | 7 |
| machine:cd agent && npm test | claude-haiku-5-5 | 3 | 1,394 | 6 | 60,406 | 33 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,200 | 4 | 29,128 | 21 |
| capture:provenance | claude-sonnet-5-5 | 2 | 339 | 4 | 24,602 | 5 |


wall: 2052s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 6 | 15,521 | 566,536 | 1992 | 09:43:09 | 10:16:21 |
| review | 3 | 11,550 | 689,955 | 57 | 09:43:09 | 09:44:06 |
| triage | 1 | 1,974 | 27,967 | 19 | 10:16:21 | 10:16:40 |
| capture | 1 | 339 | 24,602 | 5 | 10:16:40 | 10:16:45 |
| synthesize | 1 | 4,348 | 128,295 | 36 | 10:16:45 | 10:17:21 |

- **claude-haiku-5-5**: 6 agent · 26 calls · out 15,521 · in 52 · cache_read 566,536 · cache_create 224,171
- **claude-opus-5-5**: 3 agent · 21 calls · out 11,550 · in 42 · cache_read 689,955 · cache_create 132,841
- **claude-sonnet-5-5**: 3 agent · 8 calls · out 6,661 · in 16 · cache_read 180,864 · cache_create 109,386

