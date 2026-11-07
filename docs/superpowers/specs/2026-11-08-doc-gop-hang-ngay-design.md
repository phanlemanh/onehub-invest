# Đọc gộp S03 hằng ngày (PL34 `doc-gop-hang-ngay`) — thiết kế

Ngày: 2026-11-08 · Hàng: PL34 (`docs/plan/lo-trinh.json`) · Hạng: T2 · Hồ sơ: `_acceptance/doc-gop-hang-ngay/`

## Vì sao

ROADMAP §3 mục 34: Mạnh 07/11 «Đồng ý trần 20 usd/ngày. Còn lại theo khuyến nghị» (đóng Hỏi-1 của PL30), 08/11 «1. Bật
toàn bộ bài 2. Nghiệm thu sau»: phạm vi là toàn bộ bài S03 mới đã khử trùng theo tin, chạm trần thì dừng có tên; đọc lại kho
cũ ước tiền và trình riêng. PL30 (`chon-model-theo-o`) đã có lệnh `chay` đọc một lát hay một danh sách bài có trần tiền, và
cố ý KHÔNG có đường chạy toàn S03. Hàng này thêm đúng đường ấy: một lệnh cho một ngày bài, trần tiền tính theo ngày chi, chạy
lại an toàn, và một bước shell cho chuỗi đêm.

## Số đo trước khi dựng (08/11, DB máy thu, chỉ đọc)

| Ngày bài (giờ VN) | Bài thô | Sau gạt thử, sự kiện, khử trùng theo tin + chữ | Có chữ | Chỉ ảnh | Ước (công thức `uocThe`) |
|---|---|---|---|---|---|
| 06/11 | 8.641 | 3.278 | 1.443 | 1.835 | 1,48 + 2,06 USD |
| 04/11 | 10.522 | 3.849 | 1.621 | (chưa đo) | 1,68 USD phần có chữ |

Bài chỉ ảnh không nằm trong tin nào của pipeline (06/11: 0/3.658), nên khử theo tin không bao giờ chọn bài ảnh thay bài chữ.
Chi thật trung bình của Haiku trên `silver_labels` là 0,00041 USD/lời gọi (5.339 dòng). Con số «~9.000 bài, ~15 USD/ngày» của
lộ trình đếm bài thô với giá ước cũ; sau khử trùng một ngày tốn cỡ 1–4 USD — trần 20 USD gần như không bao giờ chạm, nhưng vẫn
là chốt chặn khi số bài tăng hay giá đổi.

## Thiết kế

### Lệnh mới `hang-ngay` (agent/scripts/doc-gop-s03.ts)

```
node --import tsx scripts/doc-gop-s03.ts hang-ngay [--ngay YYYY-MM-DD] [--tran-ngay-usd 20] [--cau-hinh <tệp>] [--thu]
```

- `--ngay`: ngày bài (giờ VN), mặc định hôm qua. `--tran-ngay-usd`: trần chi trong NGÀY CHI (giờ VN, ngày máy chạy), mặc định
  20. `--cau-hinh`: bảng chọn PL30 (mặc định `agent/config/doc-gop-s03.json`, model `mac_dinh` = Haiku). `--thu`: in phạm vi +
  ước tiền, KHÔNG gọi model, KHÔNG ghi bảng nào, không đòi khoá Gateway (khác `chay --thu` của PL30 — `chay --thu` vẫn gọi model).
- Thoát: 0 xong · 1 có lời gọi mà mọi lời gọi hỏng (lỗi gọi hay JSON hỏng) · 2 đầu vào sai (trước mọi lời gọi) · 3 dừng vì trần.
- Lệnh `chay` và `cham` của PL30 giữ nguyên hành vi.

Mô-đun mới `agent/src/enrich/doc-gop-s03/hang-ngay.ts`:

1. **Phạm vi ngày** — bài `stg_zalo_posts` của S03 (`agent_id` khác `apify-facebook`, cùng vị từ kênh của
   `pipeline/lib/test-posts.mjs`) có `coalesce(posted_at, captured_at)` trong ngày D giờ VN (cùng cửa sổ với mẫu soát DO1
   `pipeline/mau-soat-cuon-chieu.mjs`). Bản mới nhất mỗi `post_id`.
2. **Gạt và khử trùng** — gạt bài thử bằng `testMarker` (cùng bộ lọc của transform); gạt sự kiện và khử trùng bằng `khuTrung`
   của `pipeline/lib/eval-labels.mjs` (luật GN2: bài đã thành tin khử theo `offer_id` của `sale_offer_records`, bài chưa
   thành tin khử theo chữ đã gạt URL, rồi theo băm chữ). Một định nghĩa khử trùng duy nhất với bộ lấy mẫu.
3. **Đã đọc thì không gọi lại** — đúng luật của `chay` PL30: bỏ cặp (đơn vị, model) khi `silver_labels` đã có nhãn `json_ok`
   cùng `post_id`, cùng `text_hash`, cùng model, cùng `prompt_version`. Bài đăng lại ngày sau mang `post_id` mới thì được đọc:
   mẫu soát DO1 và các bộ đọc sau (PL18) dò nhãn theo `post_id`, và bài cùng chú thích có thể khác ảnh. Đọc lại tin đăng lại vẫn
   xa dưới trần (một ngày ước dưới 4 USD). Nhãn JSON hỏng và lời gọi lỗi không tính là đã đọc — lượt sau gọi lại (như PL30).
4. **Dựng thẻ** — `docTheTheoPost` của PL30 (mỗi bài một thẻ, ảnh có tệp trong snapshot). Thẻ không chữ, không ảnh tệp bị bỏ
   (đếm `bo`), như `chayLuot`.
