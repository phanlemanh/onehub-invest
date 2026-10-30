# Thiết kế: trang /ops/people — danh bạ Người trên Ops (danh-ba-nguoi-tren-ops)

Hồ sơ: `_acceptance/danh-ba-nguoi-tren-ops/` · hạng T2 · dãy U1 · Cổng Đáng: build, Mạnh 30/10 («Mở hàng, máy thu»,
`LUAT.md` của đợt dot0-cam-mau mục «danh-ba-nguoi-tren-ops»).

## Vấn đề

Hàng DB2b (`ho-nguoi-theo-nguon`, #199) đã dựng danh bạ Người ở DB máy thu: 9.803 người (S06 9.411 · S03 357 · S05 35),
bí danh tài khoản / SĐT băm / tên, và 28.841 vai «Người đăng» còn sống. Chưa có chỗ nào để người vận hành nhìn danh bạ:
ai đăng nhiều tin, một người mang những bí danh nào, tin nào nối về người ấy. Muốn xem phải viết SQL.

## Cách làm

Hai trang Ops, đọc thuần, chỉ ở máy thu.

1. **`/ops/people` «Danh bạ người»** — bảng mỗi người đang dùng (`parties.status = 'active'`) một hàng: mã người
   (`pty_…`), nguồn (mã `S0x`), tên hiển thị, số tin đã đăng (số khoá tin khác nhau có vai `nguoi_dang` chưa rút), số
   bí danh theo loại, nhãn suy luận. Xếp theo số tin giảm dần. Lọc theo nguồn (`?source=S03`) và tìm theo bí danh
   (`?q=`, khớp không phân biệt hoa thường trên giá trị bí danh còn sống). Máy chủ chia trang 100 người (`?page=`,
   Hỏi-2), trang ngoài khoảng về trang 1; dưới bảng «Trang k/n · m người khớp» + nút Trang trước / Trang sau (đường dẫn
   giữ lọc). Đầu trang ba số: số người đang dùng, số vai sống, số người theo nguồn.
2. **`/ops/people/[partyKey]` «Một người»** — bí danh (loại, giá trị, nguồn, ngày thấy, đã nghỉ chưa); các tin đã đăng
   (khoá tin, phương pháp, lớp bằng chứng, ngày ghi) — tối đa 200 tin mới nhất, kèm tổng; số vai đã rút. Khoá sai khuôn
   hay không có → 404.

Truy vấn nằm ở `app/src/lib/ops/people.ts`, mỗi hàm nhận `q: Q = pool` như `labels-queries.ts` để test chạy trên lược đồ
tạm. Chỉ `SELECT` trên bốn bảng 055 và `ref_lookup` (nhãn loại bí danh, phương pháp).

### Cổng và chỉ-local

- Cổng phiên `canAccessOps` (viewer trở lên), như mọi trang Ops.
- Trên cloud (`VERCEL=1`) hoặc DB không có bảng `parties` (`localOnlyTable`) → `LocalOnlyAlert` «Chỉ ở máy thu», không
  truy vấn bốn bảng. Bốn bảng không lên cloud (Hỏi-3 của DB2b).
- **Vai Người xem thấy số và mã, không thấy bí danh**: mã người, nguồn, số tin, nhãn suy luận hiện; tên, tài khoản, SĐT
  băm hiện «Ẩn với vai Người xem». Căn cứ: quyết định `viewer-khong-thay-the-duyet` «viewer chỉ thấy số và mã», và tiền lệ
  `/ops/collections` che định danh cho viewer. Vai Vận hành trở lên (`xemNoiDungTin`) thấy bí danh — tên và tài khoản
  người bán là tầng C.

### Vai suy luận chỉ hiển thị

ADR-0016 §8: vai suy luận (đăng nhiều căn → môi giới) không vào cột, chỉ ở `/ops`. Trang tính nhãn lúc đọc: người có từ
**N** tin sống trở lên mang nhãn «Có thể là môi giới» kèm chữ «suy luận · đăng ≥ N tin». Không ghi phát biểu nào vào
`party_roles`, không thêm cột. N là câu Hỏi-1 (khuyến nghị 5).

### SPL

Nguồn chỉ hiện mã `S0x` (cột `parties.source` vốn là mã). Truy vấn danh bạ (`lib/ops/people.ts`) không đọc
`source_registry`, `real_name`, `users`, `sessions`, `user_events`, `user_profile`. Giá trị bí danh (tên hiển thị, tài
khoản) đi qua bộ che chung: trang lấy danh sách tên bằng `getSourceNameEntries()` và che bằng `maskSourceNames()` —
đóng chặt (danh sách rỗng → giá trị về «—»). DB máy thu 30/10 có một tên hiển thị S06 chứa tên nguồn thật. Bí danh SĐT
là băm — hiện 8 ký tự đầu kèm «…».

## Phương án đã loại

- **Trả 500 người nhiều tin nhất, `data-grid` phân trang phía khách** — sắp/lọc tức thì trong 500, nhưng người thứ 501
  trở đi (phần đông danh bạ, 73% người có ≤ 2 tin) chỉ tới được bằng tìm bí danh. Là lối khác của Hỏi-2.
- **Đổ cả 9.8k người vào `data-grid`** — trang ~1 MB HTML mỗi lần mở.
- **Ghi vai suy luận thành phát biểu `inferred` vào `party_roles`** — hàng nói «chỉ hiển thị (không vào cột)»; ghi phát
  biểu là việc của luật E1 ở hàng sau.

## Đặc tả UX

<!-- ux-spec:start -->
### Màn và luồng

- Thanh bên Ops, nhóm «Xử lý» → «Danh bạ người» (`/ops/people`).
- Bảng → bấm mã người → `/ops/people/<pty_…>` (đường dẫn, không sheet: trang người có hai bảng dài, cần URL để dán).
- Trang người có đường dẫn về «Danh bạ người» ở breadcrumb.

### Khuôn IA đã chọn + căn cứ

Danh sách → chi tiết (list-detail qua đường dẫn), khuôn bảng quản trị của `/ops/review` (`data-grid` trong `Frame`) cho
danh sách; trang chi tiết là hai `Frame` bảng `ui/table`. Luồng hiển nhiên, không tra mẫu.

### Vùng của từng màn

`/ops/people`: PageHeader (ba số) → thanh lọc (Select nguồn + ô tìm, form GET) → Frame «Người» (data-grid một trang
100 người, chân Frame: «Trang k/n · m người khớp» + Trang trước / Trang sau). `/ops/people/<key>`: PageHeader (mã người, nguồn, số tin, nhãn suy luận) → Frame «Bí danh» → Frame «Tin đã đăng».

### Bảng trạng thái

| Vùng | Trống | Đang tải | Lỗi | Bị chặn |
|---|---|---|---|---|
| Bảng người | danh bạ rỗng → Empty + lệnh dựng `node pipeline/dung-nguoi.mjs`; lọc không khớp → Empty + nút «Xoá lọc» | Skeleton theo bố cục | RegionError + Thử lại | cloud → LocalOnlyAlert; viewer → cột bí danh «Ẩn» |
| Bí danh | người không bí danh sống → một dòng «Chưa có bí danh còn dùng» | Skeleton | RegionError | viewer → giá trị «Ẩn» |
| Tin đã đăng | 0 tin → «Chưa có tin nào nối về người này» | Skeleton | RegionError | — |

### Chữ

Nhãn lấy từ CONTEXT.md: «Danh bạ người», «Bí danh», «Người đăng», nhãn `alias_kind`/`assertion_method` từ `ref_lookup`.
Số theo `lib/format.ts` (`fmtInt`).
<!-- ux-spec:end -->

## Ngoài phạm vi

- Danh bạ Người trên cloud (TV10/SH1).
- Gộp, tách, nghỉ người từ trang (ghi `registry_events`).
- Ghi vai suy luận thành phát biểu.
- Nối khoá tin sang trang chi tiết tin.
