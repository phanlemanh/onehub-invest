### S4 round 1 — wf_0762f2ed-379 (33 agent, 133,240 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 15 | 25,212 | 30 | 1,164,661 | 390 |
| synthesize:report | claude-sonnet-5-5 | 3 | 15,753 | 6 | 93,685 | 97 |
| review:measurement | claude-opus-5-5 | 7 | 14,679 | 14 | 317,948 | 229 |
| review:conventions | claude-opus-5-5 | 23 | 13,377 | 46 | 1,304,886 | 236 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 7,349 | 4 | 22,635 | 38 |
| triage | claude-sonnet-5-5 | 2 | 5,188 | 4 | 22,573 | 39 |
| judge:E9:domain-correctness | claude-sonnet-5-5 | 2 | 4,474 | 4 | 15,970 | 34 |
| judge:E9:operational-feasibility | claude-sonnet-5-5 | 2 | 3,928 | 4 | 19,500 | 32 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 3,621 | 4 | 19,008 | 20 |
| judge:E10:spec-alignment | claude-sonnet-5-5 | 2 | 3,493 | 4 | 19,456 | 28 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 6 | 3,391 | 12 | 107,611 | 81 |
| judge:E9:spec-alignment | claude-sonnet-5-5 | 2 | 2,775 | 4 | 19,498 | 24 |
| refute:sync-cloud.mjs | claude-sonnet-5-5 | 5 | 2,598 | 10 | 100,244 | 28 |
| refute:sync-cloud.mjs | claude-sonnet-5-5 | 7 | 2,360 | 14 | 154,900 | 142 |
| judge:E10:operational-feasibility | claude-sonnet-5-5 | 2 | 2,350 | 4 | 19,458 | 20 |
| refute:check-cloud-sync.mjs | claude-sonnet-5-5 | 5 | 2,272 | 10 | 114,683 | 21 |
| judge:E10:domain-correctness | claude-sonnet-5-5 | 2 | 2,163 | 4 | 19,456 | 18 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,847 | 4 | 18,985 | 9 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,765 | 4 | 15,932 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,728 | 4 | 18,997 | 9 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,265 | 4 | 19,003 | 6 |
| refute:sync-cloud.mjs | claude-sonnet-5-5 | 4 | 1,260 | 8 | 59,514 | 13 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 1,182 | 4 | 19,013 | 61 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 1,171 | 4 | 18,983 | 8 |
| refute:check-cloud-sync.mjs | claude-sonnet-5-5 | 3 | 1,142 | 6 | 41,006 | 10 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 1,125 | 4 | 19,014 | 74 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 1,034 | 4 | 19,013 | 23 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 935 | 4 | 19,013 | 74 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 873 | 4 | 19,013 | 38 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 870 | 4 | 19,014 | 54 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 864 | 4 | 19,013 | 51 |
| machine:cd pipeline && node scripts/sync-pii-mut | claude-haiku-5-5 | 2 | 851 | 4 | 19,014 | 8 |
| capture:provenance | claude-sonnet-5-5 | 2 | 345 | 4 | 14,731 | 4 |


wall: 693s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 7,349 | 22,635 | 38 | 03:02:16 | 03:02:54 |
| machine | 15 | 22,522 | 370,626 | 83 | 03:02:16 | 03:03:39 |
| judge | 6 | 19,183 | 113,338 | 36 | 03:02:16 | 03:02:52 |
| review | 3 | 53,268 | 2,787,495 | 401 | 03:02:25 | 03:09:07 |
| triage | 1 | 5,188 | 22,573 | 39 | 03:09:07 | 03:09:46 |
| refute | 5 | 9,632 | 470,347 | 142 | 03:09:46 | 03:12:08 |
| capture | 1 | 345 | 14,731 | 4 | 03:12:08 | 03:12:13 |
| synthesize | 1 | 15,753 | 93,685 | 97 | 03:12:13 | 03:13:49 |

- **claude-opus-5-5**: 3 agent · 45 calls · out 53,268 · in 90 · cache_read 2,787,495 · cache_create 266,213
- **claude-sonnet-5-5**: 15 agent · 45 calls · out 57,450 · in 90 · cache_read 737,309 · cache_create 580,635
- **claude-haiku-5-5**: 15 agent · 34 calls · out 22,522 · in 68 · cache_read 370,626 · cache_create 286,529

### S4 round 2 — wf_35cc3601-9f2 (27 agent, 103,974 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 18 | 20,521 | 36 | 915,063 | 332 |
| review:measurement | claude-opus-5-5 | 16 | 19,891 | 32 | 1,146,563 | 310 |
| review:conventions | claude-opus-5-5 | 29 | 14,970 | 58 | 1,908,810 | 300 |
| synthesize:report | claude-sonnet-5-5 | 3 | 11,649 | 6 | 76,425 | 68 |
| triage | claude-sonnet-5-5 | 2 | 3,603 | 4 | 19,519 | 28 |
| judge:E9:operational-feasibility | claude-sonnet-5-5 | 2 | 2,713 | 4 | 18,997 | 22 |
| judge:E9:domain-correctness | claude-sonnet-5-5 | 2 | 2,490 | 4 | 15,467 | 19 |
| judge:E10:spec-alignment | claude-sonnet-5-5 | 3 | 2,466 | 6 | 53,802 | 21 |
| judge:E10:domain-correctness | claude-sonnet-5-5 | 3 | 2,439 | 6 | 53,815 | 19 |
| judge:E9:spec-alignment | claude-sonnet-5-5 | 2 | 2,143 | 4 | 18,995 | 17 |
| judge:E10:operational-feasibility | claude-sonnet-5-5 | 2 | 2,141 | 4 | 18,955 | 18 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,973 | 4 | 15,429 | 9 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 1,866 | 4 | 18,480 | 9 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,780 | 4 | 18,482 | 17 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,775 | 4 | 18,494 | 8 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,607 | 4 | 18,500 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,271 | 4 | 18,505 | 16 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 1,219 | 4 | 18,510 | 44 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 991 | 4 | 18,510 | 25 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 987 | 4 | 18,510 | 56 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 985 | 4 | 18,511 | 67 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 910 | 4 | 18,510 | 44 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 846 | 4 | 18,511 | 49 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 838 | 4 | 18,512 | 60 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 786 | 4 | 18,510 | 66 |
| machine:cd pipeline && node scripts/sync-pii-mut | claude-haiku-5-5 | 2 | 767 | 4 | 18,511 | 7 |
| capture:provenance | claude-sonnet-5-5 | 2 | 347 | 4 | 14,228 | 8 |


wall: 445s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 15 | 18,601 | 274,485 | 78 | 03:22:27 | 03:23:45 |
| judge | 6 | 14,392 | 180,031 | 24 | 03:22:27 | 03:22:51 |
| review | 3 | 55,382 | 3,970,436 | 334 | 03:22:35 | 03:28:09 |
| triage | 1 | 3,603 | 19,519 | 28 | 03:28:09 | 03:28:36 |
| capture | 1 | 347 | 14,228 | 8 | 03:28:36 | 03:28:44 |
| synthesize | 1 | 11,649 | 76,425 | 68 | 03:28:44 | 03:29:52 |

- **claude-opus-5-5**: 3 agent · 63 calls · out 55,382 · in 126 · cache_read 3,970,436 · cache_create 298,923
- **claude-sonnet-5-5**: 9 agent · 21 calls · out 29,991 · in 42 · cache_read 290,203 · cache_create 391,642
- **claude-haiku-5-5**: 15 agent · 30 calls · out 18,601 · in 60 · cache_read 274,485 · cache_create 275,234

