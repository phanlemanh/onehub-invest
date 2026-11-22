---
schema_version: 1
feature: Lệnh đo Căn giá tốt (scripts/deals-phi-ly-do.mjs) tự dựng tin phi lý đối chứng trong giao dịch, nên đối chứng không đỏ oan trên DB đã qua bước đêm mà vẫn đỏ khi luật loại hỏng
slug: deals-phi-ly-do-doi-chung-tu-tinh
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: verified
approved_by:
approved_at:
veto_state: mo
veto_opened_at: 2026-11-19T10:10:00Z
design_doc: _acceptance/deals-phi-ly-do-doi-chung-tu-tinh/design.md
---

# Acceptance Contract: deals-phi-ly-do-doi-chung-tu-tinh

## Context

Hàng của dãy P1 (giám sát thêm 31/10, theo P4 báo): E7 của hồ sơ `deals-loai-tin-phi-ly` đỏ trên DB máy thu vì đối chứng «bản
chưa loại» đọc trạng thái DB đã bị lượt đêm lọc; đối chứng phải tự dựng số trước luật loại trong giao dịch. Đo lại 19/11: lệnh
thoát 1 với đúng một dòng «FAIL đối chứng: bản chưa loại còn 0 tin phi lý». Thiết kế: `design.md` (tự dựng tin đối chứng bằng
cách xoá diện tích của tin đầu danh sách trong một SAVEPOINT, chạy bước đêm thật, rồi lùi về SAVEPOINT trước phần đo chính).

## Criteria

### AC-1 — Trên DB đã qua bước đêm, lượt đo đạt và đối chứng bắt được tin dựng
Given lược đồ riêng có thước bịa và các tin P1 hợp lý đã có số giảm trong khoảng danh sách, không tin phi lý nào trong danh sách
(trạng thái sau bước đêm),
When gọi lõi đo `doTrongGiaoDich(c)` với bước đêm thật,
Then mọi kiểm xanh; có kiểm «đối chứng: bản chưa loại còn 1 tin phi lý» và kiểm «luật loại bắt tin đối chứng <mã>» (mã tin đầu
danh sách nằm trong `offer_ids` của dòng audit `bait-gap:loai-phi-ly` trong SAVEPOINT đối chứng); sau lượt, tin đối chứng còn
diện tích cũ và vẫn đứng đầu danh sách của phần đo chính (đối chứng đã lùi về SAVEPOINT).

### AC-2 — Luật loại hỏng thì lượt đo đỏ, gọi tên
Given cùng fixture của AC-1,
When gọi lõi đo với `refresh` là bước đêm thật mà hai câu ghi của luật loại bị bỏ qua (số giảm vẫn do bên ghi thật tính),
Then kiểm «luật loại bắt tin đối chứng» đỏ và kết quả không đạt — dù dữ liệu fixture không có tin phi lý thật nào, nên ba kiểm
không-tin-phi-lý của phần đo chính vẫn xanh (đúng tình huống đối chứng cũ không phân biệt được).

### AC-3 — Danh sách rỗng thì không giả đạt
Given lược đồ riêng có thước nhưng không tin P1 nào trong khoảng danh sách,
When gọi lõi đo,
Then có kiểm đỏ ghim «không dựng được tin đối chứng»; kết quả không đạt.

### AC-4 — Lệnh trên DB local thật đạt và không đổi DB
Given DB local :5433 (dữ liệu thật đã qua bước đêm),
When chạy `cd app && node --import tsx ../scripts/deals-phi-ly-do.mjs`,
Then thoát 0, in «deals-phi-ly-do: ĐẠT», có dòng «ok đối chứng: bản chưa loại còn …», «ok luật loại bắt tin đối chứng …» và
«ok DB không đổi (… tin, băm …)» (đếm + băm `offer_id:bait_gap_pct:area_m2` và số dòng audit `bait-gap:loai-phi-ly` trước/sau
bằng nhau). Khi DB không có tin nào trong danh
sách, lệnh thoát 1 với «không dựng được tin đối chứng» — đó là kết quả đúng, không phải lỗi hàng.

