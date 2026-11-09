# Review findings: thang-bac-moi-b0-b5 (vòng 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chi tiết kiểm mới 'chua-ap-087' của data-level:distribution không có nhãn trong dq-labels.ts**
  Người dùng thấy gì: Trong lúc chờ áp bản cập nhật cơ sở dữ liệu, trang Chất lượng có thể hiện một dòng kiểm phân bố bậc với chữ thô thay vì câu tiếng Việt dễ hiểu.
  Căn cứ: Chỉ lệch chữ hiển thị tạm thời cho người quản trị, không mất hay sai dữ liệu, và tự hết khi bản cập nhật được áp.
  file: `pipeline/bac-du-lieu.mjs`
  severity: medium
  Đề xuất: known-limits

- **Phép đếm độc lập của bac-roundtrip cộng mọi tin cùng mọi căn nên sẽ đếm trùng khi có căn gắn**
  Người dùng thấy gì: Khi sau này có tin được gắn vào căn, công cụ đối chiếu tổng có thể báo lệch oan dù số liệu thật vẫn đúng.
  Căn cứ: Chỉ gây báo động giả cho người vận hành, không ảnh hưởng người dùng cuối hay dữ liệu, và việc gắn căn là hàng riêng sẽ xử lý chỗ này.
  file: `app/scripts/bac-roundtrip.ts`
  severity: low
  Đề xuất: known-limits

- **Chữ UI viết tay tên bậc thay vì lấy từ sổ từ vựng**
  Người dùng thấy gì: Một câu trên trang Chất lượng ghi cứng tên bậc, nên nếu sau này đổi tên bậc thì câu này có thể quên đổi theo.
  Căn cứ: Hôm nay chữ đang đúng, hậu quả nhẹ và xa, sửa sau rẻ khi có đợt đổi nhãn.
  file: `app/src/components/ops/quality/do-hang-ngay.tsx`
  severity: low
  Đề xuất: known-limits

- **JSDoc bị tách khỏi hàm của nó khi chèn hàm mới vào giữa**
  Người dùng thấy gì: Chú thích trong mã nguồn bị đặt nhầm chỗ, không ảnh hưởng gì đến những gì người dùng thấy hay dữ liệu.
  Căn cứ: Không có hậu quả với người dùng, chỉ làm người đọc mã hơi khó theo dõi, nên không đáng mở việc riêng.
  file: `pipeline/lib/vocab-core.mjs`
  severity: low
  Đề xuất: wont-fix

- **bac-du-lieu.itest: nhóm ca hàm cũ sẽ đỏ ngay khi 087 được áp lên máy thu (diff bỏ bước nạp lại 056/059)**
  Người dùng thấy gì: Sau khi bản cập nhật cơ sở dữ liệu được áp thật, một bộ kiểm tự động của bậc dữ liệu có thể báo đỏ dù sản phẩm vẫn chạy đúng.
  Căn cứ: Chỉ làm bộ kiểm báo đỏ giả sau triển khai, không ảnh hưởng người dùng hay dữ liệu, và có thể chỉnh lại ngay khi áp.
  file: `pipeline/scripts/bac-du-lieu.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **TB-AC-4 qua mà không kiểm gì trên DB đã áp 087**
  Người dùng thấy gì: Sau khi áp bản cập nhật, một ca kiểm sẽ báo qua mà thực ra không kiểm gì, nên có thể tạo cảm giác yên tâm giả.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu, chỉ làm bằng chứng kiểm thử kém rõ, sửa sau rẻ.
  file: `pipeline/scripts/thang-bac.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): ô «can · B2 = 0» không thể khác 0 dưới thang 08/11**
  Người dùng thấy gì: Một phép kiểm tự động về việc cụm tin không thành căn có thể không bắt được lỗi nếu luật cũ quay lại.
  Căn cứ: Rủi ro nằm ở khả năng phát hiện lỗi về sau, hôm nay số liệu đúng và người dùng không bị ảnh hưởng.
  file: `pipeline/scripts/bac-du-lieu.itest.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): «đối chứng đỏ» của TB-AC-9 đúng theo cách dựng, không chạy bộ chọn cũ**
  Người dùng thấy gì: Phép kiểm chứng minh bộ kiểm sổ không còn báo lệch oan có thể không phân biệt được bản cũ với bản mới trong mọi tình huống.
  Căn cứ: Chỉ làm bằng chứng yếu hơn hứa, không gây hại cho người dùng hay dữ liệu, sửa sau rẻ.
  file: `pipeline/scripts/thang-bac.itest.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): «không cộng dòng thang cũ» của NS1 không có dòng thang cũ nào trong đầu vào**
  Người dùng thấy gì: Báo cáo ngày có thể cộng nhầm số liệu thang cũ mà bộ kiểm hiện tại không bắt được.
  Căn cứ: Rủi ro là bộ kiểm bỏ sót lỗi tương lai, chưa có số sai thật, và người vận hành tự đối chiếu được.
  file: `scripts/bao-cao-ngay.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp, thiếu kỳ vọng viết trước): bậc kỳ vọng của 74 và 64 ô lấy từ chính levelOf**
  Người dùng thấy gì: Nếu hai cách tính bậc cùng sai theo một kiểu thì bộ kiểm vẫn báo xanh, nên một số lệch bậc có thể lọt.
  Căn cứ: Là rủi ro bỏ sót lỗi chứ chưa phải lỗi có thật, hôm nay hai bên khớp nhau và người dùng chưa thấy gì sai.
  file: `app/tests/data-level-sql.itest.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): chiều đỏ của TB-AC-11 không chạy đường của app**
  Người dùng thấy gì: Phép kiểm trang vẫn chạy khi chưa áp bản cập nhật có chiều đối chứng yếu, nhưng trang vẫn hoạt động đúng.
  Căn cứ: Không có hậu quả với người dùng, chỉ là bằng chứng kiểm thử hơi yếu, chi phí sửa không đáng.
  file: `app/tests/thang-bac-db.itest.tsx`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra) và chiều đỏ đột biến đầu vào: TB-AC-8 grep mã nguồn, đột biến levelOf là tautology**
  Người dùng thấy gì: Việc kiểm câu hướng dẫn lên bậc cũ không còn xuất hiện dựa vào đọc mã chứ không đọc chữ thật trên màn hình, nên có thể sót.
  Căn cứ: Chữ hiển thị hôm nay đã đúng, chỉ là cách kiểm chưa chặt, nhẹ và sửa sau rẻ.
  file: `app/tests/thang-bac.test.tsx`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/12 lỗi rơi vào file không bộ đo nào phủ (app/scripts/bac-roundtrip.ts, pipeline/scripts/bac-du-lieu.itest.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
