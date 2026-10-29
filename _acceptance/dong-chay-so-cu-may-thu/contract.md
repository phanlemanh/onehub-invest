---
schema_version: 1
feature: Người vận hành mở /ops/data-flow ở máy thu khi bước làm tươi số dòng chảy hỏng quá 45 phút thì thấy cảnh báo số cũ như trên cloud, không phải số cũ trình bày như số mới
slug: dong-chay-so-cu-may-thu
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: approved
approved_by: Mạnh
approved_at: 2026-10-29
design_doc: docs/superpowers/specs/2026-10-27-dong-chay-so-cu-may-thu-design.md
---

# Acceptance Contract: dong-chay-so-cu-may-thu

## Context

Căn cứ: Ngoài-2 của `_acceptance/dong-chay-len-cloud/review-findings.md` (Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng
27/10, sổ `dong-chay-len-cloud#d-20261027T054359Z-23`); ô cơ hội `opportunity.md`; ADR-0014 (ngưỡng số cũ 45′). Trang
/ops/data-flow ở máy thu đọc bảng tính sẵn `data_flow_snapshot` nhưng luôn coi số là tươi.

## Criteria

- AC-1: Given máy thu (không `VERCEL`) và `data_flow_snapshot` có `computed_at` cũ nhất 10′ trước, When `getDataFlow` đọc, Then `factsState` là `fresh`; trang ghi «Số tính lúc …» và không có Alert số cũ.
- AC-2 (cross-layer): Given máy thu và `computed_at` cũ nhất 3 giờ trước (kể cả khi chỉ một trong ba dòng cũ), When dựng `DataFlowContent` của route `/ops/data-flow`, Then `factsState` là `stale`; trang có Alert số cũ (chữ theo Hỏi-1) kèm giờ VN của `computed_at` cũ nhất, đặt ở vùng trạng thái trước các vùng số, và các vùng số vẫn hiện đúng số của bảng (số chặng từng nguồn, đủ trường lõi).
- AC-3: Given ngưỡng, When `computed_at` 44′ và 46′ trước mốc đọc, Then lần lượt `fresh` và `stale`; ngưỡng là `FACTS_STALE_MS` của `lib/ops-facts.ts` (không hằng thứ hai): đổi hằng ấy thành 60′ thì ca 46′ của máy thu đổi theo.
- AC-4: Given cloud (`VERCEL=1`), When chạy bộ DC-AC của `dong-chay-len-cloud`, Then bốn trạng thái cloud giữ nguyên (bộ xanh).
- AC-5: Given máy thu thiếu bảng hay chưa có dòng, When `getDataFlow` đọc, Then vẫn `none` như trước (không đổi nhánh này).

## Coverage

Bỏ quét không gian AC — xem dòng sổ «bỏ coverage-scan»: một trục (tuổi của `computed_at` so ngưỡng) ở một nơi (máy thu);
AC-1/AC-3 phủ hai phía ngưỡng, AC-2 phủ route, AC-4/AC-5 phủ nhánh không đổi.

## Đường đo

| Vế ngưỡng (opportunity.md) | Đo bằng |
|---|---|
| Quá 45′ → Alert số cũ kèm giờ tính, số cũ vẫn hiện | AC-2, AC-3 (jsdom trên lược đồ tạm) |
| Trong 45′ → không Alert | AC-1, AC-3 |

## Out of scope

- OOS-1: Chữ báo khi bảng 051 vắng ở máy thu (Ngoài-3 của DF1, Known limits).
- OOS-2: Kiểm khuôn khối `dataFlow` trên cloud (Ngoài-1 của DF1, Known limits).