### AC-5 — Các kiểm cũ của lệnh giữ nguyên nghĩa
Given lõi đo sau khi sửa,
When đọc danh sách kiểm của AC-1,
Then vẫn có «không tin thiếu diện tích trong danh sách», «không tin phòng quá nhỏ trong danh sách», «không tin phi lý nào trong
danh sách», kiểm đầu danh sách ≤ 35% (hoặc lối thoát «DB không còn tin đủ điều kiện ≤ 35%» chỉ khi đếm toàn DB ra 0); dòng in
«loại: …» và «5 tin đầu: …» giữ khuôn.

### AC-6 — Đối chứng không đổi danh sách mà các kiểm chính đọc
Given lược đồ riêng có đúng một tin P1 hợp lý giảm ≤ 35% (30%) và một tin hợp lý giảm 40%,
When gọi lõi đo,
Then kiểm «đầu danh sách ≤ 35% (DB còn 1 tin ≤ 35%)» xanh — không rơi vào lối thoát «DB không còn tin đủ điều kiện ≤ 35%» —
và tin đầu danh sách sau lượt là tin 30%.

## Coverage

Bỏ quét không gian (xem dòng sổ «bỏ coverage-scan»): hàng một chiều — một đối chứng của một lệnh đo; ba trạng thái dữ liệu
(có tin trong danh sách / luật hỏng / danh sách rỗng) đã là AC-1..AC-3, cộng DB thật (AC-4), giữ nghĩa cũ (AC-5) và đối chứng
không chạm danh sách của kiểm chính (AC-6).

## Đường đo

Không có `opportunity.md` (hàng phát sinh từ lỗi đo) — không có ngưỡng nghiệm thu. Con số trên màn: E7 của
`deals-loai-tin-phi-ly` đổi từ «1 lỗi» sang «ĐẠT» trên DB máy thu — đo bằng `config:executors.script.deals_phi_ly_do` (AC-4).

## Out of scope

- Đổi đường đo sang danh sách CG9 (`dealsSql({ coBang: true })`, `offer_price_rank`) mà trang Căn giá tốt đang dùng — việc riêng.
- Sửa `pipeline/refresh-bait-gap.mjs` hay luật `deal-plausibility.mjs` — luật đúng, chỉ đối chứng sai.
- Trần 50% của danh sách che tin phi lý giảm sâu — đúng thiết kế danh sách.

## Notes

Lịch sử chấm S4 (ba round, hết trần):
- r1 (sha 35bdbca78) REJECT do va chạm hạ tầng: lệnh suite `cd app && npx tsc --noEmit && npm run lint` thoát 2 vì ESLint gặp ENOENT trên tệp tạm `app/tests/.od1-cu-*` của test ops-duyet-nhip chạy song song. Chạy lại riêng lúc máy yên: tsc 0, lint 0.
- r2 (sha 35bdbca78) REJECT do lỗi thật AC-2: lệnh đo đọc dòng audit `bait-gap:loai-phi-ly` mới nhất của cả bảng, nên luật loại hỏng có thể bị một đêm cũ che. Đã sửa ở 9435f0264 (chỉ đọc dòng có id lớn hơn mốc trước lượt refresh) kèm ca test «DPD-AC-2 … dòng audit cũ … không che lượt đỏ», đỏ trên bản cũ, xanh sau sửa.
- r3 (sha 9435f0264) REJECT do va chạm hạ tầng: cùng lệnh suite thoát 2, ESLint gặp ENOENT trên `app/tests/.opl-cu-54213-0.tsx` của test ops-duyet-phim-va-loi-ghi. Sáu eval E1–E6 đạt, không finding trong hợp đồng. Chạy lại riêng trên cùng sha: tsc 0, lint 0 (0 lỗi, 5 cảnh báo cũ).
- Sửa gốc va chạm (theo giám sát, 21/11): `app/eslint.config.mjs` thay danh sách ignore lẻ bằng mẫu chung `**/.*-cu-*` và `**/.*-cu-*/**` (phủ 16 kiểu tên hiện có). Chứng hai chiều bằng `npm run lint` với ba tệp cố ý sai (`const a: any`): mẫu mới → chỉ tệp tên thường `tests/xyz-thuong-lint.ts` bị bắt (1 lỗi), `tests/.xyz-cu-1.ts` và `tests/.xyz-cu-2/a.ts` bị bỏ qua; bỏ hai dòng mẫu → cả ba bị bắt (3 lỗi); gỡ tệp thử → 0 lỗi.
- Lượt 4 chỉ mở khi Mạnh cho (vượt trần chấm là lời riêng của Mạnh).

Known limits:
