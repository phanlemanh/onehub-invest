---
slug: du-an-cua-tin-len-dinh-vi
at: 2026-11-15T00:06:08Z
verdict: findings
p0: 1
p1: 5
p2: 4
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract/evals (AC-7, AC-9, E7, E9) | Không nói cách chạy 600 trong giao dịch lùi; tệp 600 tự có `BEGIN;` (dòng 21) và `COMMIT;` (dòng 265) | `COMMIT` của 600 chốt luôn 105 lên DB máy thu khi chưa có lời áp | grep hai dòng BEGIN và COMMIT trong pipeline/sql/600_data_flow.sql | fixed: AC-9, E7, E9 — bộ chạy giữ giao dịch, chạy thân 600 đã bỏ đúng một BEGIN/COMMIT, còn COMMIT thì thoát 2 trước khi gửi câu nào; design §2.4 |
| P1 | contract/design (AC-7, §2.2) | `data_level_units()` gọi `offer_located` mỗi tin; nền `SELECT false` inline (66 ms), dạng subplan qua view > 130 s, mỗi lượt cloud-sync 15 phút | bac-du-lieu, do-hang-ngay chậm hàng phút, chồng khoá | EXPLAIN nền 66 ms; bản thử > 130 s | fixed: design §2.2 data_level_units nối view theo tập; AC-4, E4 assert thân không gọi offer_located(; AC-7, E7 trần 2 s |
| P1 | contract/design (Lớp E) | Câu bản ghi app `data-flow-queries.ts:224` gán cứng clustered/none | lưới báo 4.934 định vị, danh sách và lọc B2 vẫn 0 | `data-flow-queries.ts:224,345` | fixed: AC-11, E11 (máy thu nối view, cloud giữ câu cũ); design §2.6 |
| P1 | evals E8 / design §2.4 | Gợi ý «Chưa định vị» đếm cả tin đã định vị; E8 chỉ assert âm tính câu không có trên màn | câu gợi ý sai, E8 xanh giả | 2.469/3.224 tin S03 ghi toà đã có dự án | fixed: AC-8, E8 assert khẳng định câu mới có số locatedPending; design §2.5 |
| P1 | evals E2 | Ô nút con chỉ một tầng; danh bạ có 12 phân khu → phân khu | quy nút một bước vẫn xanh | `asset_nodes` subzone→subzone 12 | fixed: AC-2, E2 thêm ô phân khu cháu và toà → dự án, đối chứng đỏ 'nut-chau' |
| P1 | contract (Lớp E) | Bộ kiểm có sẵn trên DB thử chép sau khi áp: `bac-roundtrip.ts` SQL_DEM `false`, TB-AC-8 «lọc B2 rỗng» | `bac_roundtrip`, `tb_app_db` đỏ sau lần áp đầu | `config.yaml:160,875`; `bac-roundtrip.ts:37` | fixed: AC-11, E11 sửa SQL_DEM và TB-AC-8, hai bộ kiểm xanh |
| P2 | evals E3 | Ô S06 hai bí danh không thể có (khoá list_id, registry_aliases_ma_nguon_uq) | fixture phải phá ràng buộc | `\d` hai bảng | fixed: bỏ ô, AC-3 ghi vì sao |
| P2 | contract/evals AC-9 | So locatedPending với ảnh chụp cũ có nhánh | lúc đỏ lúc xanh | `computed_at` 23:54Z | fixed: AC-9, E9 đo nền trong cùng giao dịch trước khi áp |
| P2 | design §4 / E10 | Tệp lùi chưa định thứ tự, chưa cấm CASCADE | lùi giữa cloud-sync làm job FAIL; CASCADE xoá view của N1 | — | fixed: AC-10, E10 thay hàm trước DROP, không CASCADE, ca 10c view phụ thuộc thì lùi thất bại cả khối |
| P2 | contract (Lớp E) | do-hang-ngay: lượt đầu ghi loạt dòng «len»; subzone_node_id bỏ lặng | báo cáo DO1 ngày áp tăng vọt không chú thích | `do-hang-ngay.mjs:162` | fixed: AC-10 README ghi số dòng «len» dự kiến; subzone_node_id vào Out of scope |
