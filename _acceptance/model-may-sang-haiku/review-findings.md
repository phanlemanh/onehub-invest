# Review findings: model-may-sang-haiku (round 1)

## Trong hợp đồng

- **Số đo «kết luận luật đổi» trong AC-8 không bao giờ khác 0: so apNguong(pair) với chính nó**
  file: `_acceptance/model-may-sang-haiku/probes/do-truoc-sau-chay.mts:82`
  severity: low
  AC: AC-8
  source: bugs
  detail: `truoc = apNguong(pair).same_house` được tính trước lời gọi model. `ket_luan_sau: apNguong(pair).same_house` lại gọi đúng hàm tất định đó trên đúng đối tượng `pair`, và model không đụng tới nó. Ở nhánh lỗi còn gán thẳng `ket_luan_sau: truoc`. Vì vậy `ketLuanDoi` trong tinhSo và ngưỡng «kết luận luật đổi = 0» của kiemNguong luôn bằng 0 theo cách dựng. Kết luận không được so với kết luận đã lưu thời Qwen (chẳng hạn review_queue.ai_suggestion hay evidence.cham), nên hàng «kết luận luật đổi | 0 | 0» trong so-truoc-sau.md và eval E8 không chứng minh được gì: phép kiểm này không thể đỏ.
  rationale: AC-8 đòi báo số cặp kết luận luật đổi trước/sau và đạt khi bằng 0; phép đo so một giá trị với chính nó nên không chứng minh được ngưỡng này.

- **Hình dạng 3 (lời hứa là QUAN HỆ trước/sau, nhưng hai vế là cùng một biểu thức): «kết luận luật đổi 0» của AC-8 đúng theo cấu tạo, không bao giờ đỏ được**
  file: `_acceptance/model-may-sang-haiku/probes/do-truoc-sau-chay.mts:77`
  severity: high
  AC: AC-8
  source: measurement
  detail: Dòng 71 gán `const truoc = apNguong(pair).same_house`, dòng 77 ghi `ket_luan_sau: apNguong(pair).same_house`, tức gọi lại cùng hàm thuần trên cùng đối tượng `pair` trong cùng tiến trình. Nhánh lỗi ở dòng 79 thì gán thẳng `ket_luan_sau: truoc`. `r.output` của model và mọi kết luận đã lưu từ thời Qwen đều không được đọc. Vì vậy `ketLuanDoi` (do-truoc-sau.mjs:82) luôn bằng 0. Ngưỡng `so.ketLuanDoi !== 0` (do-truoc-sau.mjs:123) và ô «kết luận luật đổi | 0» trong so-truoc-sau.md là một ngưỡng của E8 không thể đỏ. Lời hứa AC-8 là so trước với sau khi đổi model, nhưng phép đo chỉ so một giá trị với chính nó. Đổi model, sửa prompt hay đổi luật thì số này vẫn là 0.
  rationale: Cùng gốc với mục trên: ngưỡng «kết luận luật đổi 0» của AC-8 không thể đỏ vì hai vế là cùng một biểu thức.

- **Hình dạng 5 (tuyên quét LỚP «mọi dòng thuộc danh sách nhãn viết trước» nhưng danh sách có nhãn bắt-mọi «- »): kiểm AC-4 cho judge chỉ còn bắt được ba chuỗi đã cấy**
  file: `agent/tests/du-lieu-gui-agent.itest.ts:55`
  severity: high
  AC: AC-4
  source: measurement
  detail: `NHAN_JUDGE` kết thúc bằng phần tử "- ". `kiemThan` cho qua mọi dòng có `d.startsWith(n)`, nên dòng nào bắt đầu bằng "- " cũng qua, ví dụ «- Người bán: …», «- SĐT: …», «- Nhóm: …». Hai lời hứa của E4 và AC-4 là «thân judge chỉ có các dòng thuộc danh sách nhãn dòng viết trước» và chiều đỏ «bản sao buildJudgeInput thêm dòng người bán thì đỏ gọi tên trường lộ». Cả hai thực tế chỉ dựa vào kiểm âm tính trên đúng ba giá trị đã cấy (NGUOI_BAN, SDT, NHOM). Chiều đỏ ở dòng cuối test đỏ chỉ vì nó chèn chính chuỗi `NGUOI_BAN` đã cấy, không phải vì danh sách nhãn chặn dòng lạ. Một trường lộ mới mang giá trị khác ba chuỗi cấy (cột khác của sale_offer_records hay tin khác) sẽ lọt qua, vì phần kiểm danh sách nhãn không chặn được dòng «- ...» nào.
  rationale: AC-4 đòi thân yêu cầu judge chỉ chứa các trường đã kê; nhãn bắt-mọi khiến phép kiểm không chặn được trường lạ mới.

