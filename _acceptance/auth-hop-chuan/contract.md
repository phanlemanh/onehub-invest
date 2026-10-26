---
schema_version: 1
feature: Khách đăng nhập hoặc đăng ký qua auth-4/auth-5 không còn chuyển động bị cấm, gradient tự chọn hay chữ kích thước tuỳ ý, và lỗi nhóm (auth) hiện error.tsx
slug: auth-hop-chuan
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [ui]
status: approved
design_doc: docs/superpowers/specs/2026-10-26-auth-hop-chuan-design.md
approved_by: Mạnh
approved_at: 2026-10-26
---

# Acceptance Contract: auth-hop-chuan

## Context

Hàng UI7 (phủ GD8) của lộ trình giao diện 23/10: đưa hai trang `/login` (auth-4) và `/register` (auth-5) về luật ReUI
của kho — bỏ chuyển động nền lặp vô hạn và màu tự chọn của `gradient-wave.tsx`, bỏ chữ tô gradient và cỡ chữ tuỳ ý ở
tiêu đề, không đổi cỡ `FrameTitle`, và thêm `error.tsx` cho nhóm `(auth)`. Hành vi đăng nhập/đăng ký không đổi.
T3 vì chạm `app/src/app/(auth)/**`.

Căn cứ: `docs/plan/lo-trinh.json` hàng UI7 · `opportunity.md` (Cổng Đáng = build, Mạnh 23/10) · `AGENTS.md` khối
«ReUI design rules» (motion, màu, cỡ chữ, trạng thái lỗi) · `.claude/skills/onehub-ui/routes.md` dòng `/login`, `/register`.

Source input: docs/plan/lo-trinh.json#UI7

## Criteria

- AC-1: Given cây tệp của nhóm `(auth)` và `components/auth/`, When trang `/register` hay `/login` render, Then không phần tử nào chạy chuyển động lặp vô hạn (không `@keyframes`, không `animation:` hay lớp `animate-*`), `gradient-wave.tsx` không còn được dùng, và trang không cần nhánh `prefers-reduced-motion` riêng.
- AC-2: Given cùng cây tệp, When quét mã, Then không còn màu tự chọn (rgba/hex, palette thô như `orange-500`, `pink-500`, `violet-500`) và không còn chữ tô gradient (`bg-clip-text` + `bg-gradient-*`); màu đi qua token ngữ nghĩa.
- AC-3: Given tiêu đề trang đăng ký và `FrameTitle` của hai form, When render, Then tiêu đề dùng thang chữ sẵn có (`text-4xl`, `sm:text-5xl`) không giá trị trong ngoặc vuông (`text-[…]`, `leading-[…]`, `tracking-[…]`), và `FrameTitle` không mang lớp đổi cỡ chữ.
- AC-4: Given một lỗi ném ra khi dựng trang trong nhóm `(auth)`, When Next bắt lỗi, Then `app/(auth)/error.tsx` hiện cảnh báo lỗi chuẩn của kho («Không tải được dữ liệu» + nút «Thử lại» gọi `reset`), không có vỏ cổng nào.
- AC-5: Given form đăng nhập và form đăng ký, When khách điền và gửi, Then form vẫn gửi đúng server action như trước (trường email/mật khẩu/next), `?next=` vẫn đi qua `safeNext`, `?error=` vẫn hiện cảnh báo, và liên kết chéo đăng nhập ↔ đăng ký giữ `next`; tài khoản ops thử vẫn đăng nhập được đầu-cuối. (cross-layer)
- AC-6: Given các tệp UI7 đổi, When chạy kiểm máy, Then `tsc` sạch, lint 0 lỗi, `eslint-suppressions.json` không còn khoá của `gradient-wave.tsx`, `login-form.tsx`, `register-form.tsx`, và bản đồ route còn khớp.
- AC-7: Given màn 1280 px sáng/tối và 390 px, When mở `/login` và `/register`, Then hai trang đọc được, không cuộn ngang ở 390 px, form và tiêu đề không vỡ bố cục sau khi bỏ nền gradient. (judgment)

## Coverage

Bỏ quét không gian AC: bài toán không dạng liệt-kê-đủ — câu giao đã liệt đúng bốn vế (chuyển động, gradient, cỡ chữ,
error.tsx) cộng hành vi giữ nguyên; xem dòng `descope` «bỏ coverage-scan — …» trong `decisions.jsonl`.

## Đường đo

Ô Cổng Đáng không khai ngưỡng UAT → bỏ bằng dòng `descope` «bỏ đường-đo — …» trong `decisions.jsonl`.

## Out of scope

- Đăng nhập mạng xã hội, «Quên mật khẩu» — chưa có (catalog.md đã ghi bỏ ở auth-4).
- Đổi logic đăng nhập/đăng ký, phiên, mật khẩu (`lib/auth.ts`, `actions.ts`) — không đổi.
- Thiết kế lại nội dung hero đăng ký (chữ, số đếm thật) — giữ nguyên chữ.

## Notes

- Block `@reui/auth-5` gốc tự mang dải gradient chuyển động và chữ gradient; luật ReUI của kho thắng block (AGENTS.md).
