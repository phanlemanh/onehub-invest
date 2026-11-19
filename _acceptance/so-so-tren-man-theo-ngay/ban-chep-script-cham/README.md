# Bản chép script chấm của SM1

Tham số của lượt chấm khoảng 75 KB nên không truyền được trực tiếp. Hai lượt chạy bản chép của `feature-loop/2.37.0/workflows/acceptance-verify.js`, chỉ thêm đúng một dòng `args = <nội dung s4-args>` ngay trước khối đọc `args`.

| Lượt | Bản chép (gitignored) | sha256 đầu của bản kit | sha256 đầu của bản chép | Dòng khác |
|---|---|---|---|---|
| 1 | `.acceptance-runs/so-so-tren-man-theo-ngay/acceptance-verify-r1.js` | `b366af5c35a201fa` | `760d088dff64666e` | 1 |
| 2 | `.acceptance-runs/so-so-tren-man-theo-ngay/acceptance-verify-r2.js` | `b366af5c35a201fa` | `8c49b3038b98b567` | 1 |

`ban-chep-r1.diff.txt` và `ban-chep-r2.diff.txt` là kết quả `diff` với bản của kit, mỗi dòng cắt ở 160 ký tự.
