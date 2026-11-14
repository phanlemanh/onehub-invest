# s06-tran-trang — trần trang S06 210, dừng cả lượt khi bị chặn

Hồ sơ: `_acceptance/s06-tran-trang/` · hạng T2 · nhánh ZCode `zcode/s06-tran-trang` @ 2e475d20 (1411-19, 1411-20),
Claude đưa vào main bằng cherry-pick giữ tác giả.

## Thay đổi (ZCode)

- `pipeline/collect-chotot.mjs`: trần mặc định 25 → 210 trang mỗi nguồn tin (cờ `--pages` và biến
  `CHOTOT_MAX_PAGES` vẫn thắng). Lượt thử của ZCode (không nạp): 55.686 tin so với 16.189, khoảng 1.480 lời gọi,
  không 403/429.
- 403/429 → `fetchPage` ném ngay lỗi đánh dấu `dungLuot`, không thử lại; vòng thu ghi snapshot phần đã có của vùng
  đang chạy rồi thoát 3 (vùng xong trước đã ghi). Lỗi mạng/5xx giữ cách thử lại và bỏ feed cũ.
- `pipeline/scripts/collect-chotot-chan.test.mjs`: máy chủ giả trả 429 ở trang 2, khẳng định đúng 10 lời gọi, mã 3,
  hai snapshot; chặn DB theo danh sách cho phép `oneinvest_suite_*`.

Phần Claude: xếp tệp test vào nửa `a` của `pipeline/test-nua.json`; probe trần mặc định; khai executor; phép đo
nạp 55 nghìn tin trên DB thử (mục «Đo» của hợp đồng).

## Ranh giới làn

Logic thu là làn ZCode — không viết lại. Bật trần mới cho lượt đêm là bước triển khai của ZCode sau khi giám sát
xem số đo; plist/launchd không đổi ở hồ sơ này (nạp plist mới cần lời Mạnh).
