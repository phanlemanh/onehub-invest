# Review findings: s05-khoa-nap (round 2)

Phạm vi soát: `git diff origin/main...HEAD` trên script job S05, job nạp S03, bộ thu S05, plist S05, `scripts/s05-khoa-nap.test.mjs` và các test hồi quy của AC-6, trên HEAD `3839846d`. Phiên chấm không sửa mã hay test. Tên job S05 được che thành `<job-S05>`, `<thu-S05>`.

## Soát lại finding vòng 1

| Finding | Trạng thái trên HEAD | Cách xác nhận |
|---|---|---|
| F1 | còn | tái hiện trên khối khoá thật |
| F2 | còn trong test; cây thật đúng AC-5 | đọc test + chạy script trên bản chép |
| F3 | **hết** | `s05k_hoiquy` trong config đã bỏ đường không tồn tại |
| F4 | còn; hai khối đang giống hệt | `diff` 23 dòng rỗng |
| F5 | còn | đọc test |
| N1 | còn | đo hai ca trên khối khoá thật |

## Trong hợp đồng

- **F1 (thấp, không chặn, còn) — `luc` toàn chữ số có số 0 đầu vẫn văng vòng chờ.** Điều kiện `^[0-9]+$` cho `09` đi qua, rồi `$(( $(date +%s) - luc ))` báo `value too great for base`. Lỗi mở rộng này bỏ cả vòng `until`, và script đi tiếp như đã có khoá. Tái hiện trên HEAD với chủ khoá là tiến trình đang sống: có dòng lỗi trên, không có dòng chờ, PID trong tệp khoá bị ghi đè. Tức hai job cùng ở trong khoá, đúng loại lỗi mà hồ sơ này muốn khép. Có ở cả hai script vì khối giống hệt. Không chặn vì AC-2 nói «không phải số», E2 đạt `expected`, `date +%s` không sinh giá trị này, và S05 đang paused. Tuy nhiên job nạp S03 đang chạy dùng cùng khối. Gợi ý cho bên làm: dùng `$(( now - 10#$luc ))`.
- **F2 (thấp, không chặn, còn) — ca (5) không đo vế «trả khác 0 ở cuối lượt» của AC-5.** Ca này grep nguồn script và chạy `job_step` với lệnh giả. `job-exit` chỉ có ca hỏng ở hai bước sau, không có ca bước thu hỏng. Phiên chấm chạy script thật (bản chép) với bước thu giả thoát mã 7: có dòng ghim, các bước sau vẫn chạy, script thoát mã 7. Cây thật đúng AC-5, nhưng ca (5) không giữ vế này.
- **F4 (thấp, không chặn, còn) — hai bản khối khoá không có gì giữ khỏi lệch.** Hợp đồng nói khoá dùng chung với job nạp S03, nhưng test chỉ rút khối từ script S05. `diff` trên HEAD: giống hệt.
- **F5 (rất thấp, còn) — lỗi vặt trong test.** `.khoa-test-${Date.now}.bash` thiếu `()`, nên tên tệp chứa mã nguồn hàm; vô hại vì chạy trong thư mục tạm. Tên ca trong `pipeline/scripts/s05-b-lich.test.mjs` còn ghi «plist pin '4 days'».

## Ngoài hợp đồng

- **Khoá nạp ghi hỏng tới mức thiếu cả mã tiến trình hoặc mốc giờ thì không tự gỡ**
  Người dùng thấy gì: Lượt nạp S05 và S03 bị kẹt tới khi có người gỡ khoá bằng tay; dữ liệu đến chậm, không mất.
  Căn cứ: Chỉ xảy ra khi tệp khoá hỏng, và người vận hành gỡ được; nên khép bằng một việc riêng vì khoá này dùng chung.
  file: `scripts/zalo-import-daily.sh`
  severity: medium
  Đề xuất: new-contract

## Ghi chép gốc của phiên chấm (mục ngoài hợp đồng)

Bản chép đúng khuôn thẻ do tác giả viết lại ở mục «Ngoài hợp đồng» trên.

- **N1 (còn) — khoá thiếu `pid` và `luc`, hoặc PID sống mà thiếu `luc`, không bao giờ được gỡ.** Đo lại trên HEAD: cả hai ca dừng ở trần, khoá giữ nguyên, cho tới khi gỡ tay. Khoá dùng chung nên job nạp S03 cũng kẹt. Không thuộc năm điểm của lời giao; cần một việc riêng nếu muốn khép.

## Đã soát, không phải finding

- **F3 vòng 1 đã khép:** lệnh hồi quy trên HEAD chỉ nêu ba tệp có thật; E6 vẫn chạy đủ 77 ca.
- **AC-1:** plist và hằng số mặc định đều `5 days`.
- **AC-2, nhánh PID sống + `luc` rác:** gỡ khoá của tiến trình còn sống. Đây là cách AC-2 viết («gỡ như khoá cũ») và ca (2b) ghim lại, không phải lỗi; người ký nên biết đây là đánh đổi có chủ ý.
- **AC-4:** chỉ `return 0` khi thư mục khoá thật sự hết, nhánh còn lại tính vào trần và có `sleep 5`.
- **Nạp `job-step.sh` hai lần:** dùng `JOB_RC=${JOB_RC:-0}`, không mất mã đã giữ.
- **Thoát sớm vì nạp lỗi hoặc khoá bận:** script thoát mã 1 thay cho mã bước thu đã giữ. Vẫn khác 0 nên AC-5 đúng; mã cụ thể của bước thu chỉ còn ở dòng ghim. Kết luận từ đọc mã, chưa đo.
