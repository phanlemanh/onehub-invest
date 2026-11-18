# Itest đỏ trên main vì lý do KHÁC lớp «nạp lại migration cũ» — chỉ báo, không sửa trong hàng này

Quét ngày 12/11 trên main 3bfafd37, mỗi tệp chạy trên DB của riêng lượt (`db/db-thu.sh oneinvest_suite_quet<n> --chay`).
Nhật ký đầy đủ ở `.acceptance-runs/itest-nap-lai-migration-cu-sau-095/quet/`.

| Tệp | Đỏ | Nguyên nhân (một dòng) |
|---|---|---|
| `pipeline/scripts/danh-ba-nguoi.itest.mjs` | 2/22 | AC-8 «sellers thiếu người: S06» và HD13 E7: dữ liệu chép từ máy thu có (SĐT, nguồn) S06 chưa có Người, nên ca phụ thuộc trạng thái dữ liệu thật chứ không phụ thuộc lược đồ. |
| `pipeline/scripts/the-duyet-nguoi.itest.mjs` | 1/13 | TN-AC-10 «S03 lệch số nhóm»: số thẻ không bằng số nhóm đếm độc lập trên bản chép DB thật. |
| `pipeline/scripts/so-nhom.itest.mjs` | 2/14 | SN-AC-1/2 «không rút được câu đọc của script thu S06»: script thu S06 (làn ZCode) đã đổi nên bộ rút câu nguyên văn không còn khớp. |
| `pipeline/scripts/vocab-db.itest.mjs` | 1 (cả tệp) | Bộ rút câu nạp `ref_*` không đọc được `081_labels_truong_moi.sql` (câu nạp nằm ngoài cấp ngoài cùng) — bộ rút cần sửa. |

## Hai tệp tách khỏi hàng sau khi soi sâu (giám sát duyệt cắt phạm vi 12/11)

### `pipeline/scripts/nap-lai-db.itest.mjs` — ND-AC-1 (1/13 đỏ)

- **Triệu chứng.** «áp 044 (hai lần) … phụ thuộc đúng tập»: các view phụ thuộc trực tiếp bảng bản ghi đo được là
  `[listings, sale_offers, sellers]`, kỳ vọng `[listings, sale_offers]`.
- **Nguyên nhân đã soi.**
  - Luật của 044: «chỉ hai view sống đọc thẳng bảng bản ghi; mọi view khác đi qua view sống».
  - View `sellers` của `db/migrations/060_sdt_e164.sql` (31/10) có CTE `lich` đọc thẳng `sale_offer_records`: lấy
    `min(first_seen)`, `max(last_seen)` theo `seller_phone`, gồm cả tin đã nghỉ.
  - Đây là vi phạm thật trên DB hôm nay, không phải dấu vết của việc nạp lại. Dời ca sang DB dừng ở 044 sẽ GIẤU nó, nên
    hàng này không làm.
- **Ai đang đọc `sellers`.**
  - `app/src/lib/ops-queries.ts`, `app/src/lib/deals.ts` (Ops và Invest).
  - `pipeline/sync-cloud.mjs` (lên cloud).
  - `pipeline/refresh-bait-gap.mjs`, `pipeline/do-danh-ba-sdt.mjs`, `pipeline/do-so-ghep-s06.mjs`.
- **Câu cần quyết:** 060 được miễn luật của 044, hay `sellers` phải đọc qua view sống?
  - *Miễn luật:* ghi ngoại lệ có tên vào luật 044 và vào ca ND-AC-1 (danh sách cho phép thêm `sellers` kèm lý do «lịch hoạt
    động người bán gồm cả tin đã nghỉ»). Số hiển thị giữ nguyên.
  - *Đọc qua view sống:* migration mới sửa CTE `lich` sang `sale_offers`. Ngày đầu/ngày cuối của người bán chỉ còn tính
    trên tin đang sống, nên các số hiện ở Ops/Invest và bản cloud có thể co lại. Cần đo trước số người bán đổi.

### `pipeline/scripts/trang-thai-chao.itest.mjs` — AC-3, AC-7 (2/8 đỏ)

- **Triệu chứng AC-3.** «trục assertion_field = năm trường enrich + offer_status + bảy đặc trưng HD5»: trục thật có thêm
  `area_id`, `builder_name`, `floor_raw`, `floor_band`.
- **Nguyên nhân AC-3.**
  - Kỳ vọng so với trục trong `pipeline/mappings.yaml` (sổ từ vựng), không so với DB.
  - 082 và 095 thêm bốn mã hợp lệ vào sổ; danh sách kỳ vọng ghi tay từ thời HD5 không được cập nhật.
  - Đây là kỳ vọng đóng băng trong sổ, không phải lỗi nạp lại.
- **Triệu chứng AC-7.** «ảnh chụp sau: B5 giảm một, B4 tăng một» ra `[0, 0]`. Nguyên nhân chưa soi xong.
- **Câu cần quyết:** cập nhật danh sách kỳ vọng theo sổ hiện hành (thêm bốn mã của 082/095), hay đổi ca sang so với sổ
  thay vì ghi tay? Sau đó soi riêng AC-7.
