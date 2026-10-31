# Phát biểu đi theo bài đăng: áp/hoàn tác đề xuất phải phân xử lại mọi tin chung bài — thiết kế

Hàng `phat-bieu-db-do-tren-main` (đợt dot0-cam-mau, dãy P2, T3). Phát hiện: P1 khi làm HD5 thấy hai ca của
`pipeline/scripts/phat-bieu-db.itest.mjs` đỏ ngay trên main 25ce701b — PD-AC-1 (view thiếu `field_provenance`) và PD-AC-8
(cắt chuyển lệch).

## Đo (31/10, bản chép DB máy thu `oneinvest_p2_pd`)

| Đo | Số |
|---|---|
| PD-AC-1: `information_schema.columns` có `sale_offers.field_provenance` | 29 dòng (1 ở `public` + 28 ở lược đồ test sót `dc_*`) |
| Lược đồ `dc_*` sót trên :5433 | 20 (6 `dc_cloud_*`, 14 tiền tố khác), cùng 6 đuôi tiến trình, đều của `app/tests/dong-chay-cloud.test.tsx` |
| PD-AC-8: ô cắt chuyển lệch | 34 ô |
| `resolve_offer_fields(NULL)` trong ROLLBACK | 31.277 bản ghi xét · 173 đổi · 29 đổi cột (6 tin sống) · 144 chỉ đổi `field_provenance` (tin nghỉ `doi_khoa`) |
| 29 tin đổi cột chung chủ thể với phát biểu `e2_llm`/`hitl`/`e1_rule` | 29/29 |
| Chủ thể (post) nằm trong ≥2 bản ghi tin | 2.518 |

Ví dụ: post `S03:048e…` nằm trong `post_ids` của hai tin sống `offer_3e45…` và `offer_b288…`. Lượt làm giàu đầu tiên (30/10
17:03, 47 phát biểu `e2_llm`) áp đề xuất của `offer_3e45…` → `apply_enrichment` gọi `resolve_offer_fields(ARRAY[offer_3e45…])`
→ `offer_3e45…` thành `apartment`/`PR2`, còn `offer_b288…` giữ `unknown`/trống dù phân xử ra `apartment`/`PR2`.

## Nguyên nhân

1. **PD-AC-1 — thước, không phải sản phẩm.** Câu đếm cột không lọc lược đồ; DB chung còn lược đồ tạm của test
   `dong-chay-cloud` (lượt bị giết giữa chừng không tới `after()`). Bản thân view `public.sale_offers` có cột.
2. **PD-AC-8 — lỗi thật, có từ 045.** Thiết kế PL15 §3.1: phát biểu (trừ `legacy`) đi theo post sang MỌI tin chung post
   (sổ `phat-bieu-va-phan-xu#d-20261026T234901Z-26`). `resolve_offer_fields` làm đúng điều đó, nhưng hai bộ ghi phát biểu
   `apply_enrichment` và `revert_enrichment` chỉ phân xử lại tin của đề xuất. 059 chép nguyên `apply_enrichment` nên không
   đổi gì — không phải hồi quy của 059/PL16. Lỗi nằm im tới lượt enrich đầu tiên ghi phát biểu máy (30/10).

## Thiết kế

- **Migration 063** (`db/migrations/063_phat_bieu_theo_bai_dang.sql`, số do liên làn cấp):
  - Hàm `offers_chung_chu_the(text[]) → text[]`: mọi bản ghi tin (kể cả đã nghỉ) có `offer_subject_keys(...)` giao với
    tập chủ thể.
  - `apply_enrichment` = nguyên thân 059, chỉ đổi câu phân xử: gom chủ thể đã ghi phát biểu, phân xử
    `offers ∪ offers_chung_chu_the(chủ thể)`.
  - `revert_enrichment` = nguyên thân 045, câu phân xử thành `ARRAY[r.offer_id] ∪ offers_chung_chu_the(ARRAY[subj])`.
  - Mục sửa dữ liệu (tách bằng dấu mục riêng): đã cắt chuyển → `resolve_offer_fields(NULL)` một lần, ghi một dòng
    `ops_audit` `phat-bieu:phan-xu-lai-063` mang số bản ghi xét/đổi. Chạy lại = 0 bản ghi đổi (idempotent).
- **Bộ nạp test** `pipeline/lib/nap-045.mjs`: sau `napLai059`, nạp lại phần hàm của 063 (không chạy mục sửa dữ liệu) khi DB
  đã áp 063 — nếu không, test nạp lại 045/059 trong giao dịch sẽ đè hàm 063 bằng bản lỗi.
- **PD-AC-1**: thêm `AND table_schema = current_schema()` vào đúng câu đếm (một dòng — PL5 cũng sửa tệp này).
- **Test `dong-chay-cloud` tự dọn**: lúc bắt đầu, xoá lược đồ `dc_(local|cloud|noflow|ta|mut|mig)_<pid>` mà tiến trình
  `<pid>` không còn sống; bắt SIGINT/SIGTERM để xoá lược đồ của chính nó rồi thoát. Không đụng lược đồ của tiến trình còn
  sống hay tiền tố khác.

## Hỏi-1 (chỉ người có, khó đảo) — sửa dữ liệu thật trong migration

Khuyến nghị: migration 063 tự phân xử lại một lần (173 bản ghi; 29 đổi cột, 6 tin sống). `sale_offer_records` đi lên cloud
qua sync đêm, nên 6 tin sống đổi trên cloud đêm sau khi áp — áp lên :5433 chỉ sau khi PR gộp và Mạnh duyệt (pg_dump trước).
Lối khác: tách sửa dữ liệu thành lệnh chạy tay riêng — giá: thêm một bước vận hành, tin lệch tồn tại tới khi có người chạy.

## Hỏi-2 (chỉ người có, khó đảo) — phạm vi lược đồ test được tự dọn

Khuyến nghị: cả sáu tiền tố của test (`dc_local/cloud/noflow/ta/mut/mig_<pid>`) — 20 lược đồ hiện sót đều là rác của một test;
việc vận hành xoá 20 lược đồ sau sao lưu (`~/onehub-backups/db/20261031T011840Z`) trước lượt chấm, test quét sáu tiền tố.
Lối khác: chỉ `dc_cloud_*` — 14 lược đồ tiền tố khác nằm lại mãi và test chỉ dọn `dc_cloud_`.

## Ngoài phạm vi

- Xoá 20 lược đồ `dc_*` sót trên DB chung (việc vận hành có lời duyệt riêng của Mạnh — sổ quyết định ghi khi làm).
- Bộ ghi phát biểu khác phân xử theo tập tin của lượt (transform S03/S05/S06): tin chung post với tin đã nghỉ chỉ lệch
  nguồn gốc ô của tin nghỉ, không hiện ở đâu.
- Các thay đổi PL5 trên `phat-bieu-db.itest.mjs`.

## Rủi ro

- Hàm phân xử thêm một lượt quét `sale_offer_records` (31k dòng) mỗi lần áp/hoàn tác — E5 in thời gian một lượt áp trước và
  sau 063 (thông tin, không ngưỡng).
- Test dòng chảy cloud luôn nối DB chung :5433 (`localDbUrl`), nên bước quét tự dọn chạy trên DB chung ngay lượt đầu — phạm vi
  quét phải khớp phạm vi xoá Mạnh chốt (Hỏi-2), và việc vận hành xoá sau sao lưu đi TRƯỚC lượt chấm.
- Xung đột với 061 (HD5) nếu 061 cũng định nghĩa lại `apply_enrichment`/`resolve_offer_fields` — 31/10 chưa nhánh nào có 061.
