# YC0 — Bảng Yêu cầu mức bài, nối lại trên main (`bang-yeu-cau-noi-lai`)

## Vấn đề

Bài người cần thuê, cần mua trong nhóm S03 (Yêu cầu) chỉ được nhận diện lúc transform rồi bỏ đi; chưa có bảng nên Ops không
đếm, không lọc, không ghép được. Bảng `inquiry_records` đã ký 30/10 ở nhánh `feat/bang-yeu-cau` (migration 058) nhưng nhánh
chậm main khoảng 4 tuần, đọc ý định từ `field_assertions.listing_intent` (0 dòng — trường này còn không có trong trục
`assertion_field` của main), và lệch hai luật kiến trúc của ADR-0013: khoá băm từ nội dung (câu 3) và tiêu chí do parser ghi
thẳng cột (câu 4). Mạnh chốt 10/11 (ROADMAP §3 mục 43, Q1) nối ngay bằng luật xác định cộng nhãn model; 26/11 03:39Z «Mở ngay»
YC0 rồi YC5 trước MS5.

## Tách hàng (GS phán 26/11, đồng ý đề xuất P3)

- **YC0 (hàng này, migration 136):** lớp bài Yêu cầu + ý định. Bảng `inquiry_post_records` khoá theo bài (subject_key
  `'S03:<post_id>'`, OriginatingSystemKey); trục `assertion_field` thêm `listing_intent`, `kind`, `budget_min_vnd`,
  `budget_max_vnd`; bộ ghi phát biểu ý định (luật = observed, nhãn Haiku = inferred); `resolve_inquiry_fields` cùng luật lớp
  với `resolve_offer_fields` (045); `intent_status` «song» / «cho-duyet».
- **YC9 `tieu-chi-yeu-cau-phat-bieu` (sau YC0, migration 137 nếu cần):** dịch vụ, loại hình, PN, ngân sách qua phát biểu +
  phân xử; tiêu chí thêm chỉ phần dùng lại bộ đọc tin rao. Cột tiêu chí có sẵn trong bảng 136 nhưng YC0 không ghi.
- **YC5** sau YC9 (màn lọc theo dịch vụ cần cột đã phân xử). **YC4:** lớp Nhu cầu gom (Q2) trên khoá bài ổn định của YC0.

## Bảng phủ ca (DB máy thu, chỉ đọc, 26/11; script dùng chính `parsePost`, `laYeuCau`, `docDichVu`, `docLoaiHinh`,
`docNganSach`, `docTheDaDuyet` của main và nhãn Haiku hợp lệ mới nhất mỗi bài trong `silver_labels`)

Mẫu số: bài S03 có chữ, đã gạt bài thử (245.306 bài; 51.108 bài có nhãn Haiku). «Luật» = nhánh `yeu-cau` của transform
(`!parsePost(text).kind && laYeuCau(text)`, hàm `nhanhCuaBai`). «Model» = nhãn Haiku hợp lệ mới nhất có `listing_intent =
inquiry`.

| Chiều | Giá trị | 14 ngày 12–26/11 | Toàn bộ | Ai đọc phía sau |
|---|---|---:|---:|---|
| Nguồn ý định | luật ∧ model | 3.909 | 4.946 | view sống, YC5 |
| | luật, model nói khác | 229 | 271 | view sống (luật xác định thắng) |
| | luật, chưa có nhãn | 6.043 | 18.058 | view sống |
| | chỉ model, `parsePost` không ra loại | 847 | 1.243 | Hỏi-1a |
| | chỉ model, `parsePost` ra loại tin | 73 | 88 | Hỏi-1b |
| | tổng bài Yêu cầu (hợp hai nguồn) | **11.101** | 24.606 | |
| Dịch vụ (YC9) | model · chữ · đơn vị giá · **trống** | 4.446 · 1.448 · 3.735 · **1.472** | 5.636 · 4.308 · 11.074 · 3.588 | YC9, YC5 |
| Loại hình (YC9) | chữ · PN/studio→căn hộ · **trống** | 123 · 9.088 · **1.890** | 344 · 20.672 · 3.590 | YC9, YC5 |
| Số phòng (YC9) | đọc được | 10.483 | 23.432 | YC9, YC5 |
| Ngân sách (YC9) | đọc được | 7.514 | 17.388 | YC9, YC5 |
| Thẻ nhóm đã duyệt | có dự án · chỉ phường · không thẻ | 10.833 · 215 · 52 | 24.319 · 227 · 52 | Hỏi-3 |

Ô bỏ (ngoài phạm vi, vì): S05 (transform S05 chưa có nhánh Yêu cầu, không có nhãn model); bài chỉ ảnh (không chữ); bài luật
bắt nhầm (quảng cáo, tin cho thuê có chữ «tìm nhà»; mẫu 26/11: 2/5 bài luật-có-model-không) → GT8; nhãn người «Không phải Yêu
cầu» → ngăn duyệt của YC5 (chưa có chỗ ghi nhãn người cho Yêu cầu); tiêu chí → YC9; gom → YC4.

## Thiết kế

