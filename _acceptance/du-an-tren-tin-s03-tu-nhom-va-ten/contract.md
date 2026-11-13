---
schema_version: 1
feature: Tin S03 mang phát biểu dự án (project_node_id) từ hai nguồn chắc — nhóm có đúng một dự án trong sổ nhóm, và tên dự án bài tự nêu khớp danh bạ; tin mâu thuẫn không ghi mà đưa người duyệt
slug: du-an-tren-tin-s03-tu-nhom-va-ten
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [pipeline]
status: verified
approved_by: Mạnh
approved_at: 2026-11-13
design_doc: docs/superpowers/specs/2026-11-13-du-an-tren-tin-s03-tu-nhom-va-ten-design.md
---

# Acceptance Contract: du-an-tren-tin-s03-tu-nhom-va-ten

## Context

Tin S03 chưa có phát biểu dự án nào dù DA2 đã mở ô `project_node_id` (096 đã áp máy thu). Sổ nhóm và nhãn bạc đã có sẵn hai
nguồn chắc; đo 12/11 hợp hai nguồn phủ 5.517/6.409 tin. Lệnh mới tính phát biểu từ hai nguồn, mặc định chỉ đếm; ghi thật
chờ lời riêng của Mạnh sau gộp. Không migration, không gọi model.

## Criteria

- AC-1: Given DB thử có nhóm S03 A (sổ ghi đúng một dự án P1, sổ có cả dạng `zalouser:group:<id>` lẫn `<id>`), nhóm B (ba
  dự án), nhóm C (không dự án), bài thuộc tin S03 ở cả ba nhóm, When chạy lệnh với `--ghi`, Then mỗi bài của nhóm A có đúng
  một phát biểu `project_node_id` = P1, lớp `inferred`, phương pháp `e1_rule`, luật `du-an-nhom-mot-du-an`, evidence mang
  khoá nhóm và mã dòng sổ; bài nhóm B, C không có dòng nào của luật này.
- AC-2: Given bài thuộc tin S03 có nhãn bạc mới nhất nêu tên dự án, When chạy với `--ghi`, Then bài mà tên khớp tên hay bí
  danh của đúng một nút project (không phân biệt hoa thường) VÀ nhãn có căn cứ thuộc tập Cổng Phạm vi chốt ở Hỏi-4 (mặc định:
  `chu_bai` với đoạn trích đã kiểm) có một phát biểu luật `du-an-ten-bai` với lớp và phương pháp theo Hỏi-3/Hỏi-4, evidence
  mang mã nhãn, căn cứ và đoạn trích; không dòng cho: tên không khớp nút, tên khớp hai nút, nhãn căn cứ ngoài tập (ngữ cảnh
  nhóm, kiến thức nghề, ảnh khi chọn A), trích chưa kiểm, tên chỉ nằm ở nhãn cũ hơn nhãn mới nhất.
- AC-3: Given tin có bài ở hai nhóm một-dự-án khác nhau, và tin có dự án theo nhóm khác dự án theo tên bài, When chạy với
  `--ghi`, Then không bài nào của hai tin ấy có phát biểu của hai luật; tin có hai nguồn cùng một dự án có cả hai dòng; với
  `--bang-mau-thuan <tệp>` tệp liệt đúng các tin mâu thuẫn kèm dự án ứng viên và nguồn, không chứa chữ bài.
- AC-4: Given phát biểu của lượt trước, When sổ nhóm đổi (nhóm A thành hai dự án), tên đổi nút (bí danh bị gỡ) hay nút đổi
  dự án rồi chạy lại `--ghi`, Then phát biểu của bài mất điều kiện bị rút có lý do `xet-lai-so-nhom-danh-ba`, bài đổi dự án
  còn đúng một dòng sống của luật mang giá trị mới; chạy lại lần nữa không đổi gì → 0 dòng chèn, 0 dòng rút.
- AC-5: Given bài có phát biểu `project_node_id` từ phương pháp khác (fact·hitl, observed·parser), When chạy với `--ghi`,
  Then các dòng ấy giữ nguyên (không rút, không sửa); luật nhóm không ghi cho bài có dòng `fact` hay `observed` khác; luật
  tên bài không ghi cho bài có dòng `fact` khác.
