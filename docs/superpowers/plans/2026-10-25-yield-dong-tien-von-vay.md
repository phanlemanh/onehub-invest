# yield-dong-tien-von-vay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đóng phần đo của hàng UI3. Phần UI và logic (redirect 301, `lib/financing.ts`, `yield/financing/*`, nhóm Vốn vay trên form, gỡ `/dau-tu`) đã dựng ở S1 làm bản bấm được (commit `9e32bf3`). Còn lại: test jsdom, smoke HTTP và ROADMAP.

**Architecture:**
- Test `app/tests/yield-dong-tien-von-vay.test.tsx`: các ca «YDT-AC-n», jsdom + hàm thuần, không cần DB, theo khuôn `compare-saved.test.tsx`.
- Smoke `scripts/smoke-yield-dong-tien.mjs`: chạy trên dev :3460 (`BASE_URL`) + DB local. Đọc thị trường bằng `pg`, mượn từ `app/node_modules`.
- Chỉ E19 ghi DB: một người thử và một phiên, tiền tố riêng mỗi lượt, xoá ở `finally`.

**Tech Stack:** Next.js 16.4, React 19, node:test + tsx, jsdom, @tanstack/react-table (qua data-grid), pg.

**Spec:**
- `docs/superpowers/specs/2026-10-25-yield-dong-tien-von-vay-design.md`
- hợp đồng `_acceptance/yield-dong-tien-von-vay/contract.md`
- evals `_acceptance/yield-dong-tien-von-vay/evals.yaml`
- Gate 1 (`00e9535`): nhận khuyến nghị Hỏi-1..5.

## Global Constraints

- Redirect: `{ source: "/:country/:market/dau-tu", destination: "/yield?area=:country-:market#financing", statusCode: 301 }`. Đã có.
- Mặc định vay `LOAN_DEFAULTS = { equityPct: 0.3, ratePct: 0.09, termYears: 20 }`. Server kẹp eq 0.1–1, rate 0–0.3, term 5–35.
- Chữ UI nguyên văn:
  - «Dòng tiền vốn vay», «Hằng tháng», «Năm 1»…«Năm 5», «Lợi nhuận / tiền mặt bỏ ra»
  - «Khoản vay», «Trả nợ/tháng», «Tiền mặt bỏ ra», «Về mặc định»
  - «Doanh thu ngắn hạn», «Phí quản lý», «Phí nền tảng», «Thuế», «Chi phí cố định», «Lãi», «Gốc»
- Sự kiện `dau_tu_input`, payload đủ 5 khoá: `area, price, equityPct, ratePct, termYears`.
- Mỗi phép đo mới có cặp hai chiều trên cùng fixture: vật lành → xanh, bản phá → đỏ với thông điệp ghim.
- Đường dẫn suy từ `import.meta.url`. ui-check không tạo tệp trong cây.

## Review Focus

- `area` lạ (`khong-co-ma`) → thị trường đầu danh sách, không 500. Smoke E4 có ca đối chứng.
- `eq=0.01` dưới sàn → kẹp 10% (khoản vay 90% giá mua). Smoke E8 có ca.
- Phường không có giá thuê dài hạn (`estimate.lt = null`) → không có mục `section-lt`. Test E5 có ca.
- Lãi 0% → trả nợ = khoản vay ÷ (12·kỳ hạn), không chia cho 0. Test E6 có ca.
- `sendUserEvent` đi qua `sendBeacon` hoặc `fetch` tuỳ trình duyệt. Test E9 giả cả hai và đọc body JSON của đường nào được gọi.

---

### Task 1: Test jsdom YDT-AC-2..9

**Files:**
- Create: `app/tests/yield-dong-tien-von-vay.test.tsx`

**Interfaces:**
- Consumes:
  - `monthlyPayment`, `amortizeByYear`, `financingPlan`, `LOAN_DEFAULTS` (`@/lib/financing`)
  - `FinancingGrid({ plan, currency, horizon })`
  - `YieldForm` (props như `yield/page.tsx`, có `initialLoan`)
  - `InsightActions`, `estimateYield` (`@/lib/yield`)
