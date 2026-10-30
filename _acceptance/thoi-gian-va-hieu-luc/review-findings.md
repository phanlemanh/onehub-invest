# Review findings: thoi-gian-va-hieu-luc (round 1)

## Trong hợp đồng

- **Hình dạng 5 (tuyên quét LỚP, chỉ có điểm-case): E7 tuyên «bộ itest PL16 chạy trên 059 vẫn xanh» nhưng cmd không chạy bac-du-lieu.itest.mjs**
  file:line: `_acceptance/thoi-gian-va-hieu-luc/evals.yaml:57`
  severity: medium
  AC: AC-7
  detail: E7 `expected` hứa một điều cho cả lớp: «bộ itest PL16 (bac-du-lieu.itest.mjs) chạy trên 059 vẫn xanh», tức AC-7 «mọi ca của AC-1…AC-4 PL16 vẫn trả như cũ». Nhưng `cmd: config:executors.test.tg_db` (config.yaml:101) chỉ chạy `node --test scripts/trang-thai-chao.itest.mjs`. bac-du-lieu.itest.mjs chỉ có tên trong `paths`, không được thực thi. Không eval nào khác của slug chạy tệp này: E12 chạy `npm test` của pipeline, mà glob của nó là `scripts/*.test.mjs` nên không gồm `.itest.mjs`; executor `bac_db` lại thuộc slug khác và trỏ DB khác (oneinvest_p2_bac). Vì vậy lời hứa «mọi ca PL16» không có phép đo nào sau 059, chỉ có sáu căn điểm-case PL19 trong kiemAC7.
  source: measurement
  rationale: AC-7 nêu rõ «mọi ca của AC-1…AC-4 PL16 vẫn trả như cũ», mà phép đo của E7 không chạy bộ thử PL16 nên vế này chưa được đo.

- **Hình dạng 4 (âm-tính-một-mình, không đối chứng dương): E10 «không nhân dòng history_transactional» đo trên DB chỉ có lược đồ, cả hai lần đều 0 dòng**
  file:line: `_acceptance/config.yaml:503`
  severity: medium
  AC: AC-9
  detail: `idem_059` chạy `db/check-idempotent-tam.sh`, script này dựng DB tạm bằng `pg_dump --schema-only ... oneinvest` và tự in «lược đồ chép từ oneinvest (không dữ liệu)». Bước điền lùi của 059 (dòng 429–432: `INSERT INTO history_transactional ... SELECT ... FROM sale_offer_records ON CONFLICT DO NOTHING`) vì thế chạy trên bảng tin rỗng, nên lần một và lần hai đều ra 0 dòng. Phép so «số dòng history_transactional không đổi» (E10 expected) xanh hiển nhiên: không có ràng buộc nào đòi lần một phải sinh dòng (>0), nên mất ON CONFLICT hay mất khoá duy nhất cũng không làm nó đỏ. Lời hứa AC-9 «059 chạy hai lần không nhân dòng ở history_transactional» chưa được đo.
  source: measurement
  rationale: AC-9 hứa «059 chạy hai lần không nhân dòng ở history_transactional», nhưng phép đo chạy trên DB rỗng nên lời hứa này chưa được kiểm thật.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe mgn_mu vẫn chèn field_assertions không có observed_at, sẽ gãy khi DB đã áp 059 (observed_at NOT NULL)**
  Người dùng thấy gì: Một bài kiểm nghiệm của tính năng gán nhãn mù sẽ báo đỏ sau khi nâng cấp này, dù sản phẩm không hỏng. Người dùng không thấy gì, nhưng cổng nghiệm thu của tính năng kia bị kẹt đỏ cho tới khi bài thử được cập nhật.
  Căn cứ: Hậu quả nhẹ với người dùng cuối vì chỉ là bài thử cũ chưa theo kịp quy tắc mới, không mất dữ liệu; nhưng nó chặn cổng của tính năng khác nên cần một việc riêng sửa bài thử đó.
  file: `_acceptance/man-gan-nhan-mu/probes/mu.mjs`
  severity: medium
  Đề xuất: new-contract

- **Test nạp nguyên DDL của 059 trong giao dịch chỉ giữ khoá 56056, không giữ 33033 như luật test nạp migration**
  Người dùng thấy gì: Khi hai bộ kiểm thử chạy cùng lúc trên cùng một cơ sở dữ liệu, chúng có thể treo hoặc báo lỗi chập chờn. Sản phẩm và dữ liệu thật không bị ảnh hưởng, chỉ cần chạy lại bộ thử.
  Căn cứ: Hậu quả nhẹ và tự khắc phục được bằng cách chạy lại, không đụng dữ liệu thật; ghi lại là hạn chế đã biết là đủ.
  file: `pipeline/scripts/bac-du-lieu.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Phat-bieu-db.itest nạp lại toàn bộ 045 sau 059 làm hàm chặn field_assertions_guard tụt về bản 045, và napLai059 không khôi phục lại**
  Người dùng thấy gì: Một số bài kiểm thử cũ về phát biểu đang chạy với phiên bản quy tắc chặn cũ, nên có thể báo xanh dù quy tắc mới có lỗi. Dữ liệu thật và sản phẩm không bị ảnh hưởng.
  Căn cứ: Chỉ làm giảm độ tin cậy của một bài thử, dữ liệu thật không đổi vì giao dịch thử luôn hoàn tác; sửa được sau mà không mất gì.
  file: `pipeline/scripts/phat-bieu-db.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (khẳng định quan hệ nhưng so giá trị với chính nó): «đếm độc lập» của AC-8 dùng đúng câu SQL của CLI**
  Người dùng thấy gì: Lệnh đếm trạng thái chào vẫn in đúng số liệu, nhưng phép tự kiểm tra con số đó chưa thật độc lập nên khó phát hiện nếu cách phân xử trạng thái sai. Người dùng có thể thấy số đếm trông hợp lý mà không được đối chiếu chéo.
  Căn cứ: Số đếm không sai và dữ liệu không bị mất hay hỏng; chỉ là phép tự kiểm yếu, có thể bổ sung sau mà người dùng không bị ảnh hưởng.
  file: `pipeline/scripts/trang-thai-roundtrip.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/6 lỗi rơi vào file không bộ đo nào phủ (_acceptance/man-gan-nhan-mu/probes/mu.mjs, _acceptance/thoi-gian-va-hieu-luc/evals.yaml, _acceptance/config.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
