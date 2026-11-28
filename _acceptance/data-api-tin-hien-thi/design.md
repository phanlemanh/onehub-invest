# PB7 — data-api chỉ trả tin hiển thị được: không S02, không S08 (data-api-tin-hien-thi)

Mã hàng PB7 (GS cấp 27/11). Điều kiện trước khi mở API. Dựng trên nhánh PB2 đã ký (`51e9d84d8`) — **gộp sau PB2**.

## 1. Vấn đề

Cổng Invest có luật «tin hiển thị được» (`app/src/lib/offers-public.ts`, điều kiện `VISIBLE`): nguồn trong
`OFFER_HIDDEN_SOURCES` (`app/src/lib/offers-filters.ts`, hôm nay S02 và S08) không bao giờ hiện. Căn cứ: AGENTS.md luật 5
(S02 chỉ để hiệu chuẩn) và luật 6 («S02, S08 không tính là tin hiển thị được», Mạnh chốt 02/11).

`/v1/listings` của data-api (sau PB2) đọc `sale_offers` không lọc nguồn: mọi tin bán, thuê dài hạn — kể cả căn giá tốt
(`?minBelowMedianPct=`) và chi tiết (`/v1/listings/:listingKey`) — ra API kèm `originatingSystemName`. Lượt chấm PB2 vòng 2
gọi đây là finding HIGH ngoài hợp đồng; Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng PB2 (27/11).

Đo 27/11 trên bản chép DB của M5 (chỉ đọc): `sale_offers` 0 dòng S02, 0 dòng S08 — **hôm nay 0 dòng lọt; lỗ tiềm ẩn**.
Thuê ngắn hạn đọc view `listings` (989 dòng, đều S01 tự thu, không có cột nguồn).

## 2. Phương án

**Một nguồn: sổ từ vựng `pipeline/mappings.yaml` → các tệp hằng sinh (PL6).** Kho đã có cơ chế một-nguồn cho mã dữ liệu:
`pipeline/vocab.mjs --write` sinh `pipeline/lib/vocab.generated.mjs`, `agent/src/vocab.generated.ts`,
`app/src/lib/vocab.generated.ts` từ `mappings.yaml`; `vocab --check` (trong test pipeline) đỏ khi tệp sinh lệch sổ.

- `mappings.yaml` thêm một khoá chính sách: `nguon_khong_hien_thi` — danh sách mã nguồn không bao giờ hiện công khai, mỗi
  mục kèm căn cứ (AGENTS.md luật 5/6). Hôm nay S02, S08. Đây là chỗ DUY NHẤT viết danh sách.
- `vocab-core.mjs` sinh hằng `SOURCE_HIDDEN` vào ba đích cũ và một đích MỚI: `data-api/src/contract/vocab.generated.ts`
  (chỉ hằng này — data-api đi kho công khai một mình nên phải tự mang tệp sinh; tệp chỉ chứa mã `S0x`, không tên nguồn).
- App: `OFFER_HIDDEN_SOURCES` thành bí danh của `SOURCE_HIDDEN` nhập từ `vocab.generated` — `VISIBLE` không đổi một chữ.
- data-api: `/v1/listings` (danh sách, căn giá tốt cả hai nhánh, chi tiết) thêm điều kiện nguồn dựng từ `SOURCE_HIDDEN`, ở
  ĐÚNG một chỗ — nhánh `sale_offers` của `tapGhep` mà mọi đường đọc tin đi qua.
- `pipeline/scripts/do-s03-len-cong.mjs` (đọc `OFFER_HIDDEN_SOURCES` bằng regex) chuyển sang đọc hằng sinh.

Lối loại (sổ quyết định ghi lý do): app nhập thẳng tệp của data-api (app chưa từng nhập mã ngoài gốc `app/`, Turbopack
lấy gốc là `app/`); view SQL `v_tin_hien_thi` (cần migration + DDL cloud — lời riêng của Mạnh, nặng hơn việc); bản chép
+ test khớp (GS 27/11: «không danh sách nguồn chép tay»).

**Phạm vi chỉ là nguồn ẩn.** Trọn luật `VISIBLE` (tin cũ quá 30 ngày, thiếu trường lõi, giá ngoài ngưỡng) đo 27/11 làm
`/v1/listings` mất 29.250 tin bán và 23.362 tin thuê dài, và đổi ma trận loại hình PB2-AC-4 (tin loại `unknown`/null sẽ vắng)
— là quyết định sản phẩm riêng (Hỏi-1 của thẻ), không gộp vào hàng điều kiện mở API này.

## 3. Đường đo

| Thước | Đo gì | Chiều đỏ |
|---|---|---|
| test data-api `tin-hien-thi.test.ts` | cấy tin S02 (bán), S08 (thuê dài) có hạng giá; vắng ở mọi đường + mọi bộ lọc; chi tiết 404; tin S06 cùng phường có | bỏ điều kiện nguồn → «PB7 nguồn ẩn lọt ra API: S0x ở <đường>» |
| probe `nguon-chung.mjs` | danh sách chỉ viết ở `mappings.yaml`; app và data-api nhập từ tệp sinh; không literal nhóm mã nguồn ẩn ở mã nguồn khác | cấy literal vào bản chép một route → đỏ gọi tên tệp; sửa tay tệp sinh → `vocab --check` đỏ |
| probe `do-db.mjs` | bản chép DB: số dòng nguồn ẩn route trả trước/sau, tổng còn lại bằng nhau | đối chứng: cấy một dòng S08 vào bản chép trong giao dịch → trước ≥ 1, sau 0 |
| probe `pham-vi.mjs` | ranh giới tệp, 0 tên nguồn thật trên cây data-api | bốn ô cấy |

## 4. Phụ thuộc

PB2 gộp trước (nhánh này dựng trên đầu PB2 đã ký). Sau khi PB2 vào main, U2 gộp main vào nhánh PB7 như thường lệ.
