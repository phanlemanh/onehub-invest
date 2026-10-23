---
schema_version: 1
feature: Đổi URL cloud cứng từ project Vercel cũ sang prod mới onehub-invest.vercel.app
slug: ops-ingest-url-onehub-invest
owner: phanlemanh@gmail.com
risk_tier: T2      # pipeline/ + scripts/ + app/docs — không chạm t3_paths
surfaces: [cli, config]
status: implemented
approved_by:
approved_at:
veto_state: mo
veto_opened_at: 2026-10-23T01:55:23Z
---

# Acceptance Contract: ops-ingest-url-onehub-invest

## Context

Prod của app/ đã chuyển sang project Vercel mới `onehub-invest` (domain `onehub-invest.vercel.app`,
setup 2026-10-23, xem `docs/ops/runtime-map.md` mục Vercel). Ba chỗ còn trỏ cứng alias project cũ
`app-lilac-one-49.vercel.app`: `pipeline/push-ops-facts.mjs` (`INGEST_URL` mặc định — máy thu đẩy
ops facts 15'/lần), `scripts/audit-all.sh` (`CLOUD`), `app/docs/api/mcp-tools.json`
(`cloud_base_url`). Còn trỏ cũ thì không tắt được project cũ, và ops facts đi vào bản prod không còn
được deploy. Thay đổi chỉ đổi chuỗi URL; token giữ nguyên (prod mới dùng cùng `CLOUD_OPS_API_TOKEN`).

Source input: prompt (phiên setup Vercel prod, Mạnh duyệt «làm» 2026-10-23).

## Criteria

- AC-1: Given cây làm việc, When tìm `app-lilac-one-49.vercel.app` trong mọi tệp git theo dõi ngoài `docs/` và `_acceptance/`, Then không còn tệp nào trỏ tới.
- AC-2: Given `pipeline/push-ops-facts.mjs`, When không đặt env `INGEST_URL`, Then URL mặc định là `https://onehub-invest.vercel.app/api/v1/ops/ingest` và env `INGEST_URL` vẫn đè được.
- AC-3: Given `scripts/audit-all.sh` và `app/docs/api/mcp-tools.json`, When đọc, Then `CLOUD` và `cloud_base_url` là `https://onehub-invest.vercel.app`; JSON hợp lệ, hai script không lỗi cú pháp.
- AC-4: Given bản sao ba tệp quay về URL cũ, When chạy cùng thước đo, Then cả ba tệp bị bắt đỏ (thước đo không xanh giả).
- AC-5: Given prod mới, When POST `/api/v1/ops/ingest` không token, Then 401; When POST có token cloud với payload rỗng, Then 400 «payload thiếu pushedAt» — token khớp, route chặn trước khi ghi, không ghi gì vào DB cloud.
- AC-6: Given module `pipeline/`, When chạy bộ test, Then xanh như trước (không hồi quy).

## Coverage

- Trục nơi trỏ: đẩy ops facts (AC-2) | kiểm toàn hệ thống (AC-3) | tài liệu API cho MCP (AC-3) | phần còn lại của cây (AC-1).
- Trục âm: thước đo bắt URL cũ (AC-4) | ingest từ chối người lạ (AC-5 nửa 401).
- Trục đầu-cuối không ghi: token khớp prod mới mà không đẩy payload thật (AC-5).
- Bỏ quét morphological đầy đủ — thay đổi ba chuỗi hằng, các trục trên liệt kê đủ nơi đọc.

## Out of scope

- KHÔNG chạy `push-ops-facts.mjs` thật lên prod trong vòng này (job 15' tự chạy sau khi merge vào main).
- KHÔNG tắt/xoá project Vercel `app` cũ — Mạnh tự làm sau khi PR này merge và job 15' đã đẩy vào prod mới.
- KHÔNG đổi token hay env Vercel.
- KHÔNG sửa ghi chú lịch sử trong `docs/` (ADR, runtime-map) nhắc tên cũ.
- KHÔNG sửa lỗi dữ liệu cloud (sale_offers/ref_calib rỗng, thiếu `source_registry`) — phiên sync-cloud lo.

## Notes

- Thứ tự thực tế: ba dòng đổi URL viết TRƯỚC contract trong cùng phiên (Mạnh duyệt «làm» trên đề xuất); contract mô tả đúng cái đã làm.
- `scripts/check-cloud-url.sh` là thước đo mới của hồ sơ (static · mutation · live).
