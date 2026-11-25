# Kế hoạch HT23 api-markets-khong-tra-so-s02

| Task | Files | Kiểm | Phục vụ | independent |
|---|---|---|---|---|
| 1. Route bỏ khoá và thứ tự S02 | `app/src/app/api/v1/markets/route.ts`, `app/tests/api-markets-khong-s02.test.tsx`, `_acceptance/config.yaml` (executor `api_markets_s02`) | `config:executors.test.api_markets_s02`; route cũ phải đỏ 2 ca | E1, E2 | false |
| 2. Sổ nói thật | `app/src/lib/api-surface.ts` | ca HT23-AC-6 | E6 | false |
| 3. Rào route public đọc bảng S02 + đột biến M26–M29 | `scripts/check-api-surface.mjs`, `scripts/check-api-surface.test.mjs` | `tir_be_mat`, `api_surface_mutation`; tắt luật thì 3 ca đỏ | E3, E4, E5 | false |
| 4. Hồi quy | — | `portal_static`, `app_ui`, tsc | E7, E8 | false |

Làm tuần tự trong vòng chính (cùng một rào và một route).
