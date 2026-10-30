---
schema_version: 1
feature: Mỗi đêm đo trục SĐT của danh bạ Người và ghi vào dq_check_results để /ops/quality hiện
slug: do-danh-ba-sdt
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-10-31
design_doc: docs/superpowers/specs/2026-10-31-do-danh-ba-sdt-design.md
---

# Acceptance Contract: do-danh-ba-sdt

## Context

Hàng SD5 của `docs/plan/lo-trinh.json` (T2, dãy P4). Cổng Đáng `build`: Mạnh 30/10 «Cổng Đáng build 6 hàng audit Người theo
thứ tự đề xuất». Căn cứ: `docs/research/audit-bang-nguoi-sdt-3010.md` §0 (N1–N5), §2.2, §2.3, §3.3, §7. Số đã trôi từ 30/10
(31/10: SĐT trên tin 208, người theo SĐT S03 192).

## Criteria

- AC-1: Given DB máy thu, When lệnh `do-danh-ba-sdt.mjs` đọc (giao dịch chỉ đọc), Then nó ra năm số theo nguồn S03, S05
  đúng định nghĩa của design §1.
  - N1: SĐT nối 1–1 với đúng một người gửi trên tin sống mà người theo SĐT chưa `merged`.
  - N2: người có bí danh `sdt_bam`/`sdt` không có vai chưa rút.
  - N3: số dòng `sellers` và số SĐT khác nhau trên `sale_offers` (một dòng chung).
  - N4: tin sống mà các bài mang ≥ 2 SĐT theo `extractPhones` thật; kèm tin `seller_phone` rỗng dù có bài mang số.
  - N5: bài mà bộ dò rộng của audit §7 thấy số `extractPhones` bỏ sót, trừ bài chạm trần 3 số.
- AC-2: Given một bản chép DB máy thu (DB thử), When chạy lệnh và chạy câu đo độc lập chép từ audit §7 (SQL + bộ dò viết lại
  trong phép đo, không nạp lõi của lệnh), Then mười số (năm số × nguồn) trùng nhau.
  - Fixture dựng thêm trên DB thử đẩy mỗi số lên đúng 1 (một cặp 1–1 mới, một người SĐT không vai, một tin hai SĐT, một bài số
    dạng `ddd dd•dd ddd`) — lệnh thấy đúng phần tăng.
- AC-3: Given lệnh chạy với `--write`, When ghi, Then mỗi (kiểm, đối tượng) một dòng `dq_check_results` của ngày hôm nay.
  - `check_name` = `danh-ba-sdt:n1…n5`, `entity` = `S03`/`S05` (N3 = `sellers`), `status` = `pass` khi đạt ngưỡng design §1
    (N1 = 0 · N2 ≤ 10 · N3 hai số bằng nhau · N4 tin rỗng SĐT = 0, số tin nhiều SĐT chỉ báo · N5 = 0), `fail` khi không; `detail` dòng `khoá=giá trị` chỉ có số đếm.
  - Chạy hai lần cùng ngày (ngày theo giờ máy thu `Asia/Ho_Chi_Minh`, kể cả khi phiên DB đặt UTC): số dòng của ngày không
    đổi, giá trị là lượt sau.
  - Không có SĐT, khoá băm hay tên trong `entity`/`detail`. Lệnh chỉ ghi `dq_check_results`.
  - Dòng `fail` không làm lệnh thoát ≠ 0; DB không tới được thì thoát ≠ 0.
- AC-4: Given `scripts/cloud-sync.sh`, When job chạy, Then bước `do-danh-ba-sdt` (với `--write`) chạy qua `job_run` sau
  `bac-du-lieu`, là bước cuối; dòng `fail` không đổi mã thoát của job (Hỏi-3).
- AC-5: Given các dòng `danh-ba-sdt:*` (pass, fail, ba đối tượng), When bảng «Kiểm chất lượng» trên `/ops/quality` đọc chúng
  qua `app/src/lib/dq-labels.ts`, Then tên kiểm, đối tượng và chi tiết có nhãn tiếng Việt, không dòng nào «chưa diễn giải».
  - Ca ON12-AC-5 xanh trên DB thử sau một lượt `--write`. Nhãn mới có thuật ngữ trong `CONTEXT.md`.
- AC-6: Given nhánh so với merge-base, When liệt kê tệp đổi, Then chỉ trong: `pipeline/do-danh-ba-sdt.mjs`,
  `pipeline/do-danh-ba-sdt.test.mjs`, `pipeline/CLAUDE.md` (một dòng), `scripts/cloud-sync.sh` (một bước),
  `app/src/lib/dq-labels.ts`, `app/tests/dq-danh-ba-sdt-label.test.tsx`, `CONTEXT.md`, `_acceptance/config.yaml`, hồ sơ này,
  design doc, plan, tệp máy sinh (`PRODUCT-MAP.md`, `LO-TRINH.html`).

## Coverage

- Trục **số đo × nguồn** (N1–N5 × S03/S05; N3 chung) — AC-1, AC-2.
- Trục **trạng thái** (pass khi bằng 0 / bằng nhau; fail) — AC-3, AC-5.
- Trục **đường ra** (bảng in, `--write`, chạy lại trong ngày, job cloud-sync, `/ops/quality`) — AC-3, AC-4, AC-5.
- Thước CE: câu đo độc lập của audit §7 trên cùng bản chép DB; fixture đẩy từng số lên 1. Bản quét: `coverage-scan.md`.

## Đường đo

- Ngưỡng ở `opportunity.md` (bật khi): «ra đúng số của audit §0 … Chạy hai lần cùng ngày không nhân dòng».
- «Đúng số»: AC-2 — trùng câu đo độc lập của audit §7 trên cùng bản chép DB (Hỏi-2: DB 30/10 không còn, số 30/10 không
  tái lập được).
- «Không nhân dòng»: AC-3.

## Out of scope

- Sửa các lỗi được đo (SD1–SD4, HD13); S06 và N6–N14 của audit.
- Màn số riêng trên `/ops/quality`; ngưỡng cảnh báo khác 0.
- Đọc bí danh sau SD3 khác `sdt_bam`/`sdt`.

## Notes

- Hôm nay mọi kiểm dự kiến `fail` (các lỗi chưa sửa); đó là số trước khi sửa, đúng mục đích.
