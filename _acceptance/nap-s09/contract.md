---
schema_version: 1
feature: Bộ nạp S09 của làn thu vào main — bản thu S09 khuôn API nạp được vào stg_s09_item (097) bằng lõi DA31, chạy lại không nhân dòng, chỉ ghi DB máy thu khi có cờ tường minh
slug: nap-s09
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, data]
status: signed-off
veto_state: mo
veto_opened_at: 2026-11-14T07:13:26Z
design_doc: docs/superpowers/specs/2026-11-14-nap-s09-design.md
---

# Acceptance Contract: nap-s09

## Context

DA31 (gộp 14/11) dựng migration 097 `stg_s09_item` và lõi `dongItemS09`/`CAU_CHEN_S09_ITEM`, nhưng chưa có lệnh nạp chạy
được. Làn thu viết bộ nạp `pipeline/import-s09.mjs` (commit 475fac08, nhánh `zcode/nap-s09-sach`); hàng này đưa nó vào
main qua cổng. Lượt nạp thật trên máy thu là bước triển khai riêng, chờ lời Mạnh.

## Criteria

- AC-1: Given DB thử áp 097 và snapshot tổng hợp khuôn API (một `danh-muc`, hai `du-an` hợp lệ), When chạy bộ nạp hai lần,
  Then lần một ghi đúng 3 dòng `stg_s09_item` và đúng một dòng `airbnb_snapshots` (city `vn`, source `s09-du-an`); lần hai
  không lỗi, ghi 0 dòng, `stg_s09_item` vẫn 3 dòng, `airbnb_snapshots` vẫn đúng một dòng của snapshot, và mọi dòng
  `stg_s09_item` của snapshot trỏ đúng dòng đó.
- AC-2: Given snapshot có một item thiếu `sourceId`, một `kind` lạ, một `du-an` thiếu `chiTiet.data.id` và một item hợp lệ,
  When nạp, Then bỏ đúng 1/1/1 theo ba lý do và ghi đúng 1 dòng.
- AC-3: Given URL DB không phải `oneinvest_suite_*` (dạng `postgresql://…?sslmode=`, tên gần giống, DB máy thu trần) và
  không có cờ `--may-thu`, When chạy lệnh, Then thoát 2 với lời từ chối, trước khi kết nối (một assert mỗi dạng); đối
  chứng dương: cùng ba dạng kèm `--may-thu` thì qua chốt — lỗi in ra là lỗi kết nối, không phải lời từ chối. Mọi URL của
  hai ca trỏ tới cổng đóng (`localhost:1`, mật khẩu giả, giữ tên DB) và ca kiểm trước rằng cổng ấy từ chối kết nối, nên
  không ca nào ghi được vào DB máy thu.
- AC-4 (cross-layer): Given DB thử chép từ DB máy thu (xoá khi xong) và bản thu S09 13/11, When chạy lệnh nạp hai lần, Then lần
  một in 345/345, bỏ 0/0/0, lần hai 0/345; `v_s09_toa` hai khu 115 và 61 bản ghi, `v_s09_phan_khu` 13 và 7 — bằng số của DA31.
- AC-5 (judgment): Given mục schemaVersion 13 của `collector/docs/DATA-CONTRACT.md`, `db/migrations/097_stg_s09_item.sql` và
  `pipeline/lib/s09-du-an.mjs`, When đối chiếu, Then hợp đồng dữ liệu nêu đúng hai `kind`, khoá dự án `chiTiet.data.id`,
  điều kiện `chiTiet.meta.code = "200"`, bảng đích `stg_s09_item` và việc không dùng `item.meta`/`manifest.notes` — khớp
  cột sinh của 097 và luật bỏ của `dongItemS09`.
- AC-6: Given diff và các commit của hàng so với main, When quét, Then tệp đổi chỉ nằm trong vùng hàng (năm tệp của bộ nạp,
  `pipeline/scripts/nap-s09*`, `_acceptance/nap-s09/`, `_acceptance/config.yaml`, design doc của hàng, `PRODUCT-MAP.md`,
  `LO-TRINH.html`); `pipeline/sync-cloud.mjs`, `app/`, `db/migrations/` không đổi; không dòng thêm nào, không thông điệp hay
  tác giả commit nào, không tên tệp đổi nào chứa tên nguồn hay tên miền thật (danh sách tên đọc từ DB máy thu không rỗng);
  tệp test mới nằm trong đúng một nửa của `pipeline/test-nua.json` và ca chia-nua xanh.

## Coverage

- Trục nạp: hợp lệ · nạp lại · ba lý do bỏ (AC-1, AC-2).
- Trục chốt chặn: ba dạng URL bị từ chối · cờ `--may-thu` qua chốt (AC-3).
- Trục dữ liệu thật: bản thu 13/11 trên bản chép máy thu, số khớp DA31 (AC-4).
- Trục hợp đồng dữ liệu: DATA-CONTRACT khớp 097 và lõi (AC-5).
- Trục ranh giới và bộ test: vùng, tên nguồn, chia nửa (AC-6).

## Out of scope

- Lượt nạp thật trên DB máy thu và lượt dựng toà S09 thật (bước triển khai sau gộp, chờ lời Mạnh).
- Thu S09 định kỳ (làn thu).
- Dựng toà, phân khu, cụm từ `stg_s09_item` — đã có ở DA31.

## Notes

- Bộ nạp là làn thu: lỗi logic nạp trả làn thu qua GS; làn Claude chỉ sửa lỗi tích hợp và thêm thước.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-14:
  - Ngoài-2: Máy kiểm tự động hiển thị xanh nhưng thực ra không chạy các ca kiểm bộ nạp S09, nên lỗi sau này có thể lọt qua mà không ai biết.
  - Ngoài-3: Một phép kiểm trong bộ test luôn cho kết quả đạt nên không thêm bảo đảm gì, nhưng không làm sai dữ liệu hay trải nghiệm của ai.
