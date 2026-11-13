# CG8 `can-gia-tot-cung-loai` — Căn giá tốt so cùng loại hình × bán/thuê theo phường

Ngày: 2026-11-12 · Hạng: T2 · Hồ sơ: `_acceptance/can-gia-tot-cung-loai/` · Bản phạm vi: `docs/plan/pham-vi-can-gia-tot-vi-tri-0911.md`
(Mạnh «Chốt theo đề xuất» Q1–Q5 ngày 09/11, ROADMAP §3 mục 42; Q5: CG8 làm trước mọi hàng, tách khỏi PL26).

## 1. Vấn đề (số đo 12/11, DB máy thu, chỉ đọc)

Ba đường hiện ra «số giảm» của Căn giá tốt đều so tin với thước **cả phường, gộp mọi loại hình**:

| Đường | Thước hiện tại | Tệp |
|---|---|---|
| `/ops/deals` (danh sách + trang một căn) | `bait_gap_pct` do `refresh-bait-gap` tính từ `v_ruler_p2_area` | `pipeline/refresh-bait-gap.mjs`, `app/src/lib/deals.ts`, `app/src/lib/deals-chi-tiet.ts` |
| `/api/v1/deals` của app (tạm đóng, chỉ token ops) | `v_ruler_p2_area` | `app/src/app/api/v1/deals/route.ts` |
| `/v1/deals` của data-api (API công khai) | `market_asset_stats` (phường × bán/thuê, mọi loại hình) | `data-api/src/routes/deals.ts` |

Trên toàn bộ tin bán đang rao (12/11), trung vị số giảm theo loại hình khi so với thước cả phường ↔ thước cùng loại trong phường:

| Loại hình | Số tin | Có thước cùng loại | Trung vị số giảm: thước cả phường | thước cùng loại |
|---|---|---|---|---|
| căn hộ | 9.618 | 8.121 | **35,2%** | 0,0% |
| nhà | 25.254 | 25.086 | −12,9% | −0,4% |
| đất | 5.610 | 5.316 | 15,5% | 3,6% |
| thương mại | 406 | 169 | −12,4% | 0,0% |
| chưa rõ (`unknown`) | 156 | 0 | −82,3% | — |

Căn hộ đúng giá đang hiện «rẻ ~35%», nhà đúng giá hiện «đắt ~13%». Đây là lỗi so khác loại, không phải căn giá tốt.

## 2. Thiết kế

**Thước** = view có sẵn `v_ruler_p2` (034, sửa ở 044): trung vị giá/m² theo phường × `property_type`, chỉ tin bán, một căn một
phiếu, lọc 5–500 tr/m², cần ≥ 5 căn. View có trên DB máy thu và trên cloud (catch-up 26/10,
`docs/ops/cloud-schema-catchup-2026-10-26.md`). **Không migration.**

Luật chung cho cả ba đường (một câu, một chỗ định nghĩa trong mã mỗi đường):

1. Tin có số giảm ⇔ `kind = 'sale'` ∧ `property_type` thuộc tập đã biết (`apartment`, `house`, `land`, `commercial`, `room`…, tức khác
   `unknown` và khác NULL) ∧ có dòng `v_ruler_p2` cùng `area_id` **và cùng `property_type`**.
2. Số giảm = `ROUND((1 − price_perm2 / m) × 100, 1)`, `m` là trung vị của đúng dòng thước đó. Không bao giờ lùi về thước cả phường.
3. Tin thuê: không đường nào chấm (thước bán không áp cho thuê) — giữ như hiện tại, nay thành luật viết ra.
4. Tin `unknown`/NULL loại hình: không số giảm, không vào danh sách; trang một căn ghi lý do «Chưa rõ loại hình — không so được với
   thước cùng loại». Tin có loại nhưng phường × loại chưa đủ 5 căn: lý do «Phường chưa đủ tin <loại> để dựng thước».

Thay đổi theo đường:

