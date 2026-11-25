# HT2 · zl-ac-3-doi-chung-dung-tren-main — ca đối chứng ZL-AC-3 đúng ở mọi thế cây

Ngày 2026-11-22 · dãy U1 · hạng T2 · hồ sơ `_acceptance/zl-ac-3-doi-chung-dung-tren-main/`

## Hỏng gì

`scripts/zalo-import-job-lan.test.mjs` ca ZL-AC-3 ghi bản test job Zalo cũ (12b8942) vào một worktree tạm. Worktree ấy
lấy HEAD của kho cộng một commit mô phỏng sửa phần nạp. Ca chạy bản cũ trong đó và đòi nó đỏ với «ZJ-AC-5 phần nạp của
tệp bọc đã đổi». Đó là bằng chứng bản cũ đỏ giả khi ZCode sửa phần nạp một cách hợp lệ.

Bản cũ chỉ khớp tệp bọc cùng thời với nó. Sau #519, tệp bọc HIỆN TẠI có rào «node thật»: bản cũ dựng HOME tạm không có
node, nên sáu ca ZJ thoát 1. Khối FAILED cũng đổi hình, nên `phanNap` của bản cũ không tìm thấy khối. ZJ-AC-5 cũ lại so
với `merge-base HEAD origin/main`. Kết quả phụ thuộc thế của cây:

| Thế | merge-base trong worktree tạm | Bản trước sửa |
|---|---|---|
| nhánh s03-tran (92d5aaed4, base 9a8c06a16) | trước #519 | xanh (bản cũ đỏ vì rào node VÀ vì phần nạp — ca chỉ đòi «có dòng ZJ-AC-5») |
| main e78ff0db9 / nhánh MH1 / mọi nhánh mới | e78ff0db9 | đỏ «bản cũ đỏ vì lý do khác» |

## Sửa

ZL-AC-3 dựng worktree tạm cắt TẠI 12b8942, không cắt tại HEAD. Ca thêm một commit mô phỏng sửa phần nạp, rồi chạy bản
test của chính commit ấy. Trong cây đó tệp bọc cùng thời với bản test, và `merge-base HEAD origin/main` luôn là 12b8942
(12b8942 nằm trên main). Cả hai nguyên nhân biến mất mà không cần node giả hay vá bản test cũ. Ca chứng lại đúng điều nó
từng chứng: bản cũ đỏ giả khi phần nạp đổi.

Siết thêm:
- bản cũ phải đỏ ĐÚNG một ca (`ℹ fail 1`) — đỏ vì lý do khác không còn lọt;
- ca đối chứng dương mới: cùng cây cũ, commit chỉ sửa phần SAU phần nạp → bản cũ xanh trọn, ZJ-AC-5 chạy. Cây không có
  commit nào thì ZJ-AC-5 cũ tự bỏ qua («nhánh đã nằm trên main»), nên đối chứng dương phải có commit.

Lối bị bỏ:
- Đặt node giả vào HOME tạm của bản cũ: vẫn vướng khối FAILED đổi hình. Phải vá `phanNap` của bản cũ, tức đổi chính bản
  đối chứng.
- Bỏ qua ca khi merge-base = HEAD: GS cấm bỏ qua lặng, và ca vẫn sai ở thế nhánh MH1.

## Đo ba thế

Probe `probes/ba-the.mjs` clone kho tại HEAD, đặt `origin/main` theo từng thế, rồi chạy ba bản của tệp test (bản sửa,
bản phá, bản trước sửa). Probe `probes/ci-the-main.sh` chạy đúng bước test của job `scripts` trong `ci-test.yml` ở thế
main (env -i, `CI=true`, HOME tạm, DB thử).

## Đặc tả UX

Bỏ — không chạm giao diện.
