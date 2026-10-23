---
schema_version: 1
feature: backfill ảnh Zalo xét cả snapshot zalo-agent schemaVersion 3, không chỉ v2
slug: backfill-zalo-media-v3
owner: phanlemanh@gmail.com
risk_tier: T2      # chỉ pipeline/backfill-zalo-media.mjs + test; không đụng t3_paths
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-23T10:19:14Z
approved_by:
approved_at:
---

# Acceptance Contract: backfill-zalo-media-v3

## Context

PL4 (Kev thành nhãn, hồ sơ `kev-thanh-nhan`, nhánh `claude/acceptance-kev-nhan`) nâng snapshot
`zalo-agent` lên schemaVersion 3: thêm `RawItem.meta.kev`, giữ nguyên `meta.mediaFiles` của v2
(DATA-CONTRACT §Lịch sử phiên bản). `pipeline/backfill-zalo-media.mjs` chỉ xét `schemaVersion === 2`,
nên sau khi PL4 triển khai nó bỏ sót mọi snapshot mới và `executors.script.zalo_media_backfill`
(`--check`) báo xanh giả. Việc này nới điều kiện thành `>= 2`.

Source input: prompt (brief từ phiên điều phối «Phân chia công việc Claude/Zcode», local_5d0e32a0…, 23/10/2026 — phát hiện của phiên kiểm độc lập)

## Criteria

- AC-1: Given một thư mục snapshots có `zalo-agent` v1, v2 và v3 (v3 mang `meta.kev` cạnh `meta.mediaFiles`), một snapshot `zalo-agent` mồ côi không `manifest.json` và một snapshot v3 của nguồn khác, When backfill quét thư mục đó, Then nó xét đúng hai snapshot v2 và v3, đọc ra bài có ảnh của snapshot v3, và KHÔNG xét snapshot v1, snapshot mồ côi hay snapshot nguồn khác.
- AC-2: Given snapshot `zalo-agent` v2 có ảnh và v1 không ảnh dựng giả trên DB local, When chạy vòng `backfill --check` → backfill → nạp lại, Then hành vi v2/v1 giữ như hồ sơ `stg-zalo-media-files`: `--check` đỏ trước khi nạp và xanh sau, `media_files` đúng hợp đồng, nạp lại không nhân đôi, và dữ liệu giả dọn còn 0 dòng.
- AC-4: Given script được gọi qua một đường symlink tới thư mục `pipeline/` (như `~/dev/one-invest`, đường launchd cũ còn dùng), When chạy `backfill-zalo-media.mjs --check <thư mục không tồn tại>`, Then thân lệnh vẫn chạy và thoát 1 kèm thông điệp «không thấy thư mục snapshots» — không thoát 0 im lặng.
- AC-3: Given các snapshot `zalo-agent` thật ở `~/dev/onehub-invest/collector/snapshots`, When chạy `backfill-zalo-media.mjs --check`, Then lệnh thoát 0 và in dòng báo cáo mang số snapshot `v2+` (đủ v2 lẫn v3), số bài có ảnh chưa nạp và số dòng `stg_zalo_posts` có `media_files`.

## Coverage

- Bỏ coverage-scan — đổi một điều kiện lọc; trục duy nhất là phiên bản snapshot (v1 | v2 | v3) × loại thư mục (có manifest | mồ côi | nguồn khác), phủ hết ở AC-1 (entry d-backfill-v3-1).

## Out of scope

- Nới `pipeline/import-airbnb.mjs` nhận v3 — đã nằm trong PL4 (làn ZCode `import-*`); trên main hiện tại importer còn từ chối v3, nên backfill thật một snapshot v3 chỉ chạy được sau khi PL4 merge.
- Ca đầu-cuối v3 qua importer trong `pipeline/scripts/media-files-roundtrip.mjs` — thêm sau khi PL4 merge (cùng lý do trên).
- Đọc hay lưu `meta.kev` vào staging — việc của PL4.
- Restart collector :9210 hay sinh snapshot v3 thật — việc triển khai PL4.

## Notes

- Nhánh `fix/backfill-zalo-media-v3` cắt từ main `1682fb5` vì PR của `claude/acceptance-kev-nhan` chưa merge.
- Các hàm quét được export (`mediaSnapshots`, `postsWithMedia`, `MEDIA_SCHEMA_MIN`) và `main` chỉ chạy khi gọi trực tiếp, để test AC-1 không cần DB.
- AC-4 thêm ở vòng chấm 2: phiên VERIFY vòng 1 phát hiện điều kiện «chỉ chạy khi gọi trực tiếp» so chuỗi thô nên gọi qua symlink thì `--check` thoát 0 im lặng — đúng loại xanh giả việc này định sửa; sửa bằng so `realpathSync`.
- E2, E3 cần DB local :5433; E2 dùng tiền tố riêng mỗi lần chạy và luôn xoá dữ liệu giả.
