# Hình tại điểm quyết định — quyen-bon-vai-mot-cho

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 OPS_EMAILS = ops hay admin | 2 nhánh | `bang-quyen` (cột «cửa phụ OPS_EMAILS») |
| Hỏi-2 unit.toggle = admin hay ops tới TV4 | 2 nhánh | `bang-quyen` (ô unit.toggle × ops) |
| Hỏi-3 áp 049 lên Supabase prod | 2 nhánh | dưới ngưỡng hình riêng: một bước áp, một bước lùi — nêu bằng chữ trên thẻ |

## Đề bài `bang-quyen`

- Loại: ma trận (bảng nhiệt hai màu qua / chặn), hàng = 10 hành động, cột = 7 người gọi (không ai · user · viewer ·
  ops · admin · owner · bearer chung) + một cột «OPS_EMAILS».
- Ô: «qua» hoặc «401»/«403»; hai ô đang hỏi (unit.toggle × ops, cột OPS_EMAILS ở các hàng unit.* và zalo.admin) viền
  nổi và ghi «Hỏi-2»/«Hỏi-1» kèm lối khác.
- Nguồn: bảng «Một bảng quyền» của design doc; vai xếp bậc viewer < ops < admin < owner; bearer chỉ qua ops.read và
  ingest.push.
- AC liên quan: AC-2, AC-8.
