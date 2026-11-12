# Itest đỏ trên main vì lý do KHÁC lớp «nạp lại migration cũ» — chỉ báo, không sửa trong hàng này

Quét ngày 12/11 trên main 3bfafd37, mỗi tệp chạy trên DB của riêng lượt (`db/db-thu.sh oneinvest_suite_quet<n> --chay`).
Nhật ký đầy đủ ở `.acceptance-runs/itest-nap-lai-migration-cu-sau-095/quet/`.

| Tệp | Đỏ | Nguyên nhân (một dòng) |
|---|---|---|
| `pipeline/scripts/danh-ba-nguoi.itest.mjs` | 2/22 | AC-8 «sellers thiếu người: S06» và HD13 E7: dữ liệu chép từ máy thu có (SĐT, nguồn) S06 chưa có Người, nên ca phụ thuộc trạng thái dữ liệu thật chứ không phụ thuộc lược đồ. |
| `pipeline/scripts/the-duyet-nguoi.itest.mjs` | 1/13 | TN-AC-10 «S03 lệch số nhóm»: số thẻ không bằng số nhóm đếm độc lập trên bản chép DB thật. |
| `pipeline/scripts/so-nhom.itest.mjs` | 2/14 | SN-AC-1/2 «không rút được câu đọc của script thu S06»: script thu S06 (làn ZCode) đã đổi nên bộ rút câu nguyên văn không còn khớp. |
| `pipeline/scripts/vocab-db.itest.mjs` | 1 (cả tệp) | Bộ rút câu nạp `ref_*` không đọc được `081_labels_truong_moi.sql` (câu nạp nằm ngoài cấp ngoài cùng) — bộ rút cần sửa. |
