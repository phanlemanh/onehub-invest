# ADR-0019: Hai máy — đẩy bản chép đã lọc từ máy thu sang máy mở rộng M5 qua cầu Thunderbolt, một chiều, theo lệnh

Ngày: 2026-11-25 · Trạng thái: **accepted** (Mạnh duyệt Cổng Phạm vi HT25 25/11 08:24Z, kế hoạch 08:28Z; lời «Cho máy làm trọn»)
· Liên quan: ADR-0007 (SPL, tầng A không rời máy), ADR-0015 (đường lệnh kéo một chiều), hàng HT18 `ban-chep-da-loc-cho-may-phat-trien`
(bản chép + bộ soát), hàng HT25 `day-ban-chep-sang-may-phat-trien` (`_acceptance/day-ban-chep-sang-may-phat-trien/`), vận hành:
`docs/ops/hai-may.md`, ROADMAP §3 mục 64.

## Bối cảnh

Từ 24/11 có hai máy: **máy thu** (Mac mini — collector, launchd, DB `oneinvest` thật, giữ tầng A, nơi DUY NHẤT gộp vào `main`) và
**M5 — máy mở rộng tính toán của Mac mini** (Mạnh chốt 25/11 tối: máy bàn ở nhà, chạy lâu dài, đặt để tăng hiệu quả và tốc độ tiến
trình; không phải máy xách tay). M5 nhận một hàng việc một giám sát, tự chấm S4 cho vùng Invest và API trên bản chép đã lọc, không
được giữ tầng A (luật 6) và không chạy bộ thu, gateway, `sync-cloud`. M5 cần dữ liệu thật. HT18 làm ra bản chép đã lọc (tệp dump +
`ke.json`) và bộ soát tầng A chạy trên chính DB đích ở máy thu. Mạnh không chép tay được («Tôi không tự làm được hãy phân tích và mô
hình để tự động hoá được») và hai máy nối nhau bằng cáp Thunderbolt («đều là mạng nội bộ … tôi ngồi ở 2 máy thôi»).

## Quyết định

Một lệnh trên máy thu, `node scripts/day-ban-chep.mjs`, làm trọn: chép + soát (HT18) → ghim sha256 → gửi qua cầu Thunderbolt bằng SSH
tới một bước nhận bị ép lệnh trên M5 (`scripts/nhan-ban-chep.sh`) → bước nhận soát lại và nạp nguyên tử có lùi. Năm rào (GS 25/11):

1. **Cổng rời máy ở máy thu.** Lệnh đẩy tự chạy chép + soát trong cùng lượt; chỉ gửi khi bộ soát HT18 xanh và sha256 tệp sắp gửi bằng
   sha256 ghi trong `ke.json` lúc soát. Tệp bị sửa một byte sau soát thì dừng trước khi mở kết nối. Soát ở M5 (`--kiem
   --khong-tu-dien`) là lớp hai.
2. **Một chiều.** Khoá đẩy riêng (ed25519, chỉ nằm ở máy thu) được thêm vào `authorized_keys` của M5 với
   `restrict,command="<đường tuyệt đối tới nhan-ban-chep.sh>"`: không shell, không chuyển cổng, không agent; mọi lệnh khách gửi bị ép
   về bước nhận, bước nhận chỉ nhận ba lệnh con đóng (`nhan <sha256>`, `lui`, `trang-thai`) và từ chối khi không đi qua `command=`.
   Lệnh đẩy chỉ nạp khoá đẩy (`-F /dev/null`, `IdentitiesOnly`, `IdentityAgent=none`) — không bao giờ xác thực bằng khoá quản trị.
   Tệp đi qua stdin của `nhan` (không scp, không sftp). M5 không có khoá nào vào máy thu; bước nhận không mở kết nối ra ngoài.
3. **Không từ điển, không `.env`, không raw snapshot.** Đúng hai tệp rời máy (dump, `ke.json`); thư mục gửi có tệp nào khác thì từ
   chối trước khi gửi, nêu tệp. Một dòng tầng A cấy vào nguồn của lượt làm lượt đỏ ở bộ soát trên máy thu — không có kết nối gửi.
