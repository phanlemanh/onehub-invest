---
schema_version: 1
feature: hai ca test bước chụp (UC-TA-5, UC-BR) hết đỏ chập chờn khi bộ test scripts/ chạy song song
slug: uc-ta-5-tmp-rieng
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: verified
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
- AC-3: Given nhánh so với main, When liệt kê tệp đổi, Then chỉ có `scripts/ui-capture-login.test.mjs`, `scripts/ui-capture-browser.test.mjs`, hồ sơ này, `_acceptance/config.yaml` và tệp máy sinh.
- AC-4: Given máy chủ giả của `ui-capture-browser.test.mjs` chạy ở tiến trình con trong khi tiến trình test bị `execFileSync` chặn nhiều giây, When `capture()` gọi lại `fetch` tới nó, Then không còn lỗi «GET /login không trả 200» do kết nối giữ sống bị đóng (máy chủ giả giữ kết nối ≥ 120 giây); và vẫn chỉ sửa máy chủ giả, không đổi khẳng định.

## Coverage

- Bỏ coverage-scan — sửa một ca test; trục: hết chập chờn (AC-1), còn răng (AC-2), phạm vi (AC-3).

## Out of scope

- Sửa `ui-capture-login.mjs` (mã sản phẩm) — `loginState` nuốt lỗi gốc của fetch bằng `.catch(() => null)`; ghi hạt giống, không đổi ở vòng này.
- Cho làn ghim lại tự chạy lại ca chập chờn — việc của kit.

## Notes

- Probe `_acceptance/uc-ta-5-tmp-rieng/probes/`; đột biến chạy trên bản chép tạm.
- Vòng 1 REJECT (E1: UC-BR-3/6 chập chờn, có sẵn trên main). Mạnh chọn gộp sửa vào hồ sơ (AC-4), chấm vòng 2.
