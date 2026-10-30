# Bảng đề xuất enrich rỗng từ 26/10 — điều tra

Đo 30/10/2026 trên DB máy thu :5433, chỉ đọc. Số thô: `research-local/enrich-ngung-2610/` (gitignored). Giờ ghi theo giờ VN.

## Kết luận

Khâu Enrich **chưa bao giờ chạy theo lịch**. Bảng `enrichment_proposals` không hỏng vào ngày 26/10. Bảng chỉ từng chứa
đề xuất của **một lượt chạy thử bằng tay** sáng 23/10 (run `enrich-2026-10-22T23:25:08.912Z`, 4 tin: 2 tin S03, 2 tin
S05). Trưa 26/10, hai tin S05 cuối cùng của lượt đó biến mất khỏi lượt nạp S05. Luật nghỉ tin của migration 039 chụp 8
đề xuất của chúng vào `ops_audit` (`enrich:retire`, id 35123), xoá chúng khỏi bảng và đóng thẻ duyệt, đúng như thiết kế.
Từ đó tới nay không có gì gọi `enrich-run`, nên bảng rỗng.

Chuỗi enrich vẫn chạy được trên mã `main` hiện tại (sau 044/045). Đã chạy `LIMIT=5 enrich-run --dry`, đường này không gọi
LLM và không ghi gì: 5/5 tin ra đề xuất E1 (7 đề xuất `direct`). LLM local (qwen3.8-27b, :8000) đang sống. Hiện còn
**394 tin chờ enrich** (S03 371 · S05 23).

## (a) Bảng và số dòng

| Mốc | `public.enrichment_proposals` |
|---|---|
| 23/10 06:25 — lượt chạy thử | id 639–647 (và đề xuất của 2 tin S03) |
| 23/10 — transform S03 còn DELETE (trước 039) | đề xuất S03 mất theo CASCADE (lý do của hàng NT6) |
| 26/10 12:00 — đối soát S05 nghỉ 8 tin | 8 đề xuất → `ops_audit` 35123, bảng còn 0 |
| bản sao lưu 29/10 08:51 · 29/10 14:39 · 30/10 ×3 (`so-dong.tsv`) | 0 |
| đo 30/10 | 0; `ai_calls` 0 dòng (từ 052 chưa có lời gọi LLM nào được ghi) |

`pg_stat` ghi 34.805 lượt insert nhưng 0 dòng sống, và sequence đã lên 111.518. Hai số này **không** chứng có ai xoá dữ
liệu thật: test của agent và pipeline chạy trên `public` trong `BEGIN…ROLLBACK`, nên insert bị huỷ vẫn được đếm và
sequence không lùi. Việc chuyển DB vào volume ngày 29/10 (PR #173) cũng không phải nguyên nhân: bản sao lưu trước khi
chuyển đã có 0 dòng.

Thẻ `agent_output` trong `review_queue`: 4 thẻ, đều `rejected`. 2 thẻ đóng lúc 25/10 00:00 (S03 nghỉ tin), 2 thẻ đóng
lúc 26/10 12:00 (S05 nghỉ tin).

## (b) Ai ghi vào bảng

- Ghi: `agent/scripts/enrich-run.ts` → `runEnrich()` (`agent/src/enrich/run.ts`). Insert đề xuất, rồi E1 áp qua
  `apply_enrichment` (033, từ 045 là phát biểu kèm phân xử). Phần còn lại lên thẻ `/ops/review`.
- Lịch chạy: **không có**. Không plist launchd nào (`~/Library/LaunchAgents/com.oneinvest.*`) gọi enrich.
  `scripts/zalo-import-daily.sh` dừng ở `transform-zalo` → `transform-media` → `refresh-bait-gap`. Đầu script ghi «chạy
  SAU transform-zalo/transform-fb, TRƯỚC resolve-properties», nhưng chưa có bước nào nối nó vào chuỗi đó.
- Lần chạy cuối có ghi thật là lượt chạy thử sáng 23/10 (run_id ở trên). Không có trace hay log nào mới hơn.

## (c) 26/10 có gì đổi

- 07:44: Mạnh hoàn tác 639/644 (`hitl:manh`, `enrich:revert`, F6 «land sai») → mở lại 640/645.
- **12:00: `transform:S05` đối soát** (`ops_audit` 35122/35123): 90 tin cũ, 8 tin nghỉ, gồm cả 2 tin của lượt chạy thử.
  Đề xuất bị chụp vào audit rồi xoá theo 039. Việc này xảy ra **trước** khi PL14 (`nap-lai-khong-xoa`, #132) được merge
  lúc 18:24.
- PL14 (044) đổi `sale_offers` thành view trên `sale_offer_records` và chuyển khoá ngoại sang RESTRICT. PL15 (045, #152,
  27/10) cắt chuyển sang phát biểu (`cat-chuyen:045` 27/10 07:55). Cả hai đều không đụng tới dòng đề xuất nào, và
  `enrich-run --dry` vẫn chạy được sau hai thay đổi này.
- Không có job nào bị tắt, model không đổi (MTPLX :8000 đang trả `qwen3.8-27b-local`), khoá/ENV không đổi.

## (d) Gốc

Thiếu bước chạy enrich định kỳ. Từ M-3, Enrich chỉ là một CLI chạy bằng tay. Cái gọi là «rỗng từ 26/10» thực chất là
dấu vết cuối cùng của lượt chạy thử bị luật nghỉ tin dọn đi. Nút chặn đã biết trước khi lên lịch: TD9 (`enrich-run`
gói cả lượt, kể cả các lời gọi LLM ~2 giờ cho toàn backlog, trong **một** giao dịch, nên giữ khoá và treo thẻ) và TD8
(tin S03 mất đề xuất trước 039). Cả hai đã nằm trong hàng NT6 `enrich-backlog-ben`.

## Phụ: test bỏ rác vào DB dùng chung

Sao lưu 29–30/10 còn các lược đồ `dc_local_*`, `dc_mig_*`, `dc_mut_*`, `dc_noflow_*`, `dc_ta_*`. Đây là lược đồ tạm của
test DF1 mà không được dọn. Chúng không ảnh hưởng `public`, nhưng làm phình bản sao lưu.
