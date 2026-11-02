# Review findings: s08-noi-tiep (round 3)

Cây `a2e6ce3a`, merge-base `cfa59117`. Tệp này cố ý không chứa URL theo nghĩa đen: bộ dò `khong-lo-nguon` quét cả hồ sơ đã commit. Mọi phép thử dùng tên miền giả và chạy trên bản chép nguyên văn hai dòng bộ dò của HEAD, không sửa tệp nào.

## Trong hợp đồng

Không có finding chặn.

## Finding vòng trước, soát lại

- **F6 — HẾT.** Dòng đối chứng đã tách scheme khỏi dấu `//`, không còn bị bắt. E5 đếm 0 URL ngoài máy trong 2096 dòng thêm.
- **F7 — HẾT.** Bộ dò tách token rồi so nguyên chuỗi với URL DTD plist. Kết quả thử:

  | Dạng thử | Vòng 2 | HEAD |
  |---|---|---|
  | đúng URL DTD plist: trong DOCTYPE, đứng trần, hai lần trên một dòng | lọt | lọt (đúng) |
  | URL DTD nối đuôi: `/khac`, ký tự `x`, `?q=1`, `#m`, cổng, `.`+tên miền giả, `@`+tên miền giả, gạch chéo ngược+`@`, `%40`, dấu `)` | lọt | **bị bắt** |
  | URL khác cùng tên miền; đổi scheme sang bản bảo mật; đổi hoa thường scheme, host, đường dẫn, đuôi tệp | bị bắt | bị bắt |
  | URL khác cùng dòng, trước hoặc sau URL DTD; dính sau dấu phẩy, `<`, `>` | bị bắt | bị bắt |

  Đột biến phép miễn, đo trên năm đối chứng của bộ dò: `startsWith` đỏ 4/5, cả thư mục DTD đỏ 5/5, cả tên miền đỏ 5/5, bản `replaceAll` cũ đỏ 4/5. Đối chứng có răng. Phép miễn áp dụng ở mọi tệp chứ không riêng plist, nhưng chỉ cho đúng một URL, khớp quyết định `d-20261102T-dtd`.
- **F1, F2, F3 — HẾT** như vòng 2. Probe E4, E6 không đổi, baseline đo lại vẫn đỏ đúng chỗ.

## Ngoài hợp đồng

- **F9 (MỚI, trung bình, cần người xem) — bản sửa làm rộng bộ dò ở chỗ khác.** Bộ dò mới gom cả cụm không khoảng trắng thành một token rồi chỉ soát scheme và host ở đầu token. Vì vậy URL ngoài dính liền sau URL thuộc ngoại lệ có sẵn nay lọt, trong khi bộ dò vòng 2 quét từng lần xuất hiện nên bắt được:

  | Dạng thử (host thứ hai là tên miền giả) | Vòng 2 | HEAD |
  |---|---|---|
  | localhost có cổng, phẩy, URL thứ hai (kiểu danh sách CORS) | bị bắt | **lọt** |
  | 127.0.0.1 có cổng, phẩy, URL thứ hai | bị bắt | **lọt** |
  | testbase với tham số trỏ URL thứ hai | bị bắt | **lọt** |
  | host `.invalid`, gạch chéo, URL thứ hai | bị bắt | **lọt** |
  | localhost với tham số chuyển hướng trỏ URL thứ hai | bị bắt | **lọt** |

  Không dính phép miễn DTD: URL DTD dính URL khác vẫn bị bắt. Quét diff hiện tại: 0 token dính hai scheme, 0 dòng mà bộ vòng 2 bắt còn bộ mới lọt. Phần dò chuỗi nguồn thật vẫn chạy trên dòng gốc nên chuỗi có trong bộ mẫu vẫn bị bắt. Hướng sửa: tách token thêm tại mỗi lần xuất hiện scheme trước khi lọc, và thêm một ca đối chứng dạng này. Đổi bộ dò tầng A nên cần người quyết.

- **F8 (thấp, có từ trước, chưa sửa theo chỉ đạo điều phối) — các ngoại lệ khác của bộ dò rộng.** Vẫn lọt ở HEAD: localhost, testbase, hoặc nhãn `.invalid` dính thêm tên miền giả phía sau; URL IP công khai. Vòng này thử thêm ba dạng cũng lọt ở cả vòng 2 lẫn HEAD: userinfo không có dấu chấm trước `@` (có hoặc không có mật khẩu), host có gạch dưới, IPv6. Quét diff hiện tại: 7 URL, không URL nào thuộc các dạng này.
- **F10 (vận hành, làn merge cần biết) — bốn hồ sơ khác ghim commit cũ.** `chotot-thieu-moc`, `s05-khoa-nap`, `s06-region-tinh`, `s08-lich-tuan` đều có `verified_commit` là `3839846d`, và `scripts/s08-danh-muc/acceptance.mjs` đã đổi sau commit đó. Tệp này không nằm trong `t1_skip_globs`. Chạy thử `pre-merge-check.sh` trên clone tạm ở scratchpad: hồ sơ này và `s08-lich-tuan` hiện bị chặn trước hết vì mục Known limits có nội dung nên cần chữ ký người; sau khi điền thử chữ ký trong clone đó, `s08-lich-tuan` bị chặn tiếp vì bằng chứng cũ. Ba hồ sơ còn lại ghim cùng commit nhưng chưa đo riêng.
- **F4 (thấp) — CÒN.** `pipeline/scripts/import-s08-row.test.mjs:52` vẫn ghi «quyết chữ trong DATA-CONTRACT»; tài liệu không có câu nào về dấu phẩy. `'1,500'` vẫn ra 1.5.
- **F5 (thấp) — CÒN.** `'-5'`, `'1e3'`, `'.5'`, `'5.'` đều ra null. Code không đổi từ vòng 2.

## Đã soát, không phải finding

- **Code sản phẩm không đổi từ vòng 2**: `git diff 3839846d a2e6ce3a` ngoài `_acceptance/` chỉ có `acceptance.mjs`. Probe, evals, config của hồ sơ này cũng không đổi.
- **`thieu-env` và `nguon-duy-nhat`** vẫn PASS. Năm cấu hình thiếu đều ném với 0 lời gọi mạng.
- **Dò chuỗi nguồn thật**: 0 khớp trên 18858 mẫu, 2096 dòng thêm; tự kiểm cấy chuỗi vẫn bắt được.

## Sau vòng 3 (ghi của tác giả, không phải phiên chấm)

F9 đã sửa: bộ dò tách token tại mỗi lần xuất hiện scheme, thêm ba ca đối chứng URL ngoài dính sau URL được miễn. Kết quả đo lại nằm ở dòng repin của run-log.
