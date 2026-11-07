---
schema_version: 1
feature: Đọc gộp S03 hằng ngày — lệnh hang-ngay đọc toàn bộ bài S03 mới của một ngày đã khử trùng theo tin bằng model của bảng chọn PL30, trần 20 USD theo ngày chi, chạy lại không gọi lại bài đã đọc; bước đêm pipeline/doc-gop-hang-ngay.sh
slug: doc-gop-hang-ngay
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script, db]
status: approved
veto_state: mo
veto_opened_at: 2026-11-07T23:35:01Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-08-doc-gop-hang-ngay-design.md
lo_trinh_ma: PL34
---

# Acceptance Contract: doc-gop-hang-ngay

## Context

Hàng PL34 (`docs/plan/lo-trinh.json`). ROADMAP §3 mục 34: Mạnh 07/11 «Đồng ý trần 20 usd/ngày. Còn lại theo khuyến nghị»,
08/11 «1. Bật toàn bộ bài 2. Nghiệm thu sau» — phạm vi là toàn bộ bài S03 mới đã khử trùng theo tin, chạm trần thì dừng có tên,
đọc lại kho cũ trình riêng. PL30 `chon-model-theo-o` có lệnh `chay` trên lát/danh sách bài và cố ý không có đường chạy toàn S03;
hàng này thêm đường ấy. Số đo 08/11 (chỉ đọc): 06/11 có 8.641 bài thô → 3.278 đơn vị sau khử trùng, ước 3,5 USD. Thiết kế:
`design_doc`.

Trong mọi tiêu chí: «ngày D» là ngày bài theo giờ VN (`coalesce(posted_at, captured_at)`), «ngày chi» là ngày giờ VN lúc lệnh
chạy, «khoá đọc» là (model của bảng chọn, `prompt_version` của prompt PL30), Gateway là Gateway giả của test.

## Criteria

- **AC-1** — Given `stg_zalo_posts` có, cho ngày D: hai bài chữ thường khác nhau, hai bài cùng một tin của `sale_offer_records`,
  hai bài cùng chữ khác link ảnh, một bài thử (dấu `testMarker`), một sự kiện hệ thống (JSON), một bài chỉ ảnh có tệp, một bài
  chỉ có URL ảnh không tệp (hai bài chỉ ảnh mang chữ là URL ảnh khác nhau, như dữ liệu thật), một bài R đã có nhãn đọc được của
  khoá đọc dưới CHÍNH `post_id` của nó (ghi bằng lượt `chayLuot` thật trước đó), một bài X cùng chữ với một nhãn đọc được của
  khoá đọc dưới `post_id` KHÁC (bài đăng lại); và một bài chữ thường của ngày D−1, When chạy `hang-ngay --ngay D --thu`, Then tóm
  tắt đếm đúng `tho` 12, `bai_thu` 1, `su_kien` 1, `trung` 2, `da_doc` 1, `bo` 1 và `can_goi` 6, và tập `post_id` sẽ gọi bằng đúng
  tập viết trước {hai bài chữ thường, đại diện của tin, đại diện của cặp cùng chữ, bài chỉ ảnh có tệp, X}; R và bài ngày D−1
  không có mặt; không lời gọi model nào, số dòng `silver_labels` và `ai_calls` không đổi, và lệnh không đòi khoá Gateway.
- **AC-2** — Given cùng fixture AC-1 và khoá Gateway, When chạy `hang-ngay --ngay D` (không `--thu`), Then mỗi đơn vị của tập
  `can_goi` nhận đúng một lời gọi tới mã Gateway của model `mac_dinh`, `silver_labels` thêm đúng chừng ấy dòng với `run_id` mở
  đầu `pl34-<ngày chi>-b<D>-`, `ai_calls` thêm đúng chừng ấy dòng `viec = doc-gop-s03`, còn `sale_offers`, `sale_offer_records`,
  `enrichment_proposals`, `review_queue`, `eval_labels`, `eval_label_items` không đổi số dòng; thoát 0.
