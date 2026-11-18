# Nghĩa `pty_project_type` của tin S06 — đo theo loại nhà người bán chọn (`category`)

Sinh bởi `node pipeline/scripts/ma-can-s06-sach.mjs --bang-pty` lúc 2026-11-12T10:00:18.043Z. Nhãn đo là `category` của chính tin (người bán chọn, có thể lệch); bảng không tự kết
luận khớp hay lệch — đặt số cạnh giả thuyết của ZCode để người đọc cân (hàng DA5, `_acceptance/ma-can-s06-sach/`).

| Giá trị | Số tin | căn hộ (1010) | nhà (1020) | văn phòng, mặt bằng (1030) | đất (1040) | phòng (1050) | Khác | Loại đa số | Tỉ lệ | Giả thuyết ZCode |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 8766 | 8539 | 87 | 128 | 12 | 0 | 0 | căn hộ | 97.4% | căn hộ |
| 2 | 357 | 177 | 154 | 12 | 14 | 0 | 0 | căn hộ | 49.6% | shophouse |
| 3 | 1734 | 1073 | 364 | 151 | 146 | 0 | 0 | căn hộ | 61.9% | căn hộ |
| 4 | 1509 | 1456 | 39 | 12 | 2 | 0 | 0 | căn hộ | 96.5% | căn hộ |
| 5 | 14 | 7 | 5 | 1 | 1 | 0 | 0 | căn hộ | 50.0% | chưa có |
| 6 | 9 | 0 | 3 | 5 | 1 | 0 | 0 | văn phòng, mặt bằng | 55.6% | chưa có |
| 7 | 141 | 138 | 1 | 2 | 0 | 0 | 0 | căn hộ | 97.9% | căn hộ |
| 8 | 60 | 49 | 2 | 6 | 3 | 0 | 0 | căn hộ | 81.7% | chưa có |
| 9 | 35 | 31 | 2 | 2 | 0 | 0 | 0 | căn hộ | 88.6% | chưa có |
| 10 | 124 | 15 | 60 | 3 | 46 | 0 | 0 | nhà | 48.4% | nhà phố |
| 11 | 107 | 45 | 52 | 7 | 3 | 0 | 0 | nhà | 48.6% | đất nền |

Tổng: 12856 tin có `pty_project_type`.
