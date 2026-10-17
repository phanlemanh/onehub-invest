# Handoff M5′ — auth + saved markets + paywall (2026-10-17)

## Trạng thái hiện tại

- **Server đang chạy**: `npm run start -- -p 3456` (prod build, từ `~/dev/one-invest/src`).
- **DB**: docker compose ở `db/` (port 5433). Migration `002_auth.sql` đã apply (users, sessions, saved_markets).
- **Account test đã tạo trong Chrome của bạn** (session cookie đang active):
  - email: `demo@oneinvest.local`
  - password: `demo12345`
  - plan: `free`
- DB hiện có: 1 user, 1 session, 0 saved markets.

## Đổi tài khoản

1. Mở bất kỳ trang insight nào (`/th/bangkok`) → nút **Sign out** góc phải.
2. Bấm **Sign in** → `/login` → link **"Tạo tài khoản mới →"** để đăng ký email của bạn
   (password ≥ 8 ký tự, plan khởi đầu Free), hoặc đăng nhập tài khoản có sẵn.

## Đã build (M5′)

| Thành phần | File |
|---|---|
| Migration users/sessions/saved_markets | `db/migrations/002_auth.sql` |
| Auth scrypt + session cookie 30 ngày | `src/src/lib/auth.ts` |
| Server actions: login/register/logout/toggleSaved/setPlan | `src/src/app/actions.ts` |
| Paywall KPI redaction (field-level, mirror AirDNA `redactions[]`) | `src/src/components/kpi-strip.tsx` |
| Upsell card (endpoint-level 401 analog) | `src/src/components/upsell-card.tsx` |
| AuthBar + demo plan switcher FREE/PRO | `src/src/components/auth-bar.tsx` |
| Login page (register/login mode) | `src/src/app/login/page.tsx` |
| Trang Saved markets | `src/src/app/saved/page.tsx` |
| Save button + paywall wiring | `src/src/components/area-page.tsx` |

## Đã verify ✅ (đầy đủ — cập nhật 2026-10-17)

**Cả 4 bước verify đều PASS qua REA `capture_browser_scenario` (Chrome headless riêng, cookie session inject từ DB):**

| # | Flow | Evidence |
|---|---|---|
| A | Logged-out: KPI Revenue `••• 🔒` → login `demo@oneinvest.local` → redirect đúng `next` → Free vẫn che → ☆ Save → ★ Saved | `ev_ca273bc4b1fc…` |
| B/B2 | `/saved` liệt kê Bangkok → Remove → empty state → save lại → `/saved` có lại | `ev_9dd66bf301d1…` |
| C | Switch **PRO** → KPI Revenue hiện "THB 6.3B" + bảng Top Listings ("Family stay…") xuất hiện | `ev_0e65d6e44ec1…` |
| D | Sign out → "Sign in" hiện → paywall `•••` quay lại | `ev_b8d5e7018e22…` |

Sau verify: demo user đã reset về plan `free`, các session test đã dọn (session gốc của bạn vẫn còn); Bangkok đang saved làm dữ liệu demo cho `/saved`.

## Đã verify ✅ (trước đó, logged-out)

- Logged-out (curl + a11y snapshot): KPI **Annual Revenue bị che `••• 🔒` + badge PRO**,
  ADR/Occupancy/Listings vẫn hiện; Revenue + RevPAR timeseries thay bằng UpsellCard;
  **Top Listings** thay bằng UpsellCard; nút ☆ Save có tooltip "Sign in to save".
- `/login` 200; `/saved` 307 → `/login?next=%2Fsaved`.
- Register `demo@oneinvest.local` thành công (DB có user + session).

## Còn lại để verify (sau khi bạn đổi tài khoản)

1. **☆ Save** trên trang insight → đăng nhập (nếu chưa) → về lại trang → ★ Saved.
2. `/saved` liệt kê market đã lưu + nút Remove hoạt động.
3. **Plan switcher FREE/PRO** góc phải: chuyển Pro → KPI Revenue hiện số thật,
   charts Revenue/RevPAR + bảng Top Listings xuất hiện; chuyển lại Free → bị che.
4. Sign out → paywall quay lại.

## Commit đề xuất (repo chưa có commit nào)

```bash
git add db/ pipeline/ docs/ AGENTS.md .gitignore README.md
git commit -m "feat(m1): postgis foundation + inside-airbnb pipeline (bangkok 2026-09-22)"
git add src/
git commit -m "feat(m2): market insights page (kpis, benchmark, minimap, timeseries)"
git commit -m "feat(m3): deep sections (top submarkets, adr by size, room type, top listings)" # nếu tách
git commit -m "feat(m4): market finder choropleth + maplibre turbopack worker fix"
git commit -m "feat(m5): auth, saved markets, two-tier paywall (airdna-style)"
```

## Ghi chú kỹ thuật quan trọng

- **maplibre + Turbopack**: worker phải được serve từ `public/maplibre-gl-worker.mjs`
  + `setWorkerUrl()` trong `src/lib/map-worker.ts` (chi tiết trong memory + comment code).
  Nâng cấp maplibre-gl → phải copy lại worker vào `public/`.
- Demo plan switcher thay cho billing thật — không có payment; chỉ đổi cột `users.plan`.
- Password hash scrypt (`salt$key`), session token 32-byte hex, cookie httpOnly sameSite=lax.