- AC-6: Given DB thử, When chạy không cờ, Then lệnh in bảng đếm và số dòng `field_assertions` trước, sau bằng nhau; When
  DB thiếu `field_assertions` hay CHECK chưa có `project_node_id`, Then thoát 2 với thông điệp gọi tên điều thiếu; `--ghi`
  lỗi giữa chừng thì không dòng nào được ghi (một giao dịch).
- AC-7: Given bảng đếm của lần chạy thử trên DB thử có cả hai nguồn, When đọc các dòng số rồi chạy `--ghi`, Then «tin có dự
  án» = số tin có ít nhất một phát biểu sống của hai luật sau `--ghi` (đếm lại trong `field_assertions`); tin có dự án + mâu
  thuẫn = số tin có ít nhất một ứng viên; còn lại = tin S03 − tin có dự án − mâu thuẫn; mỗi dòng bằng đúng số tính lại bằng
  truy vấn độc lập của test. And chạy thử trên DB của lượt (bản sao dữ liệu thật) cho tin (i) > 0 và gặp đủ hai dạng khoá nhóm.
- AC-8: Given mã của hai tệp mới, When kiểm phụ thuộc, Then lệnh chỉ import `pg`, `node:*` và `pipeline/lib/*`; không
  gọi mạng hay model; mã trường, lớp, phương pháp lấy từ `pipeline/lib/vocab.generated.mjs` (không viết tay).
- AC-9: Given cây làm việc, When chạy `cd pipeline && npm test`, Then thoát 0.

## Coverage

Trục (quét không gian AC theo nguồn × trạng thái bài × đổi theo thời gian):
- Nguồn: (i) sổ nhóm · (ii) tên bài theo căn cứ nhãn (chữ bài · ngữ cảnh nhóm · kiến thức nghề · ảnh) · cả hai trùng · cả hai lệch — AC-1, AC-2, AC-3.
- Trạng thái nhóm: một dự án · nhiều · không · hai dạng khoá · hai dòng sổ lệch — AC-1.
- Trạng thái tên: khớp một nút · khớp hai nút · không khớp · không trong chữ bài · nhãn cũ — AC-2.
- Tin: một bài · nhiều bài cùng dự án · nhiều bài khác dự án · bài thuộc hai tin · bài không thuộc tin — AC-3, AC-1.
- Thời gian: lượt đầu · sổ đổi · danh bạ đổi · chạy lại không đổi — AC-4.
- Cùng chủ thể có phát biểu khác: fact · observed · inferred khác luật — AC-5.
- Chế độ chạy: thử · ghi · thiếu bảng · lỗi giữa chừng — AC-6.
[CE chưa kiểm chứng] Đủ: mọi ô của tích trục có ít nhất một AC hoặc một dòng Out of scope.

## Đường đo

- «tin S03 có dự án» ← dòng «tin có dự án» của bảng đếm chạy thử (AC-6, AC-7) trên DB máy thu, chạy lại trước lời ghi thật.
  Đo 13/11: 82,6% (A) · 83,6% (B) · 86,0% (C) — ngưỡng «~86%» đề xuất trong ô cơ hội tính cả nhãn suy từ ngữ cảnh nhóm (Hỏi-4).
- «0 tin mâu thuẫn bị ghi» ← AC-3 trên DB thử; trên DB thật: dòng «mâu thuẫn» + tệp `--bang-mau-thuan`.
- «xét lại được, không chồng» ← AC-4.
- «≥95% đúng» trên mẫu đọc tay: không đo ở hàng này — mẫu đọc tay sau khi ghi thật (Out of scope).

## Out of scope

- Chạy `--ghi` trên DB máy thu hay cloud — lời riêng của Mạnh sau gộp; trước đó chạy lại chế độ đếm.
- Nối lệnh vào chuỗi chạy đêm (Hỏi-2) và thẻ duyệt trong `/ops/review` cho tin mâu thuẫn (Hỏi-1, DV3).
- Dự án từ người bán (DV2), từ mã toà (DV3); 892 tin còn lại; 16 tên dự án ngoài danh bạ.
- Cột dự án trên `sale_offers` / bộ phân xử; `subzone_node_id`; mẫu đọc tay độ đúng.
