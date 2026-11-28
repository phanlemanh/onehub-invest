## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E11 (eval mới vòng này) khai `paths` thiếu nguồn FILL mà nó soát: carry-forward có thể mang màu cũ sang**
  Người dùng thấy gì: Ở vòng nghiệm thu sau, một phép kiểm có thể được giữ kết quả xanh cũ dù danh sách bảng cần sao lưu đã đổi. Người dùng cuối không thấy gì; chỉ làm bằng chứng nghiệm thu kém tin cậy hơn.
  Căn cứ: Chỉ ảnh hưởng độ chắc của bằng chứng nghiệm thu, không làm mất hay lộ dữ liệu của người dùng, và sửa sau rẻ.
  file: `_acceptance/sync-cloud-che-ten-nguon-moi-cot/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **kiem-ho-so.mjs không chạy từ gốc kho thì im lặng thoát 0 (xanh giả)**
  Người dùng thấy gì: Nếu ai đó chạy phép kiểm hồ sơ từ sai thư mục, nó báo đạt mà thật ra chưa kiểm gì. Việc chạy thật hiện vẫn đúng chỗ nên chưa gây hại.
  Căn cứ: Chỉ là bẫy cho người chạy tay, không đụng dữ liệu người dùng, chạy lại đúng chỗ là xong.
  file: `_acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/kiem-ho-so.mjs`
  severity: low
  Đề xuất: known-limits

- **Chiều đỏ «cấy ô bẩn» của E5 chỉ kiểm mã thoát khác 0, không kiểm bộ chặn (scan) là cái bắt**
  Người dùng thấy gì: Phép thử cố ý cấy tên nguồn có thể báo đạt dù bộ chặn không phải thứ chặn lại, mà do một lý do khác làm lượt dừng. Bản thân việc che tên nguồn không bị ảnh hưởng.
  Căn cứ: Chỉ làm bằng chứng thử nghiệm yếu đi một chút, không làm lộ dữ liệu, sửa sau không tốn kém.
  file: `pipeline/lib/sync-cloud-kho-xet.mjs`
  severity: low
  Đề xuất: known-limits

- **kiem-ho-so.mjs so FILL với origin/main mà không fetch: ref cũ thì soát FILL xanh giả**
  Người dùng thấy gì: Nếu bản main cục bộ đã cũ, phép kiểm có thể báo danh sách bảng sao lưu là đủ trong khi main đã thêm bảng mới, khiến bản sao lưu trước khi áp thiếu bảng đó.
  Căn cứ: Rủi ro chỉ xảy ra khi quên cập nhật main trước khi áp và người ký áp có thể tự kiểm lại, nên chấp nhận và ghi rõ.
  file: `_acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/kiem-ho-so.mjs`
  severity: low
  Đề xuất: known-limits

- **kiem-ho-so.mjs chỉ xanh khi chạy đúng từ worktree sync-cloud-che-ten: chạy lại ở chỗ khác thì đỏ giả**
  Người dùng thấy gì: Phép kiểm hồ sơ chỉ chạy đạt ở đúng một thư mục; chạy ở máy hay thư mục khác sẽ báo đỏ dù hồ sơ không sai. Người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ gây báo đỏ giả, không mất hay lộ dữ liệu, và công cụ này dùng một lần cho đợt áp này nên sửa không đáng.
  file: `_acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/kiem-ho-so.mjs`
  severity: low
  Đề xuất: wont-fix

- **cho-ranh: nhật ký cho thấy lượt cuối đã kết thúc thì coi là rảnh, kể cả khi vẫn có tiến trình sync-cloud đang sống**
  Người dùng thấy gì: Khi có một lượt đồng bộ chạy tay mà không ghi nhật ký, bước sao lưu có thể bắt đầu đọc giữa lúc bảng đang được thay, nên bản sao lưu có thể không nhất quán.
  Căn cứ: Chỉ xảy ra khi có lượt chạy tay chồng lên và người áp có thể kiểm lại, nên ghi thành hạn chế đã biết thay vì mở việc.
  file: `_acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/cho-ranh.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture VIẾT TAY đúng khuôn bên đọc: KX-1..KX-4 nạp chuỗi KHO/CHI tự gõ vào docKho/docChiMayThu, không round-trip từ runKho**
  Người dùng thấy gì: Nếu sau này định dạng báo cáo của lệnh đo đổi mà bộ đọc không đổi theo, kiểm thử tự động sẽ không phát hiện; chỉ lộ khi chạy đo thật trên máy thu.
  Căn cứ: Không làm mất hay lộ dữ liệu, lệch sẽ lộ ngay khi chạy đo thật và sửa sau rẻ.
  file: `pipeline/tests/sync-cloud-kho-xet.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên quét LỚP nhưng chỉ có điểm-case: ca canh (c) bảo «không route data-api nào đưa meta của dòng areas vào JSON» bằng regex chỉ liệt kê bốn tên biến**
  Người dùng thấy gì: Phép canh chỉ bắt một số cách viết mã; nếu sau này có người viết một đường trả dữ liệu thị trường theo cách khác thì có thể không bị phát hiện. Hiện chưa có đường nào như vậy.
  Căn cứ: Rủi ro chỉ có khi mã mới được thêm trong tương lai, hiện không lộ gì và có thể siết test sau.
  file: `pipeline/sync-cloud-che.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **sao-luu.mjs: choRanh ném TypeError khi nhật ký không có dòng «sync bắt đầu», và chờ mãi khi lượt cuối chết giữa chừng (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi áp lên máy thu, bước sao lưu có thể báo lỗi khó hiểu hoặc đứng chờ mãi nếu nhật ký vừa bị xoay vòng hoặc lượt đồng bộ trước bị tắt giữa chừng. Người áp phải tự dừng và chạy lại.
  Căn cứ: Chỉ gặp ở ca hiếm, không mất hay lộ dữ liệu, người áp tự dừng và chạy lại được nên chấp nhận ghi lại và đi tiếp.
  file: `_acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/sao-luu.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
