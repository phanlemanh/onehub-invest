---
schema_version: 1
feature: PL1 — importer bỏ qua mọi snapshot thử (zalo-mock, e2e, TEST), không ghi chúng vào stg_*
slug: importer-bo-qua-du-lieu-thu
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
approved_by:
approved_at:
gate1_skipped: true
---

# Acceptance Contract: importer-bo-qua-du-lieu-thu

## Context

Dữ liệu giả sinh ra khi bench parser, e2e hoặc verify tay (nguồn `zalo-mock`, `e2e`, `TEST`) đã lọt vào `stg_*`. DB local hiện còn 1.260 dòng `stg_zalo_posts` và 3 dòng `airbnb_snapshots` mang snapshot_id thử.

ZCode sửa importer (`import-airbnb.mjs`, `import-chotot.mjs`) theo ba lớp:
- nhận diện theo segment tên snapshot, dùng `basename()` nên đường dẫn có «/» cuối vẫn bắt được;
- lớp 2 theo `manifest.source`;
- lọc từng item thử lẫn trong snapshot thật.

Snapshot thử bị bỏ qua có log và exit 0, để vòng nạp đêm không gãy. Dọn các dòng thử cũ là việc của PL2, không phải PL1.

Hàng PL1 của lộ trình (`docs/plan/lo-trinh.json`, hạng T2).

Source input: prompt (brief phiên điều phối liên làn local_5d0e32a0…, 24/10/2026). Nhánh `zcode/importer-bo-qua-du-lieu-thu` @ b2f392d (claudedp-2310-4, review vòng 2 đạt).

## Criteria

- AC-1: Given mọi snapshot thử đang có thật trên máy (`collector/snapshots/*/*__zalo-mock__*` …), When chạy `import-airbnb.mjs` trên từng cái, Then mỗi lần đều bỏ qua có log và exit 0, và số dòng stg mang snapshot_id thử không tăng thêm dòng nào.
- AC-2: Given đường dẫn snapshot thử kết thúc bằng «/», When chạy `import-airbnb.mjs` hoặc `import-chotot.mjs`, Then vẫn nhận ra là snapshot thử và bỏ qua.
- AC-3: Given thư mục mang tên nguồn thật nhưng `manifest.source = zalo-mock`, When chạy `import-airbnb.mjs`, Then bỏ qua theo `manifest.source`, có log, 0 dòng.
- AC-4: Given snapshot thật (`zalo-agent`) có lẫn item `zalo-mock`, When nạp, Then item thử bị bỏ (có log đếm), còn item thật vào `stg_zalo_posts`.
- AC-5: Given snapshot thật đã nạp, When nạp lại (kể cả đường dẫn có «/» cuối), Then số dòng không đổi (idempotent).
- AC-6: Given tên snapshot có segment `e2e` hoặc `TEST`, When nạp, Then bỏ qua; tên nguồn thật chỉ chứa chữ «test» ở giữa (không phải nguyên segment) thì không bị nhận nhầm.
- AC-7: Given `import-chotot.mjs`, When gặp snapshot thử, Then bỏ qua; snapshot Chợ Tốt thật vẫn nạp vào `stg_chotot_ads`.
- AC-8: Given DB đang có dòng stg thử cũ, When chạy importer, Then các dòng cũ KHÔNG bị xoá: số đếm trước và sau bằng nhau. Dọn rác cũ là việc của PL2.

- AC-9: Given `import-chotot.mjs` gặp snapshot tên thật (`<city>__chotot-ads__<mốc>`) nhưng `manifest.source` là nguồn thử, When nạp, Then bỏ qua, 0 dòng. (thêm ở vòng 3–4)
- AC-10: Given snapshot của một nguồn không nằm trong danh sách nguồn được phép của importer (vd `example`, có thật trên máy), When nạp, Then bỏ qua có log, 0 dòng. (thêm ở vòng 3–4)
- AC-11: Given thư mục mang nguồn hợp lệ nhưng đuôi không phải mốc thời gian (`TEST`, `e2e`, chỉ có ngày), When `import-airbnb.mjs` hoặc `import-chotot.mjs` nạp, Then bỏ qua, 0 dòng; còn mốc 6 chữ số giây và 9 chữ số (mili-giây) kèm hậu tố `-n` vẫn nạp. (thêm ở vòng 4 — hồi quy AC-6 của vòng 3)

## Coverage

- Bỏ coverage-scan: 8 AC theo hàng PL1 (`tieu_chi: 8`) và brief. Các trục:
  - nơi nhận diện: tên / `manifest.source` / item;
  - dạng đường dẫn: có hoặc không «/» cuối;
  - loại thử: zalo-mock / e2e / TEST;
  - importer: airbnb / chotot;
  - lượt nạp: đầu / lặp;
  - dữ liệu cũ: giữ.

## Out of scope

- Xoá các dòng stg thử cũ (1.260 dòng `stg_zalo_posts` và 3 dòng `airbnb_snapshots`): PL2.
- Chạy lại importer trên TOÀN BỘ snapshot thật hiện có: upsert đặt `captured_at = now()`, nên sẽ làm lệch chỉ số độ tươi (real7) của `push-ops-facts`. Thay vào đó, AC-1 chạy importer trên mọi snapshot THỬ thật (phải bị bỏ qua), và các ca snapshot thật dùng fixture mang tiền tố riêng.
- Transform từ chối post thử nếu lọt vào: PL2.

## Notes

- `bat_khi` của PL1 («0 dòng stg mang snapshot_id thử») chỉ đúng theo nghĩa đen sau khi PL2 dọn rác cũ. PL1 chứng phần của nó: không thêm dòng thử nào, và không xoá dòng cũ (AC-1, AC-8).
- Fixture ghi DB local :5433 với tiền tố `acc-pl1-<nonce>`: kiểm trước không trùng, xoá sau (cascade từ `airbnb_snapshots`). Snapshot thật chỉ được đọc.
- `collect-chotot.mjs` tự ghi manifest `schemaVersion 1` (không qua `storage.ts` của collector), nên fixture Chợ Tốt dùng v1.
- Hợp đồng dựng SAU khi code xong (ZCode) nên `gate1_skipped: true`.
- Vòng 4 (25/10): ZCode thêm luật khuôn tên `<city>__<nguồn>__<mốc>` dùng chung hai importer (e5f9be9, nhánh đã rebase). Nhánh nghiệm thu dựng lại thành `claude/acceptance-importer-bo-qua-du-lieu-thu-r4` từ nhánh zcode + gộp `origin/main` 47afb91. Fixture của harness đổi sang tên khuôn thật, mốc năm 2001 mang nonce, dọn theo mốc. Thêm AC-9..11. Kiểm harness biết đỏ: importer vòng 3 (d9b9ace) đỏ 4 ca khuôn tên.
