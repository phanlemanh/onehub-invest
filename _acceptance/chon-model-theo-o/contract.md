---
schema_version: 1
feature: Đọc gộp tin S03 (chữ, mọi ảnh, thẻ nhóm) ra 17 ô với bảng chọn model theo ô, mặc định Haiku 5.5
slug: chon-model-theo-o
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: signed-off
design_doc: docs/superpowers/specs/2026-11-07-chon-model-theo-o-design.md
approved_by: Mạnh
approved_at: 2026-11-07
---

# Acceptance Contract: chon-model-theo-o

## Context

Hàng PL30 của lộ trình. Lượt đo 06–07/11 trên 48 thẻ vàng lát `s03-theo-nhom` cho thấy đọc gộp một lời gọi (chữ bài + mọi ảnh + thẻ nhóm + quy ước + từ điển) ra 17 ô đúng 96% với Haiku 5.5 trên 23 thẻ test. Mạnh 07/11: «xây dựng tính năng để có thể dễ dàng thay đổi các model và hiện tại sử dụng haiku»; ký Cổng Đáng «build · archive · ngưỡng theo đề xuất». Câu chặn của hàng: đổi model của một ô chỉ bằng bảng chọn, không sửa code bộ đọc. Luật 7 giữ: chỉ ra nhãn bạc kèm audit.

Source input: hàng PL30 `docs/plan/lo-trinh.json`; giám sát đợt dot0-cam-mau giao 07/11; `_acceptance/chon-model-theo-o/opportunity.md`.

## Criteria

- AC-1: Given cùng một mã bộ đọc và hai tệp bảng chọn khác nhau truyền qua `--cau-hinh` (bảng A giao `price_min_vnd` cho `glm`, các ô khác cho `haiku`; bảng B giao mọi ô cho `haiku`), When lệnh `chay` đọc một bài bằng Gateway giả ghi lại mã model mỗi lời gọi, Then bảng A cho đúng hai lời gọi (`zai/glm-5.3-flash`, `anthropic/claude-haiku-5.5`), `price_min_vnd` gộp là giá trị GLM giả trả, các ô khác của Haiku; bảng B cho đúng một lời gọi tới Haiku; và tệp `agent/config/doc-gop-s03.json` khớp một mẫu trong `risk_tiers.t1_skip_globs`, nên một PR chỉ đổi tệp này không cần hồ sơ nghiệm thu mới (theo trả lời Hỏi-3).
- AC-2: Given bảng chọn đúng như tệp được commit, When nạp và lập kế hoạch, Then mọi ô dùng `anthropic/claude-haiku-5.5` trừ `bathrooms` là người duyệt; giá trị `bathrooms` model trả về không vào kết quả gộp (ô ghi «người duyệt», không có giá trị).
- AC-3: Given bảng chọn sai — ô ngoài 17 ô, khoá model không khai, model thiếu mã Gateway hay đơn giá, mã Gateway ngoài ba mã Mạnh duyệt, giá trị ô không phải khoá model hay `nguoi` — When chạy lệnh đọc, Then lệnh thoát khác 0 trước lời gọi đầu, thông điệp gọi tên đúng chỗ sai, 0 lời gọi Gateway.
- AC-4: Given một thẻ mẫu có chữ bài chứa tên nguồn in sẵn, hai ảnh tệp, một ảnh chỉ có URL, tên/ID người đăng, ID tài khoản thu (`agent_id`), nhãn vàng, và `source_registry` có tên miền, `source_ids` không xuất hiện trong chữ bài, When dựng tin nhắn và gọi Gateway, Then tin nhắn có chữ bài nguyên văn (kể cả tên nguồn in sẵn), đúng hai phần ảnh, tên nhóm và thẻ nhóm; không có tên/ID người đăng, ID tài khoản thu, giá trị nhãn vàng, tên miền hay `source_ids` của `source_registry` (kể cả trong tên phần ảnh); dòng nhãn ghi `anh_thieu = 1`; mọi lời gọi mang `zeroDataRetention` và `disallowPromptTraining`, lời gọi DeepSeek chỉ qua nhà cung cấp `baseten` — hai cờ này đặt trong mã theo mã Gateway, bảng chọn không tắt được.
- AC-5: Given Gateway giả trả JSON đủ 17 ô cho một bài, When lệnh `chay` chạy trên DB thử, Then có đúng một dòng `silver_labels` (model `gateway:<mã>`, `prompt_version` `dg3-s03-v3`, `probabilities` có 17 ô với giá trị, căn cứ, câu trích, `o_duoc_giao`, `cau_hinh_sha`) và một dòng `ai_calls` (`viec` `doc-gop-s03`); số dòng `sale_offers`, `enrichment_proposals`, `review_queue`, `eval_labels` không đổi.
- AC-6: Given model trả ô căn cứ `chu_bai` với câu trích không có trong chữ bài, và một ô căn cứ `chu_bai` có câu trích đúng, When gộp kết quả, Then ô thứ nhất mang `trich_ok: false`, ô thứ hai `trich_ok: true`; giá trị cả hai vẫn giữ (nhãn bạc, không tự áp).
- AC-7: Given Gateway giả trả chữ không phải JSON cho một bài và ném lỗi mạng cho bài khác, When lệnh `chay` chạy, Then dòng JSON hỏng được ghi với `json_ok=false`, `error_kind` `json-hong` và chi phí; lỗi mạng không ghi dòng nhãn nhưng có dòng `ai_calls` lỗi; chạy lại thì đọc lại cả hai bài, bài đã có nhãn tốt không gọi lại.
- AC-8: Given trần tiền của lượt, When ước trước vượt trần, Then lệnh dừng với 0 lời gọi; When tổng chi thật chạm trần giữa lượt, Then lệnh dừng trước bài kế và in số bài còn lại; lệnh không nhận cờ hay đối số nào chọn toàn bộ tin S03 (chỉ lát nhãn hay danh sách bài).
- AC-9: Given lát vàng mẫu và Gateway giả, When chạy lệnh `cham`, Then ra bảng ô × model (đúng trên mọi thẻ, phủ, đọc thừa, JSON hỏng, USD/thẻ, giây) khớp bảng tính tay viết trước, không ghi dòng nào vào DB, và tệp tóm tắt chỉ có số (không chữ bài, không tên người).
- AC-10: Given tệp tóm tắt `_acceptance/chon-model-theo-o/evidence/cham-test.json` sinh bằng lệnh `cham` thật với Haiku trên 23 thẻ test, When kiểm, Then `prompt_sha`, `cau_hinh_sha` và `ma_sha` (băm mã bộ đọc, bộ chấm, lệnh) trong tệp bằng băm hiện tại; `dung_gop` = số ô đúng / số ô giao model (16 ô, bỏ ô người duyệt) trên 23 thẻ, mẫu số ghi trong tệp; `dung_gop` ≥ 92% là đạt, 90% đến dưới 92% là «vùng xám» (không tự xanh, Mạnh phán ở Cổng Bằng chứng), dưới 90% là chết; USD trung bình ≤ 0,0025 USD/thẻ; tệp ghi thêm `anh_thieu` theo thẻ và `dung_gop` khi bỏ thẻ 9991.

