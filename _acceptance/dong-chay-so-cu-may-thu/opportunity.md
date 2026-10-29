---
schema_version: 1
slug: dong-chay-so-cu-may-thu
feature: Người vận hành mở /ops/data-flow ở máy thu khi bước làm tươi số dòng chảy hỏng quá 45 phút thì thấy cảnh báo số cũ như trên cloud, không phải số cũ trình bày như số mới
owner: phanlemanh@gmail.com
stage: decided
decision: build
decided_by: Mạnh 27/10 ở Cổng Bằng chứng DF1 dong-chay-len-cloud — «Ngoài-2: mở hợp đồng mới»; giám sát xếp U2 2.6 (yêu cầu U2-9 đã trả lời)
decided_at: 2026-10-27T05:47:51Z
prototype:
  base_commit:
  disposition:
---

## Vấn đề & ai gặp

Mở từ mục Ngoài-2 của hồ sơ `dong-chay-len-cloud` (PR #160): `localFacts` ở `app/src/lib/data-flow-queries.ts` luôn trả
«fresh» cho dòng `data_flow_snapshot`, không so `computed_at` với ngưỡng 45′ của ADR-0014. Bước `refresh-data-flow` của
cloud-sync hỏng nhiều lượt liền thì trang /ops/data-flow ở máy thu vẫn vẽ đủ số của lần tính cuối như số hiện hành, chỉ
có dòng chữ xám «Số tính lúc …»; cùng sự cố ấy trang cloud đã báo «Máy thu không đẩy số từ …». Người gặp: người vận
hành ngồi ở máy thu.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: bảng tính sẵn ở máy thu quá 45′ thì trang máy thu có báo số cũ không?
- Kết quả nào là SỐNG: `computed_at` quá 45′ → trang máy thu hiện Alert số cũ kèm giờ tính, số cũ vẫn hiện; trong 45′ → không Alert.
- Kết quả nào là CHẾT: hết timebox mà trang máy thu vẫn vẽ số cũ không cảnh báo.
- Timebox: một ngày làm việc của dãy U2 (27/10).
