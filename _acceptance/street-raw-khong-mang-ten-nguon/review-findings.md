# Review findings: street-raw-khong-mang-ten-nguon (round 1)

## Trong hợp đồng

- **Trần 50 kiểm sau khi đã ghi: vượt trần vẫn NULL hàng loạt phường, quận của dòng mới, trái AC-5 «dừng, không rút, không ghi»**
  AC: AC-5
  file: `pipeline/transform-chotot.mjs:188`
  severity: medium
  source: conventions
  detail: Các dòng 133–134 đặt phuongRaw và districtRaw về NULL ngay trong vòng lặp. Câu `INSERT INTO sale_offer_records` (dòng 153) chạy cho từng tin trong cùng vòng đó, và main không bọc transaction (dòng ~220 ghi rõ «mỗi câu upsert tự commit»). Lời gọi `kiemTranTenNguon(Object.values(boTen)…)` chỉ chạy sau vòng lặp, ở dòng 188. Vậy khi sổ nguồn có token chung chung làm bộ dò trúng hàng loạt, đúng ca mà trần sinh ra để chặn, các dòng tin MỚI đã được commit với phuong_raw và district_raw bằng NULL trước khi job ném lỗi. Ca này không lùi lại tự nhiên được. Câu upsert không cập nhật district_raw khi trùng khoá, còn phuong_raw dùng COALESCE, nên sau khi sửa sổ, lượt sau không trả district_raw về. Trần thứ hai trong rutTenNguonS06 (dòng 196) cũng ném lỗi sau khi writeAssertions, rutDuongCoSo và retractRule đã commit. Thông điệp «không rút, không ghi» vì thế sai với trạng thái thật. Test SR-AC-5 chỉ thử hàm kiemTranTenNguon riêng lẻ, không thử vị trí gọi, nên không bắt được lỗi này. Cách sửa: đếm trước khi upsert (lượt đếm thuần trên `ads`) hoặc bọc lượt trong transaction khi kiểm trần.

- **Câu lọc ward_name_v3 trong phép đo bị bỏ kết quả, không có kiểm đếm phuong_raw độc lập**
  AC: AC-1
  file: `_acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.mjs:134`
  severity: low
  source: conventions
  detail: Câu `ads.filter((r) => trung(r.ward_name_v3, e));` bị bỏ kết quả. Nó chỉ cộng vào thời gian chiPhiLuat, không thành một mục trong `ky`. Kiểm phuong_raw vì thế được gán cứng là `phuong_raw 1`, không đếm độc lập trên stg như AC-1 yêu cầu («bằng đếm độc lập trên stg_chotot_ads»). Thêm vào đó, transform dò trên g.phuongRaw (ward_name_v3, rồi ward_name, rồi chữ), không dò trên ward_name_v3 thô, nên câu lọc này không phản ánh đúng chi phí của luật.

- **Trần 50 kiểm SAU vòng lặp đã upsert sale_offer_records không qua transaction: vượt trần vẫn ghi NULL quận vĩnh viễn cho tin mới**
  AC: AC-5
  file: `pipeline/transform-chotot.mjs:188`
  severity: medium
  source: bugs
  detail: Hợp đồng (AC-5) và thông điệp lỗi nói vượt trần thì «dừng, không rút, không ghi» để «không NULL hàng loạt lặng lẽ». Nhưng `kiemTranTenNguon(... 'giá trị chữ')` chỉ chạy ở dòng 188, sau vòng `for (const ad of ads)`. Vòng này đã chạy `INSERT INTO sale_offer_records ... ON CONFLICT` cho từng tin với `phuongRaw`/`districtRaw` đã thành NULL (dòng 133–134), và `main()` không bọc transaction (mỗi câu tự commit). Vì vậy, khi sổ nguồn có token chung chung làm trúng hàng loạt, mọi tin MỚI của lượt đã được ghi với phuong_raw/district_raw = NULL trước lúc job ném lỗi. `district_raw` không nằm trong danh sách `DO UPDATE SET`, nên sau khi sửa sổ, các lượt sau cũng không điền lại được: ô quận NULL vĩnh viễn. (phuong_raw thì COALESCE điền lại được.) Tương tự, trần thứ hai trong `rutTenNguonS06` (dòng 73) ném lỗi sau khi `writeAssertions`, `rutDuongCoSo` và `retractRule` đã commit, còn `resolveOffers` chưa chạy, nên câu «không ghi» cũng sai ở nhánh đó. Phép đo chỉ thử hàm trần bằng test đơn vị, không thử trên đường chạy thật, nên lỗi không lộ ra. Cách sửa: đếm và kiểm trần trước vòng upsert (lượt đọc trước trên `ads`), hoặc bọc lượt trong transaction.

