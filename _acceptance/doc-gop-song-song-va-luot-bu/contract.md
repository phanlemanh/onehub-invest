---
schema_version: 1
feature: Đọc gộp S03 gọi model song song có trần, có trần thời gian riêng để enrich luôn chạy, và lượt bù theo khoảng ngày
slug: doc-gop-song-song-va-luot-bu
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
design_doc: docs/superpowers/specs/2026-11-24-doc-gop-song-song-va-luot-bu-design.md
veto_state:
veto_opened_at:
approved_by: Mạnh
approved_at: 2026-11-23T23:38:35Z
---

# Acceptance Contract: doc-gop-song-song-va-luot-bu

## Context

Hàng HT6, giám sát giao gấp 24/11 trên đường găng S03 (audit máy thu 24/11 mục A2, đề xuất N2/N3). Bước đọc gộp hằng ngày gọi
Haiku tuần tự, trung bình 7,3 s một lời (sổ `ai_calls` 8 ngày: 26.671 lời, 0 lỗi gọi). Một ngày ~2.950 lời nên bước cần
21.000–28.000 s, trong khi trần cả lượt 00:00 là 14.400 s: đêm 23/11 bị cắt ở 14.400 s, `enrich-text` không chạy từ 21/11.
Cửa sổ «hôm qua + hôm kia» làm bài 22/11 (407 lời còn lại) và 23/11 (2.643 lời) rơi khỏi đường đọc sau đêm 25/11.

Vùng: `agent/src/enrich/doc-gop-s03/**`, `agent/scripts/doc-gop-s03.ts`, `agent/tests/doc-gop-*`, `pipeline/doc-gop-hang-ngay.sh`,
thiết kế và hồ sơ. Không sửa `scripts/zalo-import-daily.sh` (làn ZCode), plist hay trần 4 giờ của lượt.

## Criteria

### AC-1 — Gọi song song đúng số đã đặt
Given 40 bài cần đọc và model giả trả lời sau một độ trễ cố định,
When chạy lượt đọc gộp với `songSong` 4, rồi với 1,
Then số lời đang bay cùng lúc lớn nhất đúng bằng 4 (không bao giờ quá 4) và thời gian chạy nhỏ hơn một nửa bản tuần tự; với 1
thì lớn nhất là 1. Lệnh `chay` không truyền cờ thì vẫn tuần tự.

### AC-2 — Trần tiền không vượt khi chạy song song
Given 20 bài, mỗi lời tốn đúng 0,01 USD, trần 0,055 USD, `songSong` 4,
When chạy lượt,
Then tổng chi không quá 0,055 USD, số lời gọi không quá 5, lệnh `hang-ngay` thoát 3 với dòng `CHAM TRAN DOC GOP HANG NGAY`, và
số còn lại cộng số đã gọi bằng số cần gọi.

### AC-3 — Hết tiền, khoá sai, lùi đường giữ đúng khi song song
Given `songSong` 4 và model giả trả lỗi hết tiền (402) từ lời thứ 3,
When bảng chọn có `tu_lui` thì chạy một lượt; rồi chạy lại với bảng không có đường lùi; rồi với lỗi 401,
Then có lùi: đúng một dòng `chuyen-duong`, mọi bài có nhãn đúng một lần, không bài nào mất; không lùi: không lời mới nào được
phát sau khi lỗi về (số lời gọi ≤ số lời đã bay lúc đó), thoát 4; lỗi 401 thoát 1.

### AC-4 — Lỗi 429 không dừng lượt và làm chậm nhịp
Given `songSong` 4 và model giả trả 429 ở 3 lời đầu,
When chạy lượt,
Then lượt chạy hết các bài còn lại, ba bài lỗi không có nhãn (lượt sau đọc lại), mỗi lời có một dòng `ai_calls` với lớp
`han-muc`, số lời đang bay lớn nhất ngay sau lỗi giảm xuống dưới 4, và sau một quãng không có lỗi mới thì tăng trở lại tới 4.

### AC-5 — Song song cho cùng kết quả ghi như tuần tự
Given cùng một bộ bài và cùng câu trả lời giả,
When chạy với `songSong` 1 và 4 trên hai giao dịch riêng,
Then hai bên có cùng tập (post_id, model, json_ok) trong `silver_labels`, mỗi lời gọi đúng một dòng `ai_calls`, không cặp
(bài, model) nào bị gọi hai lần.

