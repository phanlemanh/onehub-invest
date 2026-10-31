# Review findings: sdt-luu-goc-e164 (round 2)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **sync-cloud vẫn giữ SHRINK_AUDIT.sellers trỏ tới audit 'bait-gap:sellers-orphan', nhưng refresh-bait-gap đã thôi ghi audit này (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu số người bán trên máy thu tụt mạnh so với bản trên cloud, lượt đồng bộ lên cloud sẽ dừng và không có cách giải thích hợp lệ, phải xử lý tay.
  Căn cứ: Chỉ xảy ra trong tình huống hiếm, không mất hay lộ dữ liệu, lượt đồng bộ dừng an toàn và sửa sau rẻ.
  file: `pipeline/sync-cloud.mjs`
  severity: medium
  Đề xuất: known-limits

- **060 sẽ được áp lên cả Supabase, nhưng sellers trên cloud là đích ghi của sync-cloud: thành view thì lượt tráo hỏng (r1)**
  Người dùng thấy gì: Khi áp thay đổi này lên cloud, bảng người bán trên cloud thành bảng tính sẵn không ghi được nữa, nên đồng bộ lên cloud có thể dừng hẳn.
  Căn cứ: Không mất dữ liệu nhưng làm kẹt đồng bộ cloud; cần xử lý trước khi triển khai lên cloud, sửa trước khi áp thì rẻ hơn nhiều.
  file: `db/migrations/060_sdt_e164.sql`
  severity: medium
  Đề xuất: new-contract

- **Code đổi sang E.164 mà không kiểm 060 đã áp chưa; trong khoảng giữa merge và lúc áp 060, các lượt chạy đêm hỏng hoặc dữ liệu lệch mà không báo (r1)**
  Người dùng thấy gì: Nếu code mới chạy đêm trước khi áp thay đổi cơ sở dữ liệu, bước dựng danh bạ có thể lỗi và nhãn người bán trên trang deals tạm biến mất.
  Căn cứ: Chỉ tạm thời trong khoảng chờ triển khai, tự hết khi áp đúng thứ tự; rủi ro giảm nếu áp ngay sau khi gộp.
  file: `pipeline/lib/danh-ba-nguoi.mjs`
  severity: medium
  Đề xuất: known-limits

