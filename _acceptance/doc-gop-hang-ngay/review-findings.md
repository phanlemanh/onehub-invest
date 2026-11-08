## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Daily spend cap counts by silver_labels.run_id, but SQL_GHI_DOC rewrites run_id and adds cost onto the old value when it re-reads a json-hong label**
  Người dùng thấy gì: Số tiền đã chi trong ngày có thể tính lệch: đếm dư khiến việc đọc bài dừng sớm hơn cần, hoặc đếm hụt khi bước kiểm mẫu chạy ngay sau đó, nên trần 20 USD không chính xác tuyệt đối.
  Căn cứ: Lệch nhỏ vì mỗi lời gọi chỉ tốn cỡ vài phần nghìn USD và phần dư đã được ghi trong hợp đồng; không mất dữ liệu, chạy lại hôm sau là đọc tiếp được, còn sửa đúng cần đổi cách ghi sổ tiền nên đắt hơn hậu quả.
  file: `agent/src/enrich/doc-gop-s03/hang-ngay.ts`
  severity: medium
  Đề xuất: known-limits

- **Header comments still say there is no whole-S03 path and that --thu needs the key, which contradicts the new hang-ngay command**
  Người dùng thấy gì: Người đọc mã sau này có thể tưởng hệ thống chưa có đường đọc toàn bộ bài S03 và tưởng chạy thử vẫn cần khoá, dẫn tới hiểu sai ranh giới an toàn.
  Căn cứ: Không ảnh hưởng người dùng cuối hay dữ liệu, chỉ gây hiểu nhầm cho người bảo trì; sửa rất rẻ bằng một lần chỉnh chữ ở lượt dọn sau.
  file: `agent/src/enrich/doc-gop-s03/chay.ts`
  severity: low
  Đề xuất: known-limits

- **New nightly script is not recorded in pipeline/CLAUDE.md, agent/CLAUDE.md or the ROADMAP as-built section**
  Người dùng thấy gì: Bước đêm mới có gọi model trả tiền chưa có trên các bản đồ vận hành, nên người trực có thể không biết nó tồn tại khi tra sự cố hay chi phí.
  Căn cứ: Không gây mất dữ liệu hay lỗi cho người dùng; bước này chưa gắn lịch nên chưa chạy thật, và bổ sung tài liệu là việc rẻ làm cùng lượt gộp.
  file: `pipeline/doc-gop-hang-ngay.sh`
  severity: low
  Đề xuất: known-limits

- **phamViNgay re-copies the S03 channel predicate instead of using test-posts.mjs, which calls itself the single definition**
  Người dùng thấy gì: Nếu sau này luật chọn bài S03 ở nơi khác đổi, phạm vi đọc hằng ngày có thể lặng lẽ lệch, đọc thiếu hoặc thừa bài mà không có cảnh báo.
  Căn cứ: Hiện hai định nghĩa đang khớp nên chưa có hậu quả; nếu lệch thì chỉ đọc thừa hoặc thiếu bài và sửa lại được, không mất dữ liệu gốc.
  file: `agent/src/enrich/doc-gop-s03/hang-ngay.ts`
  severity: low
  Đề xuất: known-limits

- **When the date calculation fails the script exits 2 without the JOB FAIL line the header promises**
  Người dùng thấy gì: Nếu việc tính ngày hôm qua bị lỗi thì bước đêm dừng mà không in dòng báo hỏng quen thuộc, nên người trực khó thấy đêm đó không đọc bài nào.
  Căn cứ: Tình huống hiếm vì tính ngày gần như không hỏng; hậu quả chỉ là báo lỗi kém rõ, không mất dữ liệu, và đêm sau chạy lại được.
  file: `pipeline/doc-gop-hang-ngay.sh`
  severity: low
  Đề xuất: known-limits

