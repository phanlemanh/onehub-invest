---
slug: nhom-s03-tren-cloud
at: 2026-10-25T03:47:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

# Gap probe: nhom-s03-tren-cloud

Phản biện context sạch (6 tệp: design, contract, evals, decisions, claims, opportunity). Máy đã kiểm lại từng finding trên
vật thật trước khi xử: nhật ký cổng thật có 5100 dòng `post 202`, 0 dòng thiếu `accepted`; `collector/openclaw/handler.js`
ghi `group=` bằng `channelName || threadId`, nên nhóm thiếu tên kênh mang mã nhóm.

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-1 ghi căn cứ mục-tiêu nhưng câu trích zalo-admin.ts chỉ quyết bộ lọc từng nhóm, không quyết gộp hợp mọi tài khoản, khử trùng mã hay đổi nghĩa badge «N nhóm bật» ở /ops/sources; design còn ghi /ops/sources «không đổi» [hieu-chuan-mot-bo-so#F2] | Mạnh ký tưởng chỉ sửa trang Thu thập; badge /ops/sources đổi số không ai hỏi; khi có tài khoản thứ hai N bảng nhóm lệch tổng badge mà E2 vẫn xanh | Dòng chi-nguoi Hỏi-2 thay d-1; design thêm mục «Câu hỏi cho người», sửa câu «không đổi» | human-gate1: Hỏi-2 (sổ d-9 supersedes d-1); design có mục «Câu hỏi cho người», mục «Không làm» sửa lại |
| P1 | contract | AC-2/E2 hứa giá trị viết trước nhưng không ghi N, không ghim chỗ trùng giữa cấp ngoài, default, c | Nhóm allow:false của c trùng nhóm bật ở default → bản sao «bỏ qua allow:false» vẫn ra đúng N, chiều đỏ không bắt; cấp ngoài nằm trọn trong default → kế thừa không được đo | Ma trận toàn phần trong AC-2 kèm N, mỗi bản sao đỏ ra số khác ghi trong expected | fixed: hợp đồng có ma trận viết trước (T4 ngoài default, D4 trùng, X allow:false không bật nơi khác, D8 enabled:false), N = 8; bản sao sai ra 4 / 7 / 9 / 9 / 9, ghi trong E2 |
| P1 | evals | Ma trận AC-1 có dòng skip không mang accepted, không có post khác 202 mang accepted | Bản sao «cộng accepted của dòng skip» vẫn ra A = 5 → chiều đỏ không thể bắt; lỗi «cộng accepted ở post 4xx/5xx» lọt | skip của A mang accepted 4, thêm post 500 mang accepted 7; bản sao đỏ ra số khác 5 | fixed: AC-1 thêm hai dòng ấy; E1 ghi bản sao skip → 9, mọi post → 12 |
| P1 | contract | Đường «thiếu trường → «—»» chỉ đo bằng khối viết tay; nhóm B (post 202 thiếu accepted) lại bị ghim = 0 | E5 xanh trên khuôn không bên ghi nào sinh; nhóm B đã qua cổng hiện «Vào bảng thô = 0» — số giả OPS-9 muốn bỏ | Bên ghi xuất null cho B, E round-trip từ push-ops-facts thật | fixed: bên ghi và trang máy thu ghi accepted null cho B (sổ d-11); AC-1, AC-3, AC-6 đòi B = «—» từ bên ghi thật; bỏ ca khối viết tay khỏi AC-5 |
| P1 | evals | Lời hứa «máy chủ không có mã nhóm» không đo ca nhóm thiếu tên; inputs E7 thiếu tệp dựng tên và tệp quyết 0 hay null | Bên ghi để mã làm tên → mã lên máy chủ qua name, E3 vẫn xanh vì mọi nhóm có tên; hội đồng E7 PASS mà không đọc tệp dựng tên | Ma trận có nhóm ghi bằng mã; E3 assert khối s03 và HTML không chứa mã; thêm ba tệp vào inputs E7 | fixed: nhóm C ghi bằng mã trong ma trận; khối s03 ghi name null, bảng «Nhóm chưa có tên» (sổ d-12); E3 có ca không chứa mã + chiều đỏ; E7 thêm ops-cloud.ts, ops-flow.mjs, ops-local.mjs |

Ghi chú ngoài cap (đã xử):

- d-4 chỉ trích hàng «Cũ» của ADR-0014 cho cả nhánh khối vắng → fixed: d-10 supersedes d-4, trích hàng «Không có».
- AC-5 không assert Alert vàng 45′ → fixed: AC-5 và E5 đòi Alert vàng «Máy thu không đẩy số từ …».
- ST-s03-local không có khung ui-check → fixed: E9 thêm khung `E9-ST-s03-local.png` trên dev server máy thu.
