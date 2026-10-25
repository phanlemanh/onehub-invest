---
schema_version: 1
feature: ảnh mẫu snapshot trong các bộ test scripts/ có manifest, theo cổng «chỉ nạp snapshot đã ghi xong» của 2510-8
slug: test-anh-mau-co-manifest
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-25T12:17:08Z
approved_by:
approved_at:
---

# Acceptance Contract: test-anh-mau-co-manifest

## Context

PR #105 (`snapshot-nguyen-tu`, 2510-8) thêm vào hai tệp bọc nạp Zalo một cổng: snapshot thiếu `manifest.json` dưới 30 phút được coi
là đang ghi, nên tệp bọc dừng chuỗi và thoát khác 0. Ảnh mẫu trong ba bộ test `scripts/` (`nap-ts-order`, `zalo-import-job` — kéo
theo `zalo-import-job-lan` —, `job-exit`) tạo thư mục snapshot không có manifest, nên trên main 1807624 có 12 ca đỏ. Lượt chấm 2510-8
không chạy bộ test `scripts/` nên lọt. Phát hiện khi ghim lại hồ sơ `khoa-nap-s05-paused` (#106). Vòng này chỉ sửa ảnh mẫu test.

## Criteria

- AC-1: Given DB local :5433 chạy, When chạy `node --test scripts/*.test.mjs`, Then mọi ca xanh, 0 ca bị bỏ qua.
- AC-2: Given ảnh mẫu đã có manifest, When so với các ca từng đỏ trên main, Then các ca thứ tự nạp theo mốc, ma trận tác vụ Zalo và dãy lời gọi của apify-facebook-daily xanh lại mà KHÔNG nới khẳng định nào (chỉ thêm tệp manifest vào ảnh mẫu).
- AC-3: Given nhánh so với main, When liệt kê tệp đổi, Then chỉ có ba tệp test, hồ sơ này, `_acceptance/config.yaml` và tệp máy sinh — không tệp bọc, importer hay collector nào.

## Coverage

- Bỏ coverage-scan — vòng sửa ảnh mẫu test; trục: xanh thật không bỏ qua (AC-1), không nới khẳng định (AC-2), không lén sửa mã (AC-3).

## Out of scope

- Cổng manifest của tệp bọc (đã nghiệm thu ở `snapshot-nguyen-tu`, E5/E6) — không đổi.
- Thêm bộ test `scripts/` vào làn ghim lại mặc định (`suite_keys`) để lần sau không lọt — việc riêng của cấu hình kit.

## Notes

- Probe `_acceptance/test-anh-mau-co-manifest/probes/`; diff khẳng định đo bằng git (chỉ dòng thêm manifest).
