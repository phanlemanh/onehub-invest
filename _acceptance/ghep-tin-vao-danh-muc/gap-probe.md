---
slug: ghep-tin-vao-danh-muc
at: 2026-11-12T09:50:58Z
verdict: findings
p0: 2
p1: 1
p2: 0
ghi_chu: số đo S1 trước hợp đồng — ô dừng chờ điều kiện, GS sắp lại 12/11 (không thu phạm vi)
---

# Số đo S1 — U1 · PL20 `ghep-tin-vao-danh-muc` — số đo S1 (12/11, DB máy thu, chỉ đọc)

Đơn vị: bài S03 (`subject_key = 'S03:'||post_id`) có ít nhất một phát biểu, lọc `property_type = apartment`.

## Xác định «thuộc hai khu»
- `collection_units.project_node_ids` của cả 30 nhóm S03 đang RỖNG → đường của DB1 (Hỏi-3) hiện không ra bài nào.
- Để đo, U1 tạm gán nhóm theo tên (chỉ để đo, không ghi DB): GP = 3 nhóm (CN VGP Q9, Hoàng Phát VHGP, Shophouse VGP);
  OP1 = 4 nhóm (Hàng Hot VHOP, Toà S1+S2 OCP, Cho thuê-CN OCP1, CN OCP1-F1). Nhóm «VHOP» có thể lẫn OCP2/3.
- Việc gán nhóm → dự án thuộc DA2 / sổ nhóm; PL20 không nên tự làm.

## Kết quả
| | OP1 | GP |
|---|---|---|
| bài căn hộ | 6.301 | 4.683 |
| có phát biểu toà hay mã căn | 5.160 | 1.881 |
| gắn được TRỤC (khớp duy nhất trục có trong danh bạ) | 166 | 1 |
| gắn được TOÀ (khớp duy nhất toà) | 2.415 | 506 |
| tên toà mơ hồ (nhiều toà cùng tên trong khu) | 0 | 19 |
| tên toà KHÔNG có trong danh bạ | 2.579 | 1.355 |
| có trục trong chữ (mã căn che tầng) nhưng danh bạ chưa có trục đó | 656 | 10 |

- `unit_number` ở OP1 phần lớn dạng che tầng `PR6xx19` (toà + trục) — 1.203 bài đọc ra toà+trục; GP gần như không có (17).
- Gắn mức CĂN: 0 — mã căn trên tin che tầng; tầng đọc riêng (`floor_raw`) chưa ghép.
- Toà thiếu trong danh bạ (OP1, đếm bài): PR2 436 · P4 261 · ZR2 183 · H2 155 · R1.01 149 · H1 138 · ZR3 136 · PR2.02 113 · H3 109 · S2.06 105 · R1 103 · S1.10 101…
  GP: S10 178 · S5 143 · S2 122 · S7 118 · S1.05 97 · S6 87… (GP ghi phân khu «S10» thay toà «S10.0x»).
- Danh bạ (DB1, chỉ từ S08): OP1 18 toà / 152 trục / 318 căn; GP 51 toà / 259 trục / 1.418 căn. LD2 chỉ 6 trục, PR6 29.

## Kết luận cho GS
- Nút cổ chai không phải bộ đọc (PL13): chữ bài đã ra tên toà/mã căn đủ dày. Nút cổ chai là (1) DANH BẠ thiếu toà và trục
  (chỉ S08), (2) sổ nhóm chưa gắn dự án.
- Trên phát biểu hiện có, gắn trục chỉ được ~167 bài; đủ cỡ mẫu cho Wilson (≥ ~73 đúng hết mới qua 0,95) nhưng độ phủ rất mỏng,
  và chưa có tập test có nhãn người cho trục.
- Đề nghị: sắp việc lấp danh bạ toà/trục cho OP1, GP (DA5/DA6 hay việc riêng) và gắn sổ nhóm → dự án (DA2) TRƯỚC PL20;
  hoặc thu PL20 về «gắn TOÀ + TRỤC khi danh bạ có» với ngưỡng đo trên phần gắn được và ghi độ phủ làm số, không làm ngưỡng.

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Danh bạ thiếu toà, trục của hai khu (chỉ S08) | 2.579 + 1.355 bài nêu toà không có trong danh bạ, chỉ 167 bài gắn được trục | đếm bài khớp danh bạ sau khi lấp | human-gate1: GS sắp DAZ1 S09 + lát hai khu DA10 trước |
| P0 | design | Sổ nhóm S03 chưa gắn dự án (project_node_ids rỗng cả 30 nhóm) | không có đường máy xác định bài thuộc hai khu | số nhóm có đúng một dự án | human-gate1: GS sắp phần đầu GCQ1 trước |
| P1 | evals | Chưa có tập test nhãn người ở mức trục, toà | cận dưới Wilson không đo được | số nhãn người theo mức | deferred: GS xin Mạnh và đội gắn nhãn một lần |
