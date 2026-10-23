# Thiết kế: canonical không còn tin giả (PL2 · L19b)

> Hàng PL2 của `docs/plan/lo-trinh.json` (đợt dot0-cam-mau, dãy P4). Hồ sơ `_acceptance/canonical-khong-tin-gia/`.
> Căn cứ: `docs/architecture/classification-enrich-review.md` §0.3 (L19, F6 bước 2) · luật đợt
> (`.acceptance-runs/dieu-phoi-dot0-cam-mau/LUAT.md` mục PL2) · migration 039 (`reconcile_stale_offers`).

## 1. Vấn đề (đo trên DB local 23/10)

| Chỗ | Số |
|---|---|
| `stg_zalo_posts` từ snapshot `zalo-mock` (bộ sinh tin giả của collector) | 1.260 post |
| Post do agent thử `e2e-agent` (SĐT giả 0901234567) | 1 |
| Post trong nhóm thử `TEST`, `TEST-G1` (hook OpenClaw lúc thử ống) | 2 |
| `sale_offers` S03 có ít nhất một post thử | 1.023 / 1.102 (1 offer trộn post thật + post giả cùng băm) |
| …trong đó mang `bait_gap_pct` | 153 / 155 |
| `sellers` không còn offer thật nào sau khi bỏ tin thử | 989 / 1.043 |
| Liên kết `property_offers`, đề xuất enrich trên tin thử | 0, 0 |
| Thẻ duyệt đang chờ trên tin thử | 2 (thẻ 159, 161 — F6 bước 1) |

Đường lan: snapshot thử → importer (làn ZCode) → `stg_zalo_posts` → `transform-zalo.mjs` → `sale_offers` S03 →
`refresh-bait-gap.mjs` (bait gap + sellers) → `sync-cloud` FILL (`sale_offers`, `sellers`) → cloud. Không tầng nào
đánh dấu dữ liệu thử. PL1 (importer bỏ snapshot thử) là làn ZCode, không thuộc đợt — nên transform phải tự từ chối.

## 2. Cách làm

### 2.1 Một định nghĩa «post thử» — `pipeline/lib/test-posts.mjs`

`testMarker(row)` trả tên dấu hoặc `null`, xét theo thứ tự, mỗi dấu một luật xác định trên cột stg:

| Dấu | Luật | Căn cứ |
|---|---|---|
| `snapshot-source` | phần nguồn của `snapshot_id` (`<city>__<source>__<ts>`) là `zalo-mock`, `example`, hoặc chứa từ `mock`/`test`/`e2e` | manifest `source: zalo-mock` ghi «MOCK DATA»; `example` là snapshot `synthetic` |
| `agent` | `agent_id` bắt đầu bằng `e2e`, `test`, `mock` | post `e2e-agent` |
| `group` | `group_name` bắt đầu bằng `TEST` (không phân biệt hoa thường, theo sau là hết chuỗi hoặc ký tự không phải chữ) | nhóm `TEST`, `TEST-G1`; câu giao PL1 «zalo-mock, e2e, TEST» |

`loadStgPosts(client, channel)` là nơi DUY NHẤT đọc `stg_zalo_posts` cho transform: `channel='zalo'` (agent_id
NULL hoặc khác `apify-facebook`) cho S03, `channel='facebook'` cho S05; trả `{ posts, rejected }` với `rejected =
{ total, by_marker }`. `transform-zalo.mjs` và `transform-fb.mjs` thay câu SELECT riêng bằng hàm này.

PL1 (importer) có thể import cùng hàm sau này — một định nghĩa cho cả hai tầng; vòng này không sửa importer.

### 2.2 Dọn qua đối soát, không DELETE tay

Transform không thấy post thử → offer sinh từ chúng không còn trong lượt → `writeOffers` → `reconcile_stale_offers`
(039) rút chúng: xoá tường minh, thẻ chờ (159, 161) thành `rejected` kèm ghi chú, `ops_audit` có `enrich:reconcile`
(số offer cũ) và `enrich:retire` (danh sách offer bị rút). Offer trộn (post thật + post giả cùng băm) giữ lại với
`post_ids` chỉ còn post thật. Transform ghi thêm một dòng `ops_audit` `transform:reject-test`
`{source, rejected, by_marker}` khi lượt từ chối ít nhất một post — để dòng dọn nói được VÌ SAO offer bị rút.
Không ghi gì khi không có post thử.

`stg_*` giữ nguyên: là tầng của importer (làn ZCode), PL1 dọn nó; transform lọc ở đầu đọc nên canonical sạch dù
stg còn hay không.

### 2.3 Bait gap và sellers

