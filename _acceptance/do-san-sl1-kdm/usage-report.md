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

