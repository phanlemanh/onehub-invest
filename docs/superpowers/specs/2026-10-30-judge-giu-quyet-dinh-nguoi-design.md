# judge-giu-quyet-dinh-nguoi — thiết kế

Hàng P3, T2. Gom Ngoài-6 và Ngoài-8 của PL25 `judge-nguong-la-code` theo lời ký của Mạnh ngày 30/10. Ô cơ hội:
`_acceptance/judge-giu-quyet-dinh-nguoi/opportunity.md`. Vùng: `agent/scripts/judge-run.ts`,
`agent/src/agents/judge-entity.ts`, `agent/tests/judge-*`.

## 1. Thẻ người vừa quyết không bị máy ghi đè (Ngoài-6)

`chamMotLuot` đọc thẻ của một cặp, gọi model (mất vài giây), rồi `UPDATE review_queue … WHERE id = ANY($4)`. Nếu người
duyệt quyết thẻ trong khoảng giữa hai bước đó, lệnh UPDATE vẫn ghi đè `ai_suggestion`, `ai_reasoning` và `evidence.cham`
lên thẻ đã quyết.

**Cách sửa:** thêm `AND status = 'pending'` vào câu UPDATE và đọc `rowCount`.
- `rowCount = 0`: mọi thẻ của cặp đã bị quyết giữa chừng. Đếm là bỏ qua (người đã quyết), không đếm là cập nhật.
- `rowCount ≥ 1`: đếm là cập nhật.
- Cặp có hai thẻ ghi hai chiều mà một thẻ bị quyết giữa chừng thì KHÔNG thẻ nào được sửa (thêm `AND NOT EXISTS` thẻ
  không còn chờ trong cùng bộ id). Đây là luật «người đã quyết cặp này — không sửa» mà judge-run đã áp lúc đọc thẻ, nay
  áp cả lúc ghi.

Mệnh đề WHERE được Postgres kiểm theo từng dòng khi ghi, nên không cần khoá dòng. Lối khoá dòng (`SELECT … FOR UPDATE`
giữ suốt cuộc gọi model) chết vì nó giữ khoá trong vài giây gọi model, và nút quyết của người ở `/ops/review` phải đứng
chờ trong lúc đó.

## 2. So phường theo cùng khoá với thẻ duyệt (Ngoài-8)

Hiện `chuanHoaPhuong` bỏ dấu rồi mới bỏ tiền tố, và chỉ bỏ `phuong|p.|p` có khoảng trắng theo sau. Có ba lỗi:
- «Phương Liệt» thành `liet`. Vì «Phường» và «Phương» cùng thành `phuong` khi bỏ dấu, nên «Phường Phương Liệt» ra
  `phuong liet` trong khi «Phương Liệt» ra `liet`, và luật kết luận «khác phường» → `no`.
- «Xã Kim Chung», «Thị trấn Đông Anh» giữ nguyên tiền tố. DB local có 2 667 tin bán ghi «Xã …».
- «P.Bến Nghé» (P. dính liền) không bỏ được tiền tố.

Thẻ duyệt `/ops/review` đã so hàng Phường bằng `khoaPhuong` + `soPhuong` (`app/src/lib/ops/review-can-cu.ts`):
1. Bỏ MỘT tiền tố hành chính (`phường|xã|thị trấn` + khoảng trắng hoặc hết chuỗi, hay `p.`) trên chuỗi CÒN DẤU.
2. Slug hoá như `slugifyName()`.
3. Khoá rỗng → Thiếu. Khoá chỉ có số («Phường 12» của hai quận) → so chuỗi gốc (trim, chữ thường).

**Cách sửa:** luật ghép căn so phường bằng đúng khoá ấy, để kết luận «cùng / khác / thiếu phường» của luật luôn trùng
nhãn Khớp / Lệch / Thiếu mà người duyệt thấy trên cùng thẻ. `chuanHoaPhuong` thay bằng `khoaPhuong` + `soPhuong` chép
sang `judge-entity.ts`. Gói `agent/` không nạp được tệp của `app/`, vì tệp đó nhập `@/lib/vocab.generated` qua bí danh
của Next. Test giữ hai bản khớp nhau bằng cách rút nguyên văn thân `khoaPhuong` và `soPhuong` từ tệp app, bỏ kiểu bằng
`stripTypeScriptTypes` của `node:module`, rồi chạy cùng ma trận qua cả hai bản. Lệch một ô là test đỏ.

Giới hạn kế thừa có chủ ý: hai chuỗi chỉ khác cách viết của phường số («Phường 12» với «P.12») vẫn ra «khác phường»,
đúng như thẻ hiện Lệch. Đổi luật khoá số là việc của app, không thuộc hàng này.

## 3. Đường đo

Không có số liệu cơ hội; mọi thước là test trong `agent/tests/`:
- `judge-run.test.ts`: dùng DB thử riêng như PL25. `queryPair` giả đổi trạng thái thẻ ngay trước khi trả cặp, tức là
  giữa lúc đọc thẻ và lúc ghi thẻ.
- `judge-nguong.test.ts`: chứa ma trận tên phường và phép rút hàm từ tệp app. Không cần DB.

## 4. Ngoài phạm vi

Bộ đếm thẻ mới khi `ON CONFLICT` (Ngoài-7: chấp nhận, không sửa) · thẻ cũ mất tin gốc (Ngoài-1, Known limits) · sửa
`khoaPhuong` của app · luật khoá phường số · chạy judge-run trên DB `oneinvest`.
