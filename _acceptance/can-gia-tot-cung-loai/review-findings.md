# Review findings: can-gia-tot-cung-loai (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **data-api /v1/deals chuyển từ bảng precompute market_asset_stats sang view v_ruler_p2 tính trung vị lúc chạy**
  Người dùng thấy gì: API công khai Căn giá tốt có thể chậm hơn khi nhiều người gọi cùng lúc vì mỗi lượt gọi tính lại giá trung vị; kết quả trả về vẫn đúng.
  Căn cứ: Chỉ ảnh hưởng tốc độ chứ không làm sai số hay mất dữ liệu, người dùng tải lại là được, và dữ liệu hiện còn nhỏ nên chưa thấy chậm thật.
  file: `data-api/src/routes/deals.ts`
  severity: medium
  Đề xuất: known-limits

- **lyDoRoi vẫn ghi «thước phường» cho căn đắt hơn trong khi câu chứng minh đã đổi sang thước cùng loại**
  Người dùng thấy gì: Trên trang một căn đắt hơn mặt bằng, một câu vẫn nói «thước phường» trong khi câu khác nói «thước cùng loại», nên người đọc có thể thấy hai cách gọi cho cùng một con số.
  Căn cứ: Chỉ là chữ gây khó hiểu nhẹ, con số hiển thị vẫn đúng, và sửa chữ sau rất rẻ.
  file: `app/src/lib/deals-chi-tiet.ts`
  severity: low
  Đề xuất: known-limits

- **Lệnh đo E7 gọi API với min_discount=0 nhưng cả hai route tự đổi 0 thành 5, nên tin giảm 0–5% không bao giờ được kiểm**
  Người dùng thấy gì: Bằng chứng đo trên dữ liệu thật chỉ phủ các tin giảm từ 5% trở lên, nhưng được mô tả như toàn bộ tin, nên người đọc có thể tin độ phủ rộng hơn thực tế.
  Căn cứ: Không ảnh hưởng người dùng cuối, các dòng đã kiểm vẫn đúng, chỉ cần ghi rõ mẫu bị cắt trong bằng chứng.
  file: `pipeline/scripts/do-can-gia-cung-loai.mjs`
  severity: low
  Đề xuất: known-limits

- **Bộ soát ranh giới E9 tính tệp chưa track vào danh sách tệp nhưng không quét nội dung của chúng để tìm tên nguồn**
  Người dùng thấy gì: Công cụ kiểm tra rò tên nguồn thật có thể bỏ sót tên nằm trong tệp mới chưa thêm vào git, nên một lần rò có thể lọt mà vẫn báo sạch.
  Căn cứ: Rủi ro chỉ xảy ra khi có tệp mới chưa add và chứa tên nguồn, các rào khác khi đẩy lên vẫn còn, và cấp thêm vài dòng quét là rẻ nhưng chưa gấp.
  file: `pipeline/scripts/can-gia-cung-loai-ranh-gioi.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm-tính-một-mình): đột biến AC-6 không chạy route mà vẫn xanh khi câu SQL hỏng**
  Người dùng thấy gì: Phép thử bảo vệ việc API công khai dùng đúng thước cùng loại luôn báo đạt, nên nếu sau này ai đó quay lại thước cả phường thì không có gì báo động.
  Căn cứ: Lỗi nằm ở lưới an toàn chứ chưa làm sai số hôm nay, nhưng nó che mất lần hồi quy sau; sửa phép thử là việc nhỏ.
  file: `app/tests/can-gia-cung-loai-db.test.tsx`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 (âm-tính-một-mình): đột biến AC-3 đạt cả khi bản đột biến làm mất dòng căn hộ**
  Người dùng thấy gì: Phép thử xác nhận danh sách Ops in đúng giá trung vị cùng loại có thể báo đạt dù bản sai không còn trả dòng nào, nên bắt lỗi yếu hơn vẻ ngoài.
  Căn cứ: Không làm sai dữ liệu hiện tại, chỉ làm lưới kiểm lỏng hơn, và gia cố sau rất rẻ.
  file: `app/tests/can-gia-cung-loai-db.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): «không token → 401» của AC-5 đo bằng grep mã nguồn route**
  Người dùng thấy gì: Phép thử chặn người chưa đăng nhập vào danh sách Căn giá tốt chỉ kiểm thứ tự chữ trong mã, nên có thể không phát hiện nếu cổng chặn bị gỡ trên thực tế.
  Căn cứ: Cổng chặn hiện còn đúng và ngoài phạm vi hàng này; rủi ro là hồi quy sau nên ghi lại để làm phép thử gọi thật khi đụng lại API.
  file: `app/tests/can-gia-cung-loai-db.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm-tính-một-mình): E9 chỉ có đối chứng cho migration_doi, còn contact_doi và ten_nguon = 0 không có đối chứng dương**
  Người dùng thấy gì: Hai bộ kiểm chặn lộ liên lạc người bán và tên nguồn thật chưa từng được thử để biết chúng có thật sự báo đỏ, nên số 0 có thể là do chúng không bắt được gì.
  Căn cứ: Không làm lộ dữ liệu hiện tại, chỉ làm độ tin của kết quả sạch thấp hơn, và thêm ca thử sau là rẻ.
  file: `pipeline/scripts/can-gia-cung-loai-ranh-gioi.mjs`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 4/8 lỗi rơi vào file không bộ đo nào phủ (pipeline/scripts/do-can-gia-cung-loai.mjs, app/tests/can-gia-cung-loai-db.test.tsx) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
