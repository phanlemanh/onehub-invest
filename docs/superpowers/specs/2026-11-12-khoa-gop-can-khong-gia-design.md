# DA6 `khoa-gop-can-khong-gia` — mỗi tin thuộc nhiều nhất một căn, đổi giá không sinh căn mới

Hồ sơ: `_acceptance/khoa-gop-can-khong-gia/` · hàng DA6 (T3) của `docs/plan/lo-trinh.json` · Cổng Đáng: Mạnh «Làm cả ba» (12/11)
· ADR-0013 câu 3 (căn = vật thể, tin = Property; một tin không là hai căn).

## Vấn đề

Stage A của `pipeline/resolve-properties.mjs` gom tin S06 theo khoá cụm
`ô 0,0005° | ô 0,0005° | kind | property_type | round(diện tích) | round(giá/1e6)` và khớp căn có sẵn qua `stable_key` = khoá cụm.
Giá nằm trong khoá: tin đổi giá rơi sang cụm mới → không khớp căn cũ → tạo căn mới và chèn link mới, trong khi link cũ vẫn còn
(`ON CONFLICT (property_id, offer_id)` chỉ chặn trùng cặp). Một tin thành hai căn — trái ADR-0013 câu 3.

## Đo trên DB máy thu (12/11, chỉ đọc)

- `property_offers` 87.768 link · 84.833 tin khác nhau · 76.408 căn (`resolved_by = 'stage-ab'`, mọi căn `verification = 'pending'`).
- **2.682 tin gắn hơn một căn** (đo 12/11; 2 căn: 2.468 · 3: 182 · 4: 27 · 5: 4 · 7: 1). Mốc trước: 1.853 (lộ trình, kiểm kê
  11/11), 247 (27/10) — tăng mỗi lượt resolve vì mỗi lần một tin đổi giá là thêm một link.
- Luật dọn (ghi chú hàng DA6): giữ căn tạo sớm nhất → gỡ **2.935 link**; sau dọn **2.542 căn không còn tin nào**.
- `properties`, `property_offers` nằm trong FILL của `pipeline/sync-cloud.mjs` → cloud nhận dữ liệu đã dọn ở lượt sync kế.
- Bên đọc: app và API không liệt kê căn đứng một mình; mọi bên đọc đi qua `property_offers` (`600_data_flow.sql`,
  `do-lam-giau-db.mjs`, `duong-can.mjs`); `reassign-areas.mjs` đếm căn theo khu (căn rỗng vẫn được đếm).

## Thiết kế

**Migration 098** (số chờ sổ của LL; idempotent, một giao dịch):
1. Bảng nhật ký `property_offer_unlinks (property_id, offer_id, score, signals, linked_at, unlinked_at, reason)` — giữ trọn dòng link
   bị gỡ để khôi phục được. Không dùng `registry_events` (055): `object_key` bắt khuôn ULID `pty_…`, căn dùng id số.
2. Dọn: với mỗi `offer_id` có hơn một link, giữ link tới căn `created_at` sớm nhất (hoà thì `id` nhỏ), chép các link còn lại vào
   nhật ký (`reason = 'DA6 gop: giu can tao som nhat'`) rồi xoá. Không xoá căn nào (M-1: «KHÔNG TRUNCATE — properties persistent
   vĩnh viễn»).
3. `ALTER TABLE property_offers ADD CONSTRAINT property_offers_offer_id_key UNIQUE (offer_id)` (bọc kiểm tồn tại).

Không thêm cột vào `properties` (bảng sync cloud: cột mới phải có DDL cloud trước, nếu không lượt sync gãy).

**Resolver** (`chayResolve`) — giữ nguyên khoá cụm (có giá), thêm hai luật:
- Chèn link chỉ cho tin **chưa gắn căn nào** (`NOT EXISTS` trên `property_offers.offer_id`, rồi `ON CONFLICT DO NOTHING` không chỉ
  khoá). Tin đã gắn giữ căn của nó dù giá, diện tích, vị trí đổi — đúng cả khi DB chưa áp 098.
