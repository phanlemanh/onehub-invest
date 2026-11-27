---
schema_version: 1
slug: go-kev-khoi-hook-s03
feature: Hook nhận tin S03 thôi gọi cổng chấm Kev; watchdog thôi canh :8009; gỡ plist cổng chấm (KEV1, phần làn thu của KV1)
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (tra-loi ZT-4, 09:44Z 24/11) theo Mạnh «bỏ Kev» 15/11 (ROADMAP §3 mục 52) và «Mở hồ sơ KEV1 cho anh ký» 24/11
decided_at: 2026-11-24T09:44:44Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: KV1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng KV1 `go-kev-khoi-hook` của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`), phạm vi HẸP theo lời phán GS
(ZT-4): chỉ phần làn thu — hook S03 + watchdog + plist cổng chấm + runtime-map. Phần `/ops/collections`, audit-all,
push-ops-facts là hàng KEV2 của dãy U1.

Mạnh chốt bỏ Kev 15/11; máy thu Mac mini (24/11) không còn dịch vụ Kev. Hook vẫn gọi `:8009` cho mỗi bài, ghi một dòng
«kev null» cho mỗi bài: đo 24/11 (ngày VN) 4.954 dòng «kev null» cạnh 5.103 dòng `post 202`; log hook 36 MB, phình gấp đôi.
Watchdog 5′ ghi «kev:DOWN» + WARN + thông báo macOS mỗi lượt — tiếng ồn che cảnh báo thật của lớp an toàn Zalo.
Người gặp: Mạnh (thông báo macOS), đội vận hành đọc log/watchdog.

Nguồn mã: nhánh làn thu `zcode/k1-hook-khong-kev` @4016cf222 (ZCode viết, LL soát đạt 24/11).

## Ngưỡng chết / ngưỡng UAT

Không đo được — việc nền vận hành, không có người dùng cuối; đích đo trên máy thu sau triển khai: dòng «kev null» mới trong
log hook = 0 (từ 4.954/ngày), dòng `post 202` vẫn chảy (không đổi lượng bài), watchdog ghi «kev:off (K1)» thay «kev:DOWN»,
agent 0 turn, lockdown 7 lớp nguyên.
