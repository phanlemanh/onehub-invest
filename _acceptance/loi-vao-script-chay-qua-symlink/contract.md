---
schema_version: 1
feature: Lối vào các script Node chạy được khi gọi qua symlink ~/dev/one-invest (job đêm launchd)
slug: loi-vao-script-chay-qua-symlink
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
design_doc: docs/superpowers/specs/2026-10-24-loi-vao-script-chay-qua-symlink-design.md
approved_by:
approved_at:
veto_state: mo
veto_opened_at: 2026-10-24T00:10:00Z
---

# Acceptance Contract: loi-vao-script-chay-qua-symlink

## Context

Lượt dọn PL2 đêm 24/10 không xảy ra: launchd gọi script qua symlink `~/dev/one-invest`, lối vào của nhiều tệp
`.mjs` so `argv[1]` (đường symlink) với `import.meta.url` (đường đã giải) nên `main()` không chạy và thoát 0 im
lặng. Transform S03/S05/S06, bait gap và resolve-properties của chuỗi đêm câm từ 19–22/10.

Source input: chẩn đoán P4 24/10 + lời giao của giám sát đợt dot0-cam-mau (hàng phát sinh dãy P4).

## Criteria

- AC-1: Given 12 tệp viết trước (`pipeline/{transform-zalo,transform-fb,transform-chotot,refresh-bait-gap,resolve-properties,dq-enum-vocab}.mjs`, `pipeline/scripts/test-data-residue.mjs`, `scripts/{dev-ops-account,check-api-surface,check-deals-api,smoke-api-matrix}.mjs`, `agent/scripts/enrich-revert.ts`), When gọi mỗi tệp theo ba cách — qua một symlink tạm trỏ tới gốc kho, qua đường thật tuyệt đối, và qua đường tương đối từ thư mục của nó — Then lối vào chạy ở cả ba cách: tệp cần DB (8 tệp) thoát khác 0 kèm `ECONNREFUSED` khi `DATABASE_URL` trỏ cổng không có ai nghe; tệp kiểm tĩnh (`check-api-surface`, `check-deals-api`) in dòng kết quả; `smoke-api-matrix` in dòng lỗi gọi mạng khi `BASE_URL` trỏ cổng chết và `OPS_API_TOKEN` có giá trị giả; `enrich-revert` thoát khác 0 kèm thông điệp thiếu `--actor`.
- AC-2: Given một tệp mẫu mang lối vào khuôn cũ (`import.meta.url === pathToFileURL(argv[1]).href`), một tệp mang biến thể `path.resolve`, và một tệp mang khuôn mới (`realpathSync`), When gọi cả ba qua symlink, Then hai khuôn cũ thoát 0 không in gì và khuôn mới in dấu đã chạy.
- AC-3: Given mọi tệp `.mjs`/`.ts` trong `pipeline/`, `scripts/`, `agent/`, `collector/src`, `data-api/src`, `tools/` (trừ `node_modules`), When quét, Then mọi tệp nhắc cả `process.argv[1]` lẫn `import.meta.url` đều có `realpathSync(` áp lên vế `argv[1]` — tính theo cả tệp, không theo từng dòng (bắt được khuôn cũ tách dòng, gán biến trung gian, `endsWith`).
- AC-4: Given các tệp ở AC-1 nhập như mô-đun từ một tệp chạy khác (cách test hiện có dùng `runTransformZalo`, `refreshBaitGap`, `measureResidue` — `argv[1]` là tệp chạy đó), When tệp chạy ấy được gọi qua symlink và qua đường thật với `DATABASE_URL` trỏ cổng chết, Then không `main()` nào chạy (tiến trình thoát 0, không có `ECONNREFUSED`).

## Coverage

- Trục A — Cách gọi: qua symlink | qua đường thật | nhập như mô-đun [thước CE: plist launchd (11/11 qua `~/dev/one-invest`, giám sát đo 24/10) + test hiện có import hàm]
- Trục B — Khuôn lối vào: so chuỗi `pathToFileURL` | `path.resolve` | `realpathSync` | không có lối vào điều kiện [thước CE: `git grep "argv\[1\]"` trên pipeline/scripts/agent 24/10]
- Core 4 ô → AC-1…AC-4. Bản chép kit (`scripts/product-map.mjs`, `khong-can-nguoi.mjs`, `lo-trinh.mjs`) đã so realpath — AC-3 quét cả chúng, không sửa.
- [GIẢ ĐỊNH] Gọi qua đường thật vẫn chạy như cũ — `realpathSync` của đường thật là chính nó.

## Out of scope

- Sửa plist launchd hay đổi `ROOT` trong `scripts/*-daily.sh` (làn ZCode `cron/*.plist`, bước thu/nạp).
- Chạy dọn tay trên DB — lượt đêm kế (sau merge) dọn theo thiết kế PL2.
- Cảnh báo khi một job đêm thoát 0 mà không in gì (giám sát job — hàng AU3/AU6).

## Notes

- Ra khỏi kho (làn merge): launchd chạy code từ checkout chính — sau merge phải `git -C ~/dev/onehub-invest pull --ff-only origin main` TRƯỚC 05:15 để job chotot 05:30 dùng bản sửa; sau 05:30 xem `pipeline/logs/chotot.log` có dòng của transform-chotot, sau 00:00 xem `zalo-import.log` có dòng `posts:` của transform-zalo.

- Chân đỏ nền có sẵn: `executors.design.ui_check` trỏ `design-scan.js` của bản kit cũ — giám sát xử riêng.
