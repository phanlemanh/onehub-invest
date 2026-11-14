---
schema_version: 1
slug: du-an-tren-tin-s03-tu-nhom-va-ten
feature: Tin S03 mang phát biểu dự án (project_node_id) suy ra từ hai nguồn chắc — nhóm có đúng một dự án trong sổ nhóm, và tên dự án bài tự nêu khớp danh bạ; mâu thuẫn không ghi mà đưa người duyệt
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh «Làm» ở phiên giám sát 13/11 05:39 VN, trả lời câu «Anh cho làm lát này, hay chưa?»
decided_by: Mạnh
decided_at: 2026-11-13     # ISO UTC (22:39Z ngày 12/11 = 05:39 VN 13/11)
prototype:
  base_commit:
  disposition:
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Tin S03 chưa có phát biểu dự án nào (DA2 đã mở ô `project_node_id` ở resource Property, migration 096 đã áp máy thu), nên
cột «dự án» trên bảng định vị của S03 đang là 0 và DV2 (dự án từ người bán) không có đầu vào. Lát này đi trước DV2.

Số đo 12/11 ~17:30Z trên DB máy thu, chỉ đọc (N1, `research-local/lat-du-an-s03-so.md` ở worktree du-an-tu-nguoi-ban):

| Nguồn | Tin S03 |
|---|---|
| Nhóm có đúng một dự án trong sổ nhóm | 5.297 |
| Bài tự nêu tên dự án, khớp danh bạ | 1.469 |
| Hai nguồn trùng nhau | 1.249 |
| Hợp lại | 5.517 trên 6.409 |
| Còn lại cho DV2 | 892 |

Mâu thuẫn: 8 tin hai nguồn nói khác nhau, 10 tin ở hai nhóm khác dự án → không ghi, đưa người duyệt. Nhóm nhiều dự án
(Ocean Park 1+2+3 và hai nhóm tám, chín dự án) không sinh phát biểu.

## Ngưỡng chết / ngưỡng UAT

- Kết quả nào là SỐNG: [đề xuất] tin S03 có dự án từ khoảng 86% trở lên ở chế độ đếm; 0 tin mâu thuẫn bị ghi; đổi sổ nhóm hay danh
  bạ thì phát biểu suy ra được rút/thay, không chồng.
- Kết quả nào là CHẾT: [đề xuất] mẫu đọc tay cho thấy dự án gán sai đáng kể (dưới 95% đúng) ở một trong hai nguồn.
- Timebox: …

## Quyết định Cổng Đáng

Mạnh, phiên giám sát đợt dot0-cam-mau, 2026-11-12T22:39:35Z (05:39 VN 13/11), nguyên văn: «Làm» — trả lời câu cuối của giám sát
lúc 16:27Z 12/11: «Anh cho làm lát này, hay chưa?» (lát ghi dự án lên tin S03 từ sổ nhóm và tên bài tự nêu). N1 đã đối chiếu
bản ghi phiên giám sát trước khi ghi dòng này.
