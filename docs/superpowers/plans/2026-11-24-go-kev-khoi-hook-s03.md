# Kế hoạch thi công — go-kev-khoi-hook-s03 (KEV1)

Hợp đồng đã duyệt 24/11 10:10Z (Mạnh). Mã thực chất do ZCode viết và đã nằm trên nhánh; phần lớn việc còn lại là chuẩn bị
lượt chấm và hồ sơ. Mọi task tuần tự (`independent: false`) — cùng một nhánh, máy chỉ chạy một bộ nặng một lúc.

| # | Việc | Files | Lệnh kiểm từng task | Phục vụ | Trạng thái |
|---|---|---|---|---|---|
| T1 | Gộp nhánh làn thu `zcode/k1-hook-khong-kev` @4016cf222 | collector/openclaw/*, scripts/zalo-watchdog.sh, pipeline/cron/com.oneinvest.kev-gate.plist (xoá), scripts/kev-nhan/acceptance.mjs, scripts/hook-zalo-spool/acceptance.mjs, scripts/job-exit.test.mjs, docs/ops/runtime-map.md | `node scripts/kev-nhan/acceptance.mjs handler-label` + bảy mode hook-zalo-spool | E2–E5, E7, E9 | xong (merge 24/11) |
| T2 | Cô lập bộ test hook khỏi `~/.openclaw` thật | collector/openclaw/handler.test.mjs | `node --test collector/openclaw/handler.test.mjs` 6/6; phá dòng gán HOME → dừng với «HOME tạm không có hiệu lực» | E1, E18 | xong |
| T3 | Chốt tĩnh «không còn Kev» có tự phá | _acceptance/go-kev-khoi-hook-s03/probes/khong-con-kev.sh | `bash …/khong-con-kev.sh $PWD` + `--tu-thu` (10 ca đỏ) | E8, E15, E17 | xong |
| T4 | Hồ sơ áp máy thu + bộ kiểm sau áp + round-trip writer thật | _acceptance/go-kev-khoi-hook-s03/ap-may-thu/** | `bash …/ap-may-thu/kiem.sh` → AP-MAY-THU PASS | E16 | xong |
| T5 | Khoá lệnh eval vào config | _acceptance/config.yaml (kev1_*) | `grep kev1_ _acceptance/config.yaml` | E1, E6, E8, E15–E18 | xong |
| T6 | Chuẩn bị lượt chấm (khi được cấp s4): gộp `origin/main` mới nhất, sinh lại PRODUCT-MAP/LO-TRINH, `npm ci` ở collector (worktree chưa có node_modules), kiểm `pipeline/node_modules` | collector/node_modules, pipeline/node_modules (không commit) | `cd collector && npm test` chạy được; `git status` sạch ngoài tệp máy sinh | E11–E14 | chờ s4 |
| T7 | S4: một lượt chấm Workflow, E13/E14 `long_running: 90` | — | verdict trong evidence-report.md | mọi E | chờ s4 |

Không có task viết mã sản phẩm mới. Áp lên máy thu KHÔNG thuộc kế hoạch này (phiên vận hành ZCode, sau gộp, theo chữ ký Cổng Bằng chứng).