- **Phép đo so dòng log bằng includes chuỗi con: số đếm sai vẫn ra xanh (vd 'phuong_raw 1' khớp cả 'phuong_raw 12')**
  AC: AC-1
  file: `_acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.mjs:140`
  severity: low
  source: bugs
  detail: Dòng log có dạng `bỏ ghi street_raw N · block_raw M · phuong_raw P · district_raw Q · rút K chủ thể`. Các kiểm tra `dongDem.includes(`${k} ${n}`)` (dòng 140) và `dongDem.includes("phuong_raw 1")` (dòng 141) là so chuỗi con không có ranh giới. Ví dụ đếm độc lập ra 2 mà log in `street_raw 20`, hoặc phuong_raw thật là 1x, thì ✔ vẫn bật. Nghĩa là AC-1 («dòng log bằng đếm độc lập») có thể cho xanh giả. Nên so khớp có ranh giới, ví dụ regex `(?:^|\s)street_raw ${n}(?:\s|$)`, hoặc tách log thành cặp khoá–số rồi so bằng.

- **Hình dạng 3 — Assert «chuỗi có mặt» (includes) cho lời hứa là QUAN HỆ BẰNG giữa số trong log và số đếm độc lập**
  AC: AC-1
  file: `_acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.mjs:140`
  severity: medium
  source: measurement
  detail: AC-1 hứa dòng log «ô chữ mang tên nguồn: bỏ ghi …» BẰNG số đếm độc lập trên stg. Dòng 140 lại kiểm bằng `dongDem.includes(`${k} ${n}`)`, còn dòng 141 dùng `dongDem.includes("phuong_raw 1")`. Log được dựng theo dạng `${c} ${n}` rồi nối bằng « · », nên đây chỉ là khớp tiền tố. Với số thật của lượt 4 (street_raw 2 · block_raw 2 · phuong_raw 1 · district_raw 1), log in «street_raw 23» hay «phuong_raw 14» vẫn qua `includes("street_raw 2")` và `includes("phuong_raw 1")`. Như vậy luật bỏ ghi thừa (trúng hàng loạt, đúng loại lỗi mà trần 50 nhắm tới) vẫn có thể ra ✔. Thêm nữa, phuong_raw không được đếm độc lập như hợp đồng ghi: dòng 134 `ads.filter((r) => trung(r.ward_name_v3, e));` tính xong rồi bỏ kết quả, còn kỳ vọng thì viết cứng là 1. Muốn đo đúng quan hệ thì phải tách số theo từng khoá (regex `\b${k} (\d+)\b`) rồi so bằng `===` với số đếm độc lập, kể cả phuong_raw.

- **Hình dạng 3 — Lời hứa «dựng sẵn biến thể không đổi kết quả» là quan hệ giữa bản có cache và bản dựng mới, nhưng assert so cache với chính cache**
  AC: AC-4
  file: `pipeline/tests/street-raw-ten-nguon.test.mjs:40`
  severity: medium
  source: measurement
  detail: AC-4 hứa «dựng sẵn biến thể theo mảng sổ không đổi kết quả của bộ dò», tức kết quả khi dùng WeakMap DA_DUNG phải bằng kết quả dựng lại từ đầu. Dòng 40 `assert.deepEqual(findSourceNames(v, SO), findSourceNames(v, SO))` gọi hai lần trên CÙNG mảng SO. Mảng này đã được cache từ test đầu (mangTenNguon(v, SO) gọi findSourceNames), nên cả hai vế cùng đọc một bản `{cands, cum}` trong cache. Assert là hằng đúng: nếu boDo dựng sai (ví dụ cands sắp sai thứ tự, hay cum lọc mất mục) thì hai vế vẫn bằng nhau. Không có vế đối chứng dựng mới, chẳng hạn `findSourceNames(v, [...SO])` hay kết quả mong đợi ghim cứng `[{code:'S90', start, end}]`.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Test mới pipeline/tests/street-raw-ten-nguon.test.mjs không nằm trong npm test, test:a/test:b hay executors của config, nên CI không bao giờ chạy**
  Người dùng thấy gì: Luật chặn tên nguồn thật lọt ra cổng công khai chỉ được kiểm khi có người chạy tay. Nếu sau này ai đó sửa nhầm, hệ thống tự động có thể không báo.
  Căn cứ: Hiện luật đang đúng và đã có phép đo tay, nên chưa mất dữ liệu; rủi ro chỉ xuất hiện khi có người sửa sau này và việc đăng ký test sau này rẻ.
  file: `pipeline/tests/street-raw-ten-nguon.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Phép đo ghi bản đột biến của transform vào thư mục mã nguồn pipeline/, tệp không bị gitignore**
  Người dùng thấy gì: Nếu phép đo bị giết giữa chừng, một bản mã đã tắt rào chặn tên nguồn có thể còn sót trong thư mục làm việc và bị commit nhầm.
  Căn cứ: Chỉ xảy ra khi phép đo chết giữa chừng và có người commit rộng tay; hậu quả nhỏ, phát hiện được ở bước xem thay đổi, tự xoá được.
  file: `_acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.mjs`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 4/8 lỗi rơi vào file không bộ đo nào phủ (_acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

