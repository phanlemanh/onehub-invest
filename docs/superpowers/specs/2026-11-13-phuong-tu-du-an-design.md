# DA9 phuong-tu-du-an — tin gắn dự án nằm trọn một xã nhận phường suy ra từ dự án

Căn cứ: ô `_acceptance/phuong-tu-du-an/opportunity.md` (Mạnh 09/11 «Theo khuyến nghị» Q1–Q9, Q9: phường suy ra mang nhãn
«suy ra từ dự án» và DF7 tính là phường thật), hàng DA9 `docs/plan/lo-trinh.json`, ADR-0013 §«Luật cho mọi việc sau»
(câu 4: chỉ bộ phân xử ghi cột chuẩn), DA2 (096: `area_id` ở Property, `registry_inherit` ↔ `inferred`), DV1 (`asset_nodes.area_ids`
= mã xã hiện hành của nút dự án), DV6 (`du-an-tren-tin-s03-tu-nhom-va-ten`: phát biểu `project_node_id` trên bài S03).

## Vấn đề (đo 13/11, DB máy thu, chỉ đọc)

- Tin S03 đang sống: 245 không khu, 5.714 chỉ tới tỉnh (`region_type = 'market'`), 57 có phường (`submarket`).
- Nút dự án: 20; 14 nút có đúng một mã và mã là phường; 5 nút chỉ tới tỉnh; 1 nút hai phường (Phú Mỹ Hưng).
- Không có đường nào đưa phát biểu `area_id` vào cột `sale_offer_records.area_id`: `resolve_offer_fields` (045 → 061, vá 068)
  không xét `area_id`; `transform-zalo` ghi đè cột mỗi lượt (`writeOffers`: `area_id = EXCLUDED.area_id`).

## Thiết kế

### 1. Bộ ghi phát biểu kế thừa — `pipeline/lib/phuong-tu-du-an.mjs` + `pipeline/scripts/phuong-tu-du-an.mjs`

- Đầu vào: phát biểu `project_node_id` sống trên chủ thể Property (mọi luật, mọi nguồn — S03 từ DV6, S06 khi DS2 có); nút dự án
  có `area_ids` đúng MỘT mã và mã ấy là `submarket` (luật `phuongCuaToa` của `pipeline/lib/danh-ba-vat-the.mjs` dùng lại).
- Một chủ thể có hai dự án sống khác nhau → không kế thừa (đếm `du_an_mau_thuan`).
- Ghi: `area_id` = mã phường, `inferred` · `registry_inherit`, `rule_id` `phuong-tu-du-an`, evidence `{ project_node_id, nut_area_ids }`.
- Rút (lý do `xet-lai-du-an`): dòng sống của luật mà chủ thể không còn dự án, dự án đổi, hay nút đổi phường (mẫu rút của
  `danh-ba-vat-the.mjs --sua-xa`). Chạy lại không đổi gì → 0 chèn, 0 rút. Không chạm phát biểu `area_id` của luật khác.
- Mặc định chạy thử (chỉ đếm); `--ghi` một giao dịch rồi phân xử lại tin bị chạm.

### 2. Đường vào cột — migration 099 (Hỏi-1, số xin ở sổ LL)

Theo khuôn 068 (không chép thân hàm — đọc định nghĩa đang chạy, chèn cạnh mốc, thiếu mốc thì dừng `MOC-099`, áp lại được):
(a) giữ khoá `field_provenance->'area_id'` mang `nguon = 'du-an'` qua lượt dựng lại; (b) hàm mới
`resolve_offer_area_du_an(text[])` chạy ngay sau UPDATE chính và cộng số tin đổi vào kết quả. Với mỗi tin:

- giá trị gốc G của cột = `field_provenance->'area_id'->>'goc'` khi cột đang mang nhãn `nguon = 'du-an'` (phường do chính nhánh
  ghi lượt trước), ngược lại = cột hiện tại (giá trị nguồn ghi);
- G là phường (`submarket`) → cột = G, không đổi (0 tin có phường nguồn bị đổi);
- G trống hay tỉnh, và các bài của tin có đúng MỘT giá trị phát biểu `area_id` sống lớp `inferred` · `registry_inherit` → cột =
  phường ấy, `field_provenance->'area_id'` = `{method: registry_inherit, tier: inferred, nguon: 'du-an', goc: G}`;
