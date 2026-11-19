# Bảng thử phá AC-2 (vòng 5, đo trên a720656d7, 19/11)

Mỗi dòng phá một chỗ của `scripts/suite-neu-doi.mjs` trong worktree tạm rồi chạy các ca `SSL-AC-2`.

| Mã | Phá gì | Kết quả | Ca đỏ |
|---|---|---|---|
| M0 | Không phá (đối chứng) | xanh | không có |
| M1 | Tín hiệu thoát ngay, bỏ đường ra chung | đỏ | ca chính (bị ngắt) |
| M2 | Đường ra không mang mã ngắt | đỏ | ca chính (bị ngắt) |
| M3 | Chỉ bỏ SIGTERM gửi cho nhóm tiến trình | **xanh, có lý do** | không có |
| M3b | Bỏ cả SIGTERM và SIGKILL gửi cho nhóm | đỏ | ca chính: «phải ngắt nhóm tiến trình», lệnh chờ 60,7 giây |
| M4 | createdb lỗi không ghi dòng | đỏ | createdb lỗi |
| M5 | Đọc sha sau khi chạy | đỏ | sha đọc trước khi chạy |
| M6 | Không từ chối cây bẩn | đỏ | cây bẩn |
| M7 | Cây bẩn không ghi dòng | đỏ | cây bẩn |
| M8 | Tính cả tệp trong `_acceptance/` là bẩn | đỏ | createdb lỗi, sha đọc trước khi chạy, tepBan |
| M9 | Không nối run-log | đỏ | createdb lỗi, cây bẩn, ca chính |

**Vì sao M3 xanh mà không phải đột biến sống sót.** Lời hứa của AC-2 là lệnh bị ngắt thì dừng được bước test, dọn DB và để lại dòng
`scripts-ci`. Bỏ riêng SIGTERM thì SIGKILL dự phòng vẫn ngắt nhóm sau 10 giây, nên cả ba điều ấy vẫn đúng; ca đo cho phép tối đa 20 giây.
M3b bỏ cả hai đường ngắt và làm ca đỏ, nên phép đo có phân biệt được.
