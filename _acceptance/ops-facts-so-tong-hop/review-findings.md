# Review findings: ops-facts-so-tong-hop (round 1)

## Trong hợp đồng

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): AC-7 tuyên «các khối còn lại vẫn đo» nhưng chỉ assert một khối lockdown**
  AC: AC-7
  file: `pipeline/scripts/ops-facts-so-tong-hop.test.mjs:179`
  severity: medium
  source: measurement
  detail: Contract AC-7 hứa một quan hệ trên toàn bộ năm khối: khối hỏng mang {measured_at, error}, còn mọi khối khác vẫn đo. Nhưng trong vòng lặp MATRIX, phần «khối khác» chỉ có `assert.equal(r.payload.blocks.lockdown.error, undefined, ...)`. Lockdown đọc từ tệp log và probe, không dùng client pg, nên nó luôn xanh dù các khối DB làm gì. Ba khối dùng chung client pg (freshness, records24h, reviewQueue, chạy tuần tự ở push-ops-facts.mjs main) không được kiểm chéo. Ví dụ một hồi quy làm lỗi dây chuyền: bọc các lệnh đọc trong transaction, câu đầu hỏng thì các câu sau báo «current transaction is aborted». Khi đó ca `freshness` (omit stg_chotot_ads) sẽ biến records24h và reviewQueue thành error, mà phép đo vẫn xanh. Thiếu ma trận viết trước kiểu: với mỗi khối hỏng, mỗi khối còn lại trong BLOCKS phải không có `error`.

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): AC-6 «mỗi nhãn của pipeline/cron» nhưng đáp án viết tay 2 nhãn, bản chụp không có nhãn ngoài cron, pid và lastLogAt mỗi thứ chỉ một nhánh**
  AC: AC-6
  file: `pipeline/scripts/ops-facts-so-tong-hop.test.mjs:132`
  severity: medium
  source: measurement
  detail: Tên ca và contract AC-6 hứa: một hàng cho MỖI nhãn khai trong pipeline/cron/*.plist có mặt trong bản chụp; `pid`/`lastExit` đúng bản chụp; `lastLogAt` là mtime, hoặc `null` khi tệp vắng. Phép đo không phủ hết lời hứa đó: (1) `want` viết tay `["com.oneinvest.chotot", "com.oneinvest.smoke"]`, không suy từ giao của 12 plist trong pipeline/cron với bản chụp. (2) Bản chụp scripts/fixtures/launchctl-list-2026-10-23.txt chỉ có 2 dòng và cả hai đều là nhãn đã khai. Không có nhãn sống nào nằm ngoài cron (com.apple.* ...), nên nếu readLaunchdJobs bỏ mất phép lọc theo cron (`if (!l) continue` / lặp theo `declared`) và trả mọi nhãn launchctl thì ca vẫn xanh. (3) Cả hai dòng đều có pid `-`: chỉ nhánh `pid === null`, `running === false` được assert (dòng 136-138), nhánh pid số / running=true chưa từng chạy. (4) Cả hai tệp log đều được LOGS() tạo, nên nhánh `lastLogAt = null` khi tệp vắng mà contract nêu rõ không có ca nào. Lời hứa nói về cả lớp nhưng phép đo chỉ có một điểm.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **ops-local.mjs hardcode tên luồng thu (literal nguồn) thay vì đọc source_ids từ source_registry**
  Người dùng thấy gì: Danh sách luồng thu dùng để đếm bản ghi 24 giờ được viết cứng ở một chỗ nữa. Nếu sau này một nguồn đổi tên luồng, số bản ghi theo nguồn trên trang Ops sẽ lệch mà không ai được báo.
  Căn cứ: Hiện số đúng và không lộ dữ liệu nhạy cảm; rủi ro chỉ xảy ra khi có người đổi cấu hình nguồn, và sửa sau không đắt.
  file: `scripts/lib/ops-local.mjs`
  severity: low
  Đề xuất: known-limits

- **sourceRunsQ bắt mọi lỗi của truy vấn đầy đủ, không ghi log, rồi lặng lẽ trả last_run/items_24h/offers = null**
  Người dùng thấy gì: Khi truy vấn chạy gần nhất của từng nguồn gặp lỗi bất kỳ, hệ thống vẫn gửi lên với số trống và không để lại dấu vết. Trang Ops có thể hiện thiếu thông tin về lần chạy mà không ai biết vì sao.
  Căn cứ: Cloud hiện chỉ đọc tên và nhãn của phần này nên người dùng gần như không thấy ảnh hưởng, và sau này thêm cảnh báo thì không mất dữ liệu.
  file: `pipeline/push-ops-facts.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
