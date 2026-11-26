---
schema_version: 1
feature: Test bộ thu S08 cô lập token — không đọc tệp token thật ở HOME, xanh trên máy không có tệp, không để lại thư mục tạm (ZC19)
slug: s08-test-cach-ly-token
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-26T08:40:00Z
design_doc: docs/superpowers/specs/2026-11-26-s08-test-cach-ly-token-design.md
---

# Acceptance Contract: s08-test-cach-ly-token

## Context

Hàng ZC19 (dãy ZT), sau HT9. Ca «2410-19: strip PII ĐỆ QUY» đọc `~/.oneinvest/s08-token.json` vì `TOKEN_FILE` của bộ thu
S08 là hằng tính lúc nạp (`s08-danh-muc.ts:18`): máy không có tệp (M5, CI, worktree chấm HOME tạm) thì đỏ ENOENT, nên
bộ collector đỏ nền (KEV1 E11 S4 r1 trên M5, 26/11). Nguồn mã: nhánh làn thu `zcode/zk-s08-test-cach-ly-token` @b48cd2683
(ZCode, LL soát ĐẠT 26/11); vòng này thêm một sửa tích hợp: dọn thư mục tạm bằng `rmSync`.

## Acceptance Criteria

- AC-1: Given HOME tạm rỗng (không có `.oneinvest/s08-token.json`), When chạy `collector/dist/test/s08-danh-muc.test.js`,
  Then 4/4 ca xanh và đầu ra không có ENOENT.
- AC-2: Given HOME tạm có `.oneinvest/s08-token.json` quyền 000, When chạy cùng tệp test, Then vẫn 4/4 xanh, không EACCES —
  test không chạm tệp token ở HOME.
- AC-3: Given bản chép tệp test đã biên dịch bỏ dòng đặt `S08_TOKEN_FILE`, When chạy với HOME tạm rỗng, Then tệp đỏ và đầu
  ra nêu `s08-token.json` — thước cô lập phân biệt được bản hỏng.
- AC-4: Given một lượt chạy tệp test với TMPDIR tạm, When lượt kết thúc, Then không còn thư mục `s08-test-*` nào; bản chép
  dọn bằng rm bất đồng bộ trong «exit» thì còn thư mục — thước dọn phân biệt được bản hỏng.
- AC-5: Given dist collector dựng lại từ đầu, When chạy toàn bộ test collector, Then 0 ca đỏ (gồm 2410-19); mã collector
  ngoài `src/test` không đổi so với nhánh chính.

## Out of scope

- Đổi `s08-danh-muc.ts` để đọc token lười (lúc gọi) — ngoài phạm vi, vì chạm mã bộ thu của làn thu, ngoài vùng hàng (chỉ
  tệp test).
- Đăng nhập, xoay hay kiểm token S08 thật trên máy thu — ngoài phạm vi, vì là vận hành làn thu và token là tầng A.

## Coverage

- Trục trạng thái token ở HOME: không có tệp · có tệp không đọc được — AC-1, AC-2.
- Trục bản hỏng: bỏ dòng đặt biến · dọn bất đồng bộ — AC-3, AC-4.
- Trục người đọc đầu ra: lượt chấm S4 và CI chạy bộ collector trọn — AC-5.

## Notes

- Đo 26/11 trên nhánh trước sửa dọn: mỗi lượt để lại 1 thư mục `s08-test-*` trong TMPDIR (token giả, không phải tầng A).