- **AC-3** — Given lượt AC-2 đã ghi xong trong cùng ngày chi, When chạy lại `hang-ngay --ngay D`, Then 0 lời gọi model, 0 dòng
  `silver_labels` mới, tóm tắt `can_goi` 0 và `da_doc` gồm mọi đơn vị đã đọc, thoát 0; Given một đơn vị lượt trước nhận JSON
  hỏng và một đơn vị lỗi mạng, When chạy lại, Then chỉ hai đơn vị ấy được gọi lại; và Given ngày D+1 có một bài `post_id` mới
  cùng chữ với một bài đã đọc ở ngày D, When chạy `hang-ngay --ngay D+1`, Then bài ấy được gọi (nhãn có dưới chính `post_id` của
  nó).
- **AC-4** — Given trần ngày chỉ đủ cho một phần lời gọi, When chạy `hang-ngay --ngay D --tran-ngay-usd <trần>`, Then lệnh gọi
  lần lượt (không từ chối cả lượt chỉ vì tổng ước vượt trần), trước mỗi lời gọi cộng tiền thật đã chi trong lượt với ước của lời
  ấy — ước = max(công thức, tiền thật lớn nhất đã gặp trong lượt) — và dừng khi tổng vượt trần còn lại; stderr có dòng chứa `CHAM
  TRAN DOC GOP HANG NGAY`, trần và số lời gọi còn lại, tóm tắt `cham_tran: true` và `con_lai` = `can_goi` − số đã gọi, thoát 3; khi
  tiền thật mỗi lời gọi lớn hơn ước công thức, tổng tiền thật của lượt vẫn ≤ trần (chỉ lời gọi đầu tiên được phép đắt hơn ước).
- **AC-5** — Given `silver_labels` đã có tiền của `run_id` `pl34-<ngày chi>-…` từ một lượt trước trong cùng ngày chi (một ngày
  bài khác) bằng S, và tiền `pl34-<ngày khác>-…` bằng T, When chạy `hang-ngay` với trần C, Then trần còn lại là C − S (tóm tắt
  `chi_ngay_truoc` = S, T không tính); S ≥ C thì 0 lời gọi, có dòng `CHAM TRAN DOC GOP HANG NGAY`, thoát 3.
- **AC-6** — Given mọi lời gọi của lượt trả lỗi mạng, hoặc mọi lời gọi trả JSON hỏng khuôn, When chạy `hang-ngay`, Then thoát 1
  và stderr gọi tên lớp hỏng; Given chỉ một phần lời gọi hỏng, Then thoát 0 và tóm tắt đếm đúng `loi`, `json_hong`.
- **AC-7** — Given đầu vào sai — cờ lạ, `--ngay` không đúng khuôn YYYY-MM-DD, `--tran-ngay-usd` âm hay không phải số, bảng chọn
  qua `--cau-hinh` sai khuôn, hoặc thiếu khoá Gateway khi không `--thu` — When chạy `hang-ngay`, Then thoát 2 với thông điệp gọi
  tên chỗ sai, 0 lời gọi model; và Given bảng chọn `--cau-hinh` có `mac_dinh` khác (GLM), Then lời gọi đi tới mã Gateway của
  model đó.
- **AC-8** — Given `pipeline/doc-gop-hang-ngay.sh` với lệnh node thay bằng tệp giả ghi đối số (`DOC_GOP_NODE`), When chạy bước
  vào một thời điểm cố định, Then nó gọi `hang-ngay` hai lần theo thứ tự `--ngay <hôm qua VN>` rồi `--ngay <hôm kia VN>`, mỗi lần
  kèm `--tran-ngay-usd 20` (hay giá trị của `DOC_GOP_TRAN_NGAY_USD`); một bước trả mã 3 thì stderr có `JOB FAIL
  [doc-gop-hang-ngay] bước <nhãn> mã 3`, bước kia vẫn chạy, và tệp thoát bằng mã hỏng đầu tiên; cả hai trả 0 thì thoát 0.