- Cụm không khớp căn nào (theo `stable_key` như cũ) chỉ sinh căn mới khi cụm **có ít nhất một tin chưa gắn**; cụm mà mọi tin đã gắn
  (vd một tin vừa đổi giá rơi sang bậc giá mới) không sinh gì.
- `stable_key` không đổi khuôn (sáu đoạn), căn có sẵn không bị ghi lại khoá.
- Chụp lại `pipeline/lib/thu-lai-deadlock.sql-base.json` (bản ghi câu SQL của resolver mà bộ thử lại deadlock đối chiếu).

**Vì sao không bỏ giá khỏi khoá** (phản biện P0, đo DB máy thu 12/11): bỏ đoạn giá thì 26.793 căn rơi vào 10.521 khoá chung, một khoá
tới 39 căn — mọi căn cùng toà (ô 0,0005° ≈ 55 m), cùng loại, cùng diện tích làm tròn gộp làm một. Lỗi không nằm ở việc khoá có giá
mà ở chỗ tin đã gắn bị gắn lại theo khoá mới; giữ căn cho tin đã gắn sửa đúng chỗ ấy, không gộp nhầm căn nào.

**Bên ghi `property_offers`** (kê toàn kho 12/11): resolver (sửa ở hàng này); hàm nạp lại đổi khoá của 044 chuyển link sang tin
mới bằng `ON CONFLICT DO NOTHING` không chỉ khoá — bắt được UNIQUE mới, tin mới đã có căn thì giữ căn của nó; hai hàm dựng dữ liệu
thử (`pipeline/lib/nap-lai-matrix.mjs`, `pipeline/scripts/do1-dung-thu.mjs`) gắn đúng một link cho tin mới tạo. Không bên ghi nào
gãy vì UNIQUE.

**Sync cloud**: `property_offers`, `properties` không thuộc nhóm giữ — lượt sync `DELETE FROM` rồi chèn lại toàn bảng, nên cloud
nhận đúng tập link đã dọn; đo lại trên cloud trước khi thêm UNIQUE ở đó (Đường đo).

## Ảnh hưởng ngoài hàng

- Hồ sơ đã ký có `paths` chạm `resolve-properties.mjs` (dong-bang-stage-b-resolve, resolve-thu-lai-deadlock) sẽ báo bằng chứng cũ
  sau khi gộp → cần ghim lại.
- Hai lượt lời riêng của Mạnh, theo thứ tự: (1) áp 098 lên DB máy thu (gồm dọn 2.935 link), chạy resolve, để sync-cloud đẩy
  dữ liệu đã dọn; (2) chỉ sau đó mới thêm DDL UNIQUE trên cloud — thêm trước thì DDL gãy vì cloud còn link trùng.
- 2.542 căn rỗng sau dọn: giữ nguyên hay đánh dấu để ẩn/dọn sau là lựa chọn sản phẩm — Hỏi ở Cổng Phạm vi; thiết kế mặc định giữ
  (M-1) và chỉ đổi nếu Mạnh chọn đánh dấu.
- Gộp các căn đã sinh do đổi giá trước đây (cùng ô, loại, diện tích, khác bậc giá) thành một căn: ngoài vòng — cần người phân biệt căn trùng với căn khác nhau cùng toà.

## Phép đo

`pipeline/tests/resolve-properties-khoa-gop.itest.mjs` trên `db/db-thu.sh oneinvest_suite_kgc --chay` (DB của riêng lượt chép dữ
liệu máy thu, xoá khi xong): áp 098 trên dữ liệu thật, đếm độc lập trước/sau, khôi phục từ nhật ký, chạy resolver mới, đổi giá thử,
và ca mồi tổng hợp dựng bằng chính resolver.
