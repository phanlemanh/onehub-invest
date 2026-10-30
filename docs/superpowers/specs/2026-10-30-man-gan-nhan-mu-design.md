# Màn gắn nhãn mù — thiết kế (PL7 `man-gan-nhan-mu`, mã C1.3 phần màn + lưu nhãn)

Ngày: 2026-10-30 · Hàng: PL7 (T2 theo lộ trình; máy suy **T3** vì chạm `db/migrations/**`, `app/src/lib/ops-access.ts`,
`app/src/app/api/v1/ops/**` — xem `t3_paths`) · Cổng Đáng: `build`, Mạnh 30/10 «Làm theo khuyến nghị» (`opportunity.md`).

## Bài toán

Mọi con số «độ tin» của phân loại (F3: cận dưới Wilson so ngưỡng theo nhóm trường) cần một **tập nhãn do người gắn**,
gắn mù (không thấy giá trị máy, tránh neo — §3.5) và có **20% tin gắn trùng hai người** để đo đồng thuận; đồng thuận
dưới 0,9 thì sửa hướng dẫn gắn nhãn trước khi tin vào số đo (F5). Chưa có bảng, màn hay lệnh nào cho việc này
(`db/migrations` không có bảng nhãn). PL8 (tập nhãn mẫu) và PL9 (`eval:classify`) đứng trên hàng này.

## Phạm vi vòng này

1. **Lưu nhãn** — migration mới (số do sổ migration cấp, dự kiến 053, P4-82), hai bảng + một view, **chỉ ở máy thu**:
   - `eval_label_items` — mỗi dòng một tin của lát được chọn để gắn: `lat` (vd `ocp1`), `source_code` (`S03`),
     `ref_id` (post_id ở stg), `text_hash` (băm nội dung đã chuẩn hoá), `split` (`dev`/`test`), `double_label`
     (thuộc 20% gắn trùng), `sampled_at`, `seed`. Khoá duy nhất `(lat, text_hash)` và `(lat, ref_id)`.
   - `eval_labels` — một dòng một (tin × người gắn × trường): `item_id`, `labeler_id` (→ `users.id`), `field`,
     `value` (chữ chuẩn hoá; số ghi dạng thập phân), `not_stated` (tin không nêu), `labeled_at`. Khoá duy nhất
     `(item_id, labeler_id, field)`.
   - view `eval_label_agreement` — theo `lat × field`: số cặp đủ hai người, số cặp khớp, tỉ lệ khớp. Một chỗ tính,
     màn và lệnh đọc chung (app không import `pipeline/`).
   - Tầng A (gắn với hồ sơ người dùng app) → **không** thêm vào `pipeline/sync-cloud.mjs` hay `push-ops-facts.mjs`.
2. **Lấy mẫu lát** — `pipeline/label-sample.mjs --lat ocp1 --n 200 --seed <s> [--nhom-khop <regex>] [--thu]`:
   - tin S03 ở `stg_zalo_posts` của các nhóm khớp mẫu tên nhóm của lát (mặc định lát `ocp1`: `ocp|ocean|masteri`,
     không phân biệt hoa thường — cùng mẫu đã dùng để đếm lát ở tài liệu lát OCP1 26/10);
   - gạt post thử bằng **đúng** bộ lọc của transform (`loadStgPosts`/`lib/test-posts.mjs`, L19);
   - khử trùng theo `text_hash` (lát có ~1.135 nội dung khác nhau / 1.878 post một tuần);
   - chọn tất định theo `seed` (băm `seed + text_hash`, lấy n nhỏ nhất); 20% (làm tròn) đánh `double_label`, nửa
     `dev` nửa `test` theo băm — chạy lại cùng tham số không thêm, không đổi dòng nào; `--thu` chỉ in.
3. **Màn `/ops/labels` «Gắn nhãn»** (cổng Ops, nhóm menu «Xử lý» cạnh «Hàng duyệt»):
   - tin kế cho người đang đăng nhập: chưa do người này gắn; tin đơn chưa ai gắn; tin gắn trùng còn thiếu người thứ
     hai (ưu tiên tin trùng đã có một người để cặp mau đủ);
   - hiện **chỉ chữ gốc của tin** + tên nhóm + giờ đăng — KHÔNG hiện, không truy vấn giá trị máy (`sale_offers`,
     `field_assertions`, `enrichment_proposals`, `meta.kev`…);
   - biểu mẫu trường lõi (mục «Trường lõi»), mỗi trường có lựa chọn «Tin không nêu»; Lưu → sang tin kế;
   - ô số: «Tôi đã gắn», «Cặp gắn trùng đủ hai người» k/N, «Đồng thuận thấp nhất»; bảng đồng thuận theo trường.
   - trên cloud (`VERCEL=1`): «Chỉ ở máy thu» (`LocalOnlyAlert`), không truy vấn bảng nhãn.
