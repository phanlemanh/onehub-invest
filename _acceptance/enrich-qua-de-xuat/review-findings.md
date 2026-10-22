## Trong hợp đồng

- **block_raw: chỉ chuẩn hoá phía LLM về tên node, còn E1 trả mã thô ("LBV"), nên cùng một toà bị tính là xung đột và mã thô được áp**
  AC: AC-3
  file: `agent/src/enrich/route.ts:372`
  severity: high
  source: bugs
  detail: `matchBuilding` chỉ chạy trên giá trị LLM (`node = field === "block_raw" && llmRaw !== null ? matchBuilding(llmRaw, ...)`), còn `e1v` giữ nguyên. Thực tế E1 (`context-resolver.ts:147`) đặt `buildingHint = code`, tức mã IN HOA như "LBV", không phải tên chuẩn. Ca thật: tin "LBV 2PN", E1 trả "LBV", LLM trả "LBV" (alias 'lbv' của node gpk-lumiere-boulevard, seed ở 032). Khi đó llmv = "Lumiere Boulevard", valueKey khác "lbv", nên routeFields cho ra E1 direct "LBV" và LLM superseded "Lumiere Boulevard". Đã chạy thử bằng tsx và ra đúng `[{block_raw,'LBV',e1_rule,direct},{block_raw,'Lumiere Boulevard',e2_llm,superseded}]`. Hậu quả: sale_offers.block_raw nhận mã thô thay cho tên chuẩn, và lượt chạy đếm thêm một 'xung đột E1/LLM' giả. Đây đúng là ca mà chú thích dòng 370-371 nói phải tránh. Test enrich-route.test.ts:134 chỉ xanh vì nó tiêm E1 = "Lumiere Boulevard", giá trị mà E1 thật không bao giờ trả. Cách sửa: chuẩn hoá e1v qua matchBuilding giống llmv trước khi so và áp.
  rationale: AC-3 yêu cầu block_raw khớp alias node building thì được corroborated và áp tên chuẩn của node; finding cho thấy thực tế áp mã thô 'LBV' và đánh dấu superseded.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **LLM confidence goes into a numeric column unchecked; one bad value rolls back the whole batch**
  Người dùng thấy gì: Nếu mô hình AI trả độ tin cậy là chữ hoặc số vô lý, cả lượt làm giàu dữ liệu có thể hỏng và mất hết kết quả đã chạy, hoặc thẻ duyệt hiện phần trăm sai (ví dụ 9000%).
  Căn cứ: Lỗi hiếm gặp và lộ ngay khi chạy (lượt chạy báo hỏng, không ghi dữ liệu sai vào tin), chạy lại là được, nên có thể xử lý ở một vòng riêng.
  file: `agent/src/enrich/run.ts`
  severity: medium
  Đề xuất: new-contract

- **enrich-run holds one DB transaction open across every LLM call (~2h for the backlog)**
  Người dùng thấy gì: Khi chạy làm giàu dữ liệu trên số lượng lớn tin, hệ thống giữ khoá nhiều giờ nên thao tác duyệt thẻ hoặc các job ban đêm có thể bị treo chờ. Nếu lỗi giữa chừng thì mất toàn bộ lượt.
  Căn cứ: Vòng này chỉ chạy lô nhỏ và chưa chạy toàn backlog nên ít ai gặp; chỉ trở nên nặng khi chạy hàng loạt, và khi đó cần sửa trước khi chạy.
  file: `agent/scripts/enrich-run.ts`
  severity: medium
  Đề xuất: known-limits

- **New review card uses raw <table>/<button> with hardcoded colors although shadcn table/button exist**
  Người dùng thấy gì: Thẻ duyệt mới dùng bảng và nút tự viết với màu cố định, nên giao diện có thể lệch nhẹ so với phần còn lại của trang vận hành. Chức năng vẫn đúng.
  Căn cứ: Chỉ là chênh lệch về hình thức ở trang nội bộ, không mất dữ liệu và không ảnh hưởng người dùng đầu tư; sửa sau cũng rẻ nhưng không cần mở việc riêng.
  file: `app/src/components/ops/review-card.tsx`
  severity: low
  Đề xuất: wont-fix

- **Cả batch enrich (gồm các lượt gọi LLM, có thể kéo ~2h) nằm trong MỘT transaction: giữ khoá hàng hàng giờ, và một lỗi DB làm mất toàn bộ**
  Người dùng thấy gì: Một lượt làm giàu dữ liệu dài sẽ giữ khoá lâu, có thể làm thao tác duyệt thẻ bị treo, và một lỗi ở cuối lượt làm mất toàn bộ kết quả AI đã tốn thời gian chạy.
  Căn cứ: Chỉ đau khi chạy lô rất lớn, mà vòng này chưa chạy; dữ liệu không bị ghi sai, chỉ mất công chạy lại.
  file: `agent/scripts/enrich-run.ts`
  severity: medium
  Đề xuất: known-limits

