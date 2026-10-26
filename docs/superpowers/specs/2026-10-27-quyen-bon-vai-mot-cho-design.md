# quyen-bon-vai-mot-cho — thiết kế (TV1)

Căn cứ: hàng TV1 của `docs/plan/lo-trinh.json` (phủ TV1 + TVN3); `docs/research/ops-tu-van-hanh-nguon-saas.md` §2.4 G3,
§3.5 (bảng vai); `docs/architecture/portals.md` (luật quản trị admin-gated, bảng chế độ API); ô cơ hội
`_acceptance/quyen-bon-vai-mot-cho/opportunity.md` (giám sát, P1-33).

## Vấn đề (đo 27/10 trên `main` 39c660ca)

- 11 route `/api/v1/ops/**` tự chép một khuôn kiểm: bearer `OPS_API_TOKEN` khớp → qua, không thì `canAccessOps` (vai
  `ops`/`admin` hoặc `OPS_EMAILS`). Route quản trị (`zalo/**`, `source-groups` add/delete/toggle) chỉ cần vai `ops`
  hoặc bearer chung — trái `portals.md` «Quản trị … → admin-gated».
- `ops_audit.actor` là hằng (`ops-user`, `api:zalo-admin`, `ops-api`) ở toggle/add/delete, zalo, review; `zalo/login`
  (chạy/dừng tiến trình đăng nhập) không ghi audit.
- `auditOpsWrite` ghi nền sau COMMIT (lỗi bị nuốt): thao tác thành công có thể mất dòng audit; chỉ set-mode, set-meta
  ghi audit trong cùng transaction.
- `GET source-groups` kiểm quyền trên `new Request("http://x")` rỗng: bearer của máy không bao giờ qua (TVN3).
- `users.role` không CHECK; kiểu `User.role` chỉ có `user|ops|admin`, giá trị lạ rơi về `user`.

## Quyết định

### Một bảng quyền ở `app/src/lib/ops-access.ts`

Bốn vai xếp bậc `viewer < ops < admin < owner` (vai `user` = không vào Ops). Bảng `QUYEN_OPS: hành động → { vai tối
thiểu, bearer máy được không }`, viết trước, một dòng một hành động:

| Hành động | Route · phương thức | Vai tối thiểu | Bearer máy |
|---|---|---|---|
| `ops.read` | GET collections, coverage, extraction-quality, truthful-coverage, source-groups | viewer | có |
| `audit.read` | GET audit | admin | không |
| `ingest.push` | POST ingest | ops | có |
| `review.decide` | POST review/[id]/decide | ops | không |
| `unit.toggle` | POST source-groups `toggle` | admin | không |
| `unit.create` | POST source-groups `add` | admin | không |
| `unit.delete` | POST source-groups `delete` | admin | không |
| `unit.set_mode` | POST source-groups `set-mode` | admin | không |
| `unit.update_meta` | POST source-groups `set-meta` | admin | không |
| `zalo.admin` | mọi phương thức `zalo/accounts`, `zalo/groups`, `zalo/login` | admin | không |

- Ghi thẳng qua route ở máy thu là «quản trị» → admin (`portals.md`: «Quản trị = ghi config, đăng nhập nguồn, bật/tắt
  thu thập → admin-gated»). Quyền «gửi lệnh» của vai `ops` ở §3.5 (`source.pause`, `unit.update_meta`, `unit.create` ở
  `draft`) đi đường lệnh kéo của TV4/TV5, không phải route ghi thẳng. Từ khi gộp tới TV4, vai `ops` không tự tạm dừng
  nhóm được (**Hỏi-2** — khuyến nghị; lối khác: cho `unit.toggle` ở vai `ops` tới khi có đường lệnh). Đo 27/10: 0
  người mang vai `ops` ở local lẫn cloud.
- `owner` ⊇ `admin` ⊇ `ops` ⊇ `viewer`. Email trong `OPS_EMAILS` tính là vai `ops` (**Hỏi-1** — khuyến nghị; lối khác: tính là `admin`). Hôm nay cửa phụ
  này bật/tắt, thêm, xoá nhóm và chạm zalo được; sau sửa nó chỉ còn đọc, nạp số và duyệt thẻ.
- Bearer chung chỉ còn cho đọc số và nạp số (máy đêm `push-ops-facts` → `ingest`). Mọi thao tác ghi khác cần một người
  thật: bearer → 403. Token máy theo tên (`ops:pull`) là việc của TV4.
