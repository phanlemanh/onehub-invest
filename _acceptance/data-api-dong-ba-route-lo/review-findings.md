## Trong hợp đồng

- **Test DRL đọc ba đường không lọc, nên trên DB thử chép từ dữ liệu thật thì không thấy dòng canh và đỏ giả**
  file: `data-api/test/dong-ba-route.test.ts:157`
  severity: medium
  AC: AC-1
  source: conventions
  detail: Executor `dapi_drl` trong _acceptance/config.yaml và probes/pha.mjs đều chạy test qua `db/db-thu.sh … --chay`. Lệnh này chép bản mẫu `oneinvest_suite_mau`, tức một pg_dump của DB chung `oneinvest`, kèm toàn bộ dữ liệu thật. Nó không dựng DB trống từ migration như `--chay-trong`. Thế mà test gọi các đường không lọc và trông vào việc dòng canh lọt vào trang đầu:
  - DRL-AC-1 và DRL-AC-2 (dòng 157, 179, 187) gọi `/v1/deals`. Route sắp theo `discount_pct DESC` và mặc định `LIMIT 30`, còn tin canh chỉ giảm 20%. Trên máy có `offer_price_rank` hay `sale_offers` thật (Mac mini), 30 dòng đầu sẽ là tin thật giảm 20–50%. Khi đó `data.find(offerId === ID.tinCanh)` ra undefined và test đỏ với «thiếu tin canh».
  - DRL-AC-5 (dòng 276) gọi `/v1/listings`, route sắp `ORDER BY l.name LIMIT 50`. Dòng «DRL có ảnh» đứng sau mọi tên bắt đầu bằng số, A, B, C… nên sẽ rơi ngoài 50 dòng đầu.
  Test xanh trên M5 vì DB thử ở đó thiếu dữ liệu nền: chính evidence-report.md dòng 196 và design.md dòng 43 có ghi điều này. Hồ sơ mở cửa cho lượt chấm chính thức chạy lại trên máy có dữ liệu thật (commit 16340596f «sau gộp main, vào lượt chấm chính thức»). Ở đó E1, E2, E5 đỏ, và ô «goc» của pha.mjs (E6) cũng đỏ theo. Trường hợp này trái với hướng repo vừa chốt ở HT9 (#545): ca cần cô lập khỏi dữ liệu thật thì chạy `--chay-trong` trên DB trống từ migration, ca dữ liệu thật tách riêng. Hướng sửa: lọc bằng `?area=vn-drl-thi-truong-phuong-1` hoặc `?market=vn-drl-thi-truong`, hoặc chuyển executor và pha.mjs sang `--chay-trong`.
  rationale: AC-1, AC-2 và AC-5 đòi tin canh có trong data của /v1/deals và /v1/listings trên DB thử; lượt chấm chính thức chạy trên máy có dữ liệu thật nên các ca này đỏ giả, làm chúng that bại.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **README công khai khẳng định API không bao giờ đọc hay trả dữ liệu S02, nhưng /v1/markets* vẫn làm việc đó**
  Người dùng thấy gì: Tài liệu công khai của API nói rằng API không bao giờ trả số liệu của nguồn hiệu chuẩn, nhưng các trang thị trường vẫn trả. Người dùng API có thể hiểu sai về dữ liệu họ nhận được.
  Căn cứ: Chỉ là câu chữ mô tả sai, không làm lộ thêm dữ liệu so với hiện tại, và sẽ hết khi hàng gỡ số này khỏi các trang thị trường hoàn tất.
  file: `data-api/README.md`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