- G trống hay tỉnh và không có (hay có hai) phường kế thừa → cột = G, bỏ khoá `area_id` khỏi `field_provenance` — gỡ dự án thì
  cột trở về giá trị nguồn kể cả khi transform không chạy lại (S06, lượt phân xử lẻ).

`transform-zalo` ghi lại cột tỉnh mỗi lượt qua `writeOffers`, và `writeOffers` đã gọi `resolveOffers` cho mọi tin vừa ghi
(`pipeline/lib/write-offers.mjs:69`) — nên không cần sửa `transform-zalo`. `reassign-areas.mjs` (chạy sau mọi transform VN) với
tin rao chỉ đặt NULL cho khu vực lạc; chuỗi transform → phân xử →
reassign-areas → phân xử được đo ở AC-5.

### 3. Nhãn

`field_provenance->'area_id'->>'nguon' = 'du-an'` là nhãn «suy ra từ dự án» cho DF7 và giao diện (DF7 đọc, hàng này không sửa
giao diện).

### 4. Số được lợi (đo 13/11, chỉ đọc: chạy thử DV6 trên DB máy thu, nối nút dự án một phường)

| | Tin S03 (6.431) | Tin S03 đang sống (6.016) |
|---|---|---|
| Từ tỉnh/trống lên có phường (có 099) | 5.249 | 4.895 |
| Đã có phường, có dự án — giữ nguyên | 44 | 39 |
| Hai phường kế thừa khác nhau — giữ nguyên | 0 | 0 |
| Không đụng bộ phân xử (chỉ phát biểu) | 0 tin đổi cột | 0 |

Khó đảo: sau khi áp 099 lên máy thu và đồng bộ, tin lên Invest mang phường suy ra — người dùng thật thấy. Đảo được bằng
migration thay lại thân hàm và một lượt phân xử, nhưng bản đã hiện không thu lại được (Hỏi-1, `kho_dao`).

## RESO-first (ADR-0011)

Không field, không enum mới: `area_id` trên tin đã khai ở DA2 (`pipeline/mappings.yaml`, local — DD 2.1 không có cấp phường);
`registry_inherit`, `inferred` đã có trong sổ. Khoá `nguon: 'du-an'` trong `field_provenance` là ghi chú nguồn gốc nội bộ (jsonb
của 045), không phải field hay lookup RESO — không vào sổ từ vựng.

## ADR-0013 — 8 câu

1. Lớp: phường của tin là phát biểu trên tin (Property), kế thừa từ nút dự án — không thành sự thật của căn.
2. DD 2.1: không field mới; `area_id` trên tin là local (DA2 đã khai trong `pipeline/mappings.yaml`).
3. Khoá: chủ thể `S0x:<id gốc>`; giá trị `areas.id` cấp phường.
4. Ai ghi: bộ ghi ghi phát biểu; cột chỉ do `resolve_offer_fields` ghi (099).
5. Nguồn gốc: evidence `{project_node_id, nut_area_ids}`; `field_provenance.area_id`.
6. Thời gian: rút + ghi mới, có lý do; không xoá.
7. Nâng bậc: tin S03 từ «tới tỉnh» lên «có phường» cho phần thuộc 14 dự án một phường; thước DF7.
8. SPL: chỉ mã nguồn; không tên nguồn thật.

## Phép đo

`pipeline/scripts/phuong-tu-du-an.test.mjs` (mã ca `PTD-AC-n`), DB thử nhân bản từ một DB mẫu dựng bằng `db-thu-dbv.mjs` (chuỗi
migration của nhánh, gồm 099); chiều đỏ bằng bản 099 đột biến và bản chép tạm của lib/lệnh. Đếm độc lập trước/sau bằng SQL của test.

## Ngoài phạm vi

- Ghi thật lên máy thu, áp 099 lên máy thu hay cloud — lời riêng của Mạnh.
- Sửa thước DF7 (`pipeline/sql/600_data_flow.sql`, `610_data_level.sql`) và giao diện nhãn.
- Nút nhiều phường (Phú Mỹ Hưng) và 5 nút chỉ tới tỉnh — cần toạ độ hay danh bạ phân khu.
- Đường vào cột của tin S06: bộ ghi phát biểu được cho mọi nguồn, nhưng hàng này chỉ đo đường S03 (S06 đã 99% có phường;
  `transform-chotot` ghi `COALESCE` và đã gọi phân xử).
- Bộ ghi dự án trên tin (DV6, GCQ2, DV2, DV3).
