# Review findings: transform-zalo-boc-job-run (round 2)

## Trong hợp đồng

Không có finding mới ở round này. Finding AC-6 của round 1 (ZJ-AC-6 đo PATH trên object env do test dựng) đã được sửa ở commit 2d47dff.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

Không có mục mới ở round này (4 mục từ round trước được carried, không chấm lại).

- **Dòng bảng runtime-map ghi sai hành vi zalo-import khi bước nạp (DB) hỏng: mã thoát luôn là 1 và không có dòng JOB FAIL (r1)**
  Người dùng thấy gì: Đêm DB sập, người trực đọc tài liệu vận hành rồi tìm chữ báo lỗi trong nhật ký sẽ không thấy gì, dù job vẫn báo đỏ. Họ có thể tưởng job không lỗi và mất thời gian tìm nguyên nhân.
  Căn cứ: Hậu quả nhẹ: không mất hay lộ dữ liệu, job vẫn báo đỏ đúng, chỉ là chỉ dẫn tìm nguyên nhân thiếu một nhánh; sửa câu chữ tài liệu sau này rất rẻ.
  file: `docs/ops/runtime-map.md`
  severity: low
  Đề xuất: known-limits

- **Đoạn runtime-map vừa sửa vẫn ghi P1.5 của zalo-import-daily.sh nằm trên nhánh zcode, trong khi bản vá đã vào main (r1)**
  Người dùng thấy gì: Tài liệu vận hành còn nói một bản vá chưa vào bản chính trong khi nó đã vào rồi. Người đọc có thể hiểu sai là job đêm vẫn còn nuốt lỗi ở đoạn nạp.
  Căn cứ: Chỉ là ghi chú lỗi thời, không ảnh hưởng chạy thật và không mất dữ liệu; sửa lại câu chữ lúc nào cũng được, chi phí rất thấp.
  file: `docs/ops/runtime-map.md`
  severity: low
  Đề xuất: known-limits

- **Chú thích trong job-exit.test.mjs vẫn xếp zalo-import vào nhóm job không có bước DB làn Claude (r1)**
  Người dùng thấy gì: Một dòng chú thích trong bộ kiểm cũ còn nói job nạp Zalo chưa có bước thuộc làn Claude. Người bảo trì sau có thể tưởng job này chưa được kiểm, nhưng người dùng cuối không bị ảnh hưởng gì.
  Căn cứ: Không có tác động nào tới người dùng hay dữ liệu, chỉ là chú thích gây hiểu nhầm nhẹ cho người bảo trì; không đáng mở việc riêng.
  file: `scripts/job-exit.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **ZJ-AC-5 thành rào làn vĩnh viễn trong bộ scripts/*.test.mjs, sẽ đỏ khi ZCode sửa hợp lệ đoạn nạp của chính làn mình (r1 · tệp đã đổi)**
  Người dùng thấy gì: Sau khi gộp, nếu ZCode sửa hợp lệ phần nạp Zalo của làn mình thì bộ kiểm script chung báo đỏ dù không có lỗi thật. Việc kiểm tra và gộp các thay đổi sau đó có thể bị chặn oan.
  Căn cứ: Không ảnh hưởng người dùng cuối nhưng sẽ gây báo đỏ giả lặp lại và cản việc gộp của làn khác; người vận hành tự gỡ được nhưng tốn công mỗi lần, và sửa sớm thì rẻ hơn khi nhiều nhánh đã dính.
  file: `scripts/zalo-import-job.test.mjs`
  severity: medium
  Đề xuất: new-contract

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
