### S4 round 1 — wf_b79de342-1a6 (55 agent, 162,067 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 20 | 29,257 | 42 | 1,911,301 | 303 |
| review:conventions | claude-opus-5-5 | 33 | 17,123 | 68 | 2,576,842 | 212 |
| synthesize:report | claude-sonnet-5-5 | 2 | 15,136 | 4 | 52,373 | 86 |
| review:bugs | claude-opus-5-5 | 25 | 14,745 | 56 | 2,027,381 | 187 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 8,751 | 6 | 75,032 | 57 |
| triage | claude-sonnet-5-5 | 2 | 7,699 | 4 | 37,259 | 44 |
| judge:E11b:domain-correctness | claude-sonnet-5-5 | 5 | 3,419 | 12 | 166,010 | 29 |
| machine:node scripts/link-nguoi-ban-s03/acceptan | claude-haiku-5-5 | 2 | 3,102 | 4 | 26,622 | 56 |
| machine:node scripts/link-nguoi-ban-s03/acceptan | claude-haiku-5-5 | 2 | 2,813 | 4 | 26,617 | 55 |
| judge:E11b:spec-alignment | claude-sonnet-5-5 | 3 | 2,793 | 8 | 63,477 | 22 |
| machine:cd app && npm test | claude-haiku-5-5 | 3 | 2,791 | 6 | 29,983 | 630 |
| judge:E11b:operational-feasibility | claude-sonnet-5-5 | 3 | 2,719 | 8 | 63,016 | 22 |
| machine:node scripts/link-nguoi-ban-s03/acceptan | claude-haiku-5-5 | 2 | 2,424 | 4 | 26,616 | 125 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,237 | 4 | 26,587 | 277 |
| refute:tien-kiem-ho-so.mjs | claude-sonnet-5-5 | 5 | 2,142 | 10 | 122,409 | 25 |
| refute:chon.mjs | claude-sonnet-5-5 | 8 | 2,038 | 16 | 198,554 | 26 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,822 | 4 | 26,601 | 8 |
| refute:import-airbnb.mjs | claude-sonnet-5-5 | 5 | 1,821 | 10 | 114,651 | 25 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,774 | 4 | 26,595 | 9 |
| refute:server.ts | claude-sonnet-5-5 | 4 | 1,764 | 8 | 82,560 | 21 |
| refute:extension.patch | claude-sonnet-5-5 | 7 | 1,726 | 14 | 175,345 | 25 |
| refute:extension.patch | claude-sonnet-5-5 | 6 | 1,706 | 12 | 139,234 | 22 |
| machine:node scripts/link-nguoi-ban-s03/acceptan | claude-haiku-5-5 | 2 | 1,608 | 4 | 26,621 | 11 |
| refute:tien-kiem-ho-so.test.mjs | claude-sonnet-5-5 | 2 | 1,597 | 4 | 25,410 | 15 |
| refute:lien-lac.mjs | claude-sonnet-5-5 | 6 | 1,553 | 12 | 136,950 | 19 |
| machine:node scripts/link-nguoi-ban-s03/acceptan | claude-haiku-5-5 | 2 | 1,461 | 4 | 26,617 | 53 |
| refute:ho-so-nap.itest.mjs | claude-sonnet-5-5 | 4 | 1,301 | 8 | 95,638 | 15 |
| machine:node scripts/link-nguoi-ban-s03/acceptan | claude-haiku-5-5 | 2 | 1,296 | 4 | 26,621 | 12 |
| refute:extension.patch | claude-sonnet-5-5 | 3 | 1,265 | 6 | 52,047 | 16 |
| refute:extension.patch | claude-sonnet-5-5 | 4 | 1,209 | 8 | 83,541 | 20 |
| refute:tien-kiem-ho-so.test.mjs | claude-sonnet-5-5 | 5 | 1,193 | 10 | 109,212 | 21 |
| refute:db-nap.mjs | claude-sonnet-5-5 | 2 | 1,176 | 4 | 25,179 | 11 |
| refute:chon.mjs | claude-sonnet-5-5 | 4 | 1,047 | 8 | 80,730 | 14 |
| refute:extension.patch | claude-sonnet-5-5 | 3 | 1,030 | 6 | 51,940 | 15 |
| refute:import-airbnb.mjs | claude-sonnet-5-5 | 4 | 1,029 | 8 | 82,427 | 18 |
| refute:phai-lui-ho-so.test.mjs | claude-sonnet-5-5 | 4 | 1,025 | 8 | 77,871 | 21 |
| machine:node scripts/link-nguoi-ban-s03/acceptan | claude-haiku-5-5 | 2 | 963 | 4 | 26,617 | 50 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 950 | 4 | 26,606 | 25 |
| refute:extension.patch | claude-sonnet-5-5 | 4 | 892 | 8 | 76,099 | 12 |
| refute:ho-so-api.test.ts | claude-sonnet-5-5 | 2 | 884 | 4 | 25,233 | 10 |
| machine:node scripts/link-nguoi-ban-s03/acceptan | claude-haiku-5-5 | 2 | 875 | 4 | 26,617 | 10 |
| refute:extension.patch | claude-sonnet-5-5 | 3 | 861 | 6 | 52,042 | 11 |
| machine:node scripts/link-nguoi-ban-s03/acceptan | claude-haiku-5-5 | 2 | 858 | 4 | 26,616 | 9 |
| refute:extension.patch | claude-sonnet-5-5 | 3 | 844 | 6 | 50,430 | 13 |
| refute:importer-schema-v5.test.mjs | claude-sonnet-5-5 | 3 | 814 | 6 | 62,891 | 10 |
| refute:extension.patch | claude-sonnet-5-5 | 3 | 776 | 6 | 52,795 | 14 |
| refute:ho-so-api.test.ts | claude-sonnet-5-5 | 3 | 735 | 6 | 53,027 | 9 |
| refute:extension.patch | claude-sonnet-5-5 | 3 | 732 | 6 | 50,879 | 15 |
| refute:importer-schema-v5.test.mjs | claude-sonnet-5-5 | 3 | 713 | 6 | 54,413 | 14 |
| refute:phai-lui-ho-so.test.mjs | claude-sonnet-5-5 | 2 | 698 | 4 | 25,326 | 10 |
| machine:node scripts/link-nguoi-ban-s03/acceptan | claude-haiku-5-5 | 2 | 672 | 4 | 26,621 | 10 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 669 | 4 | 23,394 | 37 |
| machine:node scripts/link-nguoi-ban-s03/acceptan | claude-haiku-5-5 | 2 | 661 | 4 | 26,620 | 10 |
| refute:tien-kiem-ho-so.test.mjs | claude-sonnet-5-5 | 2 | 547 | 4 | 25,280 | 10 |
| capture:provenance | claude-sonnet-5-5 | 2 | 331 | 4 | 22,191 | 6 |


wall: 1187s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 8,751 | 75,032 | 57 | 12:30:01 | 12:30:58 |
| machine | 17 | 26,976 | 452,571 | 997 | 12:30:01 | 12:46:37 |
| judge | 3 | 8,931 | 292,503 | 29 | 12:30:01 | 12:30:30 |
| review | 3 | 61,125 | 6,515,524 | 306 | 12:30:14 | 12:35:20 |
| triage | 1 | 7,699 | 37,259 | 44 | 12:46:39 | 12:47:23 |
| refute | 28 | 33,118 | 2,182,113 | 48 | 12:47:25 | 12:48:13 |
| capture | 1 | 331 | 22,191 | 6 | 12:48:14 | 12:48:20 |
| synthesize | 1 | 15,136 | 52,373 | 86 | 12:48:22 | 12:49:47 |

- **claude-opus-5-5**: 3 agent · 78 calls · out 61,125 · in 166 · cache_read 6,515,524 · cache_create 387,526
- **claude-sonnet-5-5**: 35 agent · 127 calls · out 73,966 · in 260 · cache_read 2,661,471 · cache_create 1,096,062
- **claude-haiku-5-5**: 17 agent · 35 calls · out 26,976 · in 70 · cache_read 452,571 · cache_create 447,652

