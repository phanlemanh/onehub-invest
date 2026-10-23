---
schema_version: 1
feature: ZC1 — hai tin chỉ có ảnh cùng nhóm cùng thời điểm đều vào raw với sourceId khác nhau
slug: sourceid-tin-anh
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
approved_by:
approved_at:
gate1_skipped: true
---

# Acceptance Contract: sourceid-tin-anh

## Context

Collector API tính `sourceId = sha256(group|ts|text)` để khử trùng. Hai tin chỉ có ảnh (text rỗng) cùng nhóm, cùng thời điểm vì thế đụng nhau, và tin sau bị bỏ lúc ingest (L20, review §6). ZCode thêm sender và danh sách URL/path ảnh vào công thức, CHỈ khi text rỗng. Tin có chữ giữ nguyên id cũ để không đổi id các tin đã có.

Hàng ZC1 của lộ trình (`docs/plan/lo-trinh.json`, hạng T2).

Source input: prompt (brief phiên điều phối liên làn local_5d0e32a0…, 23/10/2026). Nhánh `zcode/kev-nhan` @ 7271b32 (claudedp-2310-14).

## Criteria

- AC-1: Given hai tin chỉ có ảnh cùng nhóm, cùng ts, cùng URL ảnh nhưng khác sender, When collector ingest, Then cả hai được nhận và ra hai RawItem với sourceId khác nhau.
- AC-2: Given hai tin chỉ có ảnh cùng nhóm, cùng ts, cùng sender nhưng khác URL ảnh, When collector ingest, Then cả hai được nhận với sourceId khác nhau.
- AC-3: Given một tin chỉ có ảnh được gửi lại y hệt (cùng nhóm, ts, sender, URL), When collector ingest lần hai, Then lần hai vẫn bị khử trùng (duplicates = 1).
- AC-4: Given một tin có chữ (kèm hoặc không kèm ảnh), When tính sourceId, Then sourceId bằng đúng công thức cũ `sha256(group|ts|text)` cắt 32 ký tự; tin cùng chữ, cùng ts nhưng khác sender vẫn trùng như trước.
- AC-5: Given hai event chỉ có ảnh cùng nhóm cùng ts (khác sender), When flush rồi nạp snapshot bằng `import-airbnb.mjs` vào DB local, Then ra hai raw item và hai dòng `stg_zalo_posts` khác `post_id`.

## Coverage

- Bỏ coverage-scan: 5 AC theo hàng ZC1 (`tieu_chi: 5`, `bat_khi`: hai raw item, hai dòng stg). Các trục:
  - loại tin: chỉ ảnh / có chữ + ảnh / chỉ chữ;
  - khác biệt: sender / URL / không gì (lặp y hệt);
  - tầng: raw / stg.

## Out of scope

- Ảnh cùng nội dung được giao lại với URL khác (token ký khác) — sẽ ra hai sourceId; không chuẩn hoá URL ở vòng này.
- Tính lại sourceId cho tin chỉ ảnh đã có trong raw cũ — id cũ giữ nguyên, không backfill.
- Khử trùng ở tầng transform/canonical.

## Notes

- AC-5 ghi DB local :5433 dùng chung. Harness kiểm trước `snapshot_id` và `post_id` chưa có trong DB (có thì bỏ chạy, exit 2), nạp với `skipMedia` (không tải ảnh thật), rồi xoá đúng snapshot giả (cascade sang `stg_zalo_posts`).
- Hợp đồng dựng SAU khi code xong (ZCode) nên `gate1_skipped: true`. Cùng nhánh với `kev-thanh-nhan` (PL4), tách slug.