- **Miễn trừ chặn tụt sellers của sync-cloud không bao giờ dùng được nữa vì refresh-bait-gap đã thôi ghi audit bait-gap:sellers-orphan (r1)**
  Người dùng thấy gì: Khi số người bán co lại đáng kể, đồng bộ lên cloud bị chặn và chỉ gỡ được bằng can thiệp tay.
  Căn cứ: Hiếm gặp, đồng bộ dừng an toàn không mất dữ liệu, và sửa sau không tốn kém.
  file: `pipeline/refresh-bait-gap.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert có mặt thay vì quan hệ): E4 chỉ kiểm tập con, không kiểm bằng nhau, không ghim số người, không kiểm mỗi số thuộc đúng một người (r1)**
  Người dùng thấy gì: Phép kiểm danh bạ có thể báo xanh dù một số điện thoại bị gán nhầm cho hai người hoặc có người thừa.
  Căn cứ: Chỉ làm lưới kiểm thưa hơn, người dùng không thấy ngay; lỗi dữ liệu thật vẫn có thể bắt bằng cách đo khác và nâng chặt sau rẻ.
  file: `_acceptance/sdt-luu-goc-e164/probes/do.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): đối chứng đỏ của E8 tự ném lỗi, không chạy qua bộ quét thật, và bộ quét thật yếu hơn lời hứa (4+ chữ số thay vì 3+) (r1)**
  Người dùng thấy gì: Phép kiểm che số trên trang danh sách người có thể bỏ sót trường hợp lộ ba chữ số cuối của số điện thoại.
  Căn cứ: Khe hở nhỏ, chưa có bằng chứng lộ thật, lộ chỉ vài chữ số; siết phép đo sau rẻ.
  file: `_acceptance/sdt-luu-goc-e164/probes/people.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): 'ba vai' của E8 thực ra là hai lời gọi khác nhau, vai admin lặp lại y hệt vai ops (r1)**
  Người dùng thấy gì: Phép kiểm báo đã thử ba vai nhưng thực chất chỉ khác biệt hai, nên khác biệt riêng của quản trị viên (nếu có) chưa được kiểm.
  Căn cứ: Rủi ro thấp vì mã đọc dữ liệu không phân vai, không lộ dữ liệu đã thấy, và bổ sung sau rẻ.
  file: `_acceptance/sdt-luu-goc-e164/probes/people.tsx`
  severity: low
  Đề xuất: known-limits

- **SHRINK_AUDIT của sellers vẫn còn trong sync-cloud nhưng audit bait-gap:sellers-orphan không còn ai ghi, nên khi sellers co lại sync bị chặn mà không có đường gỡ (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi danh sách người bán co lại nhiều, việc đẩy dữ liệu lên cloud có thể tự dừng mà không có cách gỡ sẵn. Cloud giữ số liệu cũ cho tới khi có người can thiệp.
  Căn cứ: Không mất dữ liệu và chỉ dừng cập nhật cloud, nhưng cần người xử lý; sửa sau rẻ nên ghi lại là hạn chế đã biết.
  file: `pipeline/sync-cloud.mjs`
  severity: medium
  Đề xuất: known-limits

- **Migration 060 thiếu dòng «không áp tệp này lên Supabase», dù tệp bỏ bảng sellers mà sync đang đẩy lên cloud và dựng view trên bảng chỉ có ở máy thu (r1)**
  Người dùng thấy gì: Tệp cập nhật cấu trúc dữ liệu không ghi rõ là chỉ dành cho máy thu. Nếu ai lỡ áp lên cloud thì sẽ báo lỗi.
  Căn cứ: Chỉ là thiếu ghi chú, nếu áp nhầm thì lỗi hiện ngay và không mất dữ liệu; công sửa nhỏ nhưng hậu quả nhẹ.
  file: `db/migrations/060_sdt_e164.sql`
  severity: low
  Đề xuất: wont-fix

- **fmtPhone trên thẻ Căn giá tốt không còn khớp số E.164, SĐT hiện liền một khối (r1 · tệp đã đổi)**
  Người dùng thấy gì: Trên thẻ Căn giá tốt, số điện thoại người bán hiện liền một khối thay vì tách nhóm cho dễ đọc. Bấm gọi vẫn dùng được.
  Căn cứ: Chỉ sai cách hiển thị, không mất hay lộ dữ liệu, bấm gọi vẫn chạy; nên sửa trong một việc nhỏ riêng.
  file: `app/src/components/ops/deal-card.tsx`
  severity: low
  Đề xuất: new-contract

- **JSDoc của hienBiDanh bị tách khỏi hàm: hằng NHAN_CHE_SDT chen vào giữa (r1)**
  Người dùng thấy gì: Không ảnh hưởng người dùng; chỉ là chú thích trong mã nằm sai chỗ.
  Căn cứ: Người dùng không thấy gì, không có rủi ro dữ liệu; sửa không đáng mở việc riêng.
  file: `app/src/lib/ops/people.ts`
  severity: low
  Đề xuất: wont-fix

- **Code mới chạy ngay khi merge nhưng phụ thuộc 060 chưa áp; transform chạy trước 060 làm hỏng bước 3 của migration (khoá căn mồ côi vĩnh viễn) (r1)**
  Người dùng thấy gì: Nếu bản mới chạy đêm trước khi cập nhật cấu trúc dữ liệu được áp, một số căn có thể mất liên kết với số điện thoại cũ và danh bạ báo lỗi mỗi đêm. Việc này chỉ xảy ra nếu triển khai sai thứ tự.
  Căn cứ: Hậu quả có thể khó phục hồi nếu xảy ra, nhưng chỉ khi làm sai thứ tự triển khai; ghi rõ thứ tự bắt buộc là đủ cho lần này.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: known-limits

- **sync-cloud vẫn chờ audit 'bait-gap:sellers-orphan' mà không còn chỗ nào ghi: lần co hợp lệ của sellers sẽ chặn sync và không giải thích được (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi danh sách người bán co hợp lệ, việc đẩy dữ liệu lên cloud sẽ dừng mà không có lời giải thích. Cloud tạm giữ số cũ.
  Căn cứ: Chỉ làm cloud chậm cập nhật, không mất hay lộ dữ liệu, xử lý thủ công được; ghi lại là hạn chế đã biết.
  file: `pipeline/sync-cloud.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert có mặt thay cho QUAN HỆ): E4 chỉ đo tập con, không đo 'đúng ảnh', không kiểm số người bằng nhau (r1)**
  Người dùng thấy gì: Bộ kiểm tra danh bạ có thể bỏ sót trường hợp một người mang thêm số lạ hoặc một số gắn cho hai người. Nghĩa là kết quả xanh chưa đủ chắc chắn.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp nhưng làm giảm độ tin của phép nghiệm thu; nên làm chặt bộ đo trong một việc riêng.
  file: `_acceptance/sdt-luu-goc-e164/probes/do.mjs`
  severity: high
  Đề xuất: new-contract

