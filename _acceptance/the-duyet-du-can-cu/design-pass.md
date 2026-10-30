---
slug: the-duyet-du-can-cu
at: 2026-10-30T05:20:00Z
route: http://localhost:3460/ops/review
material: real-components
context: host-embedded
context_scenes: []
reaction: nac-1 (anh-gui-kem-the)
options:
divergence: skipped — câu giao và RV-L04 chỉ đích danh nội dung (căn cứ, ảnh, toàn văn, lý do); khung sheet của UI1 đã chốt (solution-agents-5), không còn hướng bố cục thứ hai khả dĩ
ds_skill: onehub-ui
states: [ghep-can-du, ghep-can-ai, ghep-can-toan-van, ly-do-trong, ly-do-co, bo-sung-tin]
breakpoints: [mobile-390, desktop-1280]
themes: [light, dark]
patched: 3
deferred: 2
---
# design-pass — the-duyet-du-can-cu

Bản bấm được là trang THẬT `/ops/review` trong vỏ Ops của dev server chạy từ worktree dãy U1 (`zealous-chaum-88035f`,
:3460), dữ liệu `review_queue` local thật (11 thẻ ghép căn chờ, 4 thẻ bổ sung tin đã bác), đăng nhập bằng tài khoản
thử admin (`scripts/dev-ops-account.mjs`) qua `loginState` của `scripts/ui-capture-login.mjs` — mật khẩu đọc từ tệp,
không in. Chụp bằng Chromium headless (kịch bản tạm ngoài kho). Cấu hình `app-3460` của `.claude/launch.json` chạy từ
checkout chính, nên lượt chụp đầu ra trang CŨ; ảnh dưới đây chụp lại từ dev server của worktree.

## Ma trận capture

| state | breakpoint | theme | file |
|---|---|---|---|
| ghep-can-du | desktop-1280 | light | evidence/design-pass/ghep-can-du--desktop-1280--light.png |
| ghep-can-du | desktop-1280 | dark | evidence/design-pass/ghep-can-du--desktop-1280--dark.png |
| ghep-can-ai | desktop-1280 | light | evidence/design-pass/ghep-can-ai--desktop-1280--light.png |
| ghep-can-toan-van | desktop-1280 | light | evidence/design-pass/ghep-can-toan-van--desktop-1280--light.png |
| ly-do-trong | desktop-1280 | light | evidence/design-pass/ly-do-trong--desktop-1280--light.png |
| bo-sung-tin | desktop-1280 | dark | evidence/design-pass/bo-sung-tin--desktop-1280--dark.png |
| ghep-can-du | mobile-390 | light | evidence/design-pass/ghep-can-du--mobile-390--light.png |
| ly-do-co | mobile-390 | light | evidence/design-pass/ly-do-co--mobile-390--light.png |

Đo kèm lúc chụp: bảng so có đúng 10 hàng `[data-review-compare]`; ô lý do trống → ba nút `disabled` [true, true, true];
gõ «thử» ở 390 px → [false, false, false]; 390 px `scrollWidth = clientWidth = 390`, sheet rộng 390, khung bảng 357/357
(không cuộn ngang). Chữ trong sheet không có «Điểm B» hay «tự tin»; «%» duy nhất nằm trong lời suy luận nguyên văn của AI
(«chênh lệch khoảng 5.3%» — chênh giá, không phải độ tự tin; `data-review-quote`).

## Cảnh ngữ-cảnh

- Không cần: `context: host-embedded` — vật chạy trong vỏ Ops thật, thanh bên «Xử lý › Hàng duyệt» hiện trong ảnh 1280.

## Findings

### Nhóm 1 — vá-được-trong-từ-vựng-token (đã vá tại chỗ)

- Năm trường ngoài trục (giá, diện tích, giá/m², phường, tầng) lặp «Chưa ghi căn cứ — đọc từ tin» ở cả hai ô → ở 390 px
  mỗi hàng ba dòng chữ xám. Chuyển câu lên cột Trường, một lần mỗi hàng; ô giá trị chỉ mang căn cứ khi trường có phát
  biểu (năm trường trục).
- Tin S05 (máy thu không có bài gốc) mất đoạn đầu 300 ký tự đã lưu trên thẻ mà sheet UI1 vẫn hiện → khi không có toàn
  văn, khối nói «Không có toàn văn ở máy thu — đoạn đầu lưu trên thẻ:» rồi hiện đoạn đầu.
- Thẻ bổ sung tin cũ (evidence không ghi `source`) hiện badge «Nguồn khác» — mơ hồ → «Chưa rõ phương pháp».

### Nhóm 2 — đòi-đổi-DS/component (chờ Gate 1)

- Trạng thái ST-anh-chi-goc (vai Vận hành gặp tin chỉ có URL ảnh gốc) chưa chụp: DB máy thu chưa có tài khoản thử vai
  ops (cấp vai là việc người, TV1). Đo ở E5 (ma trận năm vai trên lược đồ tạm + jsdom).
- Nút «N» của Next dev đè góc trái chân sheet ở 390 px — chỉ có ở dev server, không có ở bản build.