### AC-6 — Bước đọc gộp có trần thời gian riêng và thoát sạch
Given mốc hết giờ đã qua giữa lượt (hoặc `DOC_GOP_TRAN_GIAY` rất nhỏ ở bước shell),
When chạy `hang-ngay --het-gio <ISO>` và `pipeline/doc-gop-hang-ngay.sh`,
Then không lời mới nào phát sau mốc, lời đang bay chạy xong và được ghi, lệnh thoát 75 với dòng `JOB WARN [doc-gop-hang-ngay] het-gio`
nêu số còn lại; bước hôm qua hết giờ thì bước hôm kia bỏ với dòng `het-gio: bo buoc hom-kia <ngày> con lai <n>` (n đếm bằng chạy thử, không gọi model), tệp thoát 75 (mã «dừng đúng hẹn» thống nhất với ZCode qua LL; mã lỗi khác giữ nguyên); cả hai bước dùng chung
một mốc; mặc định truyền `--song-song 4` và trần 9.000 s; chạy lại sau đó đọc tiếp đúng phần còn lại.

### AC-7 — Lượt bù theo khoảng ngày, có chạy thử
Given bài của ba ngày liên tiếp, có ngày đã đọc một phần,
When chạy `doc-gop-s03.ts bu --tu <d1> --den <d3> --thu`, rồi chạy thật, rồi gọi với khoảng sai,
Then `--thu` in từng ngày và một dòng tổng (đơn vị, đã đọc, cần gọi, USD ước), không gọi model, không ghi, không đòi khoá; chạy thật
đọc ngày cũ trước, chung trần ngày chi với lượt đêm, dừng ở `--tran-luot-usd` của riêng lượt, run_id mang `-bu-`; khoảng sai khuôn, ngược chiều hay dài hơn 14 ngày thoát 2
trước khi nối DB. Trên DB máy thu, `bu --tu 2026-11-22 --den 2026-11-24 --thu` thoát 0 và in số cần gọi của 22/11 và 23/11.

### AC-9 — Hai lượt đọc gộp không chạy chồng nhau
Given một lượt `hang-ngay` (hay `bu`) đang chạy thật trên DB,
When một lượt thật thứ hai khởi động trong lúc đó, rồi chạy lại sau khi lượt đầu xong,
Then lượt thứ hai thoát 6 với dòng `JOB FAIL [doc-gop-s03] dang-co-luot-khac`, không gọi model lần nào, không ghi dòng nào; chạy lại
sau khi lượt đầu xong thì chạy bình thường. `--thu` không giữ khoá và không bị khoá chặn.

### AC-8 — Hồi quy
Given cây sau khi sửa,
When chạy `feature_loop.suite_keys` (gồm suite agent) và bộ test `scripts/` của chuỗi đêm (`jst_regress`),
Then tất cả thoát 0; các ca PL30, PL34, goi-thang-anthropic hiện có vẫn xanh.

## Đường găng: số trên màn (đo trên máy thu sau khi gộp)

Hàng xong khi ba số đổi trên dữ liệu thật, không xong ở «gộp». Đo lúc ~04:00 VN sau lượt 00:00 đầu tiên chạy bản mới, và sau lượt bù.

| Số | Hiện tại | Đích | Lệnh đo |
|---|---|---|---|
| Mã thoát lượt 00:00 | đêm 23/11 TIMEOUT ở 14.400 s; đêm 24/11 thoát 1 (DB) | 0, trong trần (khi nhánh ZCode claudedp-2311-5 đã gộp; trước đó bước hết giờ làm lượt thoát 75 nhưng enrich vẫn chạy) | `grep -n 'JOB STEP \[zalo-import-daily\]\|TIMEOUT\|het-gio' pipeline/logs/zalo-import.log \| tail -20` |
| Dòng `ai_calls` của `enrich-text` trong ngày | 0 từ 21/11 | > 0 | `SELECT model, count(*) FROM ai_calls WHERE viec='enrich-text' AND at > now()-interval '1 day' GROUP BY 1` |
| Lời cần gọi của đọc gộp 22–24/11 | 22/11: 407 · 23/11: 2.643 | 0 (24/11 do lượt đêm 26/11 đọc trong cửa sổ hôm kia) | `cd agent && node --import tsx scripts/doc-gop-s03.ts bu --tu 2026-11-22 --den 2026-11-24 --thu` |

## Áp lên máy thu (chữ ký Cổng Bằng chứng phủ đúng các mục dưới)

1. **Lệnh áp** (sau khi PR gộp, từ checkout chính ở `main`, ngoài giờ lượt 00:00):
   `cd ~/dev/onehub-invest/agent && node --env-file=../.env --import tsx scripts/doc-gop-s03.ts bu --tu 2026-11-22 --den 2026-11-23 --tran-luot-usd 6`
   (chỉ 22–23/11: 24/11 còn trong cửa sổ hôm kia của lượt đêm 26/11; nếu PR gộp sau 00:00 VN 26/11 thì 24/11 cũng rơi — khi đó xin lời mới cho khoảng mở rộng)