- **Hình dạng 3 (assert có mặt thay cho QUAN HỆ): kiemTen của E5 nới quan hệ 'bí danh ten còn hiệu lực của người mang bí danh sdt cùng số' (r1)**
  Người dùng thấy gì: Bộ kiểm tra tên người bán có thể coi là đạt dù tên nằm sai người hoặc đã nghỉ. Kết quả xanh chưa chứng minh tên gắn đúng người.
  Căn cứ: Chỉ làm phép kiểm lỏng, không mất dữ liệu; sửa bộ đo là việc nhỏ, tách riêng.
  file: `_acceptance/sdt-luu-goc-e164/probes/do.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): khoá căn của E3 do probe tự băm rồi chính probe kiểm lại (r1)**
  Người dùng thấy gì: Phép kiểm khoá căn dùng chính cách băm của bộ kiểm tra nên không phát hiện nếu hệ thống thật băm khác. Chưa có bằng chứng độc lập rằng căn vẫn khớp.
  Căn cứ: Rủi ro chỉ lộ ra khi chạy trên dữ liệu thật, nơi bước triển khai có kiểm lại; ghi lại là hạn chế của bộ đo.
  file: `_acceptance/sdt-luu-goc-e164/probes/do.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): phép quét chữ số trên dữ liệu thật của people.tsx không có đối chứng trên cùng vị từ (r1)**
  Người dùng thấy gì: Phép kiểm 'không lộ số điện thoại' trên trang danh bạ có thể bỏ sót một số kiểu lộ. Chưa có bằng chứng thật là đang lộ.
  Căn cứ: Nếu lọt thì lộ số ra màn hình nội bộ nên đáng làm chặt, nhưng chưa có dấu hiệu lộ thật; sửa bộ đo rẻ.
  file: `_acceptance/sdt-luu-goc-e164/probes/people.tsx`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): 'nghỉ sdt_bam bằng retired_at, không DELETE' được đo bằng regex trên chuỗi SQL (r1)**
  Người dùng thấy gì: Một bài kiểm tra chỉ đọc văn bản câu lệnh chứ không chạy thật, nên có thể xanh dù hành vi sai. Phép đo trên dữ liệu thật vẫn có ở nơi khác.
  Căn cứ: Đã có phép đo trạng thái dữ liệu thật bù lại, hậu quả nhẹ nên chấp nhận.
  file: `pipeline/scripts/danh-ba-nguoi.test.mjs`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
