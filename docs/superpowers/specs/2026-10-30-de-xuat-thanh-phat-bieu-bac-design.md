# PL16 — đề xuất cũ thành phát biểu, bậc B0–B5 theo căn (thiết kế)

Hàng PL16 của lộ trình (`docs/plan/lo-trinh.json`), mã review C2.3 (`docs/architecture/classification-enrich-review.md:838`),
thang bậc FRAMING §3.4. Đứng trên PL15 (`field_assertions` + `resolve_offer_fields`, migration 045). Cổng Đáng: build —
Mạnh «Xếp theo bốn làn» 30/10. Hồ sơ: `_acceptance/de-xuat-thanh-phat-bieu-bac/`.

## 1. Hiện trạng đo trên DB máy thu (30/10)

| Thứ | Số | Ghi chú |
|---|---|---|
| `enrichment_proposals` | **0 dòng** | Đã 0 từ 26/10 (design PL15 dòng 21): `reconcile_stale_offers` (039) xoá đề xuất khi tin nghỉ không có tin kế, chụp lại ở `ops_audit enrich:retire` |
| Quyết định người về trường | 0 | `review_queue` có 4 thẻ enrich `rejected` nhưng do máy (`transform:S0x` khi tin nghỉ); 1 quyết định người là ghép căn (`entity_match`) — không phải trường |
| `field_assertions` | 102.597 | legacy 50.278 · source_field 48.315 · parser 4.004 · 0 dòng mang `proposal_id` |
| Căn (`properties`) | 25.863 | mọi căn có ≥1 tin đủ năm trường lõi → B2; `verification` = `pending` hết |
| Tin chưa gắn căn (S03/S05/S06) | 918 | 913 thiếu trường lõi (B0), 5 đủ (B1) |
| Thị trường có căn | 2 | `areas.region_type = market`, cha của phường |

Hệ quả: phần «đề xuất cũ → phát biểu» không còn dòng nào để chuyển. Từ 045 mọi đường áp (`apply_enrichment`) đã tự ghi phát
biểu (`evidence.proposal_id`; người = `fact/hitl`). Việc còn lại của C2.3 là **chứng minh và giữ** bất biến «mọi đề xuất đã
áp có phát biểu tương ứng» — một phép kiểm chất lượng chạy theo nhịp, không phải một bộ chuyển cho tập rỗng (Hỏi-1).

## 2. Đơn vị và thang

**Đơn vị đếm bậc** = mỗi căn hiện hành (`properties`) + mỗi tin rao S03/S05/S06 còn sống chưa gắn căn. FRAMING đặt B0/B1
trên «tin» (có lời khai, đọc được) trước khi «gắn căn» (B2): một tin lẻ là một căn chưa dựng, nên nó nằm trong phân bố.

**Trường lõi** (năm, giữ đúng điều kiện của `app/src/lib/data-level.ts` và khối `COMPLETE` của `600_data_flow.sql`):
loại tin, loại hình ≠ `unknown`, giá > 0, diện tích > 0, phường.

| Bậc | Tin lẻ | Căn |
|---|---|---|
| B0 | thiếu một trường lõi | không tin gắn nào đủ trường lõi |
| B1 | đủ trường lõi, chưa gắn | — (căn đã gắn theo định nghĩa, không dừng ở B1) |
| B2 | — | có ≥1 tin gắn đủ trường lõi |
| B3 | — | B2 và tin đại diện có **mọi** trường lõi mang nguồn gốc `measured = true` |
| B4 | — | B3 và `verification = 'verified'` và mọi trường lõi của tin đại diện có lớp `fact` |
| B5 | — | không đạt được ở PL16 — cần trạng thái lời chào + lịch sử giá (PL19) |

- Tin đại diện của căn = tin gắn đủ trường lõi, chọn tất định (lớp nguồn gốc cao nhất, rồi `offer_id` nhỏ nhất).
- Mỗi đơn vị trả kèm **chỗ kẹt** của bậc kế (`truong-loi`, `gan-can`, `so-do`, `xac-minh`, `hieu-luc`) để phân bố nói được vì
  sao chưa lên.
- Hôm nay B3 = 0 ở mọi nơi: nguồn gốc chỉ phủ năm trường enrich và luôn ghi `measured: false` (045 dòng 217). PL21 (cổng tự
  áp theo số đo) và PL17 (phát biểu cho trường lõi) mở B3; DB1 (danh mục S08) mở nhánh «khớp danh mục» của B4; PL19 thay
  vị từ B5. Bậc là MỘT hàm SQL — các hàng sau chỉ thay vị từ, không đổi bên đọc.

