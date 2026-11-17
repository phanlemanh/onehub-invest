# Review findings: the-dia-chi-nhom-s03 (round 9)

## Trong hợp đồng

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): ma trận 16 ô chỉ so một phần kết cục, không phải deepEqual đủ năm ô như E2 hứa**
  AC: AC-2
  file: `pipeline/tests/the-dia-chi-nhom.test.mjs:56`
  severity: medium
  source: measurement
  detail: E2 trong evals.yaml ghi «mỗi ô so deepEqual {du_an, phuong, tinh, phan_khu, muc_dich}». Nhưng vòng lặp `for (const [k, v] of Object.entries(mong)) assert.deepEqual(g[k], v, …)` chỉ so những khoá được viết trong `mong`, và comment của MA_TRAN tự ghi «kết cục mong đợi (một phần)». Nhiều ô chỉ ghim một trường: «tên 2 bài» → {du_an:[]}, «tên 4/50 bài» → {du_an:[5]}, «bán 18/20» → {muc_dich}, «phân khu 2 bài» → {phan_khu:null}, «dưới 5 bài đọc» → {muc_dich:null}. Phường, tỉnh, phân khu, bán/thuê của các ô đó không bị so. Ví dụ hàm làm sai ô phường hay tỉnh khi chỉ có nhãn bán/thuê thì ca vẫn xanh. Số assert thật ít hơn 16×5 ô mà hồ sơ tuyên bố đã phủ.
  rationale: AC-2 đòi mỗi ô của ma trận 16 nhóm ra đúng giá trị viết trước, mà phép kiểm chỉ so một phần nên AC chưa được chứng minh đủ.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Route POST /api/v1/ops/group-cards thiếu chốt «chỉ máy thu» (VERCEL=1 → 503) như route nhãn; trên cloud trả 500 thay vì 404/503 như comment nói**
  Người dùng thấy gì: Nếu ai đó gọi chức năng ghi thẻ từ bản cloud thì nhận thông báo lỗi chung chung thay vì lời báo rõ là chỉ làm được ở máy thu. Không có dữ liệu nào bị hỏng.
  Căn cứ: Chỉ ảnh hưởng thông báo lỗi ở nơi thẻ vốn không dùng, không mất hay lộ dữ liệu, và bản cloud không có màn nào dẫn tới đây.
  file: `app/src/app/api/v1/ops/group-cards/route.ts`
  severity: medium
  Đề xuất: known-limits

- **Docstring quyetThe vẫn tả hàm là action `card-decide` của route source-groups**
  Người dùng thấy gì: Một dòng chú thích trong mã nói sai nơi hàm được gọi; người dùng không thấy gì khác đi.
  Căn cứ: Không ảnh hưởng hành vi nào của người dùng, chỉ có thể làm người đọc mã hiểu nhầm và sửa lúc nào cũng được.
  file: `app/src/lib/the-dia-chi-nhom.ts`
  severity: low
  Đề xuất: wont-fix

- **Cấu hình preview mới app-3460-tg1 trùng cổng 3460 với app-3460-pl35**
  Người dùng thấy gì: Hai cấu hình xem thử dùng chung một cổng nên không chạy cùng lúc được. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ vướng cho người phát triển khi mở hai bản xem thử một lúc, tự khắc phục bằng cách chạy lần lượt.
  file: `.claude/launch.json`
  severity: low
  Đề xuất: wont-fix

- **Cờ dirty của hộp Duyệt thẻ không được xoá sau khi lưu thành công, nên lần mở thẻ sau hỏi «Bỏ thay đổi chưa lưu?» dù chưa sửa gì**
  Người dùng thấy gì: Sau khi lưu một thẻ, mở thẻ khác rồi đóng hộp có thể hiện câu hỏi «Bỏ thay đổi chưa lưu?» dù chưa sửa gì. Người duyệt chỉ cần bấm xác nhận để đóng.
  Căn cứ: Chỉ làm phiền thêm một lần bấm, không mất hay sai dữ liệu, và người duyệt tự vượt qua được ngay.
  file: `app/src/components/ops/group-cards/group-cards-view.tsx`
  severity: low
  Đề xuất: known-limits

- **Route group-cards trả 500 «không ghi được thẻ» khi chưa có bảng thẻ, không phải 404 như ghi chú**
  Người dùng thấy gì: Trên DB chưa áp bảng thẻ, thao tác ghi thẻ báo lỗi máy chủ chung chung thay vì báo rõ là chưa có bảng thẻ. Không có thẻ nào bị ghi sai.
  Căn cứ: Chỉ xảy ra trên môi trường chưa áp bản cập nhật, thao tác bị từ chối an toàn nên không mất dữ liệu; chỉ thông báo kém rõ.
  file: `app/src/lib/the-dia-chi-nhom.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): «nhóm hai dòng sổ cùng khoá thật một thẻ» không có cách nào đỏ**
  Người dùng thấy gì: Chưa có phép thử chứng minh rằng nhóm có hai dòng trong sổ vẫn chỉ ra đúng một thẻ. Nếu có lỗi, người duyệt có thể thấy thẻ trùng cho một nhóm.
  Căn cứ: Là chỗ hở của phép thử chứ chưa thấy lỗi thật, nếu có thẻ trùng người duyệt bác được và không mất dữ liệu.
  file: `pipeline/tests/the-dia-chi-nhom.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): AC-9a grep chữ trong sao-luu.sh, không chạy để xem tệp sao lưu ra đâu và có khác rỗng không**
  Người dùng thấy gì: Phép thử chỉ đọc chữ trong kịch bản sao lưu chứ chưa chạy thật để thấy tệp sao lưu được tạo. Nếu kịch bản hỏng thì chỉ phát hiện khi áp thật.
  Căn cứ: Bước sao lưu sẽ được người áp chạy và nhìn thấy kết quả trước khi áp, nên lỗi sẽ lộ ra trước khi ảnh hưởng dữ liệu.
  file: `pipeline/tests/the-dia-chi-nhom-lui.itest.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/8 lỗi rơi vào file không bộ đo nào phủ (.claude/launch.json, app/src/components/ops/group-cards/group-cards-view.tsx) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
