# Nhật ký áp lên DB máy thu — che-ten-nguon-khong-lay-tu-dau, 20/11/2026

Hồ sơ đã ký: `_acceptance/che-ten-nguon-khong-lay-tu-dau/` (PR #499, T3). Lệnh áp, số chạy thử, sao lưu, cách lùi, lệnh
kiểm sau ở `_acceptance/che-ten-nguon-khong-lay-tu-dau/ap-may-thu/README.md`; tệp đó giữ nguyên bản đã ký, nhật ký ghi ở đây.

Người chạy: phiên giám sát đợt dot0-cam-mau. Chữ ký Cổng Bằng chứng của Mạnh kèm lời áp (AGENTS.md «Ai quyết gì»).

## Trình tự

| Bước | Giờ (UTC, 20/11) | Kết quả |
|---|---|---|
| Sao lưu | 04:52:30 | `~/onehub-backups/db/source_registry-20261120T045230Z.sql`, 15 dòng |
| Áp migration 112 | 04:52 | `ALTER` + `COMMENT`, không lỗi |
| Điền dòng S16 trên máy (`tra-s16.mjs`) | 04:52 | «1 dòng, match_whole = true»: tên hai từ, `source_ids` hai mục, cờ bật; 1 trên 15 dòng mang cờ |
| Kiểm sau (c): đo trên bản chép (`do-ban-chep.mjs`, 91 giây) | 04:52–05:00 | đạt hết, bảng dưới |
| Kiểm sau (a): `/ops/registry` máy thu, tài khoản ops thử | 04:52–05:00 | 200; 0 chuỗi «S16 <chữ>»; 6 trên 8 nút dự án mang thương hiệu hiện nguyên tên; tên đủ hai từ 0 lần |
| Gộp PR #499 | ~05:00 | `main` a60adccb8, CI 7/7 xanh |
| Kiểm sau (b): lượt cloud-sync đầu bằng mã mới | 05:34:13 | lượt `20261120051147-c84081`: 946.726 dòng · 22 bảng · bộ soát rò PASS · «che định danh nguồn: 2 tên, 0 số», bằng lượt trước |
| Xoá hai tệp tạm tầng A (bước 6) | ~05:35 | đã xoá, thư mục tạm rỗng |

Số thật cạnh số chạy thử (18/11):

| Phép đo trên bản chép | Thật 20/11 | Chạy thử 18/11 |
|---|---|---|
| Cờ bật: nút danh bạ bị che nhầm | 0 | 0 |
| Cờ bật: bí danh bị che nhầm | 0 | 0 |
| Cờ bật: dòng cloud bị che nhầm | 0 | 0 |
| Đối chứng cờ tắt: nút | 8 | 8 |
| Đối chứng cờ tắt: bí danh | 114.776 | 114.763 |
| Đối chứng cờ tắt: dòng cloud | 6.562 | 4.762 |

Hai số đối chứng cuối tăng theo dữ liệu; script tự kiểm «không dưới mốc». Cấy cụm hai từ, cụm có dấu phân tách và tên
miền đều bị bắt. S05 65/65. Tổng kiểm ba bảng không đổi. Bản chép đã xoá.

## Bài học vận hành

Áp trước khi các dãy nhận mã #499 làm mọi nhánh thiếu mã ấy đỏ ca tầng A trên bản chép DB mới (S16 nay là tên hai từ có
cờ), và ca E4b của `app/tests/tin-rao-doi-chieu.test.tsx` đỏ trên `main` (sửa ở #504). Từ nay: báo các dãy «lấy main
trước vòng chấm kế» TRƯỚC khi áp một thay đổi làm đổi dữ liệu mà test đọc.

## Cách lùi

Chỉ khi Mạnh bảo, theo mục lùi của `ap-may-thu/README.md`: `khoi-phuc-s16.sh` với tệp sao lưu trên, rồi `lui-cot.sql`
nếu cần gỡ cột.
