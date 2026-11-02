---
schema_version: 1
feature: bộ nạp S06 từ chối snapshot thiếu finishedAt và dòng captured_at NULL có sẵn không bị đóng băng
slug: chotot-thieu-moc
owner: manh.phan@onemount.com
risk_tier: T2
surfaces: [cli]
status: signed-off
veto_state: mo
veto_opened_at: 2026-11-02T02:08:02Z
approved_by:
approved_at:
---

# Acceptance Contract: chotot-thieu-moc

## Context

Manifest thiếu `finishedAt` sinh dòng `captured_at` NULL, và từ vòng 2510-6 điều kiện `EXCLUDED.captured_at >= NULL` khiến dòng đó không bao giờ được cập nhật. ZCode (claudedp-2510-34, `zcode/chotot-thieu-moc` @ 8261e3a7) thêm chặn ở `readSnapshot` và `OR captured_at IS NULL` ở UPSERT.

Source input: GIAO claudedp-2510-34 + XONG của ZCode 22:37Z 01/11.

## Criteria

- AC-1: Given manifest thiếu `finishedAt`, When nạp, Then exit khác 0, log nêu rõ, 0 dòng NULL, không ghi `airbnb_snapshots`.
- AC-2: Given dòng `captured_at` NULL có sẵn và snapshot có mốc, When nạp, Then nội dung đổi và `captured_at` nhận mốc.
- AC-3: Given snapshot cũ hơn dòng hiện có, When nạp, Then nội dung không lùi — thêm `OR` không làm hỏng luật không lùi.

## Coverage

- Bỏ coverage-scan: lỗi một điểm, cả hai chiều và luật liền kề đã có tiêu chí.

## Out of scope

- Sửa các dòng NULL di sản hiện có bằng tay: tự được cập nhật khi có snapshot mới.
- Bộ nạp của nguồn khác: chưa có ca lỗi (luật 11).