5. **Trần ngày** — `chi_ngay` = tổng `cost_usd` của `silver_labels` có `run_id` mở đầu `pl34-<ngày chi>-`. Lượt chạy với trần
   còn lại = `tran − chi_ngay`. Khác `chay` của PL30 (ước vượt trần thì không gọi gì), lệnh đọc theo thứ tự `post_id`; trước mỗi
   lời gọi, ước lời ấy bằng max(công thức `uocThe`, tiền thật lớn nhất đã gặp trong lượt) và cộng với tiền thật đã chi trong
   lượt; vượt phần còn lại thì dừng: in dòng ghim `CHAM TRAN DOC GOP HANG NGAY <tran> USD ngày <ngày chi>: đã chi …, con lai <k>`,
   thoát 3. `chi_ngay` đã ≥ trần thì không gọi lời nào, thoát 3. Tổng chỉ vượt trần khi một lời gọi đắt hơn mọi ước trước nó (lời
   gọi đầu lượt, hay một bài nhiều ảnh bất thường) — vượt tối đa tiền của đúng lời gọi ấy.
6. **Ghi** — qua `chayLuot` của PL30: `silver_labels` (câu `SQL_GHI_DOC`) + `ai_calls` (viec `doc-gop-s03`). Luật 7: không bảng
   nào khác. `run_id = pl34-<ngày chi>-b<ngày bài>-<ISO>`.
7. **Tóm tắt** — dòng cuối stdout là một JSON `{"pl34": {...}}`: `ngay_bai`, `ngay_chi`, `tho`, `bai_thu`, `su_kien`,
   `trung`, `don_vi`, `da_doc`, `bo`, `can_goi`, `goi`, `loi`, `json_hong`, `ghi`, `usd`, `chi_ngay_truoc`, `tran`,
   `cham_tran`, `con_lai`, `uoc_usd`. Đây là chỗ đọc số một đêm thật (đường đo của `bat_khi`).

Sửa nhỏ ở `chay.ts` (cùng vùng): `chayLuot` nhận thêm hai tuỳ chọn không bắt buộc — `doDaDoc` chạy câu dò «đã có nhãn»
của PL30 cả khi người gọi truyền sẵn thẻ, và `goiDenTran` bỏ bước «ước tổng vượt trần thì không gọi gì» và ước lời gọi kế bằng
max(ước, tiền thật lớn nhất đã gặp) — và đếm thêm `hong` (JSON hỏng). Không truyền thì hành vi `chay` y như cũ (test PL30 giữ
nguyên).

### Bước đêm `pipeline/doc-gop-hang-ngay.sh`

Nạp `scripts/lib/job-step.sh`, chạy `hang-ngay` cho **hôm qua** rồi **hôm kia** (giờ VN) bằng `job_run doc-gop-hang-ngay
<hom-qua|hom-kia> …`, trần chung `DOC_GOP_TRAN_NGAY_USD` (mặc định 20) — trần tính theo ngày chi nên hai bước chia chung một
trần. Hôm kia để vớt bài thu muộn (`posted_at` hôm kia, `captured_at` hôm qua); bài đã đọc không gọi lại nên rẻ. Mỗi bước hỏng in
`JOB FAIL [doc-gop-hang-ngay] bước <nhãn> mã <n>`, tệp thoát bằng mã hỏng đầu tiên — người và `/ops` đọc log chuỗi đêm như mọi
job khác. Nạp `.env` của gốc kho bằng `--env-file` khi có (khoá Gateway). `DOC_GOP_NODE` ghi đè lệnh node (chỉ cho test).

Gắn bước vào lịch (plist, hay chuỗi `scripts/cloud-sync.sh`) là làn ZCode / giám sát, ngoài hàng này: sau khi gộp, gửi
`viec-phu` kèm thứ tự — chạy SAU job S03 đêm và TRƯỚC bước `mau-soat` của DO1 (mẫu soát cùng hàm `khuTrung` nên phần lớn bài
nó rút đã có nhãn cùng `post_id`, ít tiêu trần 0,05 USD của nó).

## Ngoài phạm vi

- Đọc lại kho cũ (bài trước ngày chạy đầu) — Mạnh: ước tiền và trình riêng.
- Gắn bước vào plist / `cloud-sync.sh` (làn ZCode, `scripts/` ngoài ranh giới hàng).
- Ghép ảnh album vào tin chữ trước khi đọc (GT2/PL28) — bài chỉ ảnh đọc riêng như một bài.
- Bảng chọn trong DB, màn Ops xem tiền theo ngày (chỗ xem là log + tóm tắt JSON; DO1 đo độ đúng).
- Phiên nghiệm thu một đêm thật — Mạnh «Nghiệm thu sau».

## Giới hạn đã biết khi thiết kế

- `chi_ngay` cộng `cost_usd` theo `run_id`: dòng JSON hỏng của ngày trước được đọc lại hôm nay mang cả tiền cũ sang `run_id` mới
  (câu ghi cộng dồn), nên chi hôm nay bị đếm dư — dư thì an toàn (dừng sớm hơn), không bao giờ đếm thiếu.
- Lời gọi lỗi mạng không ghi `silver_labels` nên không vào `chi_ngay`; mã ghi `usd = 0` cho lời gọi ném lỗi vì không đọc được
  tiền — Gateway có tính tiền lời gọi hỏng hay không chưa đo.
- Hai bài cùng ngày cùng chú thích (chữ đã gạt URL trùng nhau) mà khác ảnh bị khử trùng thành một theo luật GN2 của `khuTrung`;
  bài còn lại không có nhãn.
- Bài thu muộn hơn hai ngày bị bỏ (không có bước vớt hôm kìa).

## Đặc tả UX

Bỏ — lệnh dòng lệnh và bước shell, không có mặt người nhìn (dòng `descope` trong sổ).
