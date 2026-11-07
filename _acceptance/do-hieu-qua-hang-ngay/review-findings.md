# Review findings: do-hieu-qua-hang-ngay (round 4)

Review incomplete: không (mọi finder đều chạy xong).

## Trong hợp đồng

- **Chặn rò vẫn báo giả: tên người đăng «Hiếu»/«Danh» trúng khoá cố định «khong-tin-hieu»/«chua-co-danh-ba» có trong MỌI lát, làm dừng cả lượt đo**
  file: `pipeline/lib/do-hang-ngay.mjs:384` · severity: high · source: bugs · AC: AC-3
  detail: Vòng này thêm trungCam để chặn rò không báo giả: chỉ bỏ qua mã khu vực `vn-…` và khoá cách đọc (LA_MA), còn tên người đăng thì so theo từ trọn (theoTu, coi `-` là ranh giới từ). Nhưng phanRa (dòng 360, `Object.assign(o, chua)`) luôn ghi hai khoá cố định `khong-tin-hieu` và `chua-co-danh-ba` vào `o` của mọi lát (thi_truong, phuong, du_an, toa của do1-giu-nhap, do1-bo-sot, do1-tin-hieu, do1-chuyen-bac), kể cả khi giá trị là 0. Hai khoá này không khớp LA_MA, nên theoTu dò thấy `hieu`/`danh` là từ trọn đứng sau dấu `-`. Đã chạy thử: `chanLo({lat:{phuong:phanRa(...)}}, [{nhan:'NGUOI DANG', chuoi:'Hiếu'}])` ném `LO NGUOI DANG`, với 'Danh' cũng vậy; 'Hưng' thì qua. chuoiCam lấy sender_name (từ 4 ký tự trở lên) của các thẻ mẫu, cộng seller_name của MỌI tin có silver_label trong ngày (tinSl), nên chỉ cần một người đăng để tên hiển thị một chữ «Hiếu» hoặc «Danh» (tên Việt phổ biến) là doHangNgay dừng và không ghi bốn nhóm số do1-* của ngày đó. Đây đúng là loại báo rò giả mà commit S4-r3 định sửa. Mấy khoá enum/hằng khác trong detail (`khac`, `lap-moc`, `chua-so-cap`, `chua-co-the-soat`, `theo-chu-bai`…) cũng chịu rủi ro tương tự. Cách sửa: thêm các khoá cố định do code sinh ra vào LA_MA (hoặc chỉ cho chuỗi cấm không phải TEN NGUON so trên khoá/giá trị không thuộc từ vựng cố định), và thêm một ca kiểm với người đăng tên «Hiếu».

## Ngoài hợp đồng

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: phần gộp ô cấm vào «khac» trong bộ ghi doHangNgay không có ca nào đo, công tắc 'bo-gop-o-cam' không test nào dùng**
  file: `pipeline/scripts/do-hang-ngay.test.mjs:535` · severity: medium · source: measurement
  detail: Commit S4-r3 hứa «ô lát theo chữ bài trùng chuỗi cấm gộp vào khac TRƯỚC KHI SOÁT» trong bộ ghi (pipeline/do-hang-ngay.mjs:218 `if (dotBien !== "bo-gop-o-cam") for (const r of ra) gopOCam(r.detail, cam);`). Ca duy nhất đo điều này (test.mjs:535-538) gọi thẳng `gopOCam` trên một detail viết tay `{ lat: { du_an_theo_chu: { o: { "theo-chu-bai:hung yen park": 2, ... }, tong: 6 } } }`. Fixture này chép đúng khuôn mà gopOCam đọc (`lat.<chiều>.o`, khoá đã gập sẵn thành ASCII thường). Nó không được dựng từ bộ ghi thật: KHOA_LAT_THE.du_an_theo_chu sinh `theo-chu-bai:${v}` với v là giá trị project thô, còn dấu và chữ hoa, rồi đi qua phanRa → gopOCam → chanLo. Ca chạy qua bộ ghi (test.mjs:709-723) chỉ đặt sender_name trùng một đoạn mã phường, nên chỉ đo phần LA_MA. Không thẻ nào có ô project trùng tên người đăng. grep cho thấy dotBien 'bo-gop-o-cam' có trong code nhưng không test nào truyền vào. Hệ quả: xoá dòng 218, hoặc gọi gopOCam sau chanLo, thì không ca nào đỏ. Lời hứa «cả ngày đo không mất vì một tên khu đô thị trùng tên người đăng» vì thế chưa được đo trên đường ghi thật. Thiếu một ca qua bộ ghi: gắn nhãn project của một thẻ trùng sender_name, có dấu và chữ hoa. Ca đó phải ghi được (tổng ô giữ nguyên, ô đã sang khac). Chạy lại với dotBien 'bo-gop-o-cam' thì phải ra /LO NGUOI DANG/.
  đề xuất: known-limits

