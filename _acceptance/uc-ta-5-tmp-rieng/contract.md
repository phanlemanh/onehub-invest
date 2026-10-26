---
schema_version: 1
feature: ca test UC-TA-5 (bước chụp không để lại thư mục tạm) dùng thư mục tạm riêng, hết đỏ chập chờn khi bộ test scripts/ chạy song song
slug: uc-ta-5-tmp-rieng
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-26T04:31:47Z
approved_by:
approved_at:
---

# Acceptance Contract: uc-ta-5-tmp-rieng

## Context

`node --test scripts/*.test.mjs` trên main 6045cea đỏ 3/4 lượt ở UC-TA-5 (`scripts/ui-capture-login.test.mjs`). Ca này đếm mọi thư mục
`ui-capture-*` trong thư mục tạm chung trước và sau mỗi lần chụp; `node --test` chạy các tệp song song và
`ui-capture-browser.test.mjs` cũng tạo/xoá thư mục cùng tiền tố → đếm chung là đua. Lỗi chặn mọi lượt ghim lại có eval chạy bộ
`scripts/` (phát hiện khi ghim lại #112). Vòng này chỉ sửa ca test: đặt `TMPDIR` riêng cho UC-TA-5 (`capture()` đọc `tmpdir()`
mỗi lần gọi), trả lại khi xong.

## Criteria

- AC-1: Given DB local :5433 chạy, When chạy `node --test scripts/*.test.mjs` năm lượt liên tiếp, Then cả năm lượt 0 ca đỏ, 0 bỏ qua.
- AC-2: Given bản chép `ui-capture-login.mjs` bỏ bước dọn thư mục tạm, When chạy UC-TA-5, Then ca ĐỎ; với bản thật thì XANH (ca vẫn có răng).
- AC-3: Given nhánh so với main, When liệt kê tệp đổi, Then chỉ có `scripts/ui-capture-login.test.mjs`, hồ sơ này, `_acceptance/config.yaml` và tệp máy sinh.

## Coverage

- Bỏ coverage-scan — sửa một ca test; trục: hết chập chờn (AC-1), còn răng (AC-2), phạm vi (AC-3).

## Out of scope

- Sửa `ui-capture-login.mjs` hay `ui-capture-browser.test.mjs` — mã sản phẩm đúng, chỉ phép đếm của ca test đua.
- Cho làn ghim lại tự chạy lại ca chập chờn — việc của kit.

## Notes

- Probe `_acceptance/uc-ta-5-tmp-rieng/probes/`; đột biến chạy trên bản chép tạm.