- Một hàm duy nhất `kiemQuyen(req, hanhDong)` trả `{ nguoi, actor }` hoặc Response 401 (không ai) / 403 (sai vai). Hàm
  đọc phiên từ chính header `Cookie` của request (chung truy vấn với `getSessionUser`), nên route test được bằng phiên
  thật và GET `source-groups` kiểm bearer trên request thật. Route không tự viết điều kiện quyền nào nữa.
- `isAdmin`/`canAccessOps` giữ cho trang `/ops/**`, suy từ cùng bậc vai (viewer vào được trang Ops đọc; owner qua cổng
  admin).

### Audit đúng một dòng, người thật, cùng transaction

- Helper `ghiAuditTrong(client, actor, action, detail)` INSERT bằng client của transaction đang mở. Không route nào gọi
  `auditOpsWrite` nữa (hàm còn export cho bản route trước sửa ghim làm fixture đối chứng).
- Actor: `user:<id>` khi có người; `machine:cloud-sync` khi bearer nạp số. Không còn actor hằng cho thao tác người.
- Thao tác DB: BEGIN → ghi → INSERT audit → COMMIT; lỗi ở bất kỳ bước → ROLLBACK, 0 dòng audit, trạng thái giữ nguyên.
- Thao tác không phải DB (ghi tệp cấu hình Zalo, chạy/dừng tiến trình đăng nhập): BEGIN → INSERT audit → làm việc →
  COMMIT; việc lỗi → ROLLBACK (0 dòng). Ca COMMIT hỏng sau khi việc đã làm là giới hạn đã khai (hiếm, không mất người).
- Ô «không đổi» (toggle unchanged, 409 nhóm đã gỡ) và mọi 4xx: 0 dòng audit.

### `users.role` có CHECK

Migration `049` (liên làn cấp, P1-34): `CHECK (role IN ('user','viewer','ops','admin','owner'))` tên `users_role_chk`,
  idempotent (kiểm `pg_constraint` trước khi thêm). Đo 27/10 chỉ đếm: local user=1, admin=2; cloud admin=1 — qua cả
  hai. Bảng `users` nằm cả ở Supabase prod (đăng nhập `/ops` chạy trên đó) và cloud áp migration tay: áp prod là
  **Hỏi-3** (khó-đảo) — cách áp: Mạnh chạy tệp 049 bằng `psql` với chuỗi kết nối Supabase của mình; cách lùi
  `ALTER TABLE users DROP CONSTRAINT users_role_chk`. Không gán vai cho ai — cấp
`owner` cho tài khoản thật là việc của người (TVD). Kiểu `User.role` có năm giá trị; giá trị ngoài năm vẫn rơi về `user`.

### Sổ bề mặt API

`app/src/lib/api-surface.ts` mang chế độ theo bảng: route có phương thức khác vai thì khai riêng từng phương thức
(`source-groups` GET đọc · POST theo action; `zalo/**` admin; `audit` admin; `review` ops-session).

### Đối chứng ghim

Đối chứng của các ca chạy trên 11 tệp route ở `39c660ca` (gốc của vòng) ghim thành fixture
`app/tests/fixtures/ops-routes-truoc-tv1/` (đuôi `.ts.txt`), chép tạm cạnh route khi chạy — không đọc ref nhánh lúc chạy
(lệ `cong-tac-test-ghim-ban-cu`, `so-tu-vung-mot-nguon`). Fixture gọi bằng bearer (đường cũ cho qua).

### Giữ nguyên

- Câu SQL chạm `source_groups` trong route (PL12 ghim số câu); ca thử mới ghi bảng `collection_units`, không nhắc tên
  `source_groups` (PL12 soát tệp nhắc tên).
- Hành vi nghiệp vụ của từng route (ma trận công tắc, purge, chế độ thu, sổ đơn vị) không đổi.

## Ngoài phạm vi

- Token máy theo tên và scope `ops:pull` (TV4); giao diện quản vai (TV5/U2); cấp vai cho tài khoản thật (việc người).
- Đảo trạng thái purge (`delete` vẫn xoá cứng — G3 phần «không đảo» là hàng sau).
- Kiểm vai ở trang `/ops/**` theo từng hành động (trang vẫn dùng `canAccessOps`/`isAdmin`).
