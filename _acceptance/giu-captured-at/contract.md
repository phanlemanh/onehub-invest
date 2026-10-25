---
schema_version: 1
feature: 2410-1 — mốc thu captured_at của stg Zalo và Chợ Tốt luôn là giờ thu snapshot, nạp lại không làm sai, có script khôi phục kèm sao lưu
slug: giu-captured-at
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
approved_by:
approved_at:
gate1_skipped: true
---

# Acceptance Contract: giu-captured-at

## Context

Trước bản sửa, `import-airbnb.mjs` và `import-chotot.mjs` ghi `captured_at = now()` cả khi INSERT lẫn khi ON CONFLICT. Mỗi lần nạp lại snapshot cũ, mốc thu bị đặt lại thành giờ nạp. Sự cố 24/10: hai lượt tự kiểm nạp lại toàn bộ snapshot lên DB local, làm 4.092 dòng `stg_zalo_posts` và 15.515 dòng `stg_chotot_ads` sai mốc. Vì vậy biểu đồ «Luồng 7 ngày» trên Ops prod hiện sai.

Luật đã chốt (claudedp, MỞ LẠI 2410-1): `captured_at` = giờ thu của snapshot (`manifest.finishedAt` = `airbnb_snapshots.collected_at`), không bao giờ `now()`. Với Zalo, bảng giữ snapshot đầu, nên mốc = `LEAST(cũ, mới)`. Với Chợ Tốt, bảng đi theo snapshot mới, nên `snapshot_id` và `captured_at` chỉ cùng tiến khi snapshot mới hơn. Script `restore-captured-at.mjs` vá dữ liệu tồn đọng: mặc định chạy thử, `--apply` sao lưu ra CSV trước khi đổi, `--undo` để hoàn tác.

Source input: lời giao `claudedp-2410-1` (24/10) và lời MỞ LẠI cùng mã. Nhánh `zcode/giu-captured-at` @ 43058df, gộp vào nhánh nghiệm thu cùng `origin/main` @ ac70fec.

## Criteria

- AC-1: Given một snapshot Zalo mới, When nạp, Then mọi dòng `stg_zalo_posts` mới có `captured_at` bằng đúng giờ thu của snapshot, không dòng nào mang giờ nạp.
- AC-2: Given tin Zalo đã nạp, When nạp lại cùng snapshot, hoặc nạp một snapshot cũ hơn có cùng tin, hoặc nạp lại theo thứ tự ngược, Then nạp lại cùng snapshot không đổi dòng nào; tin có ở cả hai snapshot mang mốc thu sớm nhất; nạp lại snapshot mới hơn không đẩy mốc lên.
- AC-3: Given tin Chợ Tốt đã nạp, When nạp snapshot mới hơn rồi nạp lại snapshot cũ, Then snapshot mới làm `snapshot_id` và `captured_at` cùng tiến; nạp lại snapshot cũ không làm hai cột lùi; và luôn đúng bất biến `captured_at` = `collected_at` của snapshot mà dòng đang trỏ.
- AC-4: Given dòng stg bị đặt sai mốc, When chạy `restore-captured-at.mjs`, Then: `--dry` báo đúng số dòng sai theo bảng và không đổi gì; `--apply` ghi tệp sao lưu CSV trước rồi đưa dòng sai về giờ thu; `--undo <tệp>` trả lại đúng giá trị cũ; `--apply` lại cho cùng kết quả.
- AC-5: Given nhánh đã gộp `origin/main`, When chạy toàn bộ test pipeline, Then không có test nào đỏ do bản sửa (ZCode báo 1 test `entrypoint-symlink` đỏ sẵn trên main — đối chiếu với main).

## Coverage

- Bỏ coverage-scan: phạm vi là đúng luật captured_at đã chốt cho hai importer cộng script khôi phục. Các trục:
  - bảng: `stg_zalo_posts` / `stg_chotot_ads`;
  - thao tác: INSERT / nạp lại cùng snapshot / snapshot cũ hơn / snapshot mới hơn;
  - khôi phục: dry / apply / undo / apply lại.

## Out of scope

- Chạy `--apply` thật trên DB :5433. Việc này làm sau khi PR merge, claudedp xác nhận và ghi tên tệp sao lưu cùng số dòng trước/sau vào sổ.
- Các cột nội dung của Chợ Tốt (giá, payload…) khi nạp lại snapshot cũ: không thuộc luật captured_at.
- Mốc thu đầu tiên thật của tin Chợ Tốt (snapshot_id đã bị đè trước bản sửa nên không truy được từ stg).

## Notes

- Hợp đồng dựng SAU khi ZCode code xong, nên `gate1_skipped: true`. Phiên điều phối liên làn dựng hồ sơ, không viết code sản phẩm.
- Harness `scripts/giu-captured-at/acceptance.mjs` dựng DB TẠM `acc_capt_<nonce>` trong container `one-invest-db` (pg_dump -s chỉ schema 3 bảng), nạp fixture rồi xoá DB. Không ghi vào DB `oneinvest` (luật 2410-7). Tệp sao lưu của `--apply` trên DB tạm ghi vào `state/` rồi harness xoá.
- Kiểm harness biết đỏ: với importer của `origin/main`, chế độ zalo đỏ 6 mục, chotot đỏ 4 mục.
