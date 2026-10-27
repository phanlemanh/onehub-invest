### S4 round 1 — wf_a1fe3d8b-262 (20 agent, 62,123 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 10 | 12,903 | 20 | 525,425 | 145 |
| review:bugs | claude-opus-5-5 | 20 | 10,909 | 40 | 1,196,083 | 151 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,889 | 4 | 31,717 | 47 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 5,823 | 4 | 23,365 | 34 |
| review:conventions | claude-opus-5-5 | 19 | 5,807 | 38 | 1,183,796 | 94 |
| triage | claude-sonnet-5-5 | 2 | 2,838 | 4 | 20,955 | 22 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,195 | 4 | 20,679 | 24 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,820 | 4 | 17,618 | 11 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,686 | 4 | 20,687 | 10 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,672 | 4 | 20,693 | 9 |
| machine:node _acceptance/wanted-thanh-inquiry/ra | claude-haiku-5-5 | 2 | 1,594 | 4 | 20,715 | 9 |
| machine:node _acceptance/wanted-thanh-inquiry/ra | claude-haiku-5-5 | 2 | 1,303 | 4 | 20,713 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,009 | 4 | 20,698 | 14 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 860 | 4 | 20,673 | 29 |
| machine:cd pipeline && node --test scripts/vocab | claude-haiku-5-5 | 2 | 801 | 4 | 20,715 | 7 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 793 | 4 | 20,703 | 7 |
| machine:node _acceptance/wanted-thanh-inquiry/ra | claude-haiku-5-5 | 2 | 769 | 4 | 20,714 | 8 |
| machine:node scripts/check-cloud-catchup.mjs wan | claude-haiku-5-5 | 2 | 608 | 4 | 20,709 | 5 |
| machine:node pipeline/vocab.mjs --check | claude-haiku-5-5 | 2 | 440 | 4 | 20,689 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 404 | 4 | 16,415 | 6 |


wall: 229s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,823 | 23,365 | 34 | 01:33:24 | 01:33:57 |
| machine | 13 | 15,550 | 266,006 | 96 | 01:33:24 | 01:35:00 |
| review | 3 | 29,619 | 2,905,304 | 154 | 01:33:24 | 01:35:57 |
| triage | 1 | 2,838 | 20,955 | 22 | 01:35:57 | 01:36:20 |
| capture | 1 | 404 | 16,415 | 6 | 01:36:20 | 01:36:26 |
| synthesize | 1 | 7,889 | 31,717 | 47 | 01:36:26 | 01:37:12 |

- **claude-opus-5-5**: 3 agent · 49 calls · out 29,619 · in 98 · cache_read 2,905,304 · cache_create 264,005
- **claude-sonnet-5-5**: 4 agent · 8 calls · out 16,954 · in 16 · cache_read 92,452 · cache_create 122,473
- **claude-haiku-5-5**: 13 agent · 26 calls · out 15,550 · in 52 · cache_read 266,006 · cache_create 244,660

### S4 round 2 — wf_79052772-3e4 (16 agent, 48,353 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 18 | 10,280 | 36 | 1,216,446 | 180 |
| review:measurement | claude-opus-5-5 | 9 | 9,094 | 18 | 474,898 | 120 |
| synthesize:report | claude-sonnet-5-5 | 6 | 7,390 | 12 | 211,972 | 57 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 4,124 | 4 | 43,494 | 23 |
| review:conventions | claude-opus-5-5 | 10 | 3,983 | 20 | 288,619 | 63 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,245 | 4 | 20,696 | 26 |
| machine:cd pipeline && node --test scripts/vocab | claude-haiku-5-5 | 2 | 2,188 | 4 | 35,350 | 11 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,825 | 4 | 20,710 | 9 |
| machine:node _acceptance/wanted-thanh-inquiry/ra | claude-haiku-5-5 | 2 | 1,573 | 4 | 35,350 | 8 |
| machine:node _acceptance/wanted-thanh-inquiry/ra | claude-haiku-5-5 | 2 | 1,392 | 4 | 35,346 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,019 | 4 | 35,316 | 14 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 826 | 4 | 20,690 | 28 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 693 | 4 | 35,270 | 7 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 688 | 4 | 20,704 | 5 |
| machine:node pipeline/vocab.mjs --check | claude-haiku-5-5 | 2 | 613 | 4 | 35,298 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 420 | 4 | 16,432 | 8 |


wall: 245s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,124 | 43,494 | 23 | 01:47:18 | 01:47:41 |
| machine | 10 | 13,062 | 294,730 | 91 | 01:47:18 | 01:48:49 |
| review | 3 | 23,357 | 1,979,963 | 180 | 01:47:18 | 01:50:18 |
| capture | 1 | 420 | 16,432 | 8 | 01:50:18 | 01:50:26 |
| synthesize | 1 | 7,390 | 211,972 | 57 | 01:50:26 | 01:51:23 |

- **claude-opus-5-5**: 3 agent · 37 calls · out 23,357 · in 74 · cache_read 1,979,963 · cache_create 234,832
- **claude-sonnet-5-5**: 3 agent · 10 calls · out 11,934 · in 20 · cache_read 271,898 · cache_create 77,160
- **claude-haiku-5-5**: 10 agent · 20 calls · out 13,062 · in 40 · cache_read 294,730 · cache_create 100,371