- Produces: các ca đặt tên đúng như cột `expected` của E3, E5, E6, E7, E9, E10, E12.

- [ ] Viết các ca:
  - YDT-AC-2: quét `/dau-tu` + InsightActions href ĐÚNG BẰNG; chiều đỏ trên thư mục tạm.
  - YDT-AC-4: thứ tự mục, quan hệ số với estimate, không `section-lt` khi lt null, đầu cột + dòng tổng; chiều đỏ là bộ so quan hệ.
  - YDT-AC-5: công thức đóng + giá trị hiện tại, tổng gốc, eq 1, rate 0; chiều đỏ là hàm bỏ lũy thừa.
  - YDT-AC-6: form 30/9/20, push URL, «Về mặc định».
  - YDT-AC-7: payload sự kiện + danh sách loại ở route/agent.
  - YDT-AC-8: mở/gập + ghim cột theo matchMedia.
  - YDT-AC-9: baseline + ba tệp đã gỡ; chiều đỏ là fixture.
- [ ] Chạy `cd app && npm test`. Kỳ vọng: mọi ca xanh, không ca cũ nào đỏ.
- [ ] Commit `test(yield-dong-tien-von-vay): ca YDT-AC-2..9`.

### Task 2: Smoke HTTP

**Files:**
- Create: `scripts/smoke-yield-dong-tien.mjs`

**Interfaces:**
- Consumes:
  - dev server `BASE_URL` (mặc định `http://localhost:3460`)
  - `DATABASE_URL` (mặc định `postgres://oneinvest:oneinvest@localhost:5433/oneinvest`)
  - bảng thị trường mà `getYieldMarkets` đọc
  - `user_events`, bảng người dùng/phiên của `/api/v1/user-events`
- Produces: các dòng `ok …` / `FAIL …` đúng cột `expected` của E1, E4, E8, E19. Thoát 1 khi có FAIL.

- [ ] Viết các nhóm ca:
  - E1: 301 + Location ĐÚNG BẰNG, `redirect: "manual"`; `/vn/hanoi` 200.
  - E4: lặp mọi thị trường lấy từ DB, mã phường của thị trường thứ hai, mã lạ.
  - E8: đọc «Khoản vay», «Trả nợ/tháng» và ô KPI từ HTML; các ca kẹp/quan hệ; hai bộ tham số so lưới với ô KPI.
  - E19: người thử + phiên, POST có cookie / không cookie / kind lạ; xoá ở `finally`.
- [ ] Chạy `BASE_URL=http://localhost:3460 node scripts/smoke-yield-dong-tien.mjs`. Kỳ vọng: exit 0.
- [ ] Đối chứng đỏ một lần bằng tay: `BASE_URL` trỏ cổng không có server → FAIL có tên ca, exit 1.
- [ ] Commit `test(yield-dong-tien-von-vay): smoke HTTP redirect, thị trường, tham số vay, sự kiện`.

### Task 3: ROADMAP I4 + rà bốn tệp tài liệu (E15)

**Files:**
- Modify:
  - `docs/ROADMAP.md`: §2 as-built + §4 trạng thái, dòng I4 / UI3.
  - Chỉ khi rà thấy lệch: `.claude/skills/onehub-ui/routes.md`, `catalog.md`, `CONTEXT.md` (2 dòng đã duyệt U1-13), `app/CLAUDE.md`.

- [ ] Rà `grep -rn 'dau-tu'` trên bốn tệp. Chỉ còn dạng slug cũ/redirect.
- [ ] Ghi ROADMAP. Chạy `cd app && npm run test:lint-rules`. Kỳ vọng: xanh.
- [ ] Commit `docs(yield-dong-tien-von-vay): ROADMAP I4`, rồi đặt contract `status: implemented`.
