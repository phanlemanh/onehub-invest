# Review findings: ranh-gioi-khu-vuc-dung (round 1)

## Trong hợp đồng

- **Hình dạng 4 (assertion âm tính một mình): AC-9 «không xoá gì» đo sau ROLLBACK TO SAVEPOINT nên không bao giờ đỏ được**
  AC: AC-9
  file:line: pipeline/scripts/reassign-areas.test.mjs:211
  severity: high
  source: measurement
  detail: Ca 'AU9-AC-9 snapshot mất tag admin_level → dừng, không xoá gì' đặt `SAVEPOINT au9` (l.211), chạy runReassign và chờ nó ném lỗi (l.212), rồi `ROLLBACK TO SAVEPOINT au9` (l.213), sau đó mới so `deepEqual(await dem3(), truoc)` (l.214). Lần rollback về savepoint xoá sạch mọi thay đổi runReassign đã làm trước khi ném lỗi, nên phép so số dòng areas/listings/market_metrics trước và sau luôn bằng nhau, dù code có xoá hay không. Ví dụ: nếu chốt an toàn ở reassign-areas.mjs l.151–155 bị dời xuống sau bước xoá (bước 3–5), ca này vẫn xanh. Rollback về savepoint cũng không cần: runReassign ném Error của JS chứ không phải lỗi SQL, nên transaction không bị hỏng và vẫn đo trực tiếp được. Nửa «không xoá khu vực, listing hay metrics nào» của AC-9 vì vậy chưa có phép đo nào đỏ được; chỉ phần thông điệp lỗi (regex) là có giá trị đo.
  Lý do vào hợp đồng: AC-9 nêu rõ vế «không xoá khu vực, listing hay metrics nào» và phép đo vế này luôn xanh sau rollback nên AC-9 không được chứng minh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bước 5 xoá khu vực lạc nhưng không gỡ market_asset_stats/properties, mà hai bảng này có FK NO ACTION tới areas, nên DELETE có thể hỏng cả lượt reassign**
  Người dùng thấy gì: Nếu sau này một khu vực lạc có đủ tin bán hoặc có căn nhà gắn vào, bước dọn khu vực sai sẽ báo lỗi và dừng cả lượt tính lại hàng đêm. Số liệu khu vực khi đó không được cập nhật cho đến khi có người xử lý.
  Căn cứ: Hôm nay chưa xảy ra và không mất dữ liệu (lượt chạy tự huỷ an toàn, chạy lại được), nhưng khi xảy ra sẽ làm đứng dữ liệu hằng đêm; sửa lúc này rẻ, để sau phải gỡ rối giữa đêm.
  file: `pipeline/reassign-areas.mjs`
  severity: medium
  Đề xuất: new-contract

- **E1 trong evals.yaml đòi một ca test không tồn tại: 'AU9-AC-1 ranh giới cấp 4 bao Hà Nội không vào areas'**
  Người dùng thấy gì: Phần mô tả bằng chứng kiểm tra viết tên một ca kiểm không có thật, nên người đối chiếu có thể không tìm thấy dòng khớp. Người dùng cuối không bị ảnh hưởng gì.
  Căn cứ: Chỉ là lệch chữ trong hồ sơ nghiệm thu, hành vi thật vẫn được kiểm; nhẹ, không mất dữ liệu và sửa lại bất cứ lúc nào.
  file: `_acceptance/ranh-gioi-khu-vuc-dung/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **check_name DQ mới đặt kiểu snake_case lai tiếng Việt, lệch quy ước kebab-case tiếng Anh của 450_dq_checks.sql**
  Người dùng thấy gì: Tên của phép kiểm chất lượng mới không cùng kiểu với các phép kiểm cũ trên màn hình vận hành. Chỉ gây khó đọc cho người vận hành, không đổi số liệu.
  Căn cứ: Chỉ là cách đặt tên, không ảnh hưởng người dùng hay dữ liệu; đổi càng sớm càng rẻ nhưng không gấp và phải sửa cả hợp đồng.
  file: `pipeline/sql/450_dq_checks.sql`
  severity: low
  Đề xuất: known-limits

- **Bước 5 xoá khu vực lạc nhưng không dọn market_asset_stats và properties (khoá ngoại NO ACTION), nên cả lượt reassign bị huỷ**
  Người dùng thấy gì: Nếu một khu vực lạc về sau có nhiều tin bán hoặc có căn nhà gắn vào, việc dọn khu vực sai sẽ lỗi và cả lượt cập nhật khu vực hằng đêm bị huỷ. Bản đồ và số liệu khu vực sẽ đứng yên cho đến khi có người sửa.
  Căn cứ: Chưa xảy ra hôm nay và không làm mất dữ liệu (lượt chạy hoàn tác nguyên vẹn), nhưng khi xảy ra sẽ lặp lại mỗi đêm; sửa bây giờ rẻ hơn nhiều so với gỡ rối sau.
  file: `pipeline/reassign-areas.mjs`
  severity: medium
  Đề xuất: new-contract

- **Test Finder AC-8 nằm trong suite app_ui chạy mọi vòng và đòi DB đang hỏng, nên đỏ vĩnh viễn sau khi áp thật**
  Người dùng thấy gì: Sau khi dữ liệu Hà Nội được sửa thật, một phép kiểm tự động của bản đồ tìm kiếm sẽ báo đỏ mãi vì nó đòi dữ liệu còn sai. Điều này làm các lần nghiệm thu tính năng khác báo lỗi giả.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu, nhưng gây báo lỗi giả cho mọi lần nghiệm thu sau; sửa sau khi áp thật thì phải dựng lại phép kiểm, nên làm sớm là rẻ nhất.
  file: `app/tests/finder-ranh-gioi.test.tsx`
  severity: medium
  Đề xuất: new-contract

- **Eval E1 đòi một ca test không có trong tệp test**
  Người dùng thấy gì: Hồ sơ bằng chứng nêu một ca kiểm không có tên như vậy, người chấm phải tự diễn giải. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ là lệch chữ trong tài liệu nghiệm thu, hành vi thật vẫn được kiểm; nhẹ và sửa lúc nào cũng được.
  file: `_acceptance/ranh-gioi-khu-vuc-dung/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): AC-4 chỉ khẳng định lần chạy hai rỗng, không có đối chứng dương ở lần một**
  Người dùng thấy gì: Phép kiểm 'chạy lại không đổi gì' chưa chứng minh lần chạy đầu thật sự có đổi, nên có thể xanh dù bước ghi kết quả sai. Người dùng không thấy ngay, chỉ giảm độ chắc của phép kiểm.
  Căn cứ: Không tác động trực tiếp đến dữ liệu người dùng, các ca khác vẫn đo kết quả dời và xoá; thêm đối chứng sau này vẫn rẻ.
  file: `pipeline/scripts/reassign-areas.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên một lớp nhưng chỉ có một điểm): AC-9 «rỗng HOẶC dưới một nửa» chỉ có ca rỗng**
  Người dùng thấy gì: Chốt an toàn khi dữ liệu ranh giới bị hỏng một phần chưa có phép kiểm riêng, nên nếu ngưỡng bị đổi nhầm sau này sẽ không ai báo. Hiện hành vi vẫn đúng.
  Căn cứ: Hành vi hiện tại đúng và chốt rộng nhất đã được kiểm; chỉ là thiếu lưới an toàn cho thay đổi tương lai, thêm ca kiểm sau này rẻ.
  file: `pipeline/scripts/reassign-areas.test.mjs`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/9 lỗi rơi vào file không bộ đo nào phủ (_acceptance/ranh-gioi-khu-vuc-dung/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

