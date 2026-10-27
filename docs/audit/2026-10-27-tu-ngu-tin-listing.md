# Chuẩn hoá từ ngữ «tin» ↔ «listing» (27/10)

Mạnh giao (27/10): soát chỗ lệch giữa «listing» và «tin», quyết đổi ở đâu cho chuẩn nhất, và sửa từ gốc **khi dữ liệu
còn ít**. Để lâu, sửa gốc sai sẽ tốn công hơn nhiều. Bảng chuẩn đã chép vào `CONTEXT.md` (mục «Tài sản & tin»), quyết định
ở ROADMAP §3 #21. Tệp này là căn cứ: soát gì, lệch ở đâu, quyết gì, làm khi nào.

**Lịch sử trong ngày.** Bản đầu (PR #149) chọn hướng A: «listing» chỉ là thuê ngắn hạn, tin rao trong code là `offer`.
Cùng ngày, Mạnh chốt **hướng B, theo RESO**: listing là mọi tin niêm yết — bán, thuê dài hạn, thuê ngắn hạn. Mỗi listing
mang trường dịch vụ và trường loại hình, và nhiều listing cùng trỏ về một căn. Tệp này ghi theo hướng B; các việc của hướng
A (đổi `listing_intent` → `offer_intent`, đổi `sale_offers` → `offers`) đã huỷ.

## 1. RESO làm thế nào

| Khái niệm | RESO | Kho hiện nay |
|---|---|---|
| Listing (mọi tin) | resource `Property`: mỗi bản ghi là một lần niêm yết, khoá `ListingKey` | tách hai bảng: `sale_offers` (bán, thuê dài hạn) và `listings` (Airbnb) |
| Dịch vụ: bán · thuê dài hạn · thuê ngắn hạn | không có trường riêng: `PropertyType` (`Residential` = bán, `ResidentialLease` = thuê) + `LeaseAmountFrequency` (`Monthly`, `Daily`) | cột `kind`: `sale`, `rent_lt`; `rent_st` dự kiến (ROADMAP §3 #1) |
| Loại hình | `PropertySubType` | `property_type` |
| Cùng một căn | UPI (`UniversalPropertyId` + `SubId`) | `properties` (ADR-0013: căn = UPI + Building) |
| Lịch đêm, công suất, ADR | không có mô hình | local extension (`nights`, `listing_stats`) |

## 2. Luật (chép vào CONTEXT.md)

1. **Listing là mọi tin niêm yết** (RESO `Property`). Tiếng Việt gọi thường là «tin».
2. **Dịch vụ ở `kind`, loại hình ở `property_type`**. Hai loại listing đang có:
   - **tin rao**: listing bán và thuê dài hạn;
   - **listing thuê ngắn hạn**: Airbnb tự thu.
3. **Trang nào chỉ có một loại listing** thì được gọi trơn «Listing» hay «Tin». Trang có cả hai loại phải viết đủ tên loại.
4. **Tin tìm mua / tìm thuê không phải listing.** Gọi là «Yêu cầu mua», code `inquiry` (Mạnh 27/10), là một giá trị của
   «Ý định tin» (`listing_intent`).
5. **Dùng từ «tin rao» hoặc «tin», không dùng «tin đăng».**

## 3. Bảng chuẩn

| Khái niệm | Nhãn UI | Code hiện tại | Đích sau tái cấu trúc | RESO |
|---|---|---|---|---|
| Listing (mọi tin) | Listing · Tin | `sale_offers` + `listings` (không có bảng chung) | một khái niệm `listing`, `kind` phân dịch vụ | resource `Property` |
| Tin rao (bán + thuê dài hạn) | Tin rao · Tin | `sale_offers`, `offer_id`, `/api/v1/offers` | listing có `kind` ∈ `sale`, `rent_lt` | `Property` + `ListPrice` |
| Listing thuê ngắn hạn (Airbnb) | Listing (trang chỉ có loại này) | `listings`, `abnb_…` | listing có `kind = rent_st` + bảng mở rộng lịch đêm | `ResidentialLease` + `Daily` |
| Ý định tin | Ý định tin | `listing_intent` | giữ | local extension |
| Yêu cầu mua | Yêu cầu mua | `listing_intent = wanted` | `inquiry` | không phải `Property`; gần nhất `SavedSearch` |
| Bài (bài thô trong nhóm) | Bài | `stg_zalo_posts` | giữ | — |
| Căn nhà | Căn nhà | `properties` | giữ | UPI + `Building` |

## 4. Việc

| Mã | Việc | Tầng | Khi nào | Để lâu thì |
|---|---|---|---|---|
| **Đ3** | `CONTEXT.md`: Listing là khái niệm cha, thêm «Tin rao», «Listing thuê ngắn hạn», «Yêu cầu mua»; ghi rõ hiện trạng còn lệch | T1 | PR này | — |
| **Đ4** | FRAMING, ADR-0013, reso-khung, ROADMAP: «Listing (tin)» là lớp giữa, «mạng lưới listing» giữ như bản gốc; bỏ «tin đăng» | T1 | PR này | — |
| **Đ1** | Giá trị `wanted` → `inquiry` «Yêu cầu mua» trong sổ từ vựng: migration 050 (liên làn cấp) đổi 1 dòng `ref_lookup`, sinh lại hằng, catchup cloud. Kèm Đ5 | T3 | ngay, trước PL5 | Hiện chưa có cột, chưa dòng dữ liệu nào. Sau PL5 phải đổi cả dữ liệu đã ghi |
| **Đ5** | `/ops/collections`: ba chữ «Tin» đang chỉ bài thô → «S03 · Cộng đồng», «Bài S03 · Cộng đồng hôm nay», «n bài bị cổng chặn» | đi cùng Đ1 | cùng hàng Đ1 | — |
| **Đ2** | Tái cấu trúc listing theo RESO: gộp `sale_offers` + `listings` về một khái niệm (đổi tên bảng, `kind = rent_st` cho Airbnb, nhãn UI «Listing» trên các trang Airbnb thành tên loại khi trang có cả hai loại) | T3, hàng riêng | sau khi các dãy đang chạy khép | Đổi tên bảng không tốn theo số dòng. Cái tăng theo thời gian là số chỗ code gọi tên: hôm nay khoảng 120 tệp gọi `sale_offer` |

## 5. Không đổi, và vì sao

- **`listing_intent`**: theo hướng B, tên này đã đúng RESO.
- **Chữ trong prompt LLM** («tin đăng» ở `agent/src/agents/enrich-text.ts`, `judge-entity.ts`,
  `pipeline/scripts/bench-gate.mjs`): đây không phải nhãn UI. Đổi chữ prompt có thể đổi hành vi model nên phải đo lại
  bench. Để đến lần sửa prompt kế tiếp có bench.
- **Hồ sơ lịch sử** (`_acceptance/**`, `docs/superpowers/**`, bản phạm vi đã cắt, nhật ký): là bản ghi tại thời điểm viết,
  không sửa ngược.
- **Slug `listings`**: đúng cả trước lẫn sau tái cấu trúc.
- **Nhãn vai nguồn «Rao vặt công khai»** (S06): tên vai, đã nằm trong _Allow_.

## 6. Còn mở

- Bản thô của S06 (`stg_chotot_ads`) chưa có tên: «Bài» hiện chỉ định nghĩa cho nhóm cộng đồng. Đặt khi một trang Ops cần
  hiện nó.
- Nhãn «Yêu cầu mua» có phủ cả người tìm thuê không, hay cần «Yêu cầu mua, thuê»: chờ Mạnh xác nhận trước khi vòng Đ1
  ghi nhãn vào sổ.