## Coverage

Bỏ quét không gian bằng dòng sổ `bỏ coverage-scan`; trục ghi tay:

- Bảng chọn: mặc định (AC-2) · đổi một ô (AC-1) · nhiều model (AC-1) · người duyệt (AC-2) · sai sáu kiểu (AC-3) · đổi bằng PR nhỏ không hồ sơ (AC-1).
- Đầu vào: chữ có tên nguồn (AC-4) · ảnh tệp (AC-4) · ảnh chỉ URL (AC-4) · dữ liệu không được gửi (AC-4) · cờ gửi ZDR, nhà cung cấp (AC-4).
- Kết quả gọi: JSON đủ (AC-5) · câu trích sai (AC-6) · JSON hỏng (AC-7) · lỗi mạng (AC-7) · đọc lại (AC-7).
- Tiền: ước vượt trần (AC-8) · chạm trần giữa lượt (AC-8) · không có đường chạy toàn bộ (AC-8).
- Chỗ ghi: nhãn bạc + ai_calls (AC-5) · bảng khác không đổi (AC-5) · chấm không ghi DB (AC-9).
- Số thật: chấm Haiku trên test so ngưỡng Cổng Đáng (AC-10).

## Đường đo

- Ngưỡng «đổi model của một ô chỉ bằng bảng cấu hình, diff chỉ chạm tệp cấu hình»: AC-1 (hai lần chạy, chỉ đổi tệp bảng).
- Ngưỡng «Haiku ≥ 92% gộp 17 ô trên 23 thẻ test»: AC-10 (lệnh `cham` thật, tóm tắt ghim băm prompt + bảng + mã). Ô WC giao người duyệt nên đo trên 16 ô giao model; mốc lượt 07/11 tính lại theo công thức này là 96,7% (712/736 ô, hai lượt).
- Ngưỡng «chi phí đo ≤ 0,0025 USD/bài»: AC-10 (USD Gateway trong tóm tắt).
- Ngưỡng CHẾT «phải sửa code bộ đọc»: AC-1 chứng ngược lại (cùng mã, hai bảng, hai kết quả).
- Ngưỡng CHẾT «dưới 90%»: AC-10 nhánh chết; vùng 90–92% lên Cổng Bằng chứng cho Mạnh.

