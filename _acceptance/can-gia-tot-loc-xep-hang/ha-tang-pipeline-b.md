# Ca quá giờ của suite pipeline_b (ghi trước lượt chấm 4)

- Lượt chạy trọn bộ tại máy trên commit `0811bc9de`: `pipeline_b` thoát 1 vì hai ca của `pipeline/scripts/transform-zalo-loai-tin-doi-chieu.test.mjs` quá giờ (`SLT-DC-7, SLT-DC-9` 1.200 giây, `SLT-DC-10` 600 giây), ca `SLT-DC-9` con không khởi động được vì ca cha đã kết thúc. Cả suite: 592 ca, 588 đạt, 1 đỏ, 2 huỷ, 1 bỏ qua.
- Lúc đó máy đang tải nặng: tải trung bình 18 đến 30 khi kiểm ngay sau lượt chạy.
- Chạy riêng đúng tệp đó trên cùng commit: `bash ../db/db-thu.sh oneinvest_suite_cg3_slt --chay node --test --test-concurrency=1 scripts/transform-zalo-loai-tin-doi-chieu.test.mjs`, thoát 0, 10/10 đạt, 6 phút 11 giây.
- Nhánh không đổi tệp nào trong `pipeline/` so với `main` ở thời điểm đo (`git diff origin/main...HEAD -- pipeline` rỗng).

Nếu lượt chấm 4 quá giờ đúng các ca này thì đó là lỗi hạ tầng theo lời GS: nhả khoá với cờ hạ tầng, không tính một vòng. Ca khác đỏ, hay các ca này đỏ vì lý do khác quá giờ, thì không áp dụng ghi chú này.