4. **Ghi nhãn** — `POST /api/v1/ops/labels` với quyền mới `label.write` (vai **ops** trở lên, không bearer — Hỏi-2):
   kiểm đủ trường, kiểu và miền giá trị; tin đơn đã có người khác gắn hoặc tin trùng đã đủ hai người → 409, không ghi;
   ghi mọi trường của một lượt trong một giao dịch, khoá dòng tin (`SELECT … FOR UPDATE`) trước khi đếm người gắn — hai
   người ghi cùng lúc thì một người nhận 409. Chuẩn hoá trước khi lưu: số tiền đổi ra VND nguyên (làm tròn, tính bằng
   số nguyên triệu × 10⁶ để tránh sai số thực); chữ NFC, bỏ khoảng trắng đầu cuối, gộp khoảng trắng, chữ thường.
5. **Lệnh đồng thuận (đường đo)** — `pipeline/label-agreement.mjs --lat ocp1 [--json]` đọc view, in mỗi trường một
   dòng (cặp đủ · khớp · tỉ lệ) và dòng `thap_nhat`, và `phut_cong` theo người gắn (cộng khoảng giữa hai lượt lưu liên tiếp, bỏ khoảng nghỉ > 10
   phút) — đo ngưỡng «khoảng 6 giờ công»; thoát 0 (đo, không chặn).
6. **Từ vựng** — thuật ngữ «Gắn nhãn» (slug `labels`), «Nhãn đánh giá» trong `CONTEXT.md`; `routes.md`, `portals.md`,
   `nav.tsx`.

## Trường lõi (Hỏi-3)

Theo F3 nhóm A + B và G1 (§3.5), bỏ phần cần danh mục căn:

| Trường (`field`) | Nhập | Miền |
|---|---|---|
| `listing_intent` Ý định tin | chọn | sổ từ vựng trục `listing_intent` |
| `kind` Loại tin | chọn | trục `kind` |
| `property_type` Loại hình | chọn | trục `property_type` |
| `project` Dự án | chữ | tên dự án như tin viết (chuẩn hoá chữ thường, bỏ khoảng trắng thừa) |
| `building` Toà | chữ | mã/tên toà như tin viết |
| `price_min_vnd`, `price_max_vnd` Giá (khoảng) | số (tỷ/triệu → VND) | ≥ 0; min ≤ max; một số thì min = max (F1: giá che là khoảng) |
| `area_m2` Diện tích | số | > 0 |
| `bedrooms` Phòng ngủ | số nguyên | ≥ 0 |

Lựa chọn của ba trục lấy từ `app/src/lib/vocab.generated.ts` (PL6), không viết tay (lint PL6 đỏ khi viết tay). Không
gồm `price_basis` (PL6 đã quyết để PL13 định giá trị), tầng, mã căn, trục căn (cần danh mục — C1.5/C1.6).

## Đồng thuận (Hỏi-1)

Theo từng trường, trên tin `double_label` đã có đủ hai người gắn: **tỉ lệ khớp** = số cặp hai giá trị bằng nhau (cùng
«tin không nêu», hoặc cùng giá trị sau chuẩn hoá; số so bằng số) / số cặp đủ. Ngưỡng 0,9 (F5) xét **từng trường**;
trường dưới ngưỡng hiện Badge cảnh báo. Trường chưa có cặp đủ → «chưa đủ cặp», không hiện 0.

## Lựa chọn đã cân

- Lưu kiểu một dòng một trường (không một cột một trường): thêm trường sau (vd `price_basis` khi PL13 xong) không cần
  migration đổi bảng; view đồng thuận tính đồng loạt.
- Tính đồng thuận ở view SQL thay vì hàm JS: app không được import `pipeline/` (app/CLAUDE.md), một chỗ tính cho cả
  màn lẫn lệnh.
- Mẫu chọn ở pipeline (lệnh), không ở màn: chọn lát là việc người vận hành chạy một lần; màn chỉ đọc hàng đã chọn.
- Ghi qua route API (khuôn `/api/v1/ops/review/[id]/decide`) + `kiemQuyen`, không server action — giữ một luật quyền.
- Tri thức thiết kế sàn S1 trỏ hai tệp hiệu ứng T6 (canvas, shader gradient) — không áp cho màn biểu mẫu Ops (không
  chuyển động, ReUI).

## Ngoài vòng

