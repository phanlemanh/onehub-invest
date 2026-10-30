# PL19 — thời gian và hiệu lực: observed_at bắt buộc, trạng thái chào có phân xử, lịch sử giá theo căn, bậc B5 (thiết kế)

Hàng PL19 (mã review C2.8, lỗi L18 «không có mô hình thời gian», review §0.2 D-4), đứng trên PL15 (bảng phát biểu +
phân xử, 045) và PL16 (hàm bậc + ảnh chụp, 056 — nhánh xếp chồng lên PR #202). Khung RESO: `reso-khung-phan-loai.md` §6.

## 1. Hiện trạng đo trên DB máy thu (30/10)

| Đo | Số |
|---|---|
| Phát biểu sống thiếu `observed_at` | 50.278 — đúng toàn bộ phát biểu `legacy` (bước chuyển PL15); `parser` 4.004 và `source_field` 48.315 đã đủ |
| Bộ ghi phát biểu | `lib/assert.mjs` (bộ đọc, `posted_at ?? null`), `apply_enrichment` (045 — không ghi `observed_at`), `phat-bieu-cat-chuyen.mjs` (legacy) |
| Trạng thái chào | không có cột; trục `offer_status` đã có trong sổ (PL6) với `columns: []`, ghi chú «Cột đến ở PL19» |
| Tin sống `last_seen` quá 3 ngày | S06 21.851/27.733 · S03 521/885 · S05 28/28 |
| Tin nghỉ | `het_trong_luot` 37 · `doi_khoa` 297 |
| Lịch sử giá | `properties.price_history` chỉ được dựng một lần bởi 031; không bộ ghi nào giữ nó; `price_vnd` của tin bị ghi đè |
| Bậc | B4 = 0 nên B5 = 0 ở mọi nơi hôm nay |

## 2. Thành phần

1. **Migration 059** (số xin ở liên làn):
   - **observed_at bắt buộc.** Điền lùi phát biểu `legacy`: `least(tin.last_seen, phát biểu.created_at)` (giá trị có
     trước được đọc lần cuối ở lượt thấy tin cuối trước bước chuyển); tin không tìm thấy → `created_at`. Rồi
     `observed_at SET NOT NULL`. `apply_enrichment` ghi `observed_at = đề xuất.created_at` (lúc bộ làm giàu đọc tin).
   - **Trục cột phát biểu.** `field_assertions.field` thêm `offer_status`. Vì `enrichment_proposals.field` vẫn chỉ năm
     trường enrich, cột `field_assertions.field` chuyển sang trục mới `assertion_field` (local) = năm trường enrich +
     `offer_status`; `enrich_field` giữ cho bảng đề xuất.
   - **Cột trạng thái chào** `sale_offer_records.offer_status` (NOT NULL, mặc định `unknown`, CHECK theo trục), view
     `sale_offers` dựng lại để có cột. Chỉ hàm phân xử ghi cột này.
   - **Phân xử trạng thái** `resolve_offer_status(text[])`: trạng thái là trường theo thời gian — phát biểu có
     `observed_at` mới nhất thắng; cùng thời điểm thì theo thứ tự phương pháp của 045. Ghi cột và
     `field_provenance.offer_status` (`v, tier, method, ids, observed_at`).
   - **Bộ ghi bằng chứng** `ghi_bang_chung_chao(text[])` (SQL, chạy trước phân xử): tin sống S06 → `active`
     (`source_field`, `fact` — tin còn trên sàn là trạng thái do sàn khai); tin sống S03/S05 → `active` (`parser`,
     `observed` — bài trong nhóm được đọc là tin rao); tin S06 nghỉ `het_trong_luot` → `withdrawn` (`source_field`,
     `fact`, `observed_at = retired_at`). Nghỉ `doi_khoa` (đổi khoá) không phải bằng chứng gỡ. Giá trị đã có phát biểu
     sống cùng phương pháp thì không ghi lại; tin quay lại sau `withdrawn` → rút phát biểu `active` cũ rồi ghi mới.
   - **Lịch sử giá và trạng thái** bảng `history_transactional` (dáng RESO `HistoryTransactional`:
     `resource_name, resource_record_key, field_name, previous_value, new_value, change_type,
     modification_timestamp`), trigger trên `sale_offer_records` ghi `NewListing` khi thêm tin, `PriceChange` khi đổi
     `price_vnd`, đổi trạng thái theo bảng §6 (`Withdrawn`, `BackOnMarket`, `ActiveUnderContract`, `Closed`). Điền lùi
     một dòng `NewListing` cho mỗi tin có sẵn. View `property_price_history` gom theo căn qua `property_offers`.
   - **Vị từ B5** trong `property_data_level` (thay hàm của 056): tin ở B4 + `offer_status = 'active'` +
     `last_seen` trong cửa sổ độ tươi (`freshness_window()`, Hỏi-2) + căn có ít nhất một dòng lịch sử giá → B5.
     Quá cửa sổ → căn về B4 với chỗ kẹt `hieu-luc`. B5 không còn bậc kế: chỗ kẹt `giu-nhip`.
2. **`pipeline/trang-thai-chao.mjs`**: chạy bộ ghi bằng chứng + phân xử cho mọi tin, in đếm theo trạng thái; bước
   `job_run cloud-sync trang-thai-chao` đứng ngay TRƯỚC `bac-du-lieu` (cùng nhịp 15′ đã chọn ở PL16 Hỏi-3) để ảnh chụp
   bậc đọc trạng thái mới.
3. **Bộ ghi phát biểu của bộ đọc** (`lib/assert.mjs`): `observed_at` vắng → lúc bộ đọc đọc tin (không còn null).
   `phat-bieu-cat-chuyen.mjs` ghi `observed_at` theo luật điền lùi khi chạy lại.

## 3. Quá cửa sổ độ tươi (Hỏi-1)

§6 của khung RESO: quá cửa sổ mà không có bằng chứng mới thì **trạng thái không đổi** (`Expired` của RESO là hết hạn
hợp đồng niêm yết — sai nghĩa); chỉ căn hạ B5 → B4. Câu giao của hàng ghi «tự về hết hạn». Máy khuyên theo §6 — trục
`offer_status` đã duyệt không có giá trị «hết hạn», và ghi chú trục nói đúng điều này. Lối khác: thêm giá trị local
`stale` vào trục và để bộ ghi bằng chứng tự hạ — đổi lại một trạng thái không do bằng chứng nào phát biểu.

## 4. Không làm (cắt)

- Bộ đọc «đã bán / đã cọc» trong chữ tin S03 (làn P1 đọc tin, `transform-zalo.mjs` không được chạm): hàng sau của P1.
- Hiện trạng thái chào, lịch sử giá trên giao diện Invest hay `/ops`.
- Đưa cột `offer_status` và bảng lịch sử lên cloud (cần migration Supabase + leak gate).
- Cửa sổ độ tươi theo từng nguồn (tinh chỉnh sau khi có số đo).
- Giá đóng (`ClosePrice`), `PreviousListPrice` trên tin.
- Sửa `properties.price_history` (cột cũ của 031) — view mới thay chỗ đọc; dọn cột là việc riêng.

## 5. Rủi ro

- 059 phụ thuộc 056 (PR #202): nhánh xếp chồng; gộp #202 trước.
- `SET NOT NULL` khoá bảng `field_assertions` ngắn khi áp; áp sau gộp ngoài giờ chạy bộ đọc.
- Trigger trên `sale_offer_records` chạy trong mọi lượt nạp: chi phí một dòng mỗi tin đổi giá; lượt nạp S06 đầy đủ
  (~28k tin) chỉ ghi dòng khi giá thật sự đổi.
- Cột mới trên `sale_offer_records`: `sync-cloud.mjs` đẩy theo danh sách cột cho phép — cột mới không lên cloud.
