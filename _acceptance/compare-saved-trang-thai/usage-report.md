### S4 round 1 — wf_01094fd5-e79 (28 agent, 110,833 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| ui:E14 | claude-sonnet-5-5 | 43 | 24,307 | 86 | 4,354,981 | 376 |
| synthesize:report | claude-sonnet-5-5 | 5 | 13,572 | 10 | 186,398 | 90 |
| review:measurement | claude-opus-5-5 | 11 | 12,703 | 22 | 545,422 | 142 |
| review:bugs | claude-opus-5-5 | 22 | 12,115 | 44 | 1,214,579 | 165 |
| review:conventions | claude-opus-5-5 | 24 | 11,996 | 48 | 1,673,942 | 164 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 5,317 | 4 | 22,203 | 30 |
| triage | claude-sonnet-5-5 | 2 | 3,698 | 4 | 22,391 | 27 |
| judge:E13:spec-alignment | claude-sonnet-5-5 | 4 | 3,308 | 8 | 77,475 | 24 |
| judge:E13:domain-correctness | claude-sonnet-5-5 | 3 | 2,781 | 6 | 55,687 | 22 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,416 | 4 | 17,108 | 21 |
| judge:E13:operational-feasibility | claude-sonnet-5-5 | 2 | 1,989 | 4 | 20,661 | 16 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,776 | 4 | 20,179 | 10 |
| machine:BASE_URL=${BASE_URL:-http://localhost:34 | claude-haiku-5-5 | 2 | 1,448 | 4 | 20,217 | 10 |
| refute:compare-saved.test.tsx | claude-sonnet-5-5 | 3 | 1,346 | 6 | 43,205 | 16 |
| refute:compare-saved.test.tsx | claude-sonnet-5-5 | 4 | 1,313 | 8 | 62,663 | 22 |
| machine:cd app && node --test eslint-plugin-oneh | claude-haiku-5-5 | 2 | 1,233 | 4 | 20,205 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,226 | 4 | 20,190 | 14 |
| refute:compare-saved.test.tsx | claude-sonnet-5-5 | 4 | 1,085 | 8 | 60,941 | 14 |
| refute:smoke-compare-saved.mjs | claude-sonnet-5-5 | 3 | 1,046 | 6 | 40,072 | 14 |
| machine:node /Users/manhphan/.claude/plugins/cac | claude-haiku-5-5 | 2 | 843 | 4 | 20,252 | 7 |
| machine:node /Users/manhphan/.claude/plugins/cac | claude-haiku-5-5 | 2 | 812 | 4 | 20,251 | 8 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 755 | 4 | 20,167 | 7 |
| refute:smoke-compare-saved.mjs | claude-sonnet-5-5 | 2 | 733 | 4 | 19,237 | 9 |
| refute:smoke-compare-saved.mjs | claude-sonnet-5-5 | 2 | 707 | 4 | 16,445 | 8 |
| machine:cd app && node --test eslint-plugin-oneh | claude-haiku-5-5 | 2 | 702 | 4 | 20,204 | 6 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 649 | 4 | 20,171 | 14 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 537 | 4 | 20,217 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 420 | 4 | 16,256 | 16 |


wall: 541s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,317 | 22,203 | 30 | 15:01:51 | 15:02:21 |
| machine | 11 | 12,397 | 219,161 | 81 | 15:01:51 | 15:03:12 |
| ui | 1 | 24,307 | 4,354,981 | 376 | 15:01:51 | 15:08:07 |
| judge | 3 | 8,078 | 153,823 | 26 | 15:01:51 | 15:02:17 |
| review | 3 | 36,814 | 3,433,943 | 167 | 15:01:51 | 15:04:38 |
| triage | 1 | 3,698 | 22,391 | 27 | 15:08:09 | 15:08:37 |
| refute | 6 | 6,230 | 242,563 | 23 | 15:08:39 | 15:09:02 |
| capture | 1 | 420 | 16,256 | 16 | 15:09:04 | 15:09:20 |
| synthesize | 1 | 13,572 | 186,398 | 90 | 15:09:22 | 15:10:52 |

- **claude-sonnet-5-5**: 14 agent · 81 calls · out 61,622 · in 162 · cache_read 4,998,615 · cache_create 507,797
- **claude-opus-5-5**: 3 agent · 57 calls · out 36,814 · in 114 · cache_read 3,433,943 · cache_create 243,559
- **claude-haiku-5-5**: 11 agent · 22 calls · out 12,397 · in 44 · cache_read 219,161 · cache_create 202,043

