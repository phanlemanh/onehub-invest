# Hình tại điểm quyết định — de-xuat-thanh-phat-bieu-bac (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 — đề xuất cũ: bộ chuyển hay chỉ dòng kiểm | 2 nhánh rẽ | `hoi-1-de-xuat.html` |
| Hỏi-2 — bậc theo căn: làm ngay trên căn hiện hành hay chờ ADR-0016 Đợt 1–2 | 2 nhánh rẽ + 6 bậc nối tiếp | `hoi-2-thang-bac.html` |

## Đề bài hình

**hoi-1-de-xuat** — loại: sơ đồ rẽ nhánh (decision tree), ngang.
- Gốc: «enrichment_proposals trên máy thu: 0 dòng (từ 26/10) · 0 quyết định người về trường».
- Nhánh A (máy khuyên): «Không viết bộ chuyển» → «dòng kiểm enrich:proposal-assertion mỗi lượt cloud-sync» → «máy thu: applied=0 missing=0 → Đạt».
- Nhánh B: «Viết bộ chuyển đủ năm trạng thái» → «thêm ~1 việc S3» → «chạy trên máy thu: 0 dòng chuyển».
- Ghi chú dưới: «Từ 045, mỗi lần áp đề xuất tự ghi phát biểu mang proposal_id». AC-7.

**hoi-2-thang-bac** — loại: thang bậc (ladder/process) sáu nấc B0→B5, mỗi nấc ghi điều kiện ngắn và «ai mở» + số hôm nay.
- B0 Có lời khai — thiếu trường lõi — hôm nay: 913 tin lẻ.
- B1 Đọc được — đủ 5 trường lõi, chưa gắn căn — 5 tin lẻ.
- B2 Gắn căn — có tin gắn đủ trường lõi — 25.863 căn.
- B3 Đã đo — mọi trường lõi measured — 0 · mở bởi PL17 + PL21.
- B4 Xác minh — verified + lớp sự thật — 0 · nhánh danh mục mở bởi DB1.
- B5 Sống — lời chào còn hiệu lực + lịch sử giá — 0 · PL19 thay vị từ.
- Hộp rẽ bên phải: «Hỏi-2: tính ngay trên properties (máy khuyên) | chờ ADR-0016 Đợt 1–2 (S08 chưa có dòng)». AC-2…AC-5.

| Hỏi-3 — chỗ chạy phân bố: bước cuối cloud-sync 15′ hay sau resolve-properties của chotot-daily | 2 nhánh rẽ | `hoi-3-cho-chay.html` |

**hoi-3-cho-chay** — loại: so sánh hai nhánh (decision tree), ngang.
- Gốc: «Phân bố bậc chạy ở đâu?».
- Nhánh A (máy khuyên): «Bước cuối cloud-sync (15′), sau push-ops-facts» → «phân bố luôn tươi» → «dòng kiểm fail vẫn thoát 0 — nhịp tim /ops không đỏ oan».
- Nhánh B: «Sau resolve-properties trong chotot-daily (mỗi đêm)» → «tách khỏi nhịp tim /ops» → «phân bố tươi một lần/đêm; sửa dãy bước đã ký của job đêm».
- AC-9.
