# Hình tại điểm quyết định — gop-tin-chi-anh-o-transform

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 — quy tắc gán bài chỉ-ảnh | hai nhánh rẽ (gần nhất · chỉ xét tin offer) | cần hình: `hoi-1-quy-tac-gan` |
| Hỏi-2 — gộp ở đâu | hai nhánh rẽ (bảng ảnh · post_ids) | cần hình: `hoi-2-gop-o-dau` |
| Phản biện P1/P2 (đã sửa) | dưới ngưỡng: 1 bước | — |

## Đề bài `hoi-1-quy-tac-gan`

- Loại: dòng thời gian một người gửi trong một nhóm (trục ngang = giây).
- Nút: bài chữ A thuộc offer (t=0), bài chữ B KHÔNG thuộc offer (t=+70 giây, tin hỏi/không giá), bài chỉ-ảnh X (t=+60 giây).
- Nhánh trái «gần nhất (khuyến nghị)»: X gần B (10 giây) hơn A (60 giây) → X theo B → không vào offer nào. Nhãn: 47,7% offer có ảnh.
- Nhánh phải «chỉ xét tin offer»: X vào offer A. Nhãn: 50,3% offer có ảnh, ~218 ảnh/1.890 có thể gắn sai căn.
- AC liên quan: AC-2, AC-4, AC-6.

## Đề bài `hoi-2-gop-o-dau`

- Loại: luồng dữ liệu hai nhánh.
- Nút chung: bài nạp S03 (bài chữ + bài chỉ-ảnh) → transform-zalo → sale_offers (post_ids).
- Nhánh trái «bảng ảnh (khuyến nghị)»: transform-media đọc post_ids + gán bài chỉ-ảnh (lib/gop-anh) → bảng media → thẻ duyệt /ops/review. Nhãn: sale_offers không đổi; trang dòng chảy vẫn đếm bài chỉ-ảnh «không đọc được».
- Nhánh phải «post_ids»: transform-zalo nối bài chỉ-ảnh vào post_ids → bảng media; năm chỗ đọc «bài đại diện» (enrich agent, deals app, deals data-api công khai, công cụ agent, trang dòng chảy) phải sửa. Nhãn: dòng chảy tính bài chỉ-ảnh là đọc được.
- AC liên quan: AC-3, AC-5.
