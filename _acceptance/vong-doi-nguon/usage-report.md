### S4 round 1 — wf_78c10502-70e (18 agent, 59,445 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 10,513 | 4 | 35,418 | 75 |
| review:conventions | claude-opus-5-5 | 17 | 9,253 | 34 | 977,957 | 128 |
| review:measurement | claude-opus-5-5 | 8 | 8,556 | 16 | 286,641 | 101 |
| review:bugs | claude-opus-5-5 | 12 | 7,220 | 24 | 494,405 | 94 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 5,389 | 4 | 23,072 | 33 |
| triage | claude-sonnet-5-5 | 2 | 4,308 | 4 | 22,136 | 35 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,995 | 4 | 20,728 | 59 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,816 | 4 | 20,742 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,767 | 4 | 20,736 | 8 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,664 | 4 | 20,724 | 13 |
| machine:cd pipeline && node --test scripts/vong- | claude-haiku-5-5 | 2 | 1,368 | 4 | 20,766 | 10 |
| machine:cd pipeline && node --test scripts/vong- | claude-haiku-5-5 | 2 | 1,099 | 4 | 20,753 | 8 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 990 | 4 | 20,752 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 956 | 4 | 20,747 | 13 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 826 | 4 | 17,665 | 29 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 741 | 4 | 20,749 | 10 |
| machine:node --test --test-skip-pattern=GT-AC-1 | claude-haiku-5-5 | 2 | 558 | 4 | 20,766 | 9 |
| capture:provenance | claude-sonnet-5-5 | 2 | 426 | 4 | 16,465 | 5 |


wall: 245s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,389 | 23,072 | 33 | 08:53:35 | 08:54:08 |
| machine | 11 | 13,780 | 225,128 | 130 | 08:53:35 | 08:55:45 |
| review | 3 | 25,029 | 1,759,003 | 128 | 08:53:35 | 08:55:43 |
| triage | 1 | 4,308 | 22,136 | 35 | 08:55:45 | 08:56:20 |
| capture | 1 | 426 | 16,465 | 5 | 08:56:20 | 08:56:25 |
| synthesize | 1 | 10,513 | 35,418 | 75 | 08:56:25 | 08:57:40 |

- **claude-sonnet-5-5**: 4 agent · 8 calls · out 20,636 · in 16 · cache_read 97,091 · cache_create 126,098
- **claude-opus-5-5**: 3 agent · 37 calls · out 25,029 · in 74 · cache_read 1,759,003 · cache_create 207,565
- **claude-haiku-5-5**: 11 agent · 22 calls · out 13,780 · in 44 · cache_read 225,128 · cache_create 208,925