S05/S06 (G1 còn 100 + 100 tin), cặp ghép căn (G3, 150 cặp), `eval:classify` + `dq_check_results` (PL9), tập nhãn mẫu
(PL8), gắn từ xa qua cloud (nhãn đi ngược chiều kéo một chiều ADR-0015), sửa/xoá nhãn đã lưu, hướng dẫn gắn nhãn
(tài liệu vận hành của người, không phải code), vai người gắn nhãn riêng.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng
- Suôn sẻ: menu Ops «Xử lý › Gắn nhãn» → `/ops/labels` hiện tin kế + biểu mẫu → điền 9 ô (hoặc «Tin không nêu») → «Lưu và
  sang tin kế» → tin kế (điểm ra: hết tin → trạng thái «Đã gắn hết»).
- Biên: lát chưa lấy mẫu (bảng rỗng); người này đã gắn hết phần của mình; cặp trùng chưa đủ → bảng đồng thuận «chưa đủ
  cặp»; vai viewer mở trang (đọc số, không có biểu mẫu); trên cloud.
- Lỗi & quay lại: Lưu bị 400 → lỗi đỏ dưới đúng ô, giữ chữ đã gõ; 409 (người khác vừa gắn) → thông báo và nạp tin kế;
  tải tin lỗi → Alert có «Thử lại».

### 2. Kiểm kê màn
| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| `/ops/labels` Gắn nhãn | gắn trường lõi cho một tin của lát, không thấy giá trị máy | menu Ops nhóm Xử lý / tin kế, `/ops/quality` |

### 3. Bảng trạng thái
<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-labels-loading | Gắn nhãn | Skeleton đúng bố cục ô số + khung tin + biểu mẫu | chờ |
| ST-labels-empty | Gắn nhãn | «Chưa có tin nào của lát để gắn» + lệnh lấy mẫu `node pipeline/label-sample.mjs --lat ocp1 --n 200 --seed …` | chạy lệnh ở máy thu rồi tải lại |
| ST-labels-ready | Gắn nhãn | ô số; tin (chữ gốc, nhóm, giờ đăng); biểu mẫu 9 ô | điền, Lưu |
| ST-labels-invalid | Gắn nhãn | lỗi dưới ô sai (vd «Giá thấp nhất lớn hơn giá cao nhất») | sửa ô, Lưu lại |
| ST-labels-taken | Gắn nhãn | toast «Tin này vừa có người gắn — chuyển tin kế» | tiếp tục với tin kế |
| ST-labels-done | Gắn nhãn | «Anh đã gắn hết tin của lát» + ô số + bảng đồng thuận | sang `/ops/quality` |
| ST-labels-error | Gắn nhãn | Alert lỗi + «Thử lại» | Thử lại |
| ST-labels-viewer | Gắn nhãn | ô số + bảng đồng thuận, không biểu mẫu, câu «Cần vai ops để gắn nhãn» | — |
| ST-labels-cloud | Gắn nhãn | «Chỉ ở máy thu» — nhãn không rời máy thu | mở Ops ở máy thu |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi
- Số tiền nhập theo «tỷ» hoặc «triệu» (chọn đơn vị), máy đổi ra VND; một giá thì để hai ô bằng nhau.
- «Tin không nêu» ở mỗi ô: chọn thì ô nhập khoá lại và giá trị bị bỏ.
- Phím: Tab theo thứ tự ô; Enter ở ô cuối = Lưu. Khổ hẹp (< 768): tin trên, biểu mẫu dưới; rộng: hai cột.

### 5. Xuất xứ component
| Component | Nấc | Vì sao |
|---|---|---|
| PageHeader, StatTiles (`components/page`) | dùng | khuôn trang Ops sẵn có |
| Frame + Field/Input/Select/Checkbox/Button (`components/ui`) | ghép | biểu mẫu chuẩn shadcn base-nova |
| Badge, Alert (`components/reui`) | dùng | trạng thái đồng thuận, lỗi |
| LocalOnlyAlert (`components/ops`) | dùng | trang trên cloud |
| Table (`components/ui`) | dùng | bảng đồng thuận 9 dòng — dưới ngưỡng cần data-grid |

### 6. Khuôn IA đã chọn + căn cứ
Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: (ii) màn làm một tin một lúc theo hàng chờ do máy xếp — khung «chi tiết» là tin + biểu mẫu, «danh sách» là hàng
chờ ngầm (tin kế); cùng khuôn `/ops/review` đang dùng cho thẻ duyệt. Không tra mẫu ngoài: luồng hiển nhiên.
<!-- UX-SPEC-TEMPLATE>>> -->
