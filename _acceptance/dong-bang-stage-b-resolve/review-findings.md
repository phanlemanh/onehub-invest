# Review findings: dong-bang-stage-b-resolve (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E7 so cây với merge-base origin/main: sau khi gộp, job scripts của CI đỏ trên main và chặn mọi PR có migration hay câu ghi**
  Người dùng thấy gì: Sau khi tính năng này vào bản chính, một bước kiểm tự động sẽ báo đỏ và có thể chặn những thay đổi hợp lệ về sau của đội, làm chậm việc phát hành.
  Căn cứ: Không ảnh hưởng người dùng cuối nhưng chặn công việc của đội ngay sau khi gộp; sửa sớm thì rẻ, để lâu thì mỗi thay đổi sau đều vướng.
  file: `scripts/dong-bang-khong-ghi.test.mjs`
  severity: high
  Đề xuất: new-contract

- **Hằng STAGE_B_DONG_BANG chen giữa chú thích và hằng KHONG_CAP_THI_TRUONG**
  Người dùng thấy gì: Không có ảnh hưởng gì tới người dùng; chỉ khiến người đọc mã dễ hiểu nhầm một chú thích.
  Căn cứ: Hậu quả gần như bằng không với người dùng và không mất dữ liệu; chi phí sửa nhỏ nhưng lợi ích cũng nhỏ.
  file: `pipeline/resolve-properties.mjs`
  severity: low
  Đề xuất: wont-fix

- **DBS-AC-7 (dong-bang-khong-ghi.test.mjs) dùng merge-base động với origin/main: sau khi gộp sẽ đỏ mãi trên main và trên mọi PR về sau**
  Người dùng thấy gì: Sau khi gộp, bước kiểm tự động sẽ đỏ liên tục và có thể chặn những thay đổi hợp lệ về sau của đội.
  Căn cứ: Không chạm người dùng cuối nhưng làm tắc quy trình phát hành của đội; nên sửa ngay sau vòng này vì để lâu càng nhiều thay đổi bị vướng.
  file: `scripts/dong-bang-khong-ghi.test.mjs`
  severity: high
  Đề xuất: new-contract

- **Hình dạng 4 (âm tính một mình): RK-AC-8 «CLI đóng băng không gieo thẻ» đúng sẵn cả trên bản chưa đóng băng**
  Người dùng thấy gì: Một phép kiểm tự động có thể không bắt được lỗi nếu sau này công cụ chấm tự gieo lại thẻ Ghép căn; người dùng có thể lại thấy thẻ chờ không mong muốn.
  Căn cứ: Hành vi hiện tại vẫn đúng và người dùng tự bỏ qua được thẻ thừa; chỉ là lưới an toàn mỏng, sửa sau rẻ.
  file: `agent/tests/judge-run.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay): chiều đỏ RK-AC-8 dùng chuỗi đầu ra cũ chép tay thay vì chạy bản cũ**
  Người dùng thấy gì: Phép kiểm dùng mẫu đầu ra viết sẵn nên chưa chắc bắt được lỗi thật; không ảnh hưởng gì tới người dùng hiện nay.
  Căn cứ: Không đổi hành vi người dùng thấy và không mất dữ liệu; chỉ làm kiểm tự động kém chắc, sửa sau không đắt.
  file: `agent/tests/judge-run.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): DBS-AC-5 đếm 0 câu qua spy, nhưng chưa từng cho thấy spy cùng loadPendingUnitMatches bắt được câu nào**
  Người dùng thấy gì: Nếu sau này mã vô tình truy vấn lại thẻ chờ ghép, kiểm tự động có thể không báo, và căn giá tốt có thể lại hiện nhãn đang chờ ghép.
  Căn cứ: Hiện hành vi đúng; rủi ro chỉ xuất hiện khi mã đổi, nhãn sai thì tự hết khi sửa, nên chấp nhận và ghi lại.
  file: `app/tests/review-dong-bang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): SL1-AC-3 «tin cấp thị trường không thành cặp» mất đối chứng dương**
  Người dùng thấy gì: Một phép kiểm về tin cấp thị trường không còn chứng minh được nhiều, nhưng không đổi gì cho người dùng vì việc dựng cặp đã dừng.
  Căn cứ: Đã được hợp đồng thừa nhận và tính năng dựng cặp đã tắt nên không có hậu quả thực; sửa tốn công mà không thêm giá trị.
  file: `pipeline/scripts/s03-len-cong.itest.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 5 (quét lớp thiếu ma trận viết trước): DBS-AC-6 chỉ ghim số câu ≥10, phần miễn tự động phân loại lúc chạy**
  Người dùng thấy gì: Sau này một truy vấn mới đếm thẻ chờ có thể lọt qua kiểm tự động, khiến thẻ Ghép căn đóng băng lại hiện hoặc bị đếm ở một màn hình.
  Căn cứ: Hiện chưa có vi phạm, hậu quả nếu xảy ra chỉ là con số hoặc thẻ thừa tự hết khi sửa; ghi lại giới hạn là đủ.
  file: `scripts/ops-local-dong-bang.test.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/8 lỗi rơi vào file không bộ đo nào phủ (agent/tests/judge-run.test.ts) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

