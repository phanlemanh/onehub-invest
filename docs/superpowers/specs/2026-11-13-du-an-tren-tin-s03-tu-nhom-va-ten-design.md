# du-an-tren-tin-s03-tu-nhom-va-ten — dự án trên tin S03 từ sổ nhóm và tên bài tự nêu

Căn cứ: ô cơ hội `_acceptance/du-an-tren-tin-s03-tu-nhom-va-ten/opportunity.md` (Cổng Đáng: Mạnh «Làm», 13/11), DA2
(`_acceptance/truong-du-an-tren-tin/`, migration 096 đã áp máy thu), ADR-0013 §«Luật cho mọi việc sau», trang tri thức
«Danh bạ dự án: từ vựng, mô hình và cách gắn tin» (thứ tự tin cậy: chữ bài nêu tên trước quy ước nhóm). Lát này đi trước
DV2 (dự án từ người bán): DV2 cần tin đã biết dự án làm đầu vào.

## Vấn đề

Tin S03 chưa có phát biểu `project_node_id` nào (đo 12/11 trên DB máy thu). Hai nguồn chắc đã nằm trong DB:

- **(i) sổ nhóm** — `collection_units.project_node_ids` của nhóm S03 (Mạnh cho ghi chiều 12/11); 15 dòng có đúng một dự án.
- **(ii) tên bài tự nêu** — `silver_labels.probabilities.o.project.v` (nhãn bạc đã có, không gọi model mới), khớp tên hay
  bí danh một nút `asset_nodes` loại `project`.

Đo 12/11 (`research-local/lat-du-an-s03-so.md`): 6.409 tin; (i) 5.297; (ii) 1.469; trùng 1.249 (8 mâu thuẫn); 10 tin có bài
ở hai nhóm khác dự án; hợp 5.517; còn 892 cho DV2.

## Thiết kế

Hai tệp mã mới, một tệp test; không migration (096 đã mở ô `project_node_id` ở resource Property với `e1_rule` và `e2_llm`).

### `pipeline/lib/du-an-tren-tin-s03.mjs` — hàm thuần

`tinhDuAn({ nhom, bai, nhan, nut, tin, tangCao })` → `{ dong, mauThuan, dem }`:

- `nhom`: dòng `collection_units` S03 → map khoá nhóm thật (`khoaNhomThat`, gộp hai dạng `zalouser:group:<id>` và `<id>`)
  → dự án, CHỈ khi `cardinality(project_node_ids) = 1`. Nhóm 0 hay nhiều dự án không vào map. Một khoá nhóm thật có hai
  dòng sổ trỏ hai dự án khác nhau → không vào map, đếm `nhom_lech`.
- `nhan`: nhãn mới nhất mỗi bài (`DISTINCT ON (post_id) … ORDER BY labeled_at DESC`); tên khớp nút khi `lower(tên)` bằng
  `lower(name)` hay một `lower(alias)` của đúng MỘT nút project (khớp nhiều nút → không khớp, đếm `ten_mo_ho`). Khớp rồi
  còn phải tìm thấy chữ tên (hay bí danh đã khớp) trong chữ bài sau chuẩn hoá (NFC, hạ chữ, gộp khoảng trắng) — không thấy
  thì không phát biểu, đếm `ten_khong_trong_bai`. Đoạn tìm thấy là `evidence.trich`.
- Đơn vị xét mâu thuẫn là **tin** (`sale_offer_records` S03, `post_ids`): tập dự án ứng viên của tin = (i) của mọi bài ∪
  (ii) của mọi bài. Tập có hai dự án trở lên → **tin mâu thuẫn**: không phát biểu cho bài nào của tin, tin vào `mauThuan`
  kèm ứng viên và nguồn. Bài thuộc nhiều tin mà một tin mâu thuẫn → bài không phát biểu.
- Bài không thuộc tin S03 nào → không phát biểu (lát này ghi dự án cho tin).
- `tangCao`: bài đã có phát biểu `project_node_id` sống từ phương pháp khác (không phải hai luật này). (i) bỏ khi bài có
  dòng `fact` hoặc `observed`; (ii) bỏ khi bài có dòng `fact`. Đếm `bo_tang_cao`.

Dòng phát biểu (chủ thể `S03:<post_id>`, resource Property):

| Nguồn | evidence_tier | method | rule_id | evidence |
|---|---|---|---|---|
| (i) sổ nhóm | `inferred` | `e1_rule` | `du-an-nhom-mot-du-an` | `{ nhom: <khoá nhóm thật>, so_nhom_id: <collection_units.id> }` |
| (ii) tên bài | `observed` | `e2_llm` | `du-an-ten-bai` | `{ label_id, model, trich }` |

