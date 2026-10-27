### S4 round 1 — wf_da84a382-0da (17 agent, 40,616 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 6 | 8,857 | 12 | 183,633 | 91 |
| synthesize:report | claude-sonnet-5-5 | 3 | 5,299 | 6 | 64,969 | 33 |
| review:bugs | claude-opus-5-5 | 7 | 4,594 | 14 | 204,669 | 82 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 4,023 | 4 | 25,043 | 29 |
| review:conventions | claude-opus-5-5 | 6 | 3,730 | 12 | 178,842 | 39 |
| triage | claude-sonnet-5-5 | 2 | 2,102 | 4 | 20,108 | 17 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,080 | 4 | 20,792 | 29 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,769 | 4 | 20,806 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,589 | 4 | 20,800 | 10 |
| machine:bash _acceptance/audit-all-test-moc-phut | claude-haiku-5-5 | 2 | 1,220 | 4 | 20,821 | 275 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,070 | 4 | 20,811 | 17 |
| machine:bash _acceptance/audit-all-test-moc-phut | claude-haiku-5-5 | 2 | 984 | 4 | 20,824 | 14 |
| machine:bash _acceptance/audit-all-test-moc-phut | claude-haiku-5-5 | 2 | 817 | 4 | 20,824 | 12 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 727 | 4 | 20,788 | 8 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 713 | 4 | 20,786 | 32 |
| machine:bash _acceptance/audit-all-test-moc-phut | claude-haiku-5-5 | 2 | 630 | 4 | 20,824 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 412 | 4 | 16,529 | 5 |


wall: 332s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,023 | 25,043 | 29 | 15:53:16 | 15:53:45 |
| machine | 10 | 11,599 | 208,076 | 277 | 15:53:16 | 15:57:53 |
| review | 3 | 17,181 | 567,144 | 92 | 15:53:16 | 15:54:48 |
| triage | 1 | 2,102 | 20,108 | 17 | 15:57:53 | 15:58:11 |
| capture | 1 | 412 | 16,529 | 5 | 15:58:11 | 15:58:15 |
| synthesize | 1 | 5,299 | 64,969 | 33 | 15:58:15 | 15:58:48 |

- **claude-opus-5-5**: 3 agent · 19 calls · out 17,181 · in 38 · cache_read 567,144 · cache_create 147,477
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 11,836 · in 18 · cache_read 126,649 · cache_create 108,643
- **claude-haiku-5-5**: 10 agent · 20 calls · out 11,599 · in 40 · cache_read 208,076 · cache_create 187,175

