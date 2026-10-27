### S4 round 1 — wf_395aa27b-df4 (23 agent, 101,631 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 32 | 20,370 | 64 | 2,918,036 | 218 |
| review:bugs | claude-opus-5-5 | 26 | 19,514 | 52 | 1,893,930 | 211 |
| review:measurement | claude-opus-5-5 | 15 | 16,026 | 30 | 999,947 | 162 |
| synthesize:report | claude-sonnet-5-5 | 4 | 12,563 | 8 | 147,097 | 84 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 7,373 | 4 | 25,257 | 39 |
| triage | claude-sonnet-5-5 | 2 | 5,847 | 4 | 24,569 | 40 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,201 | 4 | 20,848 | 49 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,008 | 4 | 20,862 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,756 | 4 | 20,856 | 8 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,680 | 4 | 17,787 | 150 |
| refute:phat-bieu-cat-chuyen.mjs | claude-sonnet-5-5 | 5 | 1,591 | 10 | 95,657 | 16 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 1,543 | 4 | 20,842 | 32 |
| machine:node pipeline/phat-bieu-cat-chuyen.mjs - | claude-haiku-5-5 | 2 | 1,297 | 4 | 20,880 | 61 |
| machine:bash db/check-idempotent-tam.sh db/migra | claude-haiku-5-5 | 2 | 1,066 | 4 | 20,901 | 9 |
| machine:node pipeline/scripts/dung-lai-canonical | claude-haiku-5-5 | 2 | 970 | 4 | 20,870 | 12 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 946 | 4 | 20,867 | 16 |
| machine:cd pipeline && node --test scripts/phat- | claude-haiku-5-5 | 2 | 899 | 4 | 20,871 | 7 |
| machine:node pipeline/scripts/phat-bieu-chay-tha | claude-haiku-5-5 | 2 | 834 | 4 | 20,878 | 56 |
| refute:phat-bieu.test.mjs | claude-sonnet-5-5 | 2 | 789 | 4 | 16,743 | 9 |
| machine:node pipeline/scripts/nap-lai-ba-luot.mj | claude-haiku-5-5 | 2 | 691 | 4 | 20,877 | 144 |
| machine:node pipeline/scripts/dung-lai-canonical | claude-haiku-5-5 | 2 | 669 | 4 | 20,877 | 65 |
| machine:cd pipeline && node --test scripts/phat- | claude-haiku-5-5 | 2 | 637 | 4 | 20,874 | 179 |
| capture:provenance | claude-sonnet-5-5 | 2 | 361 | 4 | 16,594 | 6 |


wall: 413s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 7,373 | 25,257 | 39 | 00:14:16 | 00:14:55 |
| machine | 14 | 17,197 | 289,090 | 264 | 00:14:16 | 00:18:40 |
| review | 3 | 55,910 | 5,811,913 | 218 | 00:14:16 | 00:17:55 |
| triage | 1 | 5,847 | 24,569 | 40 | 00:18:40 | 00:19:20 |
| refute | 2 | 2,380 | 112,400 | 18 | 00:19:20 | 00:19:39 |
| capture | 1 | 361 | 16,594 | 6 | 00:19:39 | 00:19:45 |
| synthesize | 1 | 12,563 | 147,097 | 84 | 00:19:45 | 00:21:09 |

- **claude-opus-5-5**: 3 agent · 73 calls · out 55,910 · in 146 · cache_read 5,811,913 · cache_create 357,235
- **claude-sonnet-5-5**: 6 agent · 17 calls · out 28,524 · in 34 · cache_read 325,917 · cache_create 193,618
- **claude-haiku-5-5**: 14 agent · 28 calls · out 17,197 · in 56 · cache_read 289,090 · cache_create 264,186