- **Hình dạng 4 (kiểm âm tính đứng một mình, không có đối chứng dương): «chữ bài ≤ 500 ký tự» của AC-4 không có ca nào có thể vượt**
  file: `agent/tests/du-lieu-gui-agent.itest.ts:98`
  severity: medium
  AC: AC-4
  source: measurement
  detail: Tên test và E4 hứa «Thân enrich chỉ có chữ bài ≤ 500 ký tự». Assert duy nhất là `p.length <= 500 + 600` trên toàn prompt. Trong khi đó chữ bài gieo ở `gieoHaiTin` chỉ khoảng 75 ký tự («Bán căn hộ 2pn 70m2 giá 3,2 tỷ … — mã <id>»), nên không bài nào gần ngưỡng cắt 500. Nếu bỏ `left(text, 500)` hay bước cắt chữ trong OFFER_SELECT thì test vẫn xanh. Test thiếu một tin có chữ bài dài hơn 500 ký tự để chứng minh phần gửi đi bị cắt đúng ở 500, và trần 1100 trên toàn prompt không ghim quan hệ «phần chữ bài ≤ 500».
  rationale: AC-4 nêu rõ chữ bài tối đa 500 ký tự; test không có ca chữ bài dài hơn nên không chứng minh được giới hạn.

- **Hình dạng 4 (quan hệ giữa hai số đo, không có giá trị dương viết trước): «đã áp» của tổng kết bằng DB vẫn xanh khi cả hai bằng 0**
  file: `agent/tests/tran-tien-agent.itest.ts:169`
  severity: medium
  AC: AC-10
  source: measurement
  detail: AC-10 trong contract hứa «số đề xuất được apply_enrichment áp bằng đúng số kỳ vọng viết trước». Test chỉ assert `daAp === apDb`: số rút từ dòng tổng kết bằng số đếm `applied_at IS NOT NULL` trong DB. Không có số kỳ vọng viết trước nào, cũng không có assert `apDb > 0`. Nếu bước áp không chạy, hoặc không áp đề xuất nào, thì 0 == 0 vẫn xanh. Phần đề xuất cũng tương tự: bộ kỳ vọng `mau` rút từ chính đầu ra của tin JSON trần (`deXuat(tran[0])`), không phải ma trận viết trước, và chỉ có ràng buộc `mau.length > 0`.
  rationale: AC-10 đòi số đề xuất được áp bằng đúng số kỳ vọng viết trước; test chỉ so hai số đo với nhau nên 0 bằng 0 vẫn xanh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **enrich-run, judge-run không dừng cả lượt khi mọi đường hết tiền hay sai khoá, lệch với khuôn đọc gộp**
  Người dùng thấy gì: Khi tiền ở cả hai đường gọi model cùng cạn, lượt chạy đêm vẫn thử hết các tin còn lại rồi báo lỗi model chung chung, không báo rõ là hết tiền. Không mất dữ liệu, chỉ khó nhận ra nguyên nhân và tốn thêm lời gọi lỗi.
  Căn cứ: Hậu quả nhẹ: không mất hay lộ dữ liệu, tiền không bị tính cho lời gọi bị từ chối, chạy lại sau khi nạp tiền là xong; sửa được sau mà không đắt.
  file: `agent/scripts/enrich-run.ts`
  severity: medium
  Đề xuất: known-limits

- **Tài liệu và comment ghi đường mặc định là Gateway có cờ không giữ dữ liệu, trong khi bảng của kho đi Anthropic thẳng trước, không có cờ**
  Người dùng thấy gì: Tài liệu hướng dẫn nói dữ liệu gửi model luôn kèm cờ không giữ dữ liệu, nhưng đường mặc định thực tế đi thẳng Anthropic không có cờ đó. Người hay AI đọc tài liệu có thể hiểu sai về chế độ giữ dữ liệu.
  Căn cứ: Chỉ là chữ mô tả sai, hành vi thật đúng như hợp đồng đã được Mạnh chấp nhận; sửa chữ rẻ và có thể làm bất cứ lúc nào, nhưng nên sửa sớm vì dễ gây hiểu nhầm.
  file: `agent/CLAUDE.md`
  severity: low
  Đề xuất: known-limits

- **Probe AC-1 bỏ qua mã thoát của từng lệnh: lệnh chết giữa chừng sau một lời gọi model vẫn tính là đạt**
  Người dùng thấy gì: Phép kiểm không gọi model tại máy cũ vẫn báo đạt kể cả khi một lệnh chết ngay sau lời gọi đầu. Lỗi của đường gọi mới có thể bị che ở bước kiểm này.
  Căn cứ: Chỉ làm bằng chứng kiểm yếu đi ở một chiều, các bước kiểm khác vẫn chạy các lệnh này; không ảnh hưởng người dùng và sửa sau rẻ.
  file: `_acceptance/model-may-sang-haiku/probes/khong-goi-8000.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
