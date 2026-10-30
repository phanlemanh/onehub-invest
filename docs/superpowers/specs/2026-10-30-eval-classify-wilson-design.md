# eval:classify — độ đúng từng ô theo cận dưới Wilson (PL9)

Hồ sơ: `_acceptance/eval-classify-wilson/` · hàng PL9 của `docs/plan/lo-trinh.json` (T2, đứng trên PL8) · Cổng Đáng
`build` (Mạnh 30/10). Căn cứ: review phân loại `docs/architecture/classification-enrich-review.md` F3 (ngưỡng theo cận
dưới Wilson, nhóm A/B/C), §3.5 (dev/test, `eval:classify` ghi `dq_check_results`), §0.4 (ô = cách đọc × trường ×
phân khúc); FRAMING §3.4 (phân khúc = thị trường × loại hình); bảng nhãn PL7 (054); tập mẫu PL8.

## Vấn đề

L05: không tầng nào có tập nhãn; số cũ là độ phủ hoặc đo trên mock. PL7 dựng màn gắn nhãn mù và bảng nhãn, PL8 dựng
tập mẫu có đáp án. Chưa có lệnh nào nói «cách đọc X đọc trường Y của phân khúc Z đúng tới đâu, đủ để tự áp chưa».

## Thiết kế

### 1. Lệnh

`cd pipeline && npm run eval:classify -- --lat ocp1 [--split test|dev] [--dry]` — chấm trên **nhãn người** (DB local),
ghi `dq_check_results`.

`npm run eval:classify -- --tap-mau <tệp.jsonl>` — chấm trên **tập mẫu** PL8 (tệp do `label-mau.mjs --out` sinh), chỉ
in bảng, không mở kết nối DB, không ghi gì. Số mẫu không bao giờ lẫn với số nhãn người: tập mẫu dễ hơn tin thật (PL8
Hỏi-2 bỏ dạng mơ hồ), nên nó chỉ để thử bộ chấm và cách đọc khi đội chưa gắn nhãn.

Lệnh đọc tệp JSONL chứ không nạp `lib/tap-mau.mjs`: AC-8 của PL8 (đã ký) chặn mọi tệp `pipeline/` khác nạp bộ sinh.

### 2. Lõi thuần — `pipeline/lib/eval-classify.mjs`

- `wilsonDuoi(dung, n)` — cận dưới khoảng tin cậy 95% hai phía (z = 1,96); `n = 0` → `null`.
- `NHOM_TRUONG` + `NGUONG` — nhóm A (≥ 0,95): `listing_intent`, `kind`, `property_type`, `project`, `building`; nhóm B
  (≥ 0,90): `price_min_vnd`, `price_max_vnd`, `area_m2`, `bedrooms`. Chín trường là chín trường của PL7; nhóm C (mô tả)
  chưa có trường nhãn nào.
- `soKhop(truong, vang, doc)` — một ô đúng khi:
  - vàng «tin không nêu» và cách đọc không trả gì;
  - chữ (`project`, `building`) và trường từ vựng: bằng nhau sau NFC + chữ thường + bỏ khoảng trắng thừa;
  - giá: bằng nhau từng đồng (mỗi đầu khoảng là một trường);
  - diện tích: lệch không quá 3% (F3 «DT (±3%)»);
  - phòng ngủ: bằng nhau.
  Cách đọc không trả gì mà vàng có giá trị là sai; cách đọc trả giá trị mà vàng «không nêu» là sai.
- `CACH_DOC` — sổ cách đọc chạy được trên chữ tin. Vòng này có một: `parser` (`parsePost` + `maToaCan` của
  `transform-zalo.mjs`), trả `kind`, `price_min_vnd` = `price_max_vnd` = `priceVnd`, `area_m2`, `bedrooms`, `building`
  (mã toà của `maToaCan` bỏ đuôi căn; đúng một toà khác nhau thì trả, chữ thường; không hay nhiều toà thì không trả).
  Trường cách đọc không trả (với `parser`: `listing_intent`, `property_type`, `project`) thành ô bỏ qua có tên
  «chưa có cách đọc». Cách đọc sau (E1 luật, LLM, Kev) thêm một mục vào sổ, không đổi bộ chấm.
- `phanKhuc(vang)` — `tat-ca` cho mọi tin, cộng một phân khúc theo loại hình của tin trong nhãn vàng
  (`apartment`, `house`, …; «tin không nêu» → `khong-neu`; nhãn vàng loại hình bất đồng → chỉ `tat-ca`). Lát là thị
  trường, nên ô là (lát × loại hình) như FRAMING §3.4.
- `chamO({tin, cachDoc})` → mảng ô `{phan_khuc, cach_doc, truong, n, dung, ti_le, can_duoi, nguong, nhom, trang_thai,
  ly_do}`. `trang_thai`: `pass` khi cận dưới ≥ ngưỡng; `fail` khi dưới; `skip` khi `n = 0` (lý do «chưa có nhãn
  người») hay cách đọc không có trường (lý do «chưa có cách đọc»). Ô `tat-ca` luôn có đủ (số cách đọc × 9) dòng, kể cả
  khi chưa có nhãn nào — đó là «ô bỏ qua có tên» của hàng.