- **`refresh-bait-gap` (pipeline, luật 10 tính sẵn):** bước 2 nối `v_ruler_p2` theo `(area_id, property_type)`; bước 1 in số thước
  theo loại. Thêm một dòng log đếm tin P1 bán không chấm theo lý do (`chua-ro-loai`, `thieu-thuoc-cung-loai`). Bước loại tin phi lý
  (ON11) giữ nguyên.
- **`/ops/deals`:** `dealsSql`/`dealSql` nối `v_ruler_p2` cùng khoá, để trung vị và `ruler_n` in trên thẻ đúng là thước đã tính
  `bait_gap_pct`. `lyDoRoi` thêm hai lý do ở mục 4. Câu chứng minh đổi «thước phường» → «thước <loại> cùng phường» (vd «thước căn hộ
  cùng phường»); nhãn loại lấy từ `LABELS_VI.property_type` (đã có `loaiHinh()`).
- **`/api/v1/deals` (app):** nối `v_ruler_p2` cùng khoá; `meta.ruler` ghi «phường × loại hình, n≥5».
- **`/v1/deals` (data-api):** thay `market_asset_stats` bằng `v_ruler_p2` cùng khoá; trả thêm trường `propertyType` (thêm, không
  đổi trường cũ); tin `unknown` không vào danh sách. Tham số `min_discount`, `limit`, `area`, `market` giữ nguyên nghĩa.

**Ngoài vòng (ghi sổ descope):** `sellers.flags.median_gap_pct` (view 060) vẫn đọc thước cả phường — đổi view cần migration, để CG9
(bảng hạng tính sẵn) gánh. Nhóm sâu hơn phường (dự án, toà) là CG9–CG11. Thước thuê, nhóm số phòng ngủ: CG9.

## 3. Đo

- `pipeline/scripts/can-gia-cung-loai-db.sh` dựng DB thử `oneinvest_u1_cg8` chép từ DB máy thu bằng `db/db-thu.sh` (không chạm DB
  `oneinvest` dùng chung), chạy `refreshBaitGap` trong giao dịch rồi đếm độc lập trên đầu ra của ba đường.
- Phép đếm độc lập (không dùng mã của hàng): tính lại số giảm từ `v_ruler_p2` bằng SQL viết riêng, so với `bait_gap_pct` và với
  `discount_pct` của hai API. Đích: 0 tin lệch quá 0,1 điểm; 0 tin `unknown` có số giảm; 0 tin thuê có số giảm.
- Đối chứng đỏ: bản đột biến trỏ lại `v_ruler_p2_area` thì phép đếm ra lệch > 0, gọi tên đường.

## 4. Lựa chọn

| # | Lựa chọn | Căn cứ |
|---|---|---|
| L1 | Thước = `v_ruler_p2` có sẵn, không migration, không bảng mới | ô cơ hội: «Dùng thước phường × loại có sẵn (v_ruler_p2, market_asset_stats theo kind), không migration» |
| L2 | data-api bỏ `market_asset_stats` | bảng không có cột loại hình — lối «market_asset_stats theo loại» chết nếu không migration |
| L3 | Không lùi về thước cả phường khi thiếu thước cùng loại | ô cơ hội: «tin P1 chưa rõ loại không chấm thay cho "thước cả phường" của PL26»; thước cả phường chính là lỗi đang sửa |
| L4 | Thêm `propertyType` vào phản hồi `/v1/deals`, tin chưa rõ loại rời danh sách công khai | **Hỏi-1** — đổi hành vi API công khai |
| L5 | Bỏ design-pass và đặc tả UX | chỉ đổi câu chữ trên trang `/ops/deals/[offerId]` đã có, không đổi bố cục hay luồng |

## Đặc tả UX

Bỏ — xem L5 và dòng `descope` «bỏ đặc-tả-UX» trong sổ quyết định. Phép nhìn: một eval `ui-check` chụp trang một căn ở ba trạng thái
(căn hộ trong danh sách, tin chưa rõ loại, phường thiếu thước cùng loại).
