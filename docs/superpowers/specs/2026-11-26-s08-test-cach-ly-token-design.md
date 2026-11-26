# ZC19 s08-test-cach-ly-token — thiết kế

## Mục tiêu

Ca test của bộ thu S08 (`collector/src/test/s08-danh-muc.test.ts`) không đọc tệp token thật ở HOME, chạy xanh trên máy không
có tệp, và không để lại thư mục tạm.

## Hiện trạng

`collector/src/collectors/s08-danh-muc.ts:18` tính `TOKEN_FILE = process.env.S08_TOKEN_FILE ?? join(homedir(), ".oneinvest/s08-token.json")`
lúc nạp mô-đun. Import tĩnh bị kéo lên trước thân tệp test, nên đặt biến môi trường trong thân là quá muộn (lượt đầu của làn
thu, 78cf1d44d, sai vì thế).

## Cách làm (đã có trên nhánh làn thu @42b7e89af, gộp main thành b48cd2683)

- Đầu tệp test: `mkdtemp` một thư mục, ghi token GIẢ, đặt `S08_TOKEN_FILE` trỏ tới nó, RỒI mới import động mô-đun bộ thu
  (top-level await). Mọi ca trong tệp dùng bản nạp ấy.
- Dọn thư mục tạm trong `process.on("exit")`. Bản làn thu dọn bằng `rm` dạng promise: trong sự kiện «exit» Node không chạy
  tiếp việc bất đồng bộ, nên thư mục còn lại (đo 26/11: 1 thư mục `s08-test-*` mỗi lượt). Vòng này đổi sang `rmSync` — sửa
  tích hợp trong chính tệp test, không đụng mã sản xuất.
- Không đổi `s08-danh-muc.ts`: đọc token lười (lúc gọi) là lối khác, nhưng chạm mã bộ thu của làn thu, ngoài vùng hàng
  (`ranh_gioi` chỉ có tệp test).

## Đo

Probe `_acceptance/s08-test-cach-ly-token/probes/cach-ly.sh` chạy tệp test đã biên dịch với HOME và TMPDIR tạm: HOME rỗng,
HOME có tệp token quyền 000 (đọc là lỗi EACCES), và hai bản phá trên bản chép (bỏ dòng đặt biến; dọn bất đồng bộ) phải đỏ
đúng lý do. Bộ collector trọn chạy trên dist sạch trong cùng lệnh.

## Đặc tả UX

Không chạm UI (bỏ có tên trong sổ quyết định).
