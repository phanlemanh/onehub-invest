# Review findings: enrich-qua-de-xuat (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E1 block_raw được đổi sang tên chuẩn node nhưng không ghi lại nguồn asset_nodes (corroborated_by/evidence)**
  Người dùng thấy gì: Khi hệ thống đổi mã toà viết tắt trong tin thành tên toà chuẩn, bản ghi đề xuất chỉ lưu tên chuẩn và không nói rõ tên đó lấy từ danh mục nào. Người rà soát phải tự đối chiếu với đoạn tin gốc mới biết, nhưng giá trị được điền vẫn đúng.
  Căn cứ: Hậu quả nhẹ: không mất hay sai dữ liệu, chỉ thiếu một dấu vết giúp người kiểm tra nhanh hơn, và đoạn tin gốc vẫn còn để đối chiếu; ghi lại là đủ, bổ sung sau cũng không đắt.
  file: `agent/src/enrich/route.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6 — đường dẫn hardcode ROOT: s4-args.json trỏ input judgment E6 và repoRoot vào checkout chính (main), không vào worktree đang kiểm**
  Người dùng thấy gì: Bản ghi kiểm tra vòng đầu đã đo nhầm trên mã của nhánh chính thay vì mã đang làm, nên kết luận của vòng đó không đáng tin. Người dùng cuối không bị ảnh hưởng vì sản phẩm không đổi, và bản kiểm tra vòng sau đã trỏ đúng chỗ.
  Căn cứ: Không ảnh hưởng người dùng và không mất dữ liệu; lỗi chỉ nằm ở hồ sơ kiểm tra cũ, bản chạy lại đã sửa đúng nên không cần mở thêm việc.
  file: `_acceptance/enrich-qua-de-xuat/s4-args.json`
  severity: high
  Đề xuất: wont-fix

- **LLM confidence goes into a numeric column unchecked; one bad value rolls back the whole batch (r1)**
  Người dùng thấy gì: Nếu mô hình AI trả độ tin cậy là chữ hoặc số vô lý, cả lượt làm giàu dữ liệu có thể hỏng và mất hết kết quả đã chạy, hoặc thẻ duyệt hiện phần trăm sai (ví dụ 9000%).
  Căn cứ: Lỗi hiếm gặp và lộ ngay khi chạy (lượt chạy báo hỏng, không ghi dữ liệu sai vào tin), chạy lại là được, nên có thể xử lý ở một vòng riêng.
  file: `agent/src/enrich/run.ts`
  severity: medium
  Đề xuất: new-contract

- **enrich-run holds one DB transaction open across every LLM call (~2h for the backlog) (r1)**
  Người dùng thấy gì: Khi chạy làm giàu dữ liệu trên số lượng lớn tin, hệ thống giữ khoá nhiều giờ nên thao tác duyệt thẻ hoặc các job ban đêm có thể bị treo chờ. Nếu lỗi giữa chừng thì mất toàn bộ lượt.
  Căn cứ: Vòng này chỉ chạy lô nhỏ và chưa chạy toàn backlog nên ít ai gặp; chỉ trở nên nặng khi chạy hàng loạt, và khi đó cần sửa trước khi chạy.
  file: `agent/scripts/enrich-run.ts`
  severity: medium
  Đề xuất: known-limits

- **New review card uses raw <table>/<button> with hardcoded colors although shadcn table/button exist (r1)**
  Người dùng thấy gì: Thẻ duyệt mới dùng bảng và nút tự viết với màu cố định, nên giao diện có thể lệch nhẹ so với phần còn lại của trang vận hành. Chức năng vẫn đúng.
  Căn cứ: Chỉ là chênh lệch về hình thức ở trang nội bộ, không mất dữ liệu và không ảnh hưởng người dùng đầu tư; sửa sau cũng rẻ nhưng không cần mở việc riêng.
  file: `app/src/components/ops/review-card.tsx`
  severity: low
  Đề xuất: wont-fix

- **Cả batch enrich (gồm các lượt gọi LLM, có thể kéo ~2h) nằm trong MỘT transaction: giữ khoá hàng hàng giờ, và một lỗi DB làm mất toàn bộ (r1)**
  Người dùng thấy gì: Một lượt làm giàu dữ liệu dài sẽ giữ khoá lâu, có thể làm thao tác duyệt thẻ bị treo, và một lỗi ở cuối lượt làm mất toàn bộ kết quả AI đã tốn thời gian chạy.
  Căn cứ: Chỉ đau khi chạy lô rất lớn, mà vòng này chưa chạy; dữ liệu không bị ghi sai, chỉ mất công chạy lại.
  file: `agent/scripts/enrich-run.ts`
  severity: medium
  Đề xuất: known-limits

- **LLM hỏng, timeout hoặc trả đầu ra không parse được đều thành 'không có đề xuất LLM' mà tổng kết không báo (r1)**
  Người dùng thấy gì: Nếu máy chạy mô hình AI chết hoặc trả rác, lượt chạy vẫn báo hoàn tất như bình thường nên người vận hành không biết phần AI đã hỏng hoàn toàn.
  Căn cứ: Không làm sai dữ liệu nhưng che mất sự cố, người vận hành có thể tưởng đã làm giàu xong; dễ sửa sau và chạy lại được.
  file: `agent/scripts/enrich-run.ts`
  severity: medium
  Đề xuất: new-contract

- **syncReview ghi đè model/trace_path/run_id của thẻ chờ bằng meta của lượt hiện tại, kể cả khi lượt này không gọi LLM (r1)**
  Người dùng thấy gì: Trong một số lần chạy lại, thẻ chờ duyệt có thể hiện sai mô hình hoặc dấu vết nguồn của giá trị đang duyệt, nên người duyệt khó lần lại nguồn thật.
  Căn cứ: Dữ liệu gốc của từng đề xuất vẫn còn nguyên, chỉ phần hiển thị trên thẻ lệch; không mất dữ liệu và không áp sai giá trị.
  file: `agent/src/enrich/run.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): giá trị E1 trong ca AC-3/AC-7 viết tay hoặc stub, không rút từ resolveContext thật; có ca dựng hình dạng E1 mà writer thật không sinh ra được (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một số kiểm thử dùng dữ liệu đầu vào dựng tay thay vì dữ liệu do hệ thống thật tạo ra, nên có thể bỏ sót lỗi thật ở luồng làm giàu.
  Căn cứ: Không ảnh hưởng trực tiếp người dùng, chỉ làm lưới an toàn kiểm thử lỏng hơn; có thể bổ sung sau mà không đụng dữ liệu.
  file: `agent/tests/enrich-route.test.ts`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): node toà nhà dựng tay, loadBuildings đọc asset_nodes không bao giờ chạy (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phần đọc danh sách toà nhà từ kho dữ liệu chưa được kiểm thử bằng dữ liệu thật, nên nếu hỏng thì việc nhận diện toà nhà có thể sai mà không ai biết sớm.
  Căn cứ: Không gây mất dữ liệu ngay; chỉ là chỗ kiểm thử chưa phủ, bổ sung sau rẻ và không ảnh hưởng người dùng hiện tại.
  file: `agent/tests/enrich-db.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): chiều đỏ AC-5 skipped và AC-6 decide chạy trên đề xuất/thẻ chèn tay, không phải thẻ do lượt enrich sinh (r1)**
  Người dùng thấy gì: Kiểm thử bước áp dụng và quyết định thẻ dùng dữ liệu dựng tay, nên có thể không phát hiện sai lệch giữa thẻ do hệ thống tạo ra và thẻ lúc duyệt.
  Căn cứ: Chỉ làm kiểm thử kém sát thực tế, không gây mất dữ liệu; người dùng không thấy, bổ sung sau được.
  file: `agent/tests/enrich-apply.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt thay vì quan hệ): bảng field·giá trị·độ tin cậy chỉ kiểm bằng includes trên toàn bộ textContent (r1)**
  Người dùng thấy gì: Kiểm thử thẻ duyệt chỉ kiểm có chữ xuất hiện, không kiểm đúng hàng đúng giá trị, nên nếu bảng bị tráo giá trị hay độ tin cậy thì kiểm thử vẫn qua.
  Căn cứ: Chưa có bằng chứng thẻ hiển thị sai; rủi ro chỉ là bỏ sót lỗi hiển thị sau này, sửa kiểm thử sau rẻ.
  file: `app/tests/review-card.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ bắt một dạng): guard AC-1 tuyên 'không còn đường ghi thẳng' nhưng chỉ bắt UPDATE nằm cùng một dòng (r1)**
  Người dùng thấy gì: Công cụ canh chừng việc ghi thẳng vào dữ liệu tin chỉ bắt được một số kiểu viết, nên sau này có người thêm đường ghi thẳng theo kiểu khác thì có thể không bị phát hiện.
  Căn cứ: Hiện chưa có đường ghi thẳng nào được chỉ ra, nên chưa ảnh hưởng dữ liệu; đây là rủi ro tương lai và làm chặt công cụ canh sau cũng rẻ.
  file: `agent/tests/enrich-guard.test.ts`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