- **Mảng ENV_FILE rỗng dưới set -u làm bash 3.2 (macOS /bin/bash) chết khi không có .env, mã thoát không thuộc bảng mã đã khai**
  Người dùng thấy gì: Trên máy chạy lịch đêm bằng bash cũ của macOS, nếu thiếu tệp cấu hình thì bước đọc bài chết với mã lạ thay vì báo thiếu khoá rõ ràng.
  Căn cứ: Chỉ xảy ra khi tệp cấu hình mất, lúc đó bước vốn không chạy được; người trực vẫn thấy dòng báo hỏng nhưng sai nguyên nhân, không mất dữ liệu, và sửa chỉ một dòng nên có thể làm sớm.
  file: `pipeline/doc-gop-hang-ngay.sh`
  severity: low
  Đề xuất: known-limits

- **Lỗi bất ngờ (DB sập, lỗi SQL) thoát mã 1, trùng mã «mọi lời gọi hỏng» đã khai**
  Người dùng thấy gì: Khi cơ sở dữ liệu không lên, đêm đó báo giống như model hỏng hết, nên người trực dễ tìm sai chỗ khi xử lý.
  Căn cứ: Chỉ làm chẩn đoán chậm hơn, không mất hay sai dữ liệu; đêm sau chạy lại là bài chưa đọc được đọc tiếp.
  file: `agent/scripts/doc-gop-s03.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên «mã hỏng đầu tiên» nhưng ma trận mã của bước đêm thiếu ca hai bước cùng hỏng**
  Người dùng thấy gì: Chưa có phép kiểm nào chứng minh mã thoát khi cả hai ngày cùng hỏng là mã của ngày đầu, nên một thay đổi sai sau này có thể lọt mà không bị phát hiện.
  Căn cứ: Hành vi hiện tại chưa được chứng minh sai; rủi ro chỉ là lọt lỗi tương lai, người dùng không bị ảnh hưởng ngay và thêm ca kiểm rất rẻ.
  file: `agent/tests/doc-gop-hang-ngay.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — trần chia chung trong ngày chi chỉ đo trên dòng silver_labels viết tay đúng khuôn LIKE của bên đọc, không đo vòng ghi rồi đọc**
  Người dùng thấy gì: Chưa có phép kiểm nào chứng minh tiền do lượt đọc thật ghi ra được tính đúng vào trần của ngày, nên nếu ghi sai thì trần có thể không bao giờ chạm mà không ai biết.
  Căn cứ: Trần là chốt an toàn tiền nên đáng chú ý, nhưng hiện chưa thấy lỗi thật và chi phí mỗi lời gọi rất nhỏ; thêm ca kiểm vòng ghi rồi đọc là việc vừa phải, nên làm khi nghiệm thu đêm thật.
  file: `agent/tests/doc-gop-hang-ngay.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — assert `every` trên mảng có thể rỗng, không đối chứng số lần gọi**
  Người dùng thấy gì: Phép kiểm trần 7 USD có thể vẫn xanh dù bước đêm không gọi lần nào, nên chưa chắc đã chứng minh trần được truyền cho cả hai ngày.
  Căn cứ: Chỉ là kiểm thử lỏng, không ảnh hưởng người dùng; một dòng đếm bổ sung là sửa xong, làm lúc nào cũng được.
  file: `agent/tests/doc-gop-hang-ngay.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — ca `--cau-hinh` chỉ kiểm chữ «qwen» có mặt trong stderr, mà chữ đó cũng nằm sẵn trong tên tệp fixture**
  Người dùng thấy gì: Phép kiểm từ chối bảng chọn model sai chưa chứng minh được lý do từ chối, nên một lỗi đổi cách báo có thể lọt qua mà không ai biết.
  Căn cứ: Hành vi từ chối vẫn xảy ra theo kiểm thử hiện tại; rủi ro chỉ là bỏ sót hồi quy, không gây mất dữ liệu và sửa rẻ.
  file: `agent/tests/doc-gop-hang-ngay.test.ts`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
