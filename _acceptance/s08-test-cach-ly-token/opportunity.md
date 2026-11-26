---
schema_version: 1
slug: s08-test-cach-ly-token
feature: Test bộ thu S08 cô lập token — test không đọc tệp token thật ở HOME, không để lại thư mục tạm (ZC19)
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (hàng ZC19 trong hang-viec.json, dãy ZT, sau HT9; lời GS 26/11 «ZT dựng hồ sơ theo vòng feature-loop … ZC19 làm ngay, KEV1 vòng 2 chờ nó»)
decided_at: 2026-11-26T08:00:00Z     # ISO UTC
prototype:
  base_commit:
  disposition:
---

## Vấn đề & ai gặp

Ca «2410-19: strip PII ĐỆ QUY» của `collector/src/test/s08-danh-muc.test.ts` đọc tệp token S08 dưới HOME
(`~/.oneinvest/s08-token.json`) vì `TOKEN_FILE` của bộ thu là hằng tính lúc nạp mô-đun. Máy không có tệp đó (CI, M5,
mọi worktree chấm với HOME tạm) thì ca đỏ ENOENT. Bộ collector đỏ nền ở mọi nơi trừ máy thu, nên mọi hồ sơ có eval
`npm test` của collector đều đỏ oan (KEV1 E11 S4 r1 trên M5 26/11). Trên máy thu thì test chạm tệp token thật (tầng A).
Người gặp: các dãy chấm S4 (lượt chấm đỏ oan), GS (xếp thứ tự quanh ca đỏ nền).

## Ngưỡng nghiệm thu

Không đặt ngưỡng số liệu sản phẩm: đây là hàng nền (test). Điểm xong là bộ collector xanh trên máy không có tệp token
(M5, CI) — đo bằng eval của hợp đồng.