1. **Migration 136.**
   - `inquiry_post_records`: `inquiry_id` = subject_key `'<S0x>:<post_id>'` (PK; CHECK bằng `source || ':' ||
     originating_system_key`), `source` (mã S0x), `originating_system_key` (post_id), `posted_at`; `intent_status` ∈ {song,
     cho-duyet} và `intent_assertion_ids` (phát biểu thắng) — chỉ `resolve_inquiry_fields` ghi; cột tiêu chí (`kind` CHECK
     sale/rent_lt/rent_st, `property_type`, `bedrooms`, `area_m2`, `budget_min_vnd`, `budget_max_vnd`, `area_id`, `market_id`,
     `project_node_id`) NULL ở YC0, YC9 ghi qua phân xử; `retired_at`/`retired_reason`; không cột danh tính.
   - View sống `inquiries` = `retired_at IS NULL AND intent_status = 'song'`.
   - `field_assertions_field_chk` mở thêm `listing_intent`, `kind`, `budget_min_vnd`, `budget_max_vnd` (giữ mọi giá trị cũ);
     trigger giá trị: `listing_intent` ∈ sổ trục, `kind` ∈ sổ trục, ngân sách là số nguyên dương.
   - `resolve_inquiry_fields(p_ids text[])`: với mỗi bài có phát biểu `listing_intent` sống, lớp cao nhất thắng (fact ›
     observed › inferred, rồi `assertion_method_rank`, rồi mới nhất): thắng là `inquiry` ở lớp fact/observed → `song`; chỉ có
     `inquiry` ở lớp inferred → `cho-duyet`; thắng là giá trị khác hoặc không còn phát biểu → nghỉ `het-y-dinh`; trở lại →
     sống lại cùng khoá. Cùng cổng «chưa cắt chuyển» với 045. Không DELETE.
   - Chỉ DB local, không vào FILL/CLOUD_ALLOW của sync-cloud.
2. **Bộ ghi phát biểu ý định (`phatBieuYDinh`, hàm thuần):** bài luật nhận (`nhanhCuaBai` = `yeu-cau`) → `listing_intent =
   inquiry`, `observed`, method `parser`, `rule_id = 'yeu-cau-luat'`; nhãn Haiku hợp lệ mới nhất của bài (bỏ nhãn `json_ok =
   false` trước rồi mới lấy mới nhất) → `listing_intent = <nhãn>`, `inferred`, method `e2_llm`, evidence `{label_id,
   prompt_version, probability}`; bài thử → không dòng nào. Ghi bằng `writeAssertions(..., {replaceOwn: true})`; luật không còn
   nhận → `retractRule` rút dòng luật. Hỏi-1b: bài `parsePost` ra loại tin không nhận dòng Haiku inquiry vào bảng (bộ ghi bỏ
   qua bài ấy).
3. **Nối vào transform-zalo** sau bước tin rao: ghi phát biểu ý định cho bài S03 có chữ (đã gạt bài thử), upsert khung dòng
   `inquiry_post_records` cho bài có phát biểu inquiry, gọi `resolve_inquiry_fields`. Thiếu bảng → một dòng «chưa áp 136», bỏ bước.
4. **Ô /ops/data-flow:** nhánh «Đọc thành Yêu cầu» của 600_data_flow.sql đếm từ `inquiries` khi bảng có, thay nhánh tính lại
   `flow_s03_branch` (giữ đường cũ khi chưa áp 136).
5. **Sổ ánh xạ**: khối `inquiries` (SavedSearch; `budget_min_vnd` → ListPriceLow; `intent_status` extension VN đủ 6 điều kiện),
   bốn trường mới vào trục `assertion_field`, DQ enum; CONTEXT «Yêu cầu» bỏ «là tính năng sau», nêu khoá mức bài.
6. **Phụ lục «11 câu áp cho Yêu cầu»** của ADR-0013/0016 (`docs/adr/`), cùng PR. Giới hạn ghi rõ: không chép UPI (Yêu cầu trỏ
   một tập căn); hết hạn 7 ngày (Q5) là trạng thái suy, không xoá; hai môi giới mang cùng một khách thì bước gom (YC4) không
   khử được.

## Ô trên màn đổi và lệnh đo

Ô trên màn: nhánh «Đọc thành Yêu cầu» ở `/ops/data-flow` (S03) đếm từ bảng thật thay vì tính lại bằng luật — số đổi từ
«bài luật nhận» sang «bài Yêu cầu sống» (luật ∧/không ∧ model, trừ chờ duyệt); ô thứ hai `SELECT count(*) FROM inquiries WHERE
source='S03'` từ «bảng không tồn tại» lên ≈ 23.275 bài luật nhận toàn bộ (mốc 14 ngày 10.181). Lệnh đo độc lập:
`node pipeline/scripts/do-yeu-cau.mjs`; ô màn đo bằng `node pipeline/refresh-data-flow.mjs` rồi đọc dòng S03 của bảng data-flow.

## Áp lên DB máy thu (năm thứ cho Cổng Bằng chứng)

1. Lệnh áp: `psql "$DATABASE_URL" -f db/migrations/136_inquiry_records.sql`, rồi lượt transform-zalo thường.
2. Số chạy thử: số dòng `inquiries`, số `cho-duyet`, số phát biểu mới trên bản chép (AC-9).
3. Sao lưu trước: `scripts/db-sao-luu.sh`.
4. Cách lùi: rút phát biểu `listing_intent` của lượt (`retracted_at`), `DROP VIEW inquiries; DROP TABLE inquiry_post_records;`, trả CHECK trường về bản 117 (xoá dữ liệu — cần lời Mạnh).
5. Lệnh kiểm sau: `node pipeline/scripts/do-yeu-cau.mjs`.
