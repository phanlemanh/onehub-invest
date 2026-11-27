# Gap-probe — street-raw-khong-mang-ten-nguon (PL39)

Phản biện context sạch 25/11 (tác tử riêng, chỉ đọc nhánh và hồ sơ trước bản sửa). Bảy lỗ: 0 P0, 5 P1, 2 P2 (gộp ba P2 về
hai dòng). Mọi lỗ đã xử trong hồ sơ trước Cổng Phạm vi.

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | `pipeline/transform-chotot.mjs` luật | Không có trần số ô bị NULL | Sổ nguồn thêm token chung chung → hàng nghìn ô đường, toà về NULL lặng lẽ, chỉ một dòng log | Không AC nào chặn | Đã sửa: trần 50 mỗi lượt (`kiemTranTenNguon`), vượt thì job dừng, không rút, không ghi; AC-5, E5 |
| P1 | `pipeline/lib/duong-can.mjs`, `probes/ban-chep.mjs` | Phép đo không chạy bước chép đường sang căn | Tên nguồn chép sang `properties.street`, `enrichment_log` thì sync vẫn dừng | E2 chỉ soát sau transform | Đã sửa: phép đo chạy `dienDuongCan` sau lượt thật rồi mới soát ba bảng; bản chép cũ đã chép sang căn ghi ngoài phạm vi kèm số đo 0 |
| P1 | `transform-chotot.mjs` lượt rút, migration 061 | Chỉ rút phát biểu của luật đọc; `legacy` hay phương pháp khác cùng giá trị thắng lại | Rút fact xong, legacy mang tên nguồn thắng, cột vẫn trúng | Bảng phủ ca chỉ đếm cột | Đã sửa: rút mọi phát biểu sống S06 ở đường, toà mà giá trị trúng (mọi phương pháp); bảng phủ ca thêm lớp phát biểu theo phương pháp; phép đo cấy tin B chỉ có đường legacy trúng; AC-1 nói «về NULL hoặc phát biểu sạch còn lại» |
| P1 | `probes/ban-chep.mjs` thời gian, E3 | Một mẫu, thứ tự cố định | Lượt sau ấm hơn, tỉ lệ xanh giả hay đỏ giả | `that2.ms / dot.ms` | Đã sửa: AC-3 đo riêng chi phí của luật trên đúng các giá trị của lượt, so thời gian lượt thật; tỉ lệ hai lượt chỉ in tham khảo |
| P1 | `probes/ban-chep.mjs` ô thật | Ô thật tuỳ chọn và lọc theo luật đọc | Ô thật đến từ đường khác thì không bao giờ được soát | `coThat` theo rule_id | Đã sửa: soát cột `street_raw` của tin, không lọc luật; ô đã được GS gỡ 09:13Z nên phép đo dựa vào ca cấy, ô thật soát khi còn |
| P2 | log dòng đếm, nhánh phường | Log gọi «→ NULL» cả khi ô không đổi; nhánh phường không có ca | Đếm thừa với dòng cũ; xoá luật phường không eval nào đỏ | E1 chỉ đường, toà, quận | Đã sửa: log đổi thành «bỏ ghi … · rút … chủ thể»; tin mới N cấy phường, E1 kiểm `phuong_raw 1` |
| P2 | `mask-source-names.mjs` bộ nhớ đệm; tệp đột biến | Đệm theo danh tính mảng; tệp đột biến sót khi lượt chết | Sổ thêm mục tại chỗ thì bộ dò dùng biến thể cũ; tệp luật tắt lọt commit | Test chỉ thử mảng mới | Đã sửa: đệm dựng lại khi độ dài mảng đổi, test thêm ca thêm mục tại chỗ; phép đo dọn tệp đột biến của lượt đã chết ở đầu lượt |

verdict: converged