## Coverage

Quét theo skill `morphological-scan` (bốn trục; chân ngành: AWS Budgets — ngưỡng chi kèm cảnh báo; Apache Airflow — tác vụ
idempotent, chạy lại an toàn, catchup ngày lỡ).

- **Bài vào** — thường · ngày khác · bài thử · sự kiện · cùng tin · cùng chữ khác link · đã đọc trước · không chữ không ảnh tệp ·
  chỉ ảnh (AC-1). [thước CE: SUY-TỪ-REPO `pipeline/lib/eval-labels.mjs` `khuTrung`, `pipeline/lib/test-posts.mjs`, số đo 08/11
  trong design doc]
- **Kết quả gọi** — tốt (AC-2) · JSON hỏng · lỗi mạng (AC-3, AC-6) · mọi lời gọi hỏng (AC-6). [thước CE: SUY-TỪ-REPO
  `_acceptance/chon-model-theo-o/contract.md` AC-7, Ngoài-3]
- **Tiền** — dưới trần (AC-2) · chạm giữa lượt (AC-4) · đã chạm từ lượt trước cùng ngày chi (AC-5) · chi ngày khác không tính
  (AC-5). [thước CE: NGÀNH AWS Budgets; SUY-TỪ-REPO ROADMAP §3 mục 34]
- **Cách chạy** — chạy thử (AC-1) · thật (AC-2) · chạy lại (AC-3) · bước đêm hai ngày (AC-8) · đầu vào sai, đổi model bằng bảng
  (AC-7). [thước CE: NGÀNH Apache Airflow idempotent + catchup]
- Later: đọc lại kho cũ (trình riêng) · ghép ảnh album trước khi đọc (GT2/PL28) · màn Ops xem tiền ngày · bảng chọn hai model
  trên ngày thật (Ngoài-5 của PL30). Never: tự gắn plist (làn ZCode).

## Out of scope

- Đọc lại kho cũ (bài trước ngày chạy đầu) — Mạnh 08/11: ước tiền và trình riêng.
- Gắn bước vào lịch đêm (plist, `scripts/cloud-sync.sh`) — làn ZCode / giám sát; gửi `viec-phu` sau khi gộp.
- Ghép ảnh album vào tin chữ trước khi đọc — GT2/PL28; bài chỉ ảnh đọc riêng như một bài.
- Màn Ops cho tiền theo ngày; bảng chọn trong DB.
- Phiên nghiệm thu một đêm thật — Mạnh «Nghiệm thu sau».

## Notes

- Một đêm thật (`bat_khi` của hàng) đo sau khi bước được gắn lịch: đọc dòng tóm tắt `{"pl34": …}` của log chuỗi đêm — `con_lai`
  0, `usd` ≤ trần, lượt chạy lại `can_goi` 0.
- `chi_ngay` đếm dư khi dòng JSON hỏng của ngày trước được đọc lại hôm nay (câu ghi cộng dồn tiền) — dư thì dừng sớm hơn.
- Tổng một ngày chỉ vượt trần khi một lời gọi đắt hơn mọi ước trước nó, và vượt tối đa tiền của đúng lời gọi ấy (một lời gọi
  Haiku đo 07/11 cỡ 0,0004–0,002 USD).
- Hai bài cùng ngày cùng chú thích (chữ đã gạt URL trùng nhau) mà khác ảnh được khử trùng thành một theo luật GN2 của
  `khuTrung`; bài kia không có nhãn.
- Mã ghi `usd = 0` cho lời gọi ném lỗi (không đọc được tiền); Gateway có tính tiền lời gọi hỏng hay không chưa đo.
- Bài thu muộn hơn hai ngày không được đọc (bước đêm chỉ vớt hôm kia).
