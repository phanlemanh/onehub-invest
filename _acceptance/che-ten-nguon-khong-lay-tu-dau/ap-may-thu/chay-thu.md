# Chạy thử trên bản chép DB máy thu — 18/11/2026, nhánh @8a4bfce4d

Lệnh: `bash _acceptance/che-ten-nguon-khong-lay-tu-dau/probes/ban-chep.sh` (bản chép `oneinvest_u1_cten`, áp 112, dòng S16 dạng trả
về từ tệp cục bộ GS cấp, xoá bản chép sau lượt). Thời gian 46 giây. Chỉ ghi số.

| Phép đo | Cờ false (đối chứng) | Cờ true (sau áp) |
|---|---|---|
| Nút dự án bị coi là tên S16 | 8 | 0 |
| Bí danh danh bạ bị coi là tên S16 | 114.763 | 0 |
| Dòng các bảng đi cloud bị coi là tên S16 | 4.762 | 0 |

- Cấy cụm hai từ có dấu cách: bộ soát sync-cloud bắt. Cấy tên miền: bộ soát sync-cloud bắt.
- S05: 60 dòng log chỉ biến thể từ đầu che được; lõi mới vẫn bắt 60/60.
- DB máy thu không đổi (checksum `source_registry`, `asset_nodes`, `registry_aliases` trước = sau).
