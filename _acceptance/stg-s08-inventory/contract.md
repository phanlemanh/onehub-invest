---
schema_version: 1
feature: Bảng staging stg_s08_inventory cho danh mục căn S08 (migration 040)
slug: stg-s08-inventory
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: signed-off
approved_by:
approved_at:
gate1_skipped: true
---

# Acceptance Contract: stg-s08-inventory

## Context

PL10 S08 bước 1 (ZCode, vòng claudedp-2310-12) thu item `inventory_unit` — một căn trong quỹ
chủ đầu tư, trạng thái notSold/sold — theo DATA-CONTRACT schemaVersion 4. Importer của ZCode
cần bảng staging do làn Claude sở hữu (`db/migrations/`); số 040 đã giữ chỗ trong sổ
SO-MIGRATION. Mạnh duyệt 24/10: S08 chỉ đọc, ≤1 lần/tuần, chỉ dùng nội bộ (AGENTS.md luật 5),
`stg_s08_inventory` chỉ ở local, tên thật của S08 chỉ ở `source_registry` local. Repo công khai.

Source input: prompt (phiên điều phối liên làn, 24/10/2026) · bản quy cách trường S08 trong `research-local/` (không commit)

## Criteria

- AC-1: Given DB local :5433 chưa có hoặc đã có `stg_s08_inventory`, When áp `db/migrations/040_stg_s08_inventory.sql` hai lần liên tiếp, Then cả hai lần không lỗi, schema sau lần 2 trùng sau lần 1, số dòng không giảm và không có dòng trùng; một migration không idempotent đưa vào cùng bộ kiểm thì bị bắt.
- AC-2: Given bảng đã tạo, When ghi thử các dòng (trong giao dịch rồi ROLLBACK), Then dòng hợp lệ vào được; cùng căn ở snapshot sau vào được (giữ vòng đời notSold → sold); trùng `(source_id, snapshot_id)`, `state` ngoài `{notSold, sold}` và `snapshot_id` không tồn tại đều bị từ chối; xoá snapshot thì dòng staging của nó xoá theo.
- AC-3: Given luồng sync cloud chỉ đẩy bảng trong `FILL` của `pipeline/sync-cloud.mjs`, When chạy `pipeline/sync-pii.test.mjs` và leak gate với cloud giả, Then test xanh với code hiện tại và ĐỎ (ca S08 đỏ) khi `stg_s08_inventory` bị cấy vào `FILL`; leak gate báo `stg_s08_inventory=N` khi cloud có dòng và im khi 0 dòng.
- AC-4: Given tên thật của S08 nằm ở `source_registry` local, When soát mọi tệp thêm/sửa của nhánh so `origin/main`, Then không tệp nào chứa tên thật (kể cả tên miền không đuôi); cấy tên vào bản chép migration thì bị bắt.
- AC-5: Given luật RESO-first (ADR-0011/0013), When đọc mục `sources.S08` của `pipeline/mappings.yaml`, Then mục trỏ `staging: stg_s08_inventory`, mọi field DD khai ở đó có trong `dd-2.1.json`, `state` ánh xạ sang giá trị lookup `StandardStatus` có thật (Active, Closed), và `early_payment_price` khai «DD không có» thay vì gán field bịa.

## Coverage

- Bỏ coverage-scan — việc là một bảng staging; trục đã phủ bằng tay: lần áp (đầu | lặp), ghi (hợp lệ | trùng khoá | enum sai | FK sai | cùng căn snapshot sau | xoá snapshot), đường rời máy (FILL tĩnh | leak gate cloud), lộ tên (tệp thay đổi | đối chứng dương), RESO (field | enum | field không có DD).

## Out of scope

- Importer S08 vào staging (`pipeline/import-*`) — làn ZCode, GIAO lại sau khi có bảng.
- Transform `stg_s08_inventory` → danh mục căn (`properties` / UPI) và hiệu chuẩn — vòng sau.
- Đổi `collector/docs/DATA-CONTRACT.md` sang v4 — ZCode làm trong nhánh `zcode/s08-danh-muc`.
- Khai SLO độ tươi cho S08 trong `scripts/lib/freshness.mjs` — `source_registry` local để S08 `paused` tới khi có lần thu đầu.
- Áp 040 lên Supabase prod — bảng stg không có ở cloud.
- Đưa bất kỳ số nào của S08 lên cổng Invest hay data-api.

## Notes

- Hợp đồng dựng SAU khi code xong (commit 3e92834) — phiên được phiên điều phối giao việc, Cổng 1 không diễn ra → `gate1_skipped: true`; chữ ký Cổng 2 là điểm duyệt duy nhất (Mạnh phê quyết định này tại Cổng 2).
- T3 vì chạm `db/migrations/**` (t3_paths).
- Dòng `source_registry` S08 (tên thật, `paused`) chỉ ghi vào DB local bằng tay, không có trong migration.
- Mọi eval DB cần DB local :5433 (container `one-invest-db`); eval `reso` cần `dd-2.1.json` ở `research-local/reso/` của checkout chính (đổi bằng env `DD_JSON`).
