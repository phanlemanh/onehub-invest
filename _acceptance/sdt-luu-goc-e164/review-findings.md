## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **sync-cloud vẫn giữ SHRINK_AUDIT.sellers trỏ tới audit 'bait-gap:sellers-orphan', nhưng refresh-bait-gap đã thôi ghi audit này**
  Người dùng thấy gì: Nếu số người bán trên máy thu tụt mạnh so với bản trên cloud, lượt đồng bộ lên cloud sẽ dừng và không có cách giải thích hợp lệ, phải xử lý tay.
  Căn cứ: Chỉ xảy ra trong tình huống hiếm, không mất hay lộ dữ liệu, lượt đồng bộ dừng an toàn và sửa sau rẻ.
  file: `pipeline/sync-cloud.mjs`
  severity: medium
  Đề xuất: known-limits

- **060 sẽ được áp lên cả Supabase, nhưng sellers trên cloud là đích ghi của sync-cloud: thành view thì lượt tráo hỏng**
  Người dùng thấy gì: Khi áp thay đổi này lên cloud, bảng người bán trên cloud thành bảng tính sẵn không ghi được nữa, nên đồng bộ lên cloud có thể dừng hẳn.
  Căn cứ: Không mất dữ liệu nhưng làm kẹt đồng bộ cloud; cần xử lý trước khi triển khai lên cloud, sửa trước khi áp thì rẻ hơn nhiều.
  file: `db/migrations/060_sdt_e164.sql`
  severity: medium
  Đề xuất: new-contract

- **Code đổi sang E.164 mà không kiểm 060 đã áp chưa; trong khoảng giữa merge và lúc áp 060, các lượt chạy đêm hỏng hoặc dữ liệu lệch mà không báo**
  Người dùng thấy gì: Nếu code mới chạy đêm trước khi áp thay đổi cơ sở dữ liệu, bước dựng danh bạ có thể lỗi và nhãn người bán trên trang deals tạm biến mất.
  Căn cứ: Chỉ tạm thời trong khoảng chờ triển khai, tự hết khi áp đúng thứ tự; rủi ro giảm nếu áp ngay sau khi gộp.
  file: `pipeline/lib/danh-ba-nguoi.mjs`
  severity: medium
  Đề xuất: known-limits

- **Miễn trừ chặn tụt sellers của sync-cloud không bao giờ dùng được nữa vì refresh-bait-gap đã thôi ghi audit bait-gap:sellers-orphan**
  Người dùng thấy gì: Khi số người bán co lại đáng kể, đồng bộ lên cloud bị chặn và chỉ gỡ được bằng can thiệp tay.
  Căn cứ: Hiếm gặp, đồng bộ dừng an toàn không mất dữ liệu, và sửa sau không tốn kém.
  file: `pipeline/refresh-bait-gap.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert có mặt thay vì quan hệ): E4 chỉ kiểm tập con, không kiểm bằng nhau, không ghim số người, không kiểm mỗi số thuộc đúng một người**
  Người dùng thấy gì: Phép kiểm danh bạ có thể báo xanh dù một số điện thoại bị gán nhầm cho hai người hoặc có người thừa.
  Căn cứ: Chỉ làm lưới kiểm thưa hơn, người dùng không thấy ngay; lỗi dữ liệu thật vẫn có thể bắt bằng cách đo khác và nâng chặt sau rẻ.
  file: `_acceptance/sdt-luu-goc-e164/probes/do.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): đối chứng đỏ của E8 tự ném lỗi, không chạy qua bộ quét thật, và bộ quét thật yếu hơn lời hứa (4+ chữ số thay vì 3+)**
  Người dùng thấy gì: Phép kiểm che số trên trang danh sách người có thể bỏ sót trường hợp lộ ba chữ số cuối của số điện thoại.
  Căn cứ: Khe hở nhỏ, chưa có bằng chứng lộ thật, lộ chỉ vài chữ số; siết phép đo sau rẻ.
  file: `_acceptance/sdt-luu-goc-e164/probes/people.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): 'ba vai' của E8 thực ra là hai lời gọi khác nhau, vai admin lặp lại y hệt vai ops**
  Người dùng thấy gì: Phép kiểm báo đã thử ba vai nhưng thực chất chỉ khác biệt hai, nên khác biệt riêng của quản trị viên (nếu có) chưa được kiểm.
  Căn cứ: Rủi ro thấp vì mã đọc dữ liệu không phân vai, không lộ dữ liệu đã thấy, và bổ sung sau rẻ.
  file: `_acceptance/sdt-luu-goc-e164/probes/people.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
