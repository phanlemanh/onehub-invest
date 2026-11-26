# ZC21 s17-bo-thu-mo-rong — thiết kế

## Mục tiêu

Đưa bộ thu S17 (`collector/src/collectors/s17-thua-dinh-gia/**`, 21 tệp mã + 13 tệp test) từ nhánh làn thu vào kho chính với
các chốt an toàn đã có test và có chiều đỏ đo được. Vòng này KHÔNG viết lại logic thu: mã là của làn thu (ZCode, phiên S17),
LL soát ĐẠT @75de72613 (26/11).

## Bộ thu làm gì (tóm từ `main.ts` và tên ca test)

- Pha công khai (reference, tile-mask, images) đi bằng fetch của Node; pha cần phiên (projects, apartments, parcels, lowrise…)
  chạy TRONG trang của hồ sơ đăng nhập qua `ego-browser` — phiên không rời trình duyệt, không chép cookie, không in giá trị phiên.
- Mỗi lần chạy phải khai trần lời gọi và trần thời gian; nhịp kẹp 150–400 ms; tối đa 8 luồng lời API, 16 kết nối ảnh.
- Bị chặn (403, trang thử thách) → dừng cả lượt; bị chặn một lần → lần sau chỉ một luồng nhịp cũ; hai lần → dừng hẳn chờ người.
- Đọc số dư tài khoản trước và sau lượt; số dư giảm → dừng «balance-spent»; không đọc được → dừng trước khi chạy.
- Khoá chung: một lúc chỉ một pha cần phiên.
- Ảnh: chặn địa chỉ nội bộ (cả qua DNS và chuyển hướng), trần cỡ, lỗi cấp máy chủ ở lượt nguồn là lỗi tạm.
- Snapshot raw mang sha256 trong manifest; trạng thái tiến độ chỉ ghi khi lô đã chốt xuống đĩa; tệp DUNG dừng sạch.
- Tên thật, tên miền của nguồn chỉ ở cấu hình local (tầng A).

## Đo

- Một lệnh: dựng dist (kiểm kiểu), chạy 13 tệp test S17 với HOME + TMPDIR tạm, kiểm mã collector ngoài thư mục S17 không đổi.
- Probe `probes/dot-bien.sh`: năm đột biến trên bản chép dist (bỏ khoá phiên, lỗi máy chủ thành vĩnh viễn, bỏ chặn địa chỉ nội
  bộ, bỏ dừng khi số dư giảm, bỏ bắt buộc trần lời) — mỗi đột biến phải làm đỏ đúng ca ghim.
- Tầng A: probe có sẵn `_acceptance/so-nguon-kho-khai-bao/probes/tang-a.mjs` quét tệp nhánh đổi bằng tên thật S17 từ sổ máy thu.
- Bộ test collector trọn không nằm trong lệnh chấm: ca S08 đọc token ở HOME còn đỏ tới khi ZC19 gộp; CI chạy bộ trọn trên PR.

## Đặc tả UX

Không chạm UI (bỏ có tên trong sổ quyết định).