4. **Lùi được.** Bước nhận nạp vào `<DB>_moi` bằng `docker exec pg_restore` (không qua cổng 5433 của M5), đếm từng bảng bằng `ke.json`,
   rồi mới đổi tên: bản cũ cất tạm, DB chạy thành `<DB>_cu`, DB mới thành DB chạy; giữ đúng một bản cũ. Lỗi ở bất kỳ chặng nào (sha,
   kiểm, nạp, đếm, xoá bản cũ, đổi tên bị từ chối vì còn kết nối, giữa hai lần đổi tên) thì DB chạy đúng tên còn nguyên, DB mới bị xoá,
   thông điệp nêu chặng. `lui` đổi bản cũ thành DB chạy. Bước nhận đọc vai máy (theo thư mục nhà ở passwd, không theo `$HOME`): trên
   máy thu chỉ được chạm DB `oneinvest_suite_*` của lượt test — không bao giờ DB `oneinvest` của máy thu (AC-12).
5. **Chỉ theo lệnh.** Không plist, không cron cho việc đẩy hay nhận. Chạy hằng đêm là hàng sau, cần lời riêng của Mạnh.

Đường truyền: chỉ cầu Thunderbolt (giao diện cầu, địa chỉ IPv4 cố định đặt 25/11). Lệnh đẩy kiểm địa chỉ đích nằm trên giao diện cầu
(`route get`) trước khi chép và trước khi gửi, buộc nguồn gói vào địa chỉ cầu của máy thu; cầu không thông thì dừng nêu «cầu
Thunderbolt», không rơi sang Wi-Fi hay LAN. Địa chỉ, người dùng, đường khoá, tên máy chỉ nằm ở cấu hình riêng máy
`~/.config/onehub/hai-may.env` và `CLAUDE.local.md` — không nằm trong kho công khai.

## Lối đã bỏ

| Lối | Vì sao bỏ |
|---|---|
| Mạnh chép tay tệp dump (ổ ngoài, AirDrop) | Mạnh nói không tự làm được; tay người không ghim được băm tệp đã soát |
| scp/rsync/sftp với khoá thường | Ghi được tệp bất kỳ vào M5; dưới `command=` chúng bị ép về bước nhận và bị từ chối — một cách truyền duy nhất (stdin của `nhan`) |
| Dùng khoá quản trị (toàn quyền) cho lượt đẩy | Phá rào một chiều; khoá quản trị chỉ cho cài, thu hồi khoá đẩy, dựng và kiểm M5 |
| Thu hồi khoá quản trị sau tuần đo hai máy (Hỏi-1, 25/11 sáng) | Mạnh chốt 25/11 tối: M5 là máy mở rộng chạy lâu dài, Mac mini giữ lâu dài một khoá quản trị vào M5 |
| M5 kéo từ máy thu | Cần khoá của M5 vào máy thu — trái rào 2 |
| Nạp qua cổng 5433 của M5 | Cổng chuyển tiếp của colima trên M5 không ổn định, không được tự khởi động lại colima |
| Ghi đè thẳng DB chạy (`pg_restore --clean`) | Gãy giữa chừng thì M5 mất DB; không lùi được |
| Thêm VPN hay mã hoá ngoài SSH | GS 25/11: cáp nội bộ hai máy, SSH đủ |
| Tự chạy định kỳ bằng plist | Ngoài phạm vi; cần lời riêng của Mạnh |
| Rơi sang mạng khác khi cầu đứt | Một đường duy nhất thì dễ kiểm, dễ thu hồi; rút cáp thì cắm lại rồi chạy lại |

## Hệ quả

- Lượt đẩy đầu từ DB máy thu thật và kiểm trang Invest, data-api trên M5 nằm trong lượt chấm (E10); máy thu chỉ đọc.
- Bước nhận gọi `scripts/ban-chep-da-loc.mjs --kiem` của kho trên M5: kho M5 phải ở `main` có HT18.
- Thu hồi khoá đẩy: `node scripts/day-ban-chep-kiem-m5.mjs go` gỡ đúng một dòng (sao lưu trước).
- Khoá: Mac mini giữ lâu dài một khoá quản trị vào M5 (dựng, kiểm, cài và thu hồi khoá đẩy — không bao giờ cho lượt đẩy); khoá đẩy
  riêng luôn ép lệnh chỉ chạy bước nhận; M5 không có khoá nào vào Mac mini (rào 2 không đổi).
- Giữ nguyên: tầng A và raw snapshot không sang M5; M5 không chạy bộ thu, gateway, `sync-cloud`; đẩy chỉ theo lệnh, plist là việc sau
  cần lời riêng của Mạnh.
