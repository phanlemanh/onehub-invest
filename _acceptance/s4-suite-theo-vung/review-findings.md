# Review findings — s4-suite-theo-vung (round 3)

## Trong hợp đồng

- **suite-neu-doi bỏ sót tệp bị đổi tên/di chuyển RA KHỎI vùng → suite xanh giả**
  AC: AC-2
  file: `scripts/suite-neu-doi.mjs:102`
  severity: medium
  source: bugs
  detail: tepDoi() dựng tập tệp đổi bằng `git diff --name-only <merge-base> HEAD`. Git bật rename detection mặc định, nên một lần `git mv` chỉ in đường ĐÍCH, không in đường NGUỒN. Tệp chuyển ra khỏi vùng của một suite không bao giờ được tính là «đổi trong vùng» của suite đó, và suite bị bỏ qua với mã thoát 0 dù module của nó vừa mất một tệp. Repro: `git mv agent/x.ts collector/src/x.ts && git commit`, rồi `SUITE_NEU_DOI_BASE=goc node scripts/suite-neu-doi.mjs agent -- 'echo DA-CHAY'` cho «bỏ qua agent», lệnh không chạy. Nguy hiểm nhất với portal_static (không có trong CI, chỉ chạy ở lượt chấm). Ca này không có trong thước S4V-AC-1..AC-4. Cách sửa: thêm `--no-renames` (hoặc `--name-status -M` rồi gom cả hai cột) cho hai lệnh diff.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **evals.yaml E3 còn ghi «6 suite = 24 ô» trong khi thước đo 7 suite = 28 assert**
  Người dùng thấy gì: Hồ sơ nghiệm thu ghi sai số ô kiểm (24 thay vì 28), người chấm đọc có thể bối rối nhưng công cụ chạy đúng.
  Căn cứ: Chỉ là chữ trong hồ sơ, không ảnh hưởng người dùng, sửa một dòng lúc nào cũng được.
  file: `_acceptance/s4-suite-theo-vung/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Test AC-7 không rửa DUNG_WT_CHINH khỏi môi trường thừa kế — có thể chạy vào checkout chính thật**
  Người dùng thấy gì: Nếu máy chấm tình cờ có sẵn một biến môi trường riêng, bài kiểm có thể chạy trên thư mục thật thay vì thư mục thử và báo đỏ khó hiểu.
  Căn cứ: Chỉ xảy ra khi môi trường bất thường, hậu quả là kết quả kiểm sai chứ không mất dữ liệu, chạy lại trong môi trường sạch là hết.
  file: `scripts/dung-worktree-cham.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **quetNgoai đọc mọi đường của git ls-files mà không chắn ENOENT — lệch mẫu matGiuaChung có sẵn trong scripts/**
  Người dùng thấy gì: Khi có tệp bị xoá trên đĩa mà chưa commit, bài kiểm vùng phủ sẽ báo lỗi khó hiểu thay vì nói rõ nguyên nhân.
  Căn cứ: Chỉ làm đỏ giả tạm thời ở máy đang làm dở, commit hoặc khôi phục tệp là hết, không mất dữ liệu.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **NGOAI_LE của AC-5 ghim vào chuỗi trong chú thích của module khác — làm job scripts của CI đỏ theo PR không liên quan**
  Người dùng thấy gì: Sửa một dòng chú thích ở nơi khác có thể làm kiểm tự động đỏ, khiến người làm mất thời gian dò nguyên nhân.
  Căn cứ: Gây phiền cho người làm chứ không ảnh hưởng người dùng cuối, và tự sửa được ngay bằng cập nhật danh sách ngoại lệ.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **dung-worktree-cham.sh nuốt cờ sai vị trí hoặc gõ nhầm mà vẫn chạy tiếp**
  Người dùng thấy gì: Gõ sai tên cờ thì lệnh dựng vẫn chạy bước kiểm kiểu tốn vài phút thay vì báo lỗi ngay.
  Căn cứ: Chỉ tốn thời gian, không mất dữ liệu, người dùng gõ lại đúng là xong.
  file: `scripts/dung-worktree-cham.sh`
  severity: low
  Đề xuất: known-limits

- **dung-worktree-cham nối nhầm node_modules của thư mục sinh app/.next sang checkout chính**
  Người dùng thấy gì: Sau khi đã dựng app trong thư mục chấm, chạy lại lệnh dựng có thể nối nhầm thư mục sinh sang checkout chính, làm kết quả kiểm kiểu lẫn sản phẩm dựng của nhánh khác.
  Căn cứ: Chỉ ảnh hưởng độ chính xác lượt chấm, xoá thư mục sinh rồi dựng lại là hết, không mất dữ liệu.
  file: `scripts/dung-worktree-cham.sh`
  severity: medium
  Đề xuất: known-limits

- **next typegen lỗi bị nuốt hoàn toàn rồi âm thầm rơi về .next/types cũ, vẫn in «sinh … (next typegen)»**
  Người dùng thấy gì: Khi bước sinh kiểu hỏng, lệnh vẫn báo thành công và có thể dùng kiểu cũ, nên kiểm kiểu có thể xanh hoặc đỏ sai.
  Căn cứ: Chỉ làm sai kết quả chấm, chạy lại sau khi sửa môi trường là đúng, không mất dữ liệu.
  file: `scripts/dung-worktree-cham.sh`
  severity: medium
  Đề xuất: known-limits

- **evals.yaml E3 expected còn «6 suite = 24 ô» trong khi thước đã là 7 suite / 28 assert**
  Người dùng thấy gì: Hồ sơ nghiệm thu còn ghi số cũ sáu suite ở vài chỗ, dễ gây hiểu nhầm cho người đọc.
  Căn cứ: Chỉ là chữ trong tài liệu, không ảnh hưởng người dùng, sửa nhanh lúc nào cũng được.
  file: `_acceptance/s4-suite-theo-vung/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Phép quét canh phủ AC-5 bỏ im lặng mọi import không đuôi và alias @/ — lưới thưa hơn lời AC-5**
  Người dùng thấy gì: Một tham chiếu viết kiểu rút gọn từ module này sang module khác có thể lọt khỏi phép kiểm vùng phủ, khiến lượt chấm bỏ sót suite.
  Căn cứ: Hôm nay chưa có ca nào vỡ và CI vẫn chạy đủ suite làm lưới đỡ, nên rủi ro thấp.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Đo CHỈ DẪN thay vì ĐẦU RA — S4V-AC-6 đọc config.yaml bằng regex riêng, không bằng bộ đọc mà làn ghim lại dùng**
  Người dùng thấy gì: Nếu ai đó dời khối cấu hình sai chỗ, bài kiểm vẫn xanh nhưng bước ghim lại sẽ hỏng, chỉ lộ ra khi chạy thật.
  Căn cứ: Chỉ xảy ra khi có người sửa cấu hình sai và sẽ lộ ngay ở lần ghim kế tiếp, sửa lại là xong.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Fixture VIẾT TAY đúng khuôn bên đọc — fake `next typegen` chỉ sinh đúng dạng mà perl rewrite mong đợi**
  Người dùng thấy gì: Bài kiểm dựng worktree dùng dữ liệu giả quá khớp nên có thể không bắt được lỗi với kiểu thật.
  Căn cứ: Chỉ làm bài kiểm kém sắc, lỗi nếu có sẽ lộ ở lượt chấm thật và chạy lại được.
  file: `scripts/dung-worktree-cham.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình — vế «chạy lại không đổi gì» chỉ là doesNotMatch ba từ chưa bao giờ được ghim dương**
  Người dùng thấy gì: Bài kiểm vế chạy lại không đổi gì khá yếu nên có thể xanh dù thông điệp thay đổi.
  Căn cứ: Chỉ giảm độ tin cậy của bài kiểm, không ảnh hưởng người dùng và củng cố sau cũng được.
  file: `scripts/dung-worktree-cham.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Ma trận viết-trước khai sai số ô — eval nói 24 assert, mã chốt 28, chú thích config nói 18**
  Người dùng thấy gì: Ba tài liệu ghi ba con số khác nhau cho cùng một ma trận kiểm, dễ làm người đọc nghi ngờ.
  Căn cứ: Chỉ là chữ trong hồ sơ, không ảnh hưởng người dùng, sửa nhanh bất cứ lúc nào.
  file: `_acceptance/s4-suite-theo-vung/evals.yaml`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/14 lỗi rơi vào file không bộ đo nào phủ (_acceptance/s4-suite-theo-vung/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
