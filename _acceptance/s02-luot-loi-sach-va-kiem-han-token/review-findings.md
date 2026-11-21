## Trong hợp đồng

- **Phép đo AC-6 đã nới vùng thêm LO-TRINH.html và PRODUCT-MAP.md nhưng contract.md AC-6 vẫn ghi «chỉ gồm đúng năm tệp sau và hồ sơ này»**
  AC: AC-6
  file: `_acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/vung.sh:8`
  severity: medium
  source: conventions
  detail: Commit 72f41db44 thêm `LO-TRINH\.html|PRODUCT-MAP\.md` vào regex VUNG sau khi E6 bị từ chối ở vòng 1. Chạy lại thì E6 xanh (23 tệp). Tuy vậy, hợp đồng đã duyệt ở Cổng Phạm vi (contract.md dòng 51-55) vẫn định nghĩa AC-6 là «tệp đổi chỉ gồm đúng năm tệp sau và hồ sơ này» và không nhắc tới tệp sinh. Phép đo nay chấm một tiêu chí lỏng hơn chữ của hợp đồng, quyết định nới chỉ được ghi ở decisions.jsonl (d-20261120T205320Z-8). Lý do nới hợp lệ, vì các phép đo phạm vi khác trong _acceptance/config.yaml (snn_scope, snh_scope) cũng loại hai tệp này, nhưng cần sửa chữ AC-6 trong contract.md cho khớp. Nếu không, người ký ở Cổng Bằng chứng sẽ đọc một tiêu chí trong khi máy chấm một tiêu chí khác.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Đổi ngữ nghĩa giao diện collector↔pipeline (lượt lỗi không còn ra snapshot tên thật) mà không cập nhật DATA-CONTRACT (r1)**
  Người dùng thấy gì: Tài liệu giao diện thu thập vẫn nói lượt thu lỗi để lại thư mục bản thu để chẩn đoán, trong khi thực tế nay nằm trong thư mục ẩn. Người đọc tài liệu có thể không tìm thấy manifest lỗi.
  Căn cứ: Chỉ là tài liệu lệch với hành vi, không mất hay lộ dữ liệu, và sửa một đoạn chữ sau này rất rẻ.
  file: `collector/src/core/storage.ts`
  severity: medium
  Đề xuất: known-limits

- **docExpAppToken không kiểm kiểu exp: exp không phải số làm conLaiMs = NaN và token được duyệt «token OK» (r1)**
  Người dùng thấy gì: Nếu token có hạn dùng ghi sai định dạng, bộ thu vẫn báo token tốt dù có thể đã hỏng, và lượt thu sẽ thất bại muộn hơn.
  Căn cứ: Token thật do chính nguồn cấp nên hiếm khi sai định dạng, hậu quả chỉ là báo xanh giả cho một lượt và tự lộ ra khi lượt chạy lỗi.
  file: `collector/src/collectors/airdna-research.ts`
  severity: low
  Đề xuất: known-limits

- **Token hết hạn lúc làm mới giữa lượt bị catch trong call() nuốt mất: lượt chạy tiếp, mỗi lời gọi lại mở trình duyệt, cuối cùng ra thư mục tên thật như lượt thu thành công (r1)**
  Người dùng thấy gì: Khi token hết hạn giữa lúc đang thu, bộ thu không dừng mà cứ mở trình duyệt lặp lại và cuối cùng lưu một bản thu rỗng trông như thành công, có thể che lỗi xác thực như sự cố cũ.
  Căn cứ: Hậu quả nặng vì tái tạo đúng sự cố cũ là bản thu rỗng giả, nhưng chỉ xảy ra khi token hết hạn đúng giữa lượt và cần sửa riêng ở làn thu.
  file: `collector/src/collectors/airdna-research.ts`
  severity: high
  Đề xuất: new-contract

- **Hình dạng 2 + 1: «lệnh collect thoát 1» đo trên bản CLI viết tay của chính phép đo, CLI thật chỉ được soi bằng regex trên mã nguồn (r1)**
  Người dùng thấy gì: Chưa có lần chạy lệnh thu thật nào xác nhận lệnh thoát lỗi khi lượt thu hỏng, nên bằng chứng chỉ gián tiếp.
  Căn cứ: Mã CLI thật đã được soi và khớp, nên rủi ro thực tế thấp, và có thể bổ sung phép đo sau mà không ảnh hưởng người dùng.
  file: `_acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/nguoi-doc.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: chiều đỏ `! node nguoi-doc.mjs --pha` nhận bất kỳ lần hỏng nào, không ghim điều kiện SNAP= (r1)**
  Người dùng thấy gì: Phép thử âm tính có thể báo đạt vì một lỗi khác, nên chưa chứng minh chắc rằng chọn nhầm bản thu hỏng bị bắt.
  Căn cứ: Chỉ làm bằng chứng kém chặt, không ảnh hưởng dữ liệu thật, và siết lại phép đo là việc rẻ.
  file: `_acceptance/s02-luot-loi-sach-va-kiem-han-token/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 + 1: ca 1711-1(a) chỉ kiểm hai chuỗi cùng có mặt trong tệp nguồn, trong khi lời hứa là quan hệ «AUTH FAIL được ghi trước throw trong nhánh 401» (r1)**
  Người dùng thấy gì: Ca kiểm dòng cảnh báo xác thực hỏng chỉ dò chữ trong mã nên có thể xanh dù dòng cảnh báo đặt sai chỗ.
  Căn cứ: Hợp đồng đã chấp nhận đo tĩnh cho nhánh này, hậu quả tối đa là thiếu một dòng log chẩn đoán, và đo hành vi thật tốn công hơn nhiều.
  file: `collector/src/test/snapshot-loi-khong-tac-thu-muc.test.ts`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