### S4 round 2 — wf_ab5a6a2a-0be (19 agent, 42,402 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 5 | 10,715 | 10 | 194,466 | 74 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 5,359 | 4 | 23,225 | 29 |
| review:measurement | claude-opus-5-5 | 5 | 3,348 | 10 | 114,818 | 34 |
| review:bugs | claude-opus-5-5 | 8 | 3,301 | 16 | 244,754 | 35 |
| review:conventions | claude-opus-5-5 | 7 | 2,274 | 14 | 185,842 | 26 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,033 | 4 | 17,806 | 49 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,009 | 4 | 20,859 | 11 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,960 | 4 | 20,877 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,729 | 4 | 20,871 | 8 |
| refute:phat-bieu.test.mjs | claude-sonnet-5-5 | 4 | 1,520 | 8 | 69,176 | 17 |
| machine:node pipeline/phat-bieu-cat-chuyen.mjs - | claude-haiku-5-5 | 2 | 1,364 | 4 | 20,895 | 19 |
| machine:cd pipeline && node --test scripts/phat- | claude-haiku-5-5 | 2 | 1,139 | 4 | 20,886 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,105 | 4 | 20,882 | 14 |
| triage | claude-sonnet-5-5 | 2 | 1,025 | 4 | 19,226 | 12 |
| machine:node pipeline/scripts/dung-lai-canonical | claude-haiku-5-5 | 2 | 882 | 4 | 20,885 | 15 |
| machine:cd pipeline && node --test scripts/phat- | claude-haiku-5-5 | 2 | 783 | 4 | 20,889 | 57 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 780 | 4 | 20,857 | 31 |
| machine:node pipeline/scripts/dung-lai-canonical | claude-haiku-5-5 | 2 | 718 | 4 | 20,892 | 11 |
| capture:provenance | claude-sonnet-5-5 | 2 | 358 | 4 | 16,609 | 5 |


wall: 231s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,359 | 23,225 | 29 | 00:24:38 | 00:25:07 |
| machine | 11 | 14,502 | 226,599 | 123 | 00:24:38 | 00:26:41 |
| review | 3 | 8,923 | 545,414 | 36 | 00:24:38 | 00:25:14 |
| triage | 1 | 1,025 | 19,226 | 12 | 00:26:41 | 00:26:53 |
| refute | 1 | 1,520 | 69,176 | 17 | 00:26:53 | 00:27:10 |
| capture | 1 | 358 | 16,609 | 5 | 00:27:10 | 00:27:15 |
| synthesize | 1 | 10,715 | 194,466 | 74 | 00:27:15 | 00:28:29 |

- **claude-sonnet-5-5**: 5 agent · 15 calls · out 18,977 · in 30 · cache_read 322,702 · cache_create 166,766
- **claude-opus-5-5**: 3 agent · 20 calls · out 8,923 · in 40 · cache_read 545,414 · cache_create 116,119
- **claude-haiku-5-5**: 11 agent · 22 calls · out 14,502 · in 44 · cache_read 226,599 · cache_create 210,328

### S4 round 3 — wf_37741c4e-e08 (13 agent, 32,049 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 6 | 8,802 | 12 | 247,653 | 62 |
| review:measurement | claude-opus-5-5 | 7 | 4,258 | 14 | 200,212 | 44 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,875 | 4 | 23,862 | 18 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,592 | 4 | 20,844 | 34 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,200 | 4 | 20,850 | 27 |
| review:conventions | claude-opus-5-5 | 8 | 2,048 | 16 | 188,223 | 23 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,889 | 4 | 20,846 | 10 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,656 | 4 | 20,864 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,562 | 4 | 20,858 | 8 |
| review:bugs | claude-opus-5-5 | 6 | 1,514 | 12 | 142,176 | 18 |
| machine:cd pipeline && node --test scripts/phat- | claude-haiku-5-5 | 2 | 1,230 | 4 | 20,873 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,064 | 4 | 20,869 | 14 |
| capture:provenance | claude-sonnet-5-5 | 2 | 359 | 4 | 19,510 | 16 |


wall: 179s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,875 | 23,862 | 18 | 00:29:36 | 00:29:54 |
| machine | 7 | 12,193 | 146,004 | 101 | 00:29:36 | 00:31:17 |
| review | 3 | 7,820 | 530,611 | 44 | 00:29:36 | 00:30:21 |
| capture | 1 | 359 | 19,510 | 16 | 00:31:17 | 00:31:34 |
| synthesize | 1 | 8,802 | 247,653 | 62 | 00:31:34 | 00:32:35 |

- **claude-sonnet-5-5**: 3 agent · 10 calls · out 12,036 · in 20 · cache_read 291,025 · cache_create 95,405
- **claude-opus-5-5**: 3 agent · 21 calls · out 7,820 · in 42 · cache_read 530,611 · cache_create 107,562
- **claude-haiku-5-5**: 7 agent · 14 calls · out 12,193 · in 28 · cache_read 146,004 · cache_create 133,076

