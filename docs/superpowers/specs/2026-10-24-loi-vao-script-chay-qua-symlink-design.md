# Thiết kế: lối vào script chạy được khi gọi qua symlink

> Hàng phát sinh của dãy P4 (đợt dot0-cam-mau), giám sát giao 24/10 sau khi lượt dọn PL2 không chạy.
> Hồ sơ `_acceptance/loi-vao-script-chay-qua-symlink/`.

## 1. Lỗi

launchd gọi mọi job qua symlink `~/dev/one-invest → onehub-invest` (11 plist). Script `.sh` dựng
`ROOT=$(cd "$(dirname "$0")/.." && pwd)` — đường logic, giữ symlink — rồi `node $ROOT/pipeline/<x>.mjs`.
Lối vào của nhiều tệp `.mjs` là:

```js
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
```

Node phân giải symlink cho `import.meta.url` (`/Users/…/onehub-invest/…`) nhưng `argv[1]` giữ đường gõ
(`/Users/…/one-invest/…`) → không khớp → `main()` không chạy → thoát 0 im lặng. Biến thể
`path.resolve(argv[1]) === fileURLToPath(import.meta.url)` hỏng y như vậy (path.resolve không giải symlink).

Tái hiện chỉ đọc 24/10: `node ~/dev/one-invest/pipeline/scripts/test-data-residue.mjs` → không in gì, exit 0;
qua đường thật → in JSON. `pipeline/logs/zalo-import.log` (1.048 dòng) chưa từng có dòng nào của transform.

## 2. Job đêm câm từ bao giờ (ước theo commit thêm khuôn cũ, đối chiếu log)

| Job launchd | Tệp câm | Câm từ (commit) |
|---|---|---|
| `zalo-import` 00:00 | `transform-zalo.mjs`, `refresh-bait-gap.mjs` | 19/10 (e0216e5), 21/10 (907f4bd) — log không có dòng transform nào |
| `apify-facebook` 0/6/12/18h | `transform-fb.mjs`, `refresh-bait-gap.mjs` | 21/10 (19a3648, 907f4bd) |
| `chotot` 05:30 | `transform-chotot.mjs`, `refresh-bait-gap.mjs`, `resolve-properties.mjs` | 21/10 (a19b314), 22/10 (50005b7) |
| `cloud-sync`, `airdna-daily`, `collector`, `smoke`, watchdog, heartbeat | — (`sync-cloud`, `import-airbnb` đã so realpath; các tệp khác không có lối vào điều kiện) | không câm |

Hệ quả: số S03/S05/S06 trong `sale_offers`, bait gap và `properties` từ 19–22/10 là từ các lượt chạy tay;
lượt đêm chỉ nạp stg.

## 3. Cách sửa

Đổi lối vào sang khuôn kho đã có (`pipeline/sync-cloud.mjs:691`, `pipeline/import-airbnb.mjs:201`,
chú thích ở `pipeline/backfill-zalo-media.mjs:105`):

```js
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) …
```

Mười hai tệp: `pipeline/{transform-zalo,transform-fb,transform-chotot,refresh-bait-gap,resolve-properties,
dq-enum-vocab}.mjs`, `pipeline/scripts/test-data-residue.mjs`, `scripts/{dev-ops-account,check-api-surface,
check-deals-api,smoke-api-matrix}.mjs`, `agent/scripts/enrich-revert.ts`. Không sửa plist (làn ZCode
`cron/*.plist`), không sửa bản chép kit (`scripts/product-map.mjs`, `khong-can-nguoi.mjs`, `lo-trinh.mjs` đã
so realpath).

## 4. Đo

`pipeline/scripts/entrypoint-symlink.test.mjs` (trong suite pipeline):
- Ma trận 12 tệp gọi qua một symlink tạm tới gốc kho: tệp cần DB chạy với `DATABASE_URL` trỏ cổng chết → phải
  thoát ≠ 0 kèm `ECONNREFUSED` (chứng `main()` đã chạy, không ghi gì); tệp kiểm tĩnh in kết quả; `enrich-revert`
  báo thiếu `--actor`.
- Cặp đối chứng: tệp mẫu khuôn cũ qua symlink im lặng exit 0, khuôn mới in dấu chạy.
- Quét: không tệp mã nào trong `pipeline/`, `scripts/`, `agent/` còn so `argv[1]` với `import.meta.url` không qua
  `realpathSync`.
- Import như mô-đun (cách các test hiện có dùng) không kích hoạt `main()`.

## Đặc tả UX

Bỏ — không chạm màn hình.
