# Phụ lục ADR-0013/0016: 11 câu áp cho Yêu cầu

Ngày: 2026-11-26 · Hàng: YC0 `bang-yeu-cau-noi-lai` (migration 136) · Kèm theo: ADR-0013 §«Luật cho mọi việc sau» (câu 1–8),
ADR-0016 §«Luật cho mọi việc sau» (câu 9–11), `docs/superpowers/specs/2026-11-26-bang-yeu-cau-noi-lai-design.md`,
`_acceptance/bang-yeu-cau-noi-lai/contract.md`.

**Yêu cầu** (CONTEXT.md) là bài cần mua, cần thuê — bên mua, đối xứng với listing bên bán. Phụ lục này trả lời từng câu của hai
bộ luật cho lớp bài Yêu cầu, để các hàng sau (YC9 tiêu chí, YC4 gom Nhu cầu, YC5 màn duyệt, YC6 hết hạn) dựng trên cùng một nền.

## 11 câu

1. **Lớp nào?** Yêu cầu không phải căn và không phải tin rao: nó là bản ghi của người tìm, gắn với **bài** (resource `Property`
   theo khoá chủ thể phát biểu, vì RESO không có bản ghi ngang hàng cho nhu cầu bên mua; gần nhất `SavedSearch`). Không đặt field
   nào của căn vào Yêu cầu như sự thật của căn — tiêu chí (loại hình, PN, diện tích) là điều người tìm muốn, không phải mô tả một
   căn.
2. **Tra DD 2.1 chưa?** Đã tra (26/11): khoá và hệ thống theo `SavedSearch` (`SavedSearchKey`, `OriginatingSystemName`,
   `OriginatingSystemKey`); tiêu chí dùng lại trường `Property` phía bán (`PropertyType`, `PropertySubType`, `BedroomsTotal`,
   `LivingArea`, `ListPrice` cho hai đầu ngân sách, `SubdivisionName`). Không có tương đương: `intent_status`, `listing_intent`,
   `rent_st` — khai extension trong `pipeline/mappings.yaml` (khối `inquiries`, trục `inquiry_kind`, `assertion_field`).
3. **Khoá có bền không?** Khoá dòng là khoá chủ thể `'<S0x>:<post_id>'` — CHECK `inquiry_id = source || ':' || originating_system_key`.
   Không băm nội dung (bản 058 cũ băm nguồn · người · chữ, lệch câu này); hai bài cùng chữ của cùng người là hai dòng. Gom thành một
   Nhu cầu là lớp riêng ở YC4, đúc khoá của nó một lần trên khoá bài ổn định này.
4. **Ai ghi?** Máy ghi `FieldAssertion` `listing_intent`: luật xác định (nhánh `yeu-cau` của transform, dùng chung với
   `/ops/data-flow`) là `observed`/`parser`, nhãn Haiku hợp lệ mới nhất là `inferred`/`e2_llm`. Chỉ `resolve_inquiry_fields` ghi
   dòng và cột `intent_status`, `intent_assertion_ids`; cột tiêu chí để trống tới YC9 (cũng qua phát biểu + phân xử). Không câu
   `UPDATE` thẳng cột chuẩn từ parser hay agent.
5. **Nguồn gốc ở đâu?** `intent_assertion_ids` trỏ phát biểu thắng; phát biểu luật mang `rule_id = 'yeu-cau-luat'`, phát biểu nhãn
   mang `evidence {label_id, prompt_version, probability}` truy về dòng `silver_labels`. Bài gốc ở raw snapshot (bất biến).
6. **Thời gian?** Trạng thái chỉ đổi theo bằng chứng: phát biểu thắng thôi là inquiry → dòng nghỉ `het-y-dinh` (không xoá), trở lại
   → sống lại cùng khoá. Lượt nạp không chứa một bài thì không đụng bài đó. **Giới hạn:** hết hạn 7 ngày (Q5) là trạng thái suy ở
   YC6, không xoá dòng; lịch sử ngân sách, trạng thái của Yêu cầu (`HistoryTransactional`, `EntityEvent`) chưa có — YC4, YC6.
7. **Nâng bậc nào?** Lớp cầu từ B0 (chỉ nằm ở raw + stg, mất sau transform) lên bản ghi đếm được, lọc được: ô `/ops/data-flow`
   «Đọc thành Yêu cầu» đọc bảng thật thay vì tính lại bằng luật; `SELECT count(*) FROM inquiries WHERE source = 'S03'` từ «bảng
   không tồn tại» lên số bài luật nhận (đo bằng `pipeline/scripts/do-yeu-cau.mjs`).
8. **SPL?** `source` chỉ mang mã `S0x` (CHECK `^S0[0-9]$`); bảng không có cột danh tính người đăng (người đăng là tầng C, YC0 không
   cần); bảng chỉ ở DB local, không vào danh sách bảng của sync-cloud. Nhãn model gửi chữ bài theo luật đọc tin (ba model, 06/11).
9. **Gắn ở mức nào?** Yêu cầu không gắn một vật thể: nó trỏ một **tập** căn qua tiêu chí (khu, dự án, loại hình, PN, ngân sách).
   **Giới hạn:** không chép UPI vào Yêu cầu. Dự án/phường/phân khu từ thẻ địa chỉ nhóm đã duyệt đi qua phát biểu ở YC9
   (`project_node_id` do phân xử ghi), không đoán theo toạ độ.
10. **Kế thừa có tự nuôi không?** Yêu cầu không kế thừa trường từ danh bạ vật thể và không làm bằng chứng ngược cho vật thể hay
    cho tin rao: bộ phân xử tin (`resolve_offer_fields`) bỏ qua bốn trường của Yêu cầu (136 §5), nên phát biểu ý định của một bài
    không đổi cột hay nguồn gốc nào của tin.
11. **Được lên đâu?** Chỉ `/ops` của máy thu (YC5 dựng ngăn duyệt, gồm ngăn «Chờ duyệt» cho dòng chỉ nhãn model). Cổng Invest
    chỉ nhận chỉ số tổng hợp khi có hàng riêng (Q4). **Giới hạn:** hai môi giới mang cùng một khách đăng hai bài khác chữ thì bước
    gom (YC4) không khử được — đếm Nhu cầu sẽ cao hơn số khách thật.
