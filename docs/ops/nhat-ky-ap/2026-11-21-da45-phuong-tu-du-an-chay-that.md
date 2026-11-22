# Nhật ký áp — DA45 phuong-tu-du-an-chay-that (phường từ dự án cho tin S03), 21/11/2026

Hồ sơ: `_acceptance/phuong-tu-du-an-chay-that/` (PR #515, gộp vào `main` 3c529c0b4 lúc 05:53Z). Hồ sơ áp ở
`_acceptance/phuong-tu-du-an-chay-that/ap-may-thu/README.md`. Chữ ký Cổng Bằng chứng của Mạnh (21/11) phủ lượt ghi này. Giám sát áp
từ checkout chính, trên DB máy thu, trong khoảng 2026-11-21T05:54:28Z–05:56:10Z. Không có DDL và không ghi trực tiếp lên cloud.

## Năm thứ của hồ sơ, số thật

| Thứ | Số thật |
|---|---|
| Sao lưu trước | `~/onehub-backups/db/truoc-da45-phat-bieu-20261121T055411Z.csv` (0 dòng: luật chưa có phát biểu) · `truoc-da45-tin-s03-20261121T055411Z.csv` (8.559 bản ghi tin S03, gồm cả tin đã nghỉ) |
| Số chạy thử ngay trước áp (`--json`) | bài có dự án 87.110 · nhận phường 87.104 · dự án mâu thuẫn 0 · nút không phường 6 |
| Kiểm sau, trước áp (`kiem-sau.sql`) | có phường 83/8.144 · cửa sổ 13–19/11 21/1.665 · phát biểu sống 0 · tin nhãn `du-an` 0 |
| Lệnh áp `--ghi` | «đã ghi 87104 phát biểu, rút 0, phân xử lại 8239 tin», 102 giây (chạy thử trên bản chép: 109,2 giây) |
| Kiểm sau, sau áp | có phường **7.858/8.144 = 96,49 %** · cửa sổ 13–19/11 **1.585/1.665** · phát biểu sống 87.104 · tin nhãn `du-an` 8.141 |

**Ngưỡng AC-7** khi áp thật có ba điều kiện:

- luật có phát biểu sống: 87.104;
- có tin mang nhãn `du-an`: 8.141;
- tỉ lệ tin S03 có phường không thấp hơn tỉ lệ chạy thử trên bản chép trừ 2 điểm phần trăm. Bản chép 20/11 cho 96,4 %, nên ngưỡng là 94,4 %. Số thật đạt 96,49 %.

Kết luận: **đạt**. Cửa sổ 13–19/11 đi từ 21 lên 1.585 trên 1.665 tin, tức 95,2 %. Dự kiến ở hợp đồng là khoảng 1.201 trên 1.285; bản chép
cho 1.554 trên 1.659.

## (1) Vì sao «tin nhãn du-an» 8.141 lớn hơn «có phường» 7.858

Hai dòng đếm trên hai bảng khác nhau. Đây không phải lệch. Đo lúc 06:00Z 21/11 trên DB máy thu, chỉ đọc:

- `tin_nhan_du_an` đếm trên bảng `sale_offer_records`, gồm cả tin đã nghỉ:
  - 7.775 tin S03 đang sống, cột `area_id` cấp phường (`submarket`);
  - 366 tin S03 đã nghỉ (`retired_at` có giá trị), cũng cấp phường.
  - Không có bản ghi nhãn `du-an` nào ở cấp khác phường, hay ở nguồn khác S03.
- `co_phuong` đếm trên view `sale_offers`, view này loại tin đã nghỉ. Nên 7.858 = 7.775 tin nhãn `du-an` + 83 tin vốn đã có phường trước khi áp
  (khớp số 83 ở dòng «trước áp»).

Đối chiếu với bản sao lưu: trong 7.775 tin đang sống nhận phường, 7.436 tin trước áp có cột cấp tỉnh (`market`) và 339 tin trước áp trống cột.

## (2) Ô «Có phường» của S03 trên Ops

Ô này ở `/ops/data-flow`, đọc `data_flow_snapshot` do `pipeline/sql/600_data_flow.sql` tính trong bước `refresh-data-flow` của
`cloud-sync`. Hàng DF7 chưa làm, nên ô vẫn đếm mọi tin có `area_id` ở bất kỳ cấp nào, kể cả cấp tỉnh. Vì vậy ô chỉ tăng đúng số tin
trước áp trống cột, tức +339. 7.436 tin chuyển từ cấp tỉnh lên cấp phường không làm ô đổi.

| Cửa sổ | Snapshot 05:32:40Z (trước áp) | Snapshot 06:22:48Z (sau áp) |
|---|---|---|
| Toàn bộ | 7.602 / 8.134 | **7.955 / 8.149** |
| 30 ngày | 7.465 / 7.927 | 7.818 / 7.942 |
| 7 ngày | 1.754 / 2.031 | 1.927 / 2.046 |

- **Máy thu:** đọc trang `/ops/data-flow` trên `localhost:3456` lúc 06:30Z bằng tài khoản ops thử. Hàng S03 cho 1.927/2.046 ở cửa sổ mặc định
  7 ngày và 7.955/8.149 ở `?window=all`, đúng bằng snapshot.
- **Cloud:** lượt `cloud-sync` xong lúc khoảng 06:23Z. Ba bước `sync-cloud` (mã 0, 1.653 giây), `refresh-data-flow` (mã 0, 36 giây) và
  `push-ops-facts` (mã 0, 4 giây, «ops-facts pushed: 77 nhóm, 6 jobs, uptime 100%») đã mang snapshot trên lên cloud.
  Chưa xem trang `/ops` trên cloud: trang đòi đăng nhập tài khoản thật, phiên thợ không đăng nhập thay.
- `sync-cloud` lượt này chạy 1.653 giây, dài hơn bảy lượt trước (1.293–1.489 giây). Lý do khả dĩ là 8.239 tin S03 vừa phân xử lại nên đổi dòng
  cần đẩy; lượt này cũng bắt đầu khoảng 05:54Z, trùng lúc áp. Theo dõi lượt kế: về lại khoảng 1.300–1.500 giây thì thôi.

## (3) Hai lượt nạp 15′ đầu sau áp

Nguồn: `pipeline/logs/s03-nap-15phut.log`. Lượt nạp nhanh cuối cùng trước áp xong lúc 05:52Z, chưa có bước phường (mã mới vào main lúc 05:53Z).

| Lượt (nhanh) | transform-zalo | Bước `phuong-tu-du-an --ghi --noi-tiep` | Đầu ra của bước |
|---|---|---|---|
| Lượt 1 sau áp | mã 0, 156 giây | **mã 0, 3 giây** | bài có dự án 87.156 · nhận phường 87.150 · mâu thuẫn 0 · nút không phường 6 · đã ghi 46 phát biểu, rút 0, phân xử lại 21 tin |
| Lượt 2 sau áp (xong trước 06:22:32Z) | mã 0, 125 giây | **mã 0, 2 giây** | bài có dự án 87.267 · nhận phường 87.261 · mâu thuẫn 0 · nút không phường 6 · đã ghi 111 phát biểu, rút 0, phân xử lại 39 tin |

- Log không có dòng `JOB FAIL` và không có `BỎ LƯỢT` ở bước phường.
- Bước phường nằm đúng giữa `transform-zalo` và `transform-media`, như AC-1.
- Ngưỡng thời gian của AC-7 là lượt lặp xong trong 60 giây; hai lượt thật chạy 2–3 giây.

## (4) Kiểm sau một đêm (22/11)

Giám sát chạy `kiem-sau.sql` trên DB máy thu sáng 22/11, chỉ đọc. Dãy P3 đọc log để đối chiếu bước phường và `sync-cloud`.

| Dòng đếm | Lúc áp (21/11) | Sau một đêm (22/11) |
|---|---|---|
| Tin S03 có phường | 7.858 / 8.144 (96,49 %) | **7.986 / 8.295 (96,27 %)** |
| Cửa sổ 13–19/11 | 1.585 / 1.665 | 1.585 / 1.665 |
| Phát biểu sống | 87.104 | 90.257 |
| Tin nhãn `du-an` | 8.141 | 8.267 |

- Tỉ lệ có phường 96,27 %, vẫn trên ngưỡng AC-7 là 94,4 %. Cửa sổ 13–19/11 giữ nguyên, tức các lượt nạp sau không làm mất phường của tin cũ.
- **Lượt 00:00 đầy đủ đầu tiên** (`zalo-import.log`, chế độ `nhanh 0`):
  - bước `phuong-tu-du-an` mã 0, 2 giây, nằm giữa `transform-zalo` (mã 0, 91 giây) và `transform-media` (mã 0, 10 giây);
  - đầu ra: bài có dự án 89.998 · nhận phường 89.992 · dự án mâu thuẫn 0 · đã ghi 511 phát biểu, rút 0, phân xử lại 149 tin;
  - không có `JOB FAIL`, không có `BỎ LƯỢT` ở bước phường.
- **`sync-cloud`** (`cloud-sync.log`): bốn lượt gần nhất 1.142–1.298 giây, không dài hơn dải bảy lượt trước áp (1.293–1.489 giây). Lượt 1.653 giây
  lúc áp không lặp lại, nên mục theo dõi ở (2) đóng.

## Theo dõi

- Ngoài-2 (Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng): chuỗi tự tắt mà không báo gì khi một lượt rút sạch phát biểu. Hàng riêng, giám sát
  cắt sau.
- ~~Lượt 00:00 đầu tiên (22/11) chạy bước phường ở chế độ đầy đủ~~: đã chạy, mã 0, xem (4).
