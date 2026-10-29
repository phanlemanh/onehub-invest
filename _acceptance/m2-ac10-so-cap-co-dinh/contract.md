---
schema_version: 1
feature: Ca «M2-AC-10 chỉ thêm hai dòng config» so cặp commit cố định 3b3a33e5^→3b3a33e5 thay vì merge-base origin/main, để bộ test design-floor không đỏ trên main sau khi gộp hay trên nhánh khác sửa config.yaml
slug: m2-ac10-so-cap-co-dinh
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: approved
veto_state: mo
veto_opened_at: 2026-10-29T07:29:55Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-29-m2-ac10-so-cap-co-dinh-design.md
---

# Acceptance Contract: m2-ac10-so-cap-co-dinh

## Context

Ngoài-2/4/11 ở Cổng Bằng chứng của `dung-m2-song-song` (Mạnh chọn «mở hợp đồng mới», 29/10): ca «M2-AC-10 diff
config.yaml so merge-base origin/main» trong `scripts/design-floor/fresh.test.mjs` đỏ trên main ngay sau PR #165 (đo:
41 pass, 1 fail) và sẽ đỏ trên mọi nhánh sau có sửa `_acceptance/config.yaml`. Bất biến «chỉ thêm hai dòng executors» thuộc
về đúng một commit (`3b3a33e5`, S1 của `dung-m2-song-song`), nên phép so ghim vào cặp blob cố định đó, đúng khuôn
`aer-ac2-so-cap-co-dinh`.

## Acceptance criteria

- AC-1: Given kho có commit `3b3a33e5`, When chạy `node --test scripts/design-floor/*.test.mjs`, Then ca M2-AC-10 về
  diff so `_acceptance/config.yaml` ở `3b3a33e5^` với ở `3b3a33e5` (hai blob git cố định): 0 dòng bớt, đúng hai dòng thêm
  `design_floor_gen`, `design_floor_fresh`; ca không đọc `config.yaml` của cây đang kiểm, không gọi `merge-base` hay
  `origin/main`.
- AC-2: Given một bản clone của kho có thêm một commit thêm khoá mới vào `_acceptance/config.yaml`, ở ba trạng thái ref
  — (a) `origin/main` = HEAD (sau khi gộp), (b) `origin/main` = cha của commit thêm khoá (nhánh chưa gộp có sửa config),
  (c) không có ref `origin/main` —, When chạy `fresh.test.mjs` của bản sửa, Then thoát 0 ở cả ba; và ở (a), (b) chạy
  `fresh.test.mjs` ở `98757b5f` (bản trước sửa) trên cùng cây thì có đúng một ca `not ok`, là ca M2-AC-10 diff.
- AC-3: Given hàm kiểm cặp của ca M2-AC-10 nhận bản «trước» và bản «sau», When bản «sau» bị thêm một dòng thứ ba hoặc bớt
  một dòng có sẵn, Then hàm ném lỗi nêu đúng dòng đó (thêm hay bớt); với cặp blob thật hàm không ném và trả đúng hai dòng
  thêm, 0 dòng bớt. Ca M2-AC-10 diff gọi chính hàm ấy.
- AC-4: Given commit ghim không có trong kho (kho tải nông, hay sha không tồn tại), When đọc blob qua hàm mà ca M2-AC-10
  dùng, Then lỗi có thông điệp ghim «thiếu commit ghim <sha>» kèm gợi ý `git fetch --unshallow` — không bỏ qua, không xanh
  lặng; với sha ghim thật hàm trả blob khác rỗng.
- AC-5: Given HEAD của nhánh, When chạy `node --test scripts/design-floor/*.test.mjs`, Then thoát 0; mọi ca có ở bốn tệp
  test tại `98757b5f` vẫn còn (trừ đúng một ca M2-AC-10 diff được đổi tên), hai ca M2-AC-10 còn lại không đổi thân.

## Coverage

Bỏ quét không gian tiêu chí — xem dòng sổ `descope` «bỏ coverage-scan». Trục tự kê: nguồn so (cặp cố định, AC-1) ×
trạng thái ref của kho (sau gộp · nhánh chưa gộp có sửa config · không có `origin/main`, AC-2; thiếu commit ghim, AC-4) ×
hàm kiểm cặp (lành / thêm / bớt, AC-3) × không hạ thước (AC-5).

## Out of scope

- OOS-1: Ngoài-5 của `dung-m2-song-song` (test ghim số đếm của nguồn đang sống) — Mạnh chọn «ghi Known limits» ở Cổng
  Bằng chứng; giữ nguyên.
- OOS-2: Không sửa `contract.md` hay `evals.yaml` đã ký của `dung-m2-song-song`; câu `expected` của E12 còn nhắc merge-base
  — khai `superseded_by` (nếu cần) là hồ sơ riêng. Hồ sơ đó chỉ được ghim lại bằng làn máy khi lưới trước-merge báo hoá cũ.
- OOS-3: Không nối test design-floor vào CI (`ci-test.yml` ngoài vùng hàng).

## Notes

- Ranh giới hàng: `scripts/design-floor/**`, `_acceptance/dung-m2-song-song/**` (chỉ để ghim lại khi lưới đòi).