2. **Số chạy thử**: cùng lệnh kèm `--thu` ngay trước khi áp; ghi số cần gọi và USD ước vào báo cáo áp. Ước công thức hiện tại
   ~3,4 USD cho ~3.050 lời; theo giá thật đêm 21/11 (~1,42 mUSD/lời) ~4,3 USD. **Ngưỡng xin lại lời**: số cần gọi × 1,42 mUSD vượt
   6 USD thì dừng, không áp, trình lại. Trần chặn cứng hai lớp: `--tran-luot-usd 6` cho riêng lượt áp, và 20 USD/ngày chi chung với lượt đêm.
   Không chạy trong 23:30–04:30 VN (lượt đêm); khoá AC-9 chặn chồng lượt nếu lỡ.
3. **Sao lưu trước**: lượt chỉ THÊM dòng vào `silver_labels` và `ai_calls`, không sửa hay xoá dòng nào. Ghi trước khi áp:
   `SELECT count(*), coalesce(sum(cost_usd),0) FROM silver_labels WHERE run_id LIKE 'pl34-%'`.
4. **Cách lùi**: nhãn của lượt bù mang run_id `pl34-<ngày chi>-b<ngày bài>-bu-…`, tìm lại được để bỏ qua hay xoá. Xoá dữ liệu là
   việc cần lời riêng của Mạnh; tiền đã chi không lấy lại được.
5. **Lệnh kiểm sau**: chạy lại `bu --tu 2026-11-22 --den 2026-11-23 --thu` → cần gọi 0 cho 22/11 và 23/11; đếm lại câu ở mục 3, chênh bằng số nhãn đã ghi.

## Coverage

Trục (thước: sổ `ai_calls` 8 ngày, tồn đọng đo bằng `hang-ngay --thu`, mã thoát của `doc-gop-hang-ngay.sh` và `zalo-import-daily.sh`):

- Số lời cùng lúc: 1 · 4. [AC-1, AC-5]
- Kết cục một lời gọi: đạt · JSON hỏng · 429 · lỗi máy chủ · hết tiền · khoá sai. [AC-3, AC-4, AC-5; lỗi máy chủ đi cùng đường «lỗi khác» như 429 trừ phần làm chậm — AC-4]
- Đường gọi: Anthropic thẳng · Gateway · lùi giữa lượt. [AC-3]
- Điểm dừng của lượt: hết bài · trần tiền · hết giờ · lớp dừng. [AC-2, AC-3, AC-6]
- Ngày đọc: hôm qua · hôm kia · khoảng bù. [AC-6, AC-7]
- Chế độ: thật · chạy thử. [AC-7]
- Lượt chạy cùng lúc: một · hai chồng nhau (đêm + bù). [AC-9]

Bảng phủ ca (số trong ô từ DB máy thu 24/11):

| Ca | Số thật | AC | Ai đọc đầu ra phía sau |
|---|---|---|---|
| Lời đạt, đường Anthropic | 26.671 / 8 ngày | AC-1, AC-5 | `silver_labels` → bộ gom tin S03, mẫu soát cuộn chiếu, đo hằng ngày |
| JSON hỏng | 5 / 8 ngày | AC-5 | lượt sau đọc lại (nhãn json_ok=false không tính đã đọc) |
| Lỗi 429 / máy chủ | 0 / 8 ngày | AC-4 | lượt sau đọc lại |
| Hết tiền / khoá sai | 0 / 8 ngày (đã có ở 15/11 trên Gateway) | AC-3 | người đọc dòng JOB FAIL |
| Hết giờ | đêm 23/11 (cắt bởi trần lượt) | AC-6 | bước `enrich-run` chạy sau; người đọc dòng WARN |
| Khoảng bù | 22/11: 407 · 23/11: 2.643 | AC-7 | Mạnh ở Cổng Bằng chứng (tiền) |

Core → AC-1…AC-9. Later: song song hoá `enrich-run`; cảnh báo ra ngoài máy khi bước hết giờ. Never: tự bù mọi ngày cũ mỗi đêm.

## Out of scope

- Sửa `scripts/zalo-import-daily.sh`, plist `zalo-import`, trần 4 giờ của lượt (làn ZCode, cần lời Mạnh).
- Đổi prompt, bảng chọn model, luật «đã đọc», luật khử trùng, trần 20 USD/ngày.
- Song song hoá `enrich-run`; cảnh báo ra ngoài máy (hàng N4 của audit).
- Chạy lượt bù thật trong vòng này (chỉ chạy sau chữ ký, theo mục «Áp lên máy thu»).
