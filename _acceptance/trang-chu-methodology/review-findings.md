# Review findings: trang-chu-methodology (round 2)

## Trong hợp đồng

- **Hình dạng 1 (đo chỉ dẫn/cấu trúc thay vì đầu ra): sau khi bỏ E21, lời hứa AC-7 «navbar và chân trang vẫn hiện» chỉ còn đo bằng chuyện tệp error.tsx có tồn tại**
  file: `_acceptance/trang-chu-methodology/evals.yaml:75`
  severity: medium
  AC: AC-7
  source: measurement
  detail: Vòng này xoá E21 (ui-check: vẽ một trang marketing ném lỗi rồi ghi thứ tự DOM header < role=alert < footer, chụp sáng/tối/375). AC-7 trong contract.md:47 hứa khi một trang marketing ném lỗi thì navbar và chân trang vẫn hiện. Giờ chỉ còn E10 đo phần này, và E10 đo bằng app/tests/trang-chu-methodology.test.tsx:278 `assert.ok(existsSync(join(dir, "error.tsx")) && existsSync(join(dir, "layout.tsx")))`. Phép này kiểm vị trí tệp, rồi suy ra hành vi từ quy ước của Next. Phần còn lại của ca chỉ vẽ MarketingError đứng một mình trong jsdom, không có layout, nên không có header hay footer nào để quan sát. Không còn phép đo nào trên đầu ra thật, kiểu một trang marketing lỗi được vẽ ra có header/footer bao quanh Alert. Nếu layout bỏ navbar/footer, hoặc ranh giới lỗi bị đẩy lên trên layout (ví dụ thêm `error.tsx` vào chỗ khác, hoặc layout ném lỗi trước), E10 vẫn xanh.
  rationale: AC-7 hứa khi trang marketing lỗi thì navbar và chân trang vẫn hiện; sau khi bỏ E21 không còn phép đo nào trên đầu ra thật cho vế này, nên lời hứa của AC-7 không được chứng minh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chú thích executor trang_chu_loi_db_smoke vẫn ghi cổng cố định :3462**
  Người dùng thấy gì: Người chạy tay đọc ghi chú có thể hiểu sai cách bộ kiểm chọn cổng. Khách truy cập không bị ảnh hưởng gì.
  Căn cứ: Chỉ là một dòng ghi chú cho người vận hành, không đổi gì với khách, và ai đọc nhầm vẫn chạy lại được ngay; sửa sau rất rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits
- **Ảnh trang lỗi toàn cục thay cho E22 nằm ngoài hồ sơ, và E19 không đòi screenshot**
  Người dùng thấy gì: Trang lỗi toàn cục vẫn hoạt động như hứa, nhưng người ký không có sẵn ảnh sáng/tối của trang này trong hồ sơ để xem lại.
  Căn cứ: Không ảnh hưởng gì đến khách; chỉ làm người ký khó tự nhìn lại, và ảnh vẫn chụp lại được bất cứ lúc nào bằng lệnh kiểm.
  file: `_acceptance/trang-chu-methodology/evals.yaml`
  severity: low
  Đề xuất: known-limits
- **E16-network.txt là bản tóm tắt viết tay, không phải output gốc của công cụ**
  Người dùng thấy gì: Hồ sơ nghiệm thu có một tệp bằng chứng mạng chỉ là bản tóm tắt tay nên không đối chiếu được với kết quả gốc. Trang Phương pháp với khách không đổi.
  Căn cứ: Không có tác động nào lên khách; chỉ là bằng chứng kém chặt hơn và chạy lại công cụ là có bản gốc ngay.
  file: `_acceptance/trang-chu-methodology/evidence/E16-network.txt`
  severity: low
  Đề xuất: known-limits

- **config.yaml: thiếu dấu cách sau dấu hai chấm ở khoá methodology_design_gate nên tệp không còn là YAML hợp lệ (r1)**
  Người dùng thấy gì: Khách dùng trang chủ và trang Phương pháp không bị ảnh hưởng. Chỉ có rủi ro cho người vận hành: nếu công cụ nghiệm thu sau này đọc tệp cấu hình bằng bộ đọc chuẩn, cả cổng nghiệm thu có thể báo hỏng.
  Căn cứ: Không đụng tới khách; hiện cổng vẫn chạy bình thường, và lỗi chỉ lộ ra ở phía vận hành nếu công cụ đổi cách đọc, nên có thể ghi lại và sửa sau với chi phí rất thấp.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **catalog.md ghi luật «error.tsx của mỗi nhóm cổng truyền retry, không reset» nhưng (app)/error.tsx và ops/error.tsx vẫn dùng reset (r1)**
  Người dùng thấy gì: Ở khu Invest-app và khu Ops, nút «Thử lại» khi gặp lỗi dữ liệu vẫn chỉ vẽ lại phía trình duyệt nên lỗi có thể lặp lại cho tới khi tải lại trang. Tài liệu mô tả như thể đã đổi hết.
  Căn cứ: Khách tự gỡ được bằng cách tải lại trang, không mất dữ liệu, và việc này đã được hợp đồng chủ động để cho nhóm trang app xử lý riêng.
  file: `.claude/skills/onehub-ui/catalog.md`
  severity: low
  Đề xuất: known-limits

- **config.yaml: thiếu dấu cách sau dấu hai chấm ở methodology_design_gate làm cả file thành YAML không hợp lệ (r1)**
  Người dùng thấy gì: Khách dùng trang chủ và trang Phương pháp không thấy gì khác. Chỉ người vận hành có thể gặp lỗi nếu công cụ nghiệm thu đọc tệp cấu hình theo cách chuẩn hơn.
  Căn cứ: Không ảnh hưởng người dùng cuối, hiện cổng vẫn chạy và sửa rất rẻ, nên ghi lại là đủ.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **smoke-trang-chu-loi-db: khối finally chờ sự kiện 'exit' đã phát rồi, nên khi `next start` chết sớm thì log lỗi và danh sách FAIL bị mất (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khách không bị ảnh hưởng. Khi bài kiểm tra trang lỗi lúc cơ sở dữ liệu sập tự thất bại sớm, người chạy kiểm tra mất phần giải thích nguyên nhân dù vẫn thấy kết quả đỏ.
  Căn cứ: Chỉ làm người kiểm tra khó tìm nguyên nhân hơn, không mất dữ liệu và không cho kết quả xanh giả; chạy lại là xem được.
  file: `scripts/smoke-trang-chu-loi-db.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 3: hứa so le chẵn/lẻ nhưng chỉ kiểm lớp có mặt, không kiểm lớp vắng ở ô khác (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu có ô nào mang thừa đường kẻ hoặc thụt lề sai, lưới định nghĩa trên trang Phương pháp có thể trông lệch nhẹ ở khổ rộng mà bài kiểm tra không báo.
  Căn cứ: Chỉ là lệch thẩm mỹ nhẹ, nội dung vẫn đọc đầy đủ, không mất dữ liệu và sửa sau rất rẻ.
  file: `app/tests/trang-chu-methodology.test.tsx`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 4/4 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml, _acceptance/trang-chu-methodology/evals.yaml, _acceptance/trang-chu-methodology/evidence/E16-network.txt) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