**Phân khúc** = thị trường × loại hình (FRAMING §5 north star «theo thị trường × loại»; `CONTEXT.md` «Thị trường» =
`areas.region_type = market`). Thị trường của đơn vị = cha `market` của phường; không phường → `chua-ro`.

## 3. Thành phần

1. **Migration 056** (số xin ở liên làn):
   - `offer_data_level(...)` và `property_data_level(...)` (SQL, `STABLE`) trả `(data_level, ke_thieu)`.
   - Bảng `data_level_snapshot (snap_date, market_id, property_type, unit, data_level, n)`, khoá chính đủ năm cột đầu,
     `data_level` CHECK `B0..B5`, `unit` CHECK `can|tin_le`. Chỉ local (không lên cloud ở vòng này).
   - Trục `data_level` gắn cột `data_level_snapshot.data_level` (`pipeline/mappings.yaml` `columns`), seed `ref_field_lookup`.
2. Đơn vị không phường lưu `market_id = 'chua-ro'` (chữ, không NULL — cột nằm trong khoá chính). Loại hình của căn lấy
   `properties.property_type`, của tin lẻ lấy từ tin.
3. **`pipeline/sql/610_data_level.sql`**: `DELETE` dòng của ngày rồi `INSERT` phân bố (luật rollup: không `ON CONFLICT DO NOTHING`).
4. **`pipeline/bac-du-lieu.mjs`**: `--write` chạy 610 và ghi hai dòng kiểm chất lượng; không cờ thì chỉ in bảng phân bố
   (thị trường × loại hình × B0–B5, nhãn tiếng Việt từ trục) của ngày mới nhất.
5. **Kiểm chất lượng** (`dq_check_results`, ghi bởi `bac-du-lieu.mjs --write`):
   - `enrich:proposal-assertion` — đếm đề xuất `applied` không có phát biểu sống: khớp theo `evidence.proposal_id`, hoặc
     cùng chủ thể · trường · giá trị · phương pháp như `revert_enrichment` nhưng KHÔNG bao giờ nhận phát biểu `legacy`.
     `reverted` không vào bất biến (045 đã rút phát biểu khi hoàn tác). Thiếu > 0 → `fail`; dòng kiểm `fail` không làm lệnh
     thoát khác 0 — chỉ lỗi chạy mới.
   - `data-level:distribution` — tổng đơn vị và số theo bậc của ngày.
   - Nhãn tiếng Việt cho cả hai ở `app/src/lib/dq-labels.ts` (bài học ON12-AC-5 sau #192: bên ghi mới phải kèm nhãn bên đọc).
6. **Nhịp** (Hỏi-3): thêm bước `job_run cloud-sync bac-du-lieu node pipeline/bac-du-lieu.mjs --write` làm bước CUỐI của
   `scripts/cloud-sync.sh` (sau `push-ops-facts`, không làm chậm nhịp tim /ops). Ảnh chụp theo ngày, lượt 15′ sau ghi đè
   ngày hiện tại; ngày cũ giữ để thấy bậc tụt. Dãy bước viết trước của `scripts/job-exit.test.mjs` thêm `bac-du-lieu` ở
   cuối; lời tiêu chí đã ký (che-do-thu-tren-ops AC-6, dong-chay-len-cloud AC-9, job-bao-loi-that AC-3) không liệt kê
   trọn dãy nên không đổi.

## 4. Không làm (cắt)

- Bộ chuyển đề xuất cũ → phát biểu: bảng rỗng (Hỏi-1).
- Đẩy phân bố lên cloud / trang `/ops` (cần migration Supabase + leak gate): việc riêng sau khi số ổn.
- Bảng bậc đích từng phân khúc và số north star «đạt bậc đích»: FRAMING mới viết bằng chữ, chưa có quyết định cột.
- Bậc năng lực N0–N4.
- Phát biểu phủ định cho quyết định «bác» của người, thẻ chờ chuyển tin kế (Ngoài-4 enrich-hau-ky): PL23.
- Đổi định nghĩa «căn» (ADR-0016 Đợt 1–2): hàm bậc đọc `properties` hôm nay; DB2 đổi bên đọc của hàm (Hỏi-2).

## 5. Rủi ro

- Lệch giữa SQL và `levelOf` của app → test chéo ma trận năm trường × gắn/chưa (AC-1).
- Snapshot đếm trùng tin đã nghỉ → chỉ đọc `sale_offers` (view tin sống) và `properties`.
- Hàm chạy chậm trên 26 nghìn căn → một câu tập hợp, không gọi hàm từng dòng trong vòng lặp; đo thời gian trên bản chép DB.