Tầng của (ii) là câu hỏi cho Mạnh (Hỏi-3). `method_version` = `du-an-tren-tin-s03@1`.

### `pipeline/scripts/du-an-tren-tin-s03.mjs` — lệnh

- Không cờ: **chạy thử** — đọc, tính, in bảng đếm (tin S03 · bài (i) · bài (ii) · tin (i) · tin (ii) · trùng · hợp · mâu
  thuẫn · bỏ tầng cao · tên không trong bài · còn lại), KHÔNG ghi gì.
- `--ghi`: một giao dịch — `writeAssertions(…, { replaceOwn: true })` cho tập mong muốn, rồi rút phát biểu sống của hai
  `rule_id` này ở bài KHÔNG còn trong tập (lý do `xet-lai-so-nhom-danh-ba`). Không chạm dòng của phương pháp hay luật
  khác. Chạy lại cùng dữ liệu → 0 chèn, 0 rút.
- `--bang-mau-thuan <tệp>`: ghi bảng tin mâu thuẫn (mã tin · ứng viên · nguồn, không chữ bài) — cách đưa người duyệt
  của lát này (Hỏi-1).
- Thiếu `field_assertions` hay ô 096 (CHECK chưa có `project_node_id`) → thoát 2 kèm thông điệp.
- Chỉ import `pg` và `pipeline/lib`; không gọi model, không gọi mạng.

Xét lại khi sổ nhóm hay danh bạ đổi = chạy lại lệnh: bài mất điều kiện bị rút, bài đổi dự án được thay (cơ chế `replaceOwn`
+ rút phần thừa), không chồng. Lệnh không tự chạy theo lịch ở hàng này (Hỏi-2).

## ADR-0013 — 8 câu

1. Lớp: dự án của tin là phát biểu trên tin (`Property`), không phải sự thật của căn.
2. DD 2.1: `project_node_id` ↔ `SubdivisionName` (đã tra ở DA2, 12/11); không field mới.
3. Khoá: chủ thể `S03:<post_id>` (khoá gốc của nguồn), giá trị là `asset_nodes.id` — không khoá suy từ nội dung.
4. Ai ghi: lệnh ghi `field_assertions`; không `UPDATE` cột chuẩn nào (096 chưa có cột trên `sale_offers`).
5. Nguồn gốc: mỗi dòng có `rule_id` + `evidence` (khoá nhóm và dòng sổ, hay nhãn + đoạn trích).
6. Thời gian: đổi = rút + ghi dòng mới (sổ chỉ thêm), có lý do rút.
7. Nâng bậc: tin S03 căn hộ từ B1 lên «biết dự án» ở mức tin; thước «độ phủ dự án trên tin» của DA9 đổi từ 0 lên ~86% S03.
8. SPL: chỉ mã S03; khoá nhóm là định danh nhóm (tầng C), không tên nguồn thật; bảng mâu thuẫn không chứa chữ bài.

## Phép đo

`pipeline/scripts/du-an-tren-tin-s03.test.mjs` (mã ca `DAT-AC-n`): ca thuần cho `tinhDuAn`; ca DB trên DB thử
`oneinvest_dbv_dat_<pid>` dựng từ `db/migrations` của nhánh qua `pipeline/scripts/db-thu-dbv.mjs` (như DA2), dữ liệu mồi
do test chèn. Chiều đỏ: bản sao `lib/du-an-tren-tin-s03.mjs` đột biến (bỏ điều kiện đúng-một-dự án; bỏ luật mâu thuẫn; bỏ
rút phần thừa) nạp vào ca, ca gọi đúng tên. Không có DATABASE_URL → ca DB bỏ với lý do «thiếu DATABASE_URL — chạy qua
npm test».

## Ngoài phạm vi

- Ghi thật lên DB máy thu (`--ghi`) — lời riêng của Mạnh sau gộp; trước khi ghi chạy lại chế độ đếm.
- Nối lệnh vào chuỗi chạy đêm (Hỏi-2).
- Thẻ duyệt trong `/ops/review` cho tin mâu thuẫn — DV3 dựng thẻ dự án mơ hồ (Hỏi-1).
- Dự án từ người bán (DV2), từ mã toà (DV3); 892 tin còn lại.
- Cột dự án trên `sale_offers` / bộ phân xử; phân khu `subzone_node_id`; dự án ngoài danh bạ (16 tên).
