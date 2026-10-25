## Trong hợp đồng

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): ZJ-AC-6 kiểm PATH trên object env do chính test dựng, bỏ qua PATH mà node giả thực sự thấy**
  file: `scripts/zalo-import-job.test.mjs:182`
  severity: medium
  AC: AC-6
  source: measurement
  detail: Trong ZJ-AC-6, `assert.match(r.env.PATH, /\/\.shim-bin:\/usr\/bin:\/bin$/)` đọc `r.env`, tức object `env` mà hàm `chay()` tự dựng rồi trả về nguyên vẹn (`env` ở dòng ~71, trả ra ở dòng ~89). Vì vậy assert này luôn đúng, kể cả khi tệp bọc đổi PATH theo bất kỳ cách nào. Đầu ra thật có ghi lại: node giả ghi `"$PATH|$HOME|$DATABASE_URL"` vào tệp ENVS, nhưng vòng lặp `const [, home, db] = e.split("|")` bỏ đi trường PATH quan sát được. Chỉ HOME và DATABASE_URL được so với giá trị thật. Thực tế PATH lúc chạy khác giá trị được tuyên bố, vì tệp bọc chèn `$HOME/.local/node-v24.21.0/bin:` lên đầu. Trong khi đó E6 ở evals.yaml hứa «env của lần chạy có PATH = '<cây>/.shim-bin:/usr/bin:/bin'». Nghĩa là rào PATH của AC-6 chỉ đo cái test đưa vào, không đo cái tệp bọc thật sự truyền cho tiến trình con. Tương tự, `r.env.HOME.startsWith(SCRATCH)` cũng là kiểm trên input. HOME thì vẫn được đối chiếu với giá trị quan sát qua `assert.equal(home, r.env.HOME)`, còn PATH thì không có đối chiếu nào.
  rationale: AC-6 đòi PATH của phép đo chỉ gồm node giả và /usr/bin:/bin, nhưng ca kiểm chỉ đọc lại giá trị test tự dựng nên không chứng minh được điều AC-6 tuyên bố, trong khi PATH thật mà node giả thấy có thêm thư mục node do tệp bọc chèn vào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Dòng bảng runtime-map ghi sai hành vi zalo-import khi bước nạp (DB) hỏng: mã thoát luôn là 1 và không có dòng JOB FAIL**
  Người dùng thấy gì: Đêm DB sập, người trực đọc tài liệu vận hành rồi tìm chữ báo lỗi trong nhật ký sẽ không thấy gì, dù job vẫn báo đỏ. Họ có thể tưởng job không lỗi và mất thời gian tìm nguyên nhân.
  Căn cứ: Hậu quả nhẹ: không mất hay lộ dữ liệu, job vẫn báo đỏ đúng, chỉ là chỉ dẫn tìm nguyên nhân thiếu một nhánh; sửa câu chữ tài liệu sau này rất rẻ.
  file: `docs/ops/runtime-map.md`
  severity: low
  Đề xuất: known-limits

- **Đoạn runtime-map vừa sửa vẫn ghi P1.5 của zalo-import-daily.sh nằm trên nhánh zcode, trong khi bản vá đã vào main**
  Người dùng thấy gì: Tài liệu vận hành còn nói một bản vá chưa vào bản chính trong khi nó đã vào rồi. Người đọc có thể hiểu sai là job đêm vẫn còn nuốt lỗi ở đoạn nạp.
  Căn cứ: Chỉ là ghi chú lỗi thời, không ảnh hưởng chạy thật và không mất dữ liệu; sửa lại câu chữ lúc nào cũng được, chi phí rất thấp.
  file: `docs/ops/runtime-map.md`
  severity: low
  Đề xuất: known-limits

- **Chú thích trong job-exit.test.mjs vẫn xếp zalo-import vào nhóm job không có bước DB làn Claude**
  Người dùng thấy gì: Một dòng chú thích trong bộ kiểm cũ còn nói job nạp Zalo chưa có bước thuộc làn Claude. Người bảo trì sau có thể tưởng job này chưa được kiểm, nhưng người dùng cuối không bị ảnh hưởng gì.
  Căn cứ: Không có tác động nào tới người dùng hay dữ liệu, chỉ là chú thích gây hiểu nhầm nhẹ cho người bảo trì; không đáng mở việc riêng.
  file: `scripts/job-exit.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **ZJ-AC-5 thành rào làn vĩnh viễn trong bộ scripts/*.test.mjs, sẽ đỏ khi ZCode sửa hợp lệ đoạn nạp của chính làn mình**
  Người dùng thấy gì: Sau khi gộp, nếu ZCode sửa hợp lệ phần nạp Zalo của làn mình thì bộ kiểm script chung báo đỏ dù không có lỗi thật. Việc kiểm tra và gộp các thay đổi sau đó có thể bị chặn oan.
  Căn cứ: Không ảnh hưởng người dùng cuối nhưng sẽ gây báo đỏ giả lặp lại và cản việc gộp của làn khác; người vận hành tự gỡ được nhưng tốn công mỗi lần, và sửa sớm thì rẻ hơn khi nhiều nhánh đã dính.
  file: `scripts/zalo-import-job.test.mjs`
  severity: medium
  Đề xuất: new-contract

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