`refresh-bait-gap.mjs` đã đặt lại `bait_gap_pct` cho mọi offer P1 mỗi lượt — offer giả bị rút thì bait gap của chúng
mất theo. Registry `sellers` là DẪN XUẤT từ `sale_offers` (chú thích đầu tệp: script là chủ duy nhất của cột tổng
hợp) nhưng hiện chỉ UPDATE: người bán không còn offer nào nằm lại mãi. Thêm bước: xoá người bán không còn offer nào
(`NOT EXISTS sale_offers.seller_phone_hash`), ghi `ops_audit` `bait-gap:sellers-orphan` `{deleted, remaining}` khi xoá ≥1.

Tách hàm để đo được trong một giao dịch: `runTransformZalo(client)` (không tự BEGIN/COMMIT; `main` bọc giao dịch
như cũ) và `refreshBaitGap(client)`.

### 2.4 Thước dư lượng — `pipeline/scripts/test-data-residue.mjs`

Đo trên DB local, in JSON, mã thoát 1 khi còn dư lượng:
- `offers_from_test` — `sale_offers` có `post_ids` giao với tập post thử (theo `testMarker`);
- `bait_gap_from_test` — trong số đó, mang `bait_gap_pct`;
- `sellers_from_test` — người bán có `phone_hash` = băm SĐT rút từ text post thử (bằng `extractPhones` của chính
  transform) mà không có offer sạch nào mang SĐT đó; cộng `sellers_orphan` — người bán không còn offer nào;
- `markers` — số post thử theo dấu (ma trận đối chiếu với bảng §1).

`--simulate`: BEGIN → `runTransformZalo` → `refreshBaitGap` → đo → kiểm có dòng `ops_audit` `enrich:reconcile` +
`transform:reject-test` mới trong giao dịch → ROLLBACK. Không để lại gì trên DB. Chạy không cờ = đo trạng thái hiện
tại (dùng sau khi lượt đêm đã chạy code mới).

### 2.5 Khi nào dọn thật (Hỏi-1)

Lượt 00:00 (`scripts/zalo-import-daily.sh` → `transform-zalo` → `refresh-bait-gap`) chạy code từ checkout chính.
Khuyến nghị: dọn thật bằng lượt đêm đầu tiên SAU merge; trong vòng chỉ đo bằng `--simulate` trên DB local thật. Dọn
thật trước merge thì lượt 00:00 (code cũ) nạp lại 1.020 tin giả tới khi merge. Cloud sạch ở lượt sync 15′ kế (FILL thay toàn bảng) — không sửa tay DB prod.

### 2.6 Chặn tụt của sync cloud (Hỏi-4)

`sync-cloud.mjs` dừng cả lượt (nguyên tử, mọi bảng) khi một bảng local còn dưới 50% số dòng trên cloud
(`SHRINK_MIN`, dòng 115/495). Sau dọn: `sale_offers` 12.615 → ~11.592 (92%, qua), `sellers` 1.043 → ~54 (5%, CHẶN) —
cloud sẽ đứng yên cả tin giả lẫn dữ liệu mới từ lượt 00:15 đầu tiên. Khuyến nghị: miễn trừ có căn cứ — `sellers` được
qua khi local có dòng `ops_audit` `bait-gap:sellers-orphan` trong 24 giờ mà `remaining` bằng đúng số dòng đang gửi
(tụt được giải thích bởi một lượt dọn xác định, không phải local dựng dở). Lối khác: cờ một lần do làn merge chạy
tay sau lượt 00:00 (sync đứng tới khi có người chạy); hoặc tách phần `sellers` ra hàng riêng cùng lỗi «không còn
đường INSERT» (ngưỡng «0 sellers giả» của PL2 không đạt). Sửa `sync-cloud.mjs` (đường T3) chạm cùng tệp với dãy
P2 (AU1 leak gate) — xin qua giám sát trước khi sửa.

## 3. Ngoài vòng

- Later: importer bỏ snapshot thử + dọn stg (PL1, làn ZCode) · `pipeline/sql/450_dq_checks.sql` tính độ tươi S03
  bằng snapshot `zalo-mock` · `source_registry.source_ids` của S03 ghi `zalo-mock,zalo-groups` thay vì `zalo-agent` ·
  `sellers` không còn đường INSERT từ 21/10 (907f4bd) nên người bán thật mới không vào registry · kiểm cloud sau
  merge (bước triển khai của làn merge).
- Never: sửa tay DB prod; xoá snapshot raw (bất biến); DELETE trực tiếp `sale_offers` ngoài đối soát.

## Đặc tả UX

Bỏ — vòng không chạm UI (pipeline + DB local). Xem dòng `descope` «bỏ đặc-tả-UX» trong sổ quyết định.
