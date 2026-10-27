# Giá trị `wanted` → `inquiry` «Yêu cầu» + mô hình Listing ↔ Yêu cầu (Đ1 + Đ5) — design

Hồ sơ: `_acceptance/wanted-thanh-inquiry/`. Căn cứ: `docs/audit/2026-10-27-tu-ngu-tin-listing.md`, ROADMAP §3 #21
(hướng B), và hai lời Mạnh ngày 27/10:
- «tôi gọi Mong muốn mua nhà là Inquiry - Yêu cầu mua thay cho wanted»;
- «Tương tự Listing là bên bán còn Inquiry là bên mua» — Mạnh «Đồng ý» với mô hình đối xứng và nhãn chung «Yêu cầu».

## 1. Vì sao bây giờ

Trục «Ý định tin» (`listing_intent`, PL6) có giá trị `wanted` «Tin tìm mua, tìm thuê». Hiện chưa có cột nào mang trục
này: `columns: []`, cột sẽ đến ở PL5 (migration 046). Chưa có dòng dữ liệu nào giữ giá trị `wanted`. Thứ đã ghi xuống chỉ
là 1 dòng `ref_lookup`, có ở cả local và cloud (phiên liên làn đo 27/10). Đổi bây giờ chỉ là đổi 1 dòng. Để sau PL5 thì
phải đổi cả dữ liệu đã ghi.

## 2. Mô hình đối xứng (chép vào CONTEXT.md)

| | Listing (bên bán) | Yêu cầu (bên mua) |
|---|---|---|
| Là gì | tin chào bán / cho thuê | nhu cầu cần mua / cần thuê |
| Dịch vụ | `kind`: `sale` · `rent_lt` · `rent_st` | cùng bộ mã, nhãn theo phía: mua · thuê dài hạn · thuê ngắn hạn |
| Loại hình | `property_type` | `property_type` (cùng sổ) |
| Giá | giá rao | khoảng ngân sách |
| Gắn với | một căn (UPI) | tiêu chí (khu vực, loại hình, số PN, ngân sách) — khớp nhiều listing |
| Loại con | Tin bán · Tin cho thuê | Yêu cầu mua · Yêu cầu thuê |
| RESO | resource `Property` | không có bản ghi ngang hàng; gần nhất `SavedSearch` — extension của ta, dùng lại trường RESO phía bán |

Vòng này chỉ khai từ vựng. Không làm bảng lưu yêu cầu, không trích ngân sách hay tiêu chí, không ghép yêu cầu với listing.
Đó là tính năng mới, phải có số đo trước (luật 11). Bài tìm mua/thuê vẫn giữ ở raw + stg (review Q8).

## 3. Chỗ đổi (git grep 27/10)

| Nhóm | Tệp | Việc |
|---|---|---|
| Sổ | `pipeline/mappings.yaml` `enums.listing_intent` | code `wanted` → `inquiry`, nhãn «Tin tìm mua, tìm thuê» → «Yêu cầu»; `rationale` nêu mô hình đối xứng |
| Tệp sinh | `pipeline/lib/vocab.generated.mjs`, `agent/src/vocab.generated.ts`, `app/src/lib/vocab.generated.ts`, khối VOCAB của `CONTEXT.md` | `vocab.mjs --write` |
| Test sổ | `pipeline/scripts/vocab.test.mjs` (ma trận nhãn), `vocab-lint.test.mjs` (fixture prompt `offer|wanted`), `vocab-db.itest.mjs` (áp 043 rồi 050) | đổi theo sổ |
| DB | `db/migrations/050_wanted_thanh_inquiry.sql` | `UPDATE ref_lookup` 1 dòng; idempotent |
| Cloud | `docs/ops/cloud-schema-catchup-2026-10-27-050.sql` + `scripts/check-cloud-catchup.mjs` (`HO_SO`) | ĐO TRƯỚC + ÁP; áp sau gộp, giám sát đo, Mạnh duyệt |
| Docs sống | `CONTEXT.md` (khối Yêu cầu, Yêu cầu mua, Yêu cầu thuê; bỏ khối «Yêu cầu mua» tạm), ADR-0013 §9, reso-khung §2 + §8, ROADMAP §3 #21 | tên/nhãn mới |
| Không sửa (lịch sử) | `db/migrations/043_*`, `docs/ops/cloud-schema-catchup-2026-10-26-043.sql`, `_acceptance/so-tu-vung-mot-nguon/**`, `docs/superpowers/**` của PL6, `docs/architecture/classification-enrich-review.md`, `docs/plan/pham-vi-phan-loai-2310.md`, bản soát 27/10 | bản ghi tại thời điểm viết |

Đ5 (cùng hàng): `/ops/collections` có ba chữ «Tin» đang chỉ bài thô:
- nút chế độ Luồng 7 ngày «Tin S03 · Cộng đồng» → «S03 · Cộng đồng»;
- thanh ô Cổng S03 «Tin S03 · Cộng đồng hôm nay» → «Bài S03 · Cộng đồng hôm nay»;
- căn cứ «n tin bị cổng chặn» → «n bài bị cổng chặn».

## 4. Lựa chọn

- **Một giá trị `inquiry` cho cả mua lẫn thuê**, nhãn «Yêu cầu». Loại con phân bằng `kind` khi có bảng yêu cầu, giống tin
  rao. Tách `inquiry_buy` / `inquiry_rent` ngay trên trục ý định thì trộn hai chiều (ý định × dịch vụ) vào một trục.
- **Migration `UPDATE` có `WHERE lookup_value = 'wanted'`**: giữ `sort_order`, `is_local`; chạy hai lần không đổi gì.
- **Thử migration trên DB riêng**, không trên `oneinvest` :5433 (luật đợt 27/10 00:10Z). Bài test DB đọc `DATABASE_URL`;
  lượt chấm trỏ vào DB tạm dựng từ `db/migrations`.
- **Không thêm rào máy mới**. Phép quét tên cũ là răng của hồ sơ (`rang/`), không vào suite chung.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: `/ops/collections` → bấm nút chế độ thứ hai của Luồng 7 ngày → biểu đồ S03 (bài thô + tin rao vào kho)
  (điểm ra: tại chỗ)
- Biên: vai trò nguồn vắng → nhãn nút là mã trần «S03» (như `sourceLabel` hiện nay)

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| /ops/collections | xem thu thập 7 ngày theo nguồn | thanh bên Ops / tại chỗ |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-collections-luong-s03 | /ops/collections | nút «Listing» · «S03 · Cộng đồng»; biểu đồ bài thô + tin rao | đổi chế độ |
| ST-collections-cong-s03 | /ops/collections | ô «Cổng S03 · Cộng đồng hôm nay», thanh «Bài S03 · Cộng đồng hôm nay», căn cứ «n bài bị cổng chặn» | bấm «Xem nhóm» |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Chỉ đổi chữ; không đổi bố cục, màu hay trạng thái tải/trống/lỗi.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `SyncActivity`, `CollectionsTiles` | dùng | chỉ đổi chuỗi nhãn |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng-điều-khiển (dashboard-first)
Căn cứ: trang có sẵn, vòng này không đổi IA — chỉ đổi chữ.
<!-- UX-SPEC-TEMPLATE>>> -->
