# Review findings: media-canonical-reso (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bảng media của S05 được dựng sau transform-zalo (chỉ chạy S03), không sau transform-fb, nơi thật sự ghi tin S05**
  Người dùng thấy gì: Tin Facebook (S05) mới về giữa hai lượt nạp đêm sẽ chưa có ảnh ở Hàng duyệt và hồ sơ tin cho tới đêm hôm sau, hiện «không có ảnh». Nguồn này đang tạm dừng nên hiện chưa ai gặp.
  Căn cứ: Hậu quả nhẹ vì nguồn đang dừng, ảnh tự có lại sau lượt đêm kế tiếp, không mất dữ liệu; sửa thuộc làn thu thập nên nên làm riêng khi bật lại nguồn.
  file: `scripts/zalo-import-daily.sh`
  severity: medium
  Đề xuất: known-limits

- **Executor review_media_roundtrip còn trỏ tới tệp đã xoá app/scripts/review-media-roundtrip.ts**
  Người dùng thấy gì: Một lệnh kiểm cũ vẫn còn trong cấu hình nhưng đã mất tệp, nên ai chạy nhầm sẽ gặp thông báo lỗi khó hiểu. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng người vận hành nếu chạy nhầm lệnh cũ, thấy lỗi ngay và không mất dữ liệu; chi phí dọn rất nhỏ nhưng không đáng mở việc riêng.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **S05 offers written by apify-facebook-daily never get a transform-media run, so the media table goes stale until zalo-import-daily**
  Người dùng thấy gì: Khi bật lại nguồn Facebook, tin mới có thể thấy «không có ảnh» tới khoảng 18 giờ, và ảnh của bài đã chuyển sang tin khác tạm gắn vào tin cũ. Không có thông báo lỗi nào.
  Căn cứ: Hậu quả nhẹ và tự hết sau lượt đêm kế tiếp, không mất dữ liệu; hiện nguồn đang dừng nên chưa ai gặp, và việc sửa thuộc làn thu thập nên làm khi bật lại nguồn.
  file: `scripts/apify-facebook-daily.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): chiều đỏ NH-AC-3 không đo đột biến đã tuyên, chỉ notDeepEqual trên một đầu vào khác**
  Người dùng thấy gì: Bài thử kiểm tra thứ tự ảnh đã tải đứng trước chưa chứng minh được là sẽ bắt lỗi nếu thứ tự bị đảo. Ảnh hiện vẫn hiện đúng cho người dùng.
  Căn cứ: Không có hậu quả tức thời cho người dùng, chỉ làm lưới an toàn khi sửa sau này kém chặt hơn; bổ sung bài thử sau không tốn nhiều.
  file: `app/tests/media-canonical.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): chiều đỏ NH-AC-6 «ảnh phải thuộc đúng tin đang mở» chỉ đổi dữ liệu vào, không đổi component**
  Người dùng thấy gì: Bài thử chưa chứng minh được việc hồ sơ tin chọn đúng ảnh của tin đang mở sẽ bị bắt nếu hỏng ở phần âm. Ảnh hiện cho người dùng vẫn đúng theo kiểm tra dương.
  Căn cứ: Không ảnh hưởng người dùng hiện tại vì phép kiểm dương đã phủ; chỉ làm lưới kiểm thử yếu hơn khai báo, sửa sau rẻ.
  file: `app/tests/media-canonical.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): ca 'NH-AC-3 hai bản regex' tự dựng lại luật của localFile trong test thay vì gọi hàm bên ghi**
  Người dùng thấy gì: Nếu luật nhận biết tên tệp ảnh ở phía ghi đổi sau này mà phía đọc không đổi theo, bài thử có thể vẫn xanh và ảnh có thể không hiện. Hiện hai phía đang khớp nhau.
  Căn cứ: Hiện không ai gặp lỗi, rủi ro chỉ xuất hiện khi sửa sau này và lúc đó ảnh chỉ thiếu chứ không mất dữ liệu; thêm phép kiểm trực tiếp sau rẻ.
  file: `app/tests/media-canonical.test.tsx`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/6 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml, scripts/apify-facebook-daily.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