### 3. Nhãn vàng từ người — `docNhanNguoi(client, {lat, split})`

Đọc `eval_label_items` (lát, split; mặc định `test` — tập dev để chỉnh luật, test để chấm) nối `eval_labels` và chữ
tin ở `stg_zalo_posts` (`ref_id` = `post_id`). Một trường của một tin:
- một người gắn → nhãn đó;
- nhiều người cùng nhãn (cùng «không nêu» hoặc cùng giá trị) → nhãn đó;
- nhiều người khác nhau → loại khỏi phép chấm trường ấy, đếm vào `bat_dong` (độ đồng thuận là việc của PL7, F5);
- tin không còn chữ ở stg → loại cả tin, đếm vào `mat_chu`.
Chỉ đọc; giao dịch `READ ONLY`.

### 4. Ghi `dq_check_results` và chữ trên `/ops/quality`

Mỗi ô một dòng: `check_name = 'eval-classify'`, `entity = '<lát>|<phân khúc>|<cách đọc>|<trường>'`, `status` =
`pass|fail|skip`, `detail` = một dòng `khoá=giá trị` theo thứ tự cố định:
`run=<id> tap=nguoi split=test n=150 dung=147 ti_le=0.98 can_duoi=0.9429 nguong=0.95 nhom=A ly_do=- bat_dong=0 mat_chu=0`
(`ly_do` ∈ `-`, `chua-co-nhan-nguoi`, `chua-co-cach-doc`). Dòng `khoá=giá trị` là khuôn các bên ghi khác dùng
(`samples=… avgF1=…`, `units=… B0=…`) và là khuôn `dq-labels.ts` đọc. Một lượt một `run`, ghi trong một giao dịch trên
client riêng — lỗi giữa chừng thì không dòng nào ở lại. `--dry` in bảng, không ghi.

`dq_check_results` lên cloud (ADR-0014) và hiện ở bảng «Kiểm chất lượng» của `/ops/quality` (bản mới nhất theo
kiểm × đối tượng, 7 ngày), nên `entity`/`detail` không mang `labeler_id`, chữ tin hay tên nguồn thật — chỉ mã lát, mã
phân khúc, tên cách đọc, tên trường và số đếm. Ca ON12-AC-5 của app đòi MỌI dòng kiểm trên DB máy thu được diễn giải;
dòng lạ làm suite app đỏ. Nên vòng này thêm vào `app/src/lib/dq-labels.ts` (như PL16 với `data-level:distribution`):
tên kiểm «Độ đúng cách đọc», đối tượng «<lát> · <phân khúc> · <cách đọc> · <trường>» (nhãn trường từ `FIELD_LABEL` của
PL7, loại hình từ sổ từ vựng), chi tiết «đúng 147/150 · cận dưới 0,9429 < ngưỡng 0,95 (nhóm A) · tập test» hoặc lý do
bỏ qua. Thuật ngữ «Độ đúng cách đọc» vào `CONTEXT.md`. Màn số độ đúng riêng (lọc theo ô, so ngưỡng) là việc của C4.

### 5. Lệch đã thấy trong F3

Bảng cỡ tập của F3 ghi «0,90: 150 nhãn được ≤ 8 lỗi». Cận dưới Wilson 95% (z = 1,96) của 142/150 là 0,8983 — dưới
0,90; mốc đúng là ≤ 7 lỗi (143/150 → 0,9068). Các mốc còn lại của bảng khớp công thức (100/0 → 0,9630; 100/1 →
0,9455; 150/2 → 0,9527; 150/3 → 0,9429; 200/3 → 0,9568; 200/4 → 0,9497; 100/4 → 0,9016; 100/5 → 0,8882). Lệnh theo
công thức; sửa dòng trong review là việc tài liệu riêng (ngoài vùng tệp của hàng này).

## Vì sao không làm khác

- **Đọc phát biểu đã lưu (`field_assertions`) làm cách đọc**: DB local hôm nay chỉ có `legacy`, `source_field` và
  `parser` cho `bedrooms` — không có `e1_rule`/`e2_llm` để chấm, và tin mẫu không có phát biểu nào. Chạy cách đọc trên
  chữ tin chấm được cả nhãn người lẫn tập mẫu bằng cùng một đường.
- **Bảng kết quả eval riêng**: cần migration (ngoài vùng của dãy); `dq_check_results` đủ chỗ (kiểm, đối tượng, trạng
  thái, chi tiết) và đã có bên đọc ở `/ops/quality`.
- **Ghi số tập mẫu vào `dq_check_results`**: số mẫu lên cloud cạnh số người dễ bị đọc nhầm thành độ đúng thật.

## Ngoài phạm vi

Hiển thị trên `/ops/quality` (C4) · cách đọc E1/LLM/Kev (thêm vào sổ khi có) · nhóm C · chạy trong CI khi parser đổi ·
đo lại hằng tuần và tự hạ ô (F3 «đo lại mỗi tuần») · cặp ghép căn (G3) · lát khác OCP1 (lệnh nhận `--lat`, nhưng
chỉ OCP1 có nhãn và mẫu).
