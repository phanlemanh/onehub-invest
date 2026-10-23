### S4 round 1 — wf_f8220600-434 (24 agent, 49,700 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 4 | 7,688 | 8 | 111,182 | 56 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 5,480 | 4 | 21,808 | 32 |
| review:measurement | claude-opus-5-5 | 5 | 5,449 | 10 | 113,170 | 58 |
| review:conventions | claude-opus-5-5 | 8 | 4,297 | 16 | 278,840 | 46 |
| review:bugs | claude-opus-5-5 | 4 | 4,158 | 8 | 86,038 | 44 |
| triage | claude-sonnet-5-5 | 3 | 2,341 | 6 | 46,643 | 32 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,133 | 4 | 19,721 | 10 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,095 | 4 | 16,660 | 11 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,770 | 4 | 19,729 | 8 |
| judge:E7:operational-feasibility | claude-sonnet-5-5 | 3 | 1,429 | 6 | 51,940 | 20 |
| judge:E7:domain-correctness | claude-sonnet-5-5 | 3 | 1,403 | 6 | 48,408 | 18 |
| judge:E7:spec-alignment | claude-sonnet-5-5 | 3 | 1,374 | 6 | 51,936 | 23 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,338 | 4 | 19,735 | 7 |
| refute:check-db-autostart.sh | claude-sonnet-5-5 | 4 | 1,318 | 8 | 67,268 | 18 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,211 | 4 | 19,740 | 12 |
| machine:bash scripts/check-db-autostart.sh resta | claude-haiku-5-5 | 2 | 850 | 4 | 19,737 | 51 |
| machine:bash scripts/check-db-autostart.sh clean | claude-haiku-5-5 | 2 | 834 | 4 | 19,739 | 26 |
| machine:bash scripts/check-db-autostart.sh mutat | claude-haiku-5-5 | 2 | 787 | 4 | 19,739 | 6 |
| machine:bash scripts/check-db-autostart.sh live- | claude-haiku-5-5 | 2 | 776 | 4 | 19,740 | 6 |
| machine:bash scripts/check-db-autostart.sh stati | claude-haiku-5-5 | 2 | 671 | 4 | 19,736 | 5 |
| machine:bash scripts/check-db-autostart.sh live | claude-haiku-5-5 | 2 | 663 | 4 | 19,735 | 5 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 651 | 4 | 19,715 | 6 |
| machine:bash scripts/check-db-autostart.sh diff | claude-haiku-5-5 | 2 | 650 | 4 | 19,737 | 7 |
| capture:provenance | claude-sonnet-5-5 | 2 | 334 | 4 | 15,459 | 7 |


wall: 171s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,480 | 21,808 | 32 | 09:39:51 | 09:40:22 |
| machine | 13 | 14,429 | 253,463 | 54 | 09:39:51 | 09:40:45 |
| judge | 3 | 4,206 | 152,284 | 28 | 09:39:51 | 09:40:19 |
| review | 3 | 13,904 | 478,048 | 59 | 09:39:51 | 09:40:50 |
| triage | 1 | 2,341 | 46,643 | 32 | 09:40:50 | 09:41:21 |
| refute | 1 | 1,318 | 67,268 | 18 | 09:41:21 | 09:41:39 |
| capture | 1 | 334 | 15,459 | 7 | 09:41:39 | 09:41:46 |
| synthesize | 1 | 7,688 | 111,182 | 56 | 09:41:46 | 09:42:42 |

- **claude-sonnet-5-5**: 8 agent · 24 calls · out 21,367 · in 48 · cache_read 414,644 · cache_create 245,056
- **claude-opus-5-5**: 3 agent · 17 calls · out 13,904 · in 34 · cache_read 478,048 · cache_create 120,619
- **claude-haiku-5-5**: 13 agent · 26 calls · out 14,429 · in 52 · cache_read 253,463 · cache_create 255,428

### S4 round 2 — wf_743a00ba-312 (22 agent, 41,063 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 4 | 6,137 | 8 | 110,656 | 39 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 5,450 | 4 | 21,570 | 30 |
| review:bugs | claude-opus-5-5 | 3 | 3,407 | 6 | 39,791 | 36 |
| review:measurement | claude-opus-5-5 | 5 | 3,274 | 10 | 120,665 | 38 |
| review:conventions | claude-opus-5-5 | 4 | 2,824 | 8 | 84,171 | 30 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,313 | 4 | 19,477 | 10 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,960 | 4 | 19,483 | 8 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,830 | 4 | 16,422 | 10 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,596 | 4 | 19,491 | 8 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,425 | 4 | 19,497 | 7 |
| judge:E7:domain-correctness | claude-sonnet-5-5 | 3 | 1,398 | 6 | 48,660 | 15 |
| judge:E7:operational-feasibility | claude-sonnet-5-5 | 3 | 1,366 | 6 | 52,192 | 12 |
| judge:E7:spec-alignment | claude-sonnet-5-5 | 3 | 1,350 | 6 | 52,188 | 15 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,311 | 4 | 19,502 | 12 |
| machine:bash scripts/check-db-autostart.sh resta | claude-haiku-5-5 | 2 | 962 | 4 | 19,499 | 50 |
| machine:bash scripts/check-db-autostart.sh clean | claude-haiku-5-5 | 2 | 922 | 4 | 19,501 | 43 |
| machine:bash scripts/check-db-autostart.sh mutat | claude-haiku-5-5 | 2 | 731 | 4 | 19,501 | 6 |
| machine:bash scripts/check-db-autostart.sh stati | claude-haiku-5-5 | 2 | 684 | 4 | 19,498 | 5 |
| machine:bash scripts/check-db-autostart.sh diff | claude-haiku-5-5 | 2 | 680 | 4 | 19,499 | 7 |
| machine:bash scripts/check-db-autostart.sh live- | claude-haiku-5-5 | 2 | 563 | 4 | 19,502 | 5 |
| machine:bash scripts/check-db-autostart.sh live | claude-haiku-5-5 | 2 | 545 | 4 | 19,497 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 335 | 4 | 15,221 | 6 |


wall: 99s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,450 | 21,570 | 30 | 09:51:15 | 09:51:45 |
| machine | 13 | 15,522 | 250,369 | 54 | 09:51:15 | 09:52:09 |
| judge | 3 | 4,114 | 153,040 | 17 | 09:51:15 | 09:51:32 |
| review | 3 | 9,505 | 244,627 | 39 | 09:51:15 | 09:51:55 |
| capture | 1 | 335 | 15,221 | 6 | 09:52:09 | 09:52:15 |
| synthesize | 1 | 6,137 | 110,656 | 39 | 09:52:15 | 09:52:54 |

- **claude-sonnet-5-5**: 6 agent · 17 calls · out 16,036 · in 34 · cache_read 300,487 · cache_create 199,183
- **claude-opus-5-5**: 3 agent · 12 calls · out 9,505 · in 24 · cache_read 244,627 · cache_create 123,437
- **claude-haiku-5-5**: 13 agent · 26 calls · out 15,522 · in 52 · cache_read 250,369 · cache_create 252,111

