# Triển khai đồng bộ cloud nguyên tử (cloud-sync-atomic) — 2026-10-23

Người áp migration lên Supabase prod: **Mạnh** (luật 2 — agent không tự đổi schema production).
Hồ sơ nghiệm thu: `_acceptance/cloud-sync-atomic/` · thiết kế:
`docs/superpowers/specs/2026-10-23-cloud-sync-atomic-design.md`.

## Vì sao

`pipeline/sync-cloud.mjs` (launchd `com.oneinvest.cloud-sync`, 15') đời cũ chạy `TRUNCATE` 21 bảng rồi
nạp lại dần qua PostgREST. Đo 23/10 (chỉ đọc):

| Lỗi | Người dùng prod thấy |
|---|---|
| Cửa sổ trống mỗi lượt | ~7' trong mỗi 15': `/dau-tu`, `/ops/deals`, `/api/v1/deals`, `/vn/**` đọc thấy `sale_offers` 0, `properties` thiếu, `v_ruler_p2` 0. Lượt gãy giữa chừng để trống tới lượt lành (22/10: 15 giờ). |
| `TRUNCATE … CASCADE areas` | Xoá sạch «Lưu khu vực» (`saved_markets`, FK `ON DELETE CASCADE`) mỗi lượt. |
| node-pg dựng `Date` theo giờ máy | Mọi cột `date` lùi một ngày (`nights`, `market_metrics.month`…); `timestamptz` mất micro-giây; số thập phân trong jsonb bị làm tròn. |

Bản mới: nạp vào `sync_stage.rows` (schema riêng, `anon`/`authenticated` không đọc được) rồi tráo trong
MỘT giao dịch — prod đọc thấy bản cũ đủ tới đúng lúc COMMIT rồi thấy trọn bản mới. Không còn TRUNCATE:
`areas` được upsert theo khoá, chỉ xoá area không còn ở local (khi đó `saved_markets` trỏ nó xoá theo
FK — Mạnh chọn ở Cổng Phạm vi). Đọc local bằng `row_to_json` nên ngày/số giữ nguyên. Chặn tụt: bảng
nào ở local còn dưới 50% số dòng trên cloud thì lượt dừng, không tráo. `seller_ref` lên dạng
`S0x:<số>`; payload bảng người bán được soát tên nguồn thật ở local trước khi gửi.

### Ranh giới dữ liệu lên cloud (luật Mạnh chốt 2026-10-23, AGENTS.md luật 6)

- **Định danh người bán trên tin rao (tên, SĐT, ID tài khoản) là tầng C** — công khai, được lên cloud.
- **Tầng A chỉ còn:** tên nguồn thật (kể cả lẫn trong giá trị cột), hồ sơ người dùng app,
  `user_events`/`user_profile`, `review_queue`. Vì thế bảng thô/registry (`source_registry`, `stg_*`,
  `airbnb_snapshots`) không lên cloud — chúng mang tên nguồn thật; `seller_ref` đổi về `S0x:<số>`;
  `listing_url`, `photos` (giá trị trỏ tên miền nguồn) ở lại máy; payload ba bảng người bán được soát
  tên + định danh nguồn đọc từ `source_registry` local trước khi gửi (danh sách đó không rời máy).
- **Bảng người bán chỉ gửi cột trong danh sách cho phép** (`CLOUD_ALLOW` trong `sync-cloud.mjs`); cột
  local mới mặc định ở lại máy, log in WARN «cột chưa duyệt».
- **`PII_EXCLUDE` (SĐT, tên người bán) vẫn loại** — giữ vì phạm vi sản phẩm của đợt này (mở các cột đó
  là việc sản phẩm riêng chưa xác nhận), không phải vì luật xếp chúng vào tầng A.

Bản mới nạp và tráo qua Management API dưới role chủ bảng — không dùng service key/PostgREST nữa — nên
bật RLS (migration 037, phiên riêng) không làm sync gãy, miễn RLS không bật `FORCE`.

## Thứ tự (bắt buộc)

1. **Mạnh áp migration 038 lên Supabase prod TRƯỚC khi merge.** Code mới gặp cloud chưa có
   `sync_stage` thì dừng ngay pha `catalog` (`SYNC FAIL [catalog] … cloud chưa có sync_stage`), không
   gửi câu ghi nào, dữ liệu prod giữ nguyên — nhưng sync đứng tới khi có migration.
2. Kiểm (bước dưới) rồi mới merge PR.
3. Sau merge, điều phối làn merge `git -C ~/dev/onehub-invest pull --ff-only origin main`; lượt launchd kế
   tiếp chạy code mới. Không cần sửa plist hay `scripts/cloud-sync.sh`.

## Áp migration 038

Dán nguyên `db/migrations/038_sync_stage.sql` vào Supabase Dashboard → SQL Editor (project
`smqpqiigzulwpmrsrhci`) → Run. Migration idempotent, chỉ tạo schema `sync_stage` (2 bảng) và thu quyền
của `PUBLIC`/`anon`/`authenticated`; không đụng bảng `public` nào.

## Kiểm sau khi áp

Chạy trong SQL Editor, phải ra đúng `t | f | f`:

```sql
SELECT to_regclass('sync_stage.rows') IS NOT NULL AND to_regclass('sync_stage.swaps') IS NOT NULL AS co_bang,
       has_schema_privilege('anon', 'sync_stage', 'USAGE') AS anon_vao_duoc,
       has_schema_privilege('authenticated', 'sync_stage', 'USAGE') AS authenticated_vao_duoc;
```

## Lượt thử có đo (khuyên làm một lần, trước hoặc ngay sau merge)

Hai terminal trong worktree của PR (hoặc checkout chính sau merge). Máy đo chỉ đọc; lượt sync ghi
cloud đúng như launchd vẫn ghi mỗi 15'. Chạy lúc launchd vừa xong một lượt (xem giờ sửa của
`pipeline/logs/cloud-sync.log`) để hai lượt không chồng nhau.

```bash
node pipeline/scripts/cloud-sync-watch.mjs --seconds 300 --every 2
```

```bash
node pipeline/sync-cloud.mjs
```

Đọc kết quả:
- sync in `sync xong … catalog Xs · read Xs · stage Xs · swap Xs · gate Xs; tổng Xs; leak gate PASS`.
  Lỗi thì in `SYNC FAIL [<pha>] …`; dữ liệu prod vẫn là bản trước.
- watch kết bằng `watch: OK — không lúc nào 0, saved_markets không đổi` (exit 0). Có `MIN0 <bảng>` hoặc
  `SAVED_MARKETS_DOI` là prod đã đọc thấy rỗng/đổi dữ liệu người dùng — dừng, báo lại.
- Tự kiểm máy đo (không gọi mạng): `node pipeline/scripts/cloud-sync-watch.mjs --selftest`.

## Lùi về bản cũ

`git revert` các commit `feat(pipeline): sync-cloud nguyên tử…` trên `main`, pull vào checkout chính.
Không cần sửa dữ liệu cloud; schema `sync_stage` để lại cũng vô hại (bản cũ không đọc nó). Lưu ý bản cũ
lại TRUNCATE và xoá `saved_markets` mỗi lượt.

## Ngoài hướng dẫn này

- `/api/v1/ops/coverage` trên prod vẫn 500: cần aggregate theo mã S0x, không đưa `source_registry` lên
  cloud (ADR-0007) — việc riêng.
- Các bước trên không có bước nào để agent tự áp DDL lên production.
