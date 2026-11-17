---
schema_version: 1
feature: Lưới phạm vi làn của JST-AC-8 đo trên bản chép — hai ô đột biến dựng diff từ hai tệp tạm bằng git diff --no-index thay vì ghi vào scripts/zalo-import-daily.sh thật trong cây làm việc
slug: job-step-do-tren-ban-chep
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [pipeline]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-17T02:35:50Z
design_doc: docs/superpowers/specs/2026-11-17-job-step-do-tren-ban-chep-design.md
approved_by:
approved_at:
---

# Acceptance Contract: job-step-do-tren-ban-chep

## Context

Ca `JST-AC-8 lưới phạm vi làn` của `scripts/job-step-thoi-luong.test.mjs` làm hai ô đột biến bằng cách ghi thẳng vào
`scripts/zalo-import-daily.sh` thật trong cây làm việc rồi hoàn nguyên ở `finally`. Ngắt giữa chừng thì tệp bọc thật còn
dính dòng chèn; chạy song song thì bốn bộ test khác đọc đúng tệp ấy có thể chép phải bản đang sửa. Đây là Ngoài-1 và
Ngoài-5 của `job-step-ghi-thoi-luong`, Mạnh định tuyến «mở hợp đồng mới» ở Cổng Bằng chứng 17/11.

## Acceptance Criteria

- AC-1: Given một kho git tạm dựng từ tệp bọc, `scripts/lib/job-step.sh` và tệp test hiện tại (một commit,
  `refs/remotes/origin/main` trỏ commit ấy), When chạy riêng ca lưới phạm vi làn trong kho ấy, Then tệp bọc của kho
  tạm giữ nguyên băm, mtime và ctime, và `git status --porcelain` của kho tạm vẫn rỗng — hai ô đột biến không ghi một
  byte nào vào cây làm việc.
- AC-2: Given cùng kho tạm, When chạy ca lưới phạm vi làn, Then ô «cây hiện tại» xanh, ô chèn DƯỚI mốc (bản chép) xanh,
  ô chèn TRÊN mốc (bản chép) đỏ với thông điệp «JST-AC-8 sửa phần trên ranh giới làn Claude», và cả ba ô đi qua cùng
  một hàm tách khối `@@`; và khi kho tạm không có `refs/remotes/origin/main`, Then ca ấy ĐỎ với thông điệp «JST-AC-8
  không đọc được bản origin/main của tệp bọc» thay vì xanh trên hai bản chép rỗng.
- AC-3: Given cây sau vòng, When chạy `node --test scripts/job-step-thoi-luong.test.mjs` và lưới hồi quy năm bộ test job
  (`jst_regress`), Then cả hai xanh — mọi ca khác của tệp test giữ nguyên kỳ vọng.

## Coverage

Quét bằng ma trận nhỏ (preset test-matrix), thước CE: mục 2 của design doc và hai mục Ngoài-1, Ngoài-5 trong
`_acceptance/job-step-ghi-thoi-luong/review-findings.md`.

- Trục A — ô của lưới: (i) cây hiện tại | (ii) chèn dưới mốc | (iii) chèn trên mốc
- Trục B — nguồn diff: theo ref trên cây thật (chỉ đọc) | `--no-index` trên hai bản chép
- Trục C — kết cục: xanh | đỏ đúng thông điệp | nguồn hỏng (thiếu `origin/main`)

Core: (i)×ref×xanh, (ii)×no-index×xanh, (iii)×no-index×đỏ — AC-2; mọi ô × không-ghi-cây — AC-1; nguồn hỏng — AC-2
vế cuối. Never: (i)×no-index (ô cây hiện tại phải đọc diff thật của nhánh, không có bản chép nào để so); (ii)/(iii)×ref
(chính là đường ghi vào cây mà hàng này gỡ).

## Out of scope

- Ngoài-4, 6, 7, 8, 10, 12–15 của `job-step-ghi-thoi-luong` — Mạnh đã ghi Known limits; vòng này không sửa dù cùng tệp.
  Vị trí chèn của hai ô (dưới mốc: dòng i+2; trên mốc: dòng i−1) giữ nguyên, nên ca «đỏ nhầm khi sửa ngay sát dưới
  mốc» (Ngoài-6) vẫn như cũ.
- Mở rộng lưới hồi quy sang bộ thứ sáu (Ngoài-3) — Mạnh chốt để nguyên.
- `scripts/zalo-import-daily.sh` và `scripts/lib/job-step.sh` — vòng không sửa hai tệp này. Điều này đọc ở diff của PR,
  KHÔNG có eval riêng: một ca test khẳng định hai tệp bằng `origin/main` sẽ đỏ ở mọi nhánh sau này sửa chúng hợp lệ.
- Sửa lời hợp đồng đã ký `job-step-ghi-thoi-luong` — sổ của nó nhận một dòng trỏ sang hàng này; lời AC-8 giữ nguyên.

## Notes

Hồ sơ `job-step-ghi-thoi-luong` KHÔNG ghim lại trong vòng này: lưới trước gộp coi phần đổi ở đó chỉ là `decisions.jsonl`
và vẫn báo OK, còn mọi ca JST-AC-1…9 của nó được E3 của vòng này chạy lại trọn trên đúng sha được chấm.