## Out of scope

- Chạy đọc gộp trên toàn S03 hằng ngày (Hỏi-1: quyết định tiền của Mạnh).
- Sinh đề xuất theo ô (`enrichment_proposals`), thẻ duyệt, gắn căn từ kết quả đọc gộp (Hỏi-2; sửa chữ 07/11 theo Q5 của tài liệu mô hình: PL18 biến `silver_labels` thành phát biểu, GC2/GC3 đọc phát biểu).
- Tải ảnh chỉ có URL (làn thu thập).
- Màn Ops đổi bảng chọn; bảng chọn trong DB.
- Ô WC tự điền (chưa model nào đạt).
- Cặp A/B kiểm chéo theo ô (bảng cho phép thêm sau, không làm trong hàng này).

## Notes

- Ngưỡng 92% đo trên 48 thẻ mà quy ước và từ điển trong prompt được viết ra trong lúc gắn chính các thẻ này; nhãn vàng là «người duyệt nháp Opus». Số trên bài mới cần đo lại (giả định 3 của ô cơ hội).
- Lượt đo 07/11 tải 9 ảnh chỉ có URL; đường mới không tải, nên thẻ 9991 (mọi ô đọc từ ảnh) có thể tụt điểm.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-07:
  - Ngoài-1: Hai bản sửa vòng 2 (đòi khoá Gateway khi chạy thử, thoát 1 khi mọi lời gọi hỏng) chưa có bài kiểm tự động giữ lại.
  - Ngoài-2: Chạy thử (--thu) vẫn ghi sổ chi phí gọi model, khác lệnh đọc toàn bộ S03; chú thích cần ghi rõ là khác có chủ ý.
  - Ngoài-3: Khi mọi lời gọi trả JSON hỏng khuôn, lệnh vẫn thoát 0; người vận hành phải đọc dòng log cuối mới biết.
  - Ngoài-4: Chạy thử thiếu khoá Gateway từng vẫn gọi model; đã sửa ở vòng 2 (đòi khoá cả khi chạy thử).
  - Ngoài-5: Khi bảng chọn dùng từ hai model, dòng nhãn của model phụ ghi ý định đăng tin «không rõ» và màn gắn nhãn có thể đọc nhầm dòng đó.
  - Ngoài-6: Mã ý định đăng tin và loại tin từng gõ tay; đã sửa ở vòng 2 (lấy từ sổ chung).
  - Ngoài-7: Hai tên model trỏ cùng một mã Gateway từng lọt qua bảng chọn; đã sửa ở vòng 2 (từ chối lúc nạp).
  - Ngoài-8: Chạy thử thiếu khoá từng gọi Gateway thật và ghi sổ lời gọi; khoá đã đòi ở vòng 2, sổ lời gọi vẫn ghi khi chạy thử (xem Ngoài-2).
  - Ngoài-9: Lỗi gọi model từng bị nuốt không đếm; đã sửa ở vòng 2 (đếm, in, thoát 1 khi mọi lời gọi hỏng).
  - Ngoài-10: Ô model trả sai khuôn bị coi là «không suy ra», không đọc lại, có thể làm điểm đo đẹp hơn thực tế.
  - Ngoài-11: Thẻ có hai người gắn nhãn thì lệnh chấm lấy nhãn vàng tuỳ ý; hiện chỉ một người gắn.
  - Ngoài-12: Bài kiểm «đổi bảng chọn không cần hồ sơ» khớp mẫu bằng cách riêng, không dùng bộ khớp của lưới trước gộp.
  - Ngoài-13: Bài kiểm trần tiền đếm lời gọi bằng số tự báo của chương trình, không đếm lời gọi tới model giả.
  - Ngoài-14: Bài kiểm cờ dòng lệnh chưa phủ đủ bảy cờ được nhận.
  - Ngoài-15: Bài kiểm «đủ 17 ô» lấy danh sách ô từ chính mã đang kiểm.