- **LLM hỏng, timeout hoặc trả đầu ra không parse được đều thành 'không có đề xuất LLM' mà tổng kết không báo**
  Người dùng thấy gì: Nếu máy chạy mô hình AI chết hoặc trả rác, lượt chạy vẫn báo hoàn tất như bình thường nên người vận hành không biết phần AI đã hỏng hoàn toàn.
  Căn cứ: Không làm sai dữ liệu nhưng che mất sự cố, người vận hành có thể tưởng đã làm giàu xong; dễ sửa sau và chạy lại được.
  file: `agent/scripts/enrich-run.ts`
  severity: medium
  Đề xuất: new-contract

- **syncReview ghi đè model/trace_path/run_id của thẻ chờ bằng meta của lượt hiện tại, kể cả khi lượt này không gọi LLM**
  Người dùng thấy gì: Trong một số lần chạy lại, thẻ chờ duyệt có thể hiện sai mô hình hoặc dấu vết nguồn của giá trị đang duyệt, nên người duyệt khó lần lại nguồn thật.
  Căn cứ: Dữ liệu gốc của từng đề xuất vẫn còn nguyên, chỉ phần hiển thị trên thẻ lệch; không mất dữ liệu và không áp sai giá trị.
  file: `agent/src/enrich/run.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): giá trị E1 trong ca AC-3/AC-7 viết tay hoặc stub, không rút từ resolveContext thật; có ca dựng hình dạng E1 mà writer thật không sinh ra được**
  Người dùng thấy gì: Một số kiểm thử dùng dữ liệu đầu vào dựng tay thay vì dữ liệu do hệ thống thật tạo ra, nên có thể bỏ sót lỗi thật ở luồng làm giàu.
  Căn cứ: Không ảnh hưởng trực tiếp người dùng, chỉ làm lưới an toàn kiểm thử lỏng hơn; có thể bổ sung sau mà không đụng dữ liệu.
  file: `agent/tests/enrich-route.test.ts`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): node toà nhà dựng tay, loadBuildings đọc asset_nodes không bao giờ chạy**
  Người dùng thấy gì: Phần đọc danh sách toà nhà từ kho dữ liệu chưa được kiểm thử bằng dữ liệu thật, nên nếu hỏng thì việc nhận diện toà nhà có thể sai mà không ai biết sớm.
  Căn cứ: Không gây mất dữ liệu ngay; chỉ là chỗ kiểm thử chưa phủ, bổ sung sau rẻ và không ảnh hưởng người dùng hiện tại.
  file: `agent/tests/enrich-db.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): chiều đỏ AC-5 skipped và AC-6 decide chạy trên đề xuất/thẻ chèn tay, không phải thẻ do lượt enrich sinh**
  Người dùng thấy gì: Kiểm thử bước áp dụng và quyết định thẻ dùng dữ liệu dựng tay, nên có thể không phát hiện sai lệch giữa thẻ do hệ thống tạo ra và thẻ lúc duyệt.
  Căn cứ: Chỉ làm kiểm thử kém sát thực tế, không gây mất dữ liệu; người dùng không thấy, bổ sung sau được.
  file: `agent/tests/enrich-apply.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt thay vì quan hệ): bảng field·giá trị·độ tin cậy chỉ kiểm bằng includes trên toàn bộ textContent**
  Người dùng thấy gì: Kiểm thử thẻ duyệt chỉ kiểm có chữ xuất hiện, không kiểm đúng hàng đúng giá trị, nên nếu bảng bị tráo giá trị hay độ tin cậy thì kiểm thử vẫn qua.
  Căn cứ: Chưa có bằng chứng thẻ hiển thị sai; rủi ro chỉ là bỏ sót lỗi hiển thị sau này, sửa kiểm thử sau rẻ.
  file: `app/tests/review-card.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ bắt một dạng): guard AC-1 tuyên 'không còn đường ghi thẳng' nhưng chỉ bắt UPDATE nằm cùng một dòng**
  Người dùng thấy gì: Công cụ canh chừng việc ghi thẳng vào dữ liệu tin chỉ bắt được một số kiểu viết, nên sau này có người thêm đường ghi thẳng theo kiểu khác thì có thể không bị phát hiện.
  Căn cứ: Hiện chưa có đường ghi thẳng nào được chỉ ra, nên chưa ảnh hưởng dữ liệu; đây là rủi ro tương lai và làm chặt công cụ canh sau cũng rẻ.
  file: `agent/tests/enrich-guard.test.ts`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
