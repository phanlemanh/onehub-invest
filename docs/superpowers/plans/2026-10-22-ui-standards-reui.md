# Bộ chuẩn UI/UX ReUI — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cài bộ chuẩn UI chính chủ của ReUI (skill + MCP), lớp mỏng `onehub-ui` và máy chặn lint. Sau đó dọn `app/` tới khi lint UI về 0.

**Architecture:** Ba tầng: (1) skill `reui` cùng MCP `reui` của vendor; (2) skill `onehub-ui`, chứa đúng những gì ReUI không biết, cắm vào ổ cắm của kit; (3) một plugin ESLint cục bộ `onehub-ui` chạy trong `npm run lint`. Vi phạm cũ được giữ bằng *bulk suppressions* của ESLint 9.39 (`eslint-suppressions.json`), tệp này chỉ được giảm. B dọn từng bề mặt, mỗi đợt một nhánh/PR và một kế hoạch con.

**Tech Stack:** Next.js 16.4 · React 19 · Tailwind v4 · shadcn `base-nova` + ReUI Pro · ESLint 9.39.5 flat config · `node:test` + `RuleTester` · Node 24 · GitHub Actions

**Spec:** `docs/superpowers/specs/2026-10-22-ui-ux-standards-design.md`

## Global Constraints

- Thứ tự thẩm quyền: **ReUI skill > onehub-ui > `acceptance-gate:ux-ui-craft`**. ux-ui-craft chỉ giữ sàn a11y.
- Không đổi style hay theme: `components.json` giữ `"style": "base-nova"`, `--primary` neutral.
- Thư mục vendor không sửa tay và không bị lint quét: `src/components/ui/**`, `src/components/reui/**`, `src/components/blocks/**`, `src/components/examples/**`.
- Hex chỉ được dùng trong danh sách file bản đồ đóng: `src/lib/map-style.ts`, `src/components/finder/bins.ts`, `src/components/finder/choropleth-map.tsx`, `src/components/mini-map.tsx`, `src/components/listing/listings-map.tsx`.
- Mỗi ngoại lệ lint phải có dạng `eslint-disable-next-line onehub-ui/<luật> -- <lý do>`.
- Thông báo lỗi lint viết tiếng Việt, nêu luôn cái thay thế (cột "Thay bằng" trong spec A4).
- MCP chỉ dùng OAuth: `.mcp.json` không được có header `Authorization`. Không commit key.
- Checkout chính `~/dev/onehub-invest` luôn ở `main`. Làm việc trong `.claude/worktrees/`, nhánh `feat/ui-standards-reui` (A) và `feat/ui-clean-b<N>-<mặt>` (B).
- Không đụng `src/app/(app)/deals/**`, `src/app/(app)/[country]/[market]/dau-tu/**`, `src/components/invest/investment-simulator.tsx`, `src/components/shell/nav.tsx` cho tới khi nhánh `fix/portal-deals-airdna` merge.
- Không đụng `tools/sync-public.sh` hay `tools/public-overlay/**`: ngoài phạm vi, Mạnh quyết sau.
- Commit theo Conventional Commits, kết thúc bằng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Đổi `.claude/hooks/**` là T3 theo `_acceptance/config.yaml`, nên PR của A cần `_acceptance/ui-standards-reui/` ở hạng T3 cùng chữ ký Mạnh.

## Review Focus

1. **Class viết trong template literal hoặc `cn()`**, ví dụ `` `text-${tone}-600` `` hay `cn(ok && "text-emerald-600")`: phải bị bắt khi đoạn chữ tĩnh chứa nguyên lớp palette, và không báo nhầm khi chỉ chứa phần tiền tố. *Test:* Task 3, `no-raw-palette` có ca hợp lệ và ca lỗi cho cả hai dạng.
2. **Ngoại lệ không lý do**: `// eslint-disable-next-line onehub-ui/no-raw-table` thiếu ` -- …` phải làm lint đỏ, kể cả dạng `/* eslint-disable */` cho cả file. *Test:* Task 4.
3. **File bản đồ đang được phép dùng hex** không được vô tình mở cho các luật khác: chỉ `no-hardcoded-color` tắt ở đó. *Test:* Task 5 Step 3, đặt một `<table>` vào `mini-map.tsx` tạm thời thì lint phải đỏ.
4. **Lint đếm sai vì tệp suppressions cũ**: sửa xong một vi phạm mà quên prune thì lint phải báo, không được im lặng. *Test:* Task 5 Step 5.
5. **Route mới thêm mà quên khai** trong bản đồ route của `onehub-ui`: CI phải đỏ. *Test:* Task 7, `routes-map.test.mjs`.

---

## Phần A — Setup (nhánh `feat/ui-standards-reui`)

### Task 1: Worktree và mang spec/kế hoạch theo

**Files:** `docs/superpowers/specs/2026-10-22-ui-ux-standards-design.md`, `docs/superpowers/plans/2026-10-22-ui-standards-reui.md` (hai file đang nằm untracked ở checkout chính)

- [ ] **Step 1:** Tạo worktree bằng skill `superpowers:using-git-worktrees`: nhánh `feat/ui-standards-reui` cắt từ `main`. Chép các file gitignored theo `.worktreeinclude` (`app/.env.local`, `**/.env`).
- [ ] **Step 2:** Chuyển hai file docs trên từ checkout chính sang worktree (copy, rồi xoá bản untracked ở checkout chính). Chạy `cd app && npm ci`.
- [ ] **Step 3:** Kiểm: `cd app && npx tsc --noEmit && npm run lint`. Kết quả mong đợi: exit 0 (lint hiện 0 lỗi, 3 cảnh báo).
- [ ] **Step 4:** Commit `docs: spec + kế hoạch bộ chuẩn UI/UX ReUI`.

### Task 2: Tầng nền ReUI — skill và MCP dự án

**Files:**
- Create (installer sinh): `.claude/skills/reui/**`, `.agents/skills/reui/**`, `.cursor/skills/reui/**`, `.opencode/skills/reui/**`, `.cursor/rules/reui.mdc`, `.cursor/mcp.json`, `.mcp.json`
- Modify (installer chèn khối): `AGENTS.md`

- [ ] **Step 1:** Chạy thử, chưa ghi gì: từ gốc worktree, `curl -fsSL https://mcp.reui.io/install | REUI_DRY_RUN=1 REUI_AGENTS_MD=create node -`. Đọc danh sách thao tác ghi. Nếu installer định ghi ra ngoài worktree, trừ `~/.codex/config.toml`, thì dừng lại và báo Mạnh.
- [ ] **Step 2:** Chạy thật với cùng biến, bỏ `REUI_DRY_RUN`. Cần `REUI_AGENTS_MD=create` vì repo có `CLAUDE.md`: thiếu biến này installer chỉ in khối ra chứ không chèn vào `AGENTS.md`.
- [ ] **Step 3:** Kiểm:
  - `head -12 .claude/skills/reui/SKILL.md` có `version` `68f0e6fa91` hoặc mới hơn.
  - `grep -c 'BEGIN:reui-agent-rules' AGENTS.md` ra `1`.
  - `.mcp.json` có `reui`, url `https://mcp.reui.io/api/mcp`, và `grep -c Authorization .mcp.json` ra `0`.
  - `claude mcp list` báo `reui … ✔ Connected` (OAuth của Mạnh đã có từ trước).
- [ ] **Step 4:** Commit `chore(ui): cài ReUI agent skill + MCP dự án (installer chính chủ)`. Ghi rõ trong message: đây là file vendor, cập nhật bằng cách chạy lại installer.

### Task 3: Plugin ESLint `onehub-ui` — luật đánh dấu và class

**Files:**
- Create: `app/eslint-plugin-onehub-ui/index.mjs`, `app/eslint-plugin-onehub-ui/rules/<tên>.mjs` (mỗi luật một file), `app/eslint-plugin-onehub-ui/lib/class-strings.mjs`
- Test: `app/eslint-plugin-onehub-ui/tests/<tên>.test.mjs`
- Modify: `app/package.json` (thêm script `"test:lint-rules": "node --test eslint-plugin-onehub-ui/tests/"`)

**Interfaces:**
- Produces: `export default { meta: { name: "onehub-ui" }, rules: { … } }` từ `index.mjs`. Mười tên luật sau là hợp đồng với Task 4–5, phải đúng nguyên văn:

| Luật | Bắt | messageId → lời nhắn phải chứa |
|---|---|---|
| `no-raw-table` | JSX `<table>` | `"data-grid"` |
| `no-raw-controls` | JSX `<select>` `<input>` `<textarea>` `<button>` | tên primitive tương ứng `Select`/`Input`/`Textarea`/`Button` |
| `no-native-dialogs` | gọi `confirm(` `alert(` `prompt(` (kể cả `window.`), chuỗi chứa `fixed inset-0` | `"AlertDialog"`, `"sonner"` |
| `no-raw-palette` | lớp `(text\|bg\|border\|ring\|fill\|stroke\|from\|via\|to\|outline\|divide\|decoration)-(red\|orange\|amber\|yellow\|lime\|green\|emerald\|teal\|cyan\|sky\|blue\|indigo\|violet\|purple\|fuchsia\|pink\|rose\|slate\|gray\|zinc\|neutral\|stone)-\d{2,3}` | `state`: dòng có từ trạng thái của ReUI C3 (`success\|active\|error\|failed\|warning\|pending\|…`) → `"Badge variant"`; `noDarkPair`: chuỗi không chứa lớp `dark:` palette nào → `"dark:"` |
| `no-hardcoded-color` | `#[0-9a-fA-F]{3,8}` hoặc `rgb(`/`rgba(`/`hsl(`/`oklch(` trong: giá trị thuộc tính JSX `className`/`style`, đối số của `cn`/`clsx`/`cva`, thuộc tính object tên `color`/`background*`/`fill`/`stroke`/`borderColor`; và mọi `-[#` trong chuỗi | `"token"` |
| `no-arbitrary-text-size` | `text-\[[^\]]*(px\|rem\|em)\]` | `"text-xs"` |
| `no-banned-motion` | `transition-all`, `animate-bounce`, `\bease-(in\|out\|in-out)\b`, `duration-N` với N ∉ {0,100,150,200,300,500}, import từ `"framer-motion"`, thuộc tính JSX `whileHover`/`whileTap`/`whileFocus` | `"motion/react"` hoặc `"transition-colors"` tuỳ ca |
| `no-aschild` | thuộc tính JSX `asChild` | `"render"` |
| `no-emoji-icons` | JSXText hoặc chuỗi khớp `/\p{Extended_Pictographic}/u` | `"lucide"` |
| `require-disable-reason` | (Task 4) | |

- `lib/class-strings.mjs` xuất `forEachClassString(context, node, cb)`: duyệt `Literal` (chuỗi), `TemplateLiteral` (từng `quasi`) và `JSXText`. Mọi luật class dùng chung hàm này. Một template literal như `` `text-${x}-600` `` chỉ được xét trên từng quasi, nên không báo nhầm.

- [ ] **Step 1: Viết test hỏng cho mọi luật.** Mỗi file test dùng `RuleTester` của `eslint` với `languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } }`. Mỗi luật tối thiểu có:
  - `valid`: `<DataGrid table={t} />`; `<Badge variant="success-light">Đã duyệt</Badge>`; `"text-violet-600 dark:text-violet-400"`; `` `text-${tone}-600` ``; `"duration-200"`; `<Button render={<Link href="/x" />} />`; `var(--color-violet-500)` trong một chuỗi data.
  - `invalid`: `<table><tbody/></table>`; `<select/>`; `window.confirm("x")`; `"fixed inset-0 bg-black/50"`; `<span className="text-emerald-600">active</span>` (messageId `state`); `cn("bg-blue-500")` (messageId `noDarkPair`); `<div className="bg-[#2563eb]"/>`; `style={{ color: "#fff" }}`; `"text-[10px]"`; `"transition-all duration-300"`; `import { motion } from "framer-motion"`; `<DialogTrigger asChild/>`; `<p>✅ Xong</p>`; `setMsg("❌ lỗi")`.
- [ ] **Step 2:** Chạy `cd app && npm run test:lint-rules`. Kỳ vọng: FAIL vì thiếu module rule.
- [ ] **Step 3:** Hiện thực `lib/class-strings.mjs` và chín file luật. `index.mjs` xuất plugin.
- [ ] **Step 4:** Chạy `npm run test:lint-rules`. Kỳ vọng: mọi test PASS.
- [ ] **Step 5:** Commit `feat(lint): plugin onehub-ui — 9 luật chặn tự vẽ tay`.

### Task 4: Luật `require-disable-reason`

**Files:** Create `app/eslint-plugin-onehub-ui/rules/require-disable-reason.mjs`; test `…/tests/require-disable-reason.test.mjs`; Modify `index.mjs`

- [ ] **Step 1: Test hỏng.**
  - `valid`: `// eslint-disable-next-line onehub-ui/no-raw-table -- bảng in hoá đơn, data-grid không in được`; `// eslint-disable-next-line react-hooks/purity` (không phải luật `onehub-ui/*` nên không xét).
  - `invalid`: `// eslint-disable-next-line onehub-ui/no-raw-table`; `/* eslint-disable onehub-ui/no-raw-palette */`; `/* eslint-disable */` (tắt mọi luật cũng phải có lý do).
- [ ] **Step 2:** `npm run test:lint-rules`. Kỳ vọng: FAIL.
- [ ] **Step 3:** Hiện thực bằng `context.sourceCode.getAllComments()` trong `Program`. Một comment là directive khi khớp `^\s*eslint-disable(-next-line|-line)?\b`. Báo lỗi khi danh sách luật trống hoặc chứa `onehub-ui/` mà không có ` -- ` theo sau là chữ khác khoảng trắng.
- [ ] **Step 4:** `npm run test:lint-rules`. Kỳ vọng: PASS.
- [ ] **Step 5:** Commit `feat(lint): ngoại lệ onehub-ui bắt buộc kèm lý do`.

### Task 5: Nối plugin vào lint, chụp baseline, số đo "trước"

**Files:**
- Modify: `app/eslint.config.mjs`
- Create: `app/eslint-suppressions.json` (ESLint sinh ra), `app/eslint-plugin-onehub-ui/report.mjs`, `docs/research/ui-baseline-2026-10.md`
- Modify: `app/package.json` (script `"lint:ui-report": "eslint -f json . | node eslint-plugin-onehub-ui/report.mjs"`)

**Interfaces:**
- Consumes: plugin từ Task 3–4.
- Produces: `npm run lint`, đỏ khi có vi phạm *mới*. `report.mjs` đọc JSON của ESLint từ stdin và in ra một bảng markdown: số vi phạm theo luật, theo thư mục cấp 2 dưới `src/` (`app/ops`, `components/insight`…), và tổng. Báo cáo tính cả mục đang bị suppress: chạy `eslint --pass-on-unpruned-suppressions … --suppressions-location /dev/null` hoặc đọc thẳng tệp suppressions. Builder chọn cách, miễn tổng khớp với `eslint-suppressions.json`.

- [ ] **Step 1:** Thêm vào `eslint.config.mjs` một khối `{ files: ["src/**/*.{ts,tsx}"], ignores: [<4 thư mục vendor>], plugins: { "onehub-ui": plugin }, rules: { <mười luật>: "error" } }`. Thêm một khối riêng cho 5 file bản đồ (Global Constraints) tắt **chỉ** `onehub-ui/no-hardcoded-color`. Bỏ bốn thư mục vendor khỏi khối luật của mình; `globalIgnores` hiện có giữ nguyên. Dòng "render không thuần" (`Math.random()`/`Date.now()`) trong spec A4 **không viết luật mới**: kiểm bằng `npx eslint --print-config src/app/page.tsx | grep -A1 '"react-hooks/purity"'`. Nếu ra `2`/`"error"` thì ghi chú trong `report.mjs` rằng luật này do `eslint-config-next` lo; nếu không thì bật `"react-hooks/purity": "error"` trong khối trên.
- [ ] **Step 2:** `cd app && npx eslint . --suppress-all`, rồi `npm run lint`. Kỳ vọng: exit 0 và đã tạo `eslint-suppressions.json`.
- [ ] **Step 3:** Kiểm Review Focus 3: thêm tạm `<table/>` vào `src/components/mini-map.tsx` → `npm run lint` phải báo `onehub-ui/no-raw-table`. Hoàn tác.
- [ ] **Step 4:** Kiểm chống lùi: thêm tạm `<select/>` vào `src/app/ops/page.tsx` (file đã có vi phạm được suppress) → `npm run lint` phải đỏ. Hoàn tác.
- [ ] **Step 5:** Kiểm Review Focus 4: sửa tạm một vi phạm đang được suppress (ví dụ xoá một `<table>` trong `src/app/ops/page.tsx`) → `npm run lint` phải báo suppression thừa. Hoàn tác. Nếu ESLint 9.39.5 không báo, thêm cờ hoặc bước kiểm cho nó báo, và ghi lại cách đã làm vào `report.mjs`.
- [ ] **Step 6:** `npm run lint:ui-report > ../docs/research/ui-baseline-2026-10.md`. Thêm đầu trang: ngày, commit, lệnh chạy lại. Thêm bảng "Kiểm kê tay" chép từ spec mục 7 (số kiểu ô KPI/bảng/page header, trang có trạng thái tải, file > 200 dòng). Đối chiếu tổng với kiểm kê tay: 62 lớp màu thô, 32 `text-[Npx]`; chênh lệch thì ghi lý do.
- [ ] **Step 7:** Commit `feat(lint): bật onehub-ui + baseline suppressions; số đo trước`.

### Task 6: Chặn ở máy (hook Stop) và CI

**Files:**
- Modify: `.claude/hooks/typecheck-changed.sh`
- Create: `.github/workflows/ui-lint.yml`

- [ ] **Step 1:** Trong hook, sau khối tsc, với các file `app/src/**/*.{ts,tsx}` vừa đổi: chạy `cd app && ./node_modules/.bin/eslint <các file, đường dẫn tương đối theo app/>`. Có lỗi thì ghép vào `report` theo đúng kiểu `[app] lỗi lint UI trong file vừa đổi:`. Thiếu `node_modules` thì đi theo nhánh "bỏ qua" như tsc. Giữ nguyên `stop_hook_active` và exit 2.
- [ ] **Step 2:** Kiểm hook: thêm tạm `<table/>` vào một file feature, rồi chạy `echo '{"stop_hook_active":false}' | CLAUDE_PROJECT_DIR=$PWD .claude/hooks/typecheck-changed.sh; echo $?`. Kỳ vọng: in ra `onehub-ui/no-raw-table` và `2`. Hoàn tác, chạy lại: kỳ vọng `0`.
- [ ] **Step 3:** `ui-lint.yml`:
  - `on: pull_request` với `paths: ["app/**", ".github/workflows/ui-lint.yml"]`, và `push` lên `main` cùng `paths`.
  - Job chạy `ubuntu-latest`, timeout 10 phút. Bước: `actions/checkout@v7`, `actions/setup-node@v7` (node `24`, `cache: npm`, `cache-dependency-path: app/package-lock.json`), `npm ci` trong `app`, `npm run test:lint-rules`, `npm run lint`.
- [ ] **Step 4:** Kiểm cú pháp workflow bằng `npx --yes @action-validator/cli .github/workflows/ui-lint.yml`. Nếu không có công cụ đó thì dùng `node -e "require('yaml')"` hoặc đọc kỹ bằng tay. Workflow chạy thật sẽ được kiểm ở PR (Task 9).
- [ ] **Step 5:** Commit `ci(ui): job ui-lint + hook Stop lint file UI vừa đổi`.

### Task 7: Skill `onehub-ui` và kiểm bản đồ route

**Files:**
- Create: `.claude/skills/onehub-ui/SKILL.md`, cùng các file tham chiếu `routes.md`, `catalog.md`, `data-color.md`, `copy-vi.md`, `loop.md`
- Create: `app/eslint-plugin-onehub-ui/tests/routes-map.test.mjs`

**Interfaces:**
- Produces: skill tên `onehub-ui`, tên này được dùng ở Task 8 cho `_acceptance/config.yaml` và các con trỏ. Định dạng `routes.md` là một bảng markdown, mỗi `page.tsx` một dòng: `| \`<đường dẫn route>\` | \`<file page.tsx tương đối từ app/src/app>\` | <bề mặt: operational/marketing/flow> | <archetype ReUI> | <họ khung: Frame/Card> |`.

- [ ] **Step 1: Test hỏng** `routes-map.test.mjs`:
  - Tìm mọi `page.tsx` dưới `app/src/app/**`. Đọc `.claude/skills/onehub-ui/routes.md`, lấy cột 2.
  - `assert.deepEqual(new Set(fromFiles), new Set(fromMap))`. Khi chênh thì in danh sách thiếu và danh sách thừa.
  - Ca chuẩn hiện tại là 21 file (danh sách lấy bằng `find app/src/app -name page.tsx`).
- [ ] **Step 2:** `npm run test:lint-rules`. Kỳ vọng: FAIL (chưa có `routes.md`).
- [ ] **Step 3:** Viết skill. Frontmatter:
  - `name: onehub-ui`
  - `description`: dùng cho mọi việc UI trong `app/`, nạp sau skill `reui`.

  Thân `SKILL.md` ≤ 120 dòng, gồm:
  - (a) thứ tự thẩm quyền (Global Constraints);
  - (b) "đọc `reui` trước, rồi tới các file ở đây";
  - (c) mục lục 5 file tham chiếu, kèm câu "đọc khi nào";
  - (d) danh sách ngoại lệ hex của bản đồ;
  - (e) không đụng vendor.

  Nội dung từng file tham chiếu:
  - **`routes.md`**: đủ 21 dòng. Phân loại theo spec A2 mục 1: Invest data là operational + Dashboard grid/Record detail/Table-backed; Ops là Table-backed management, dense; `/`, `/phuong-phap` là Marketing spine; `/login`, `/register` là Auth card. Thêm cột ghi chú "khung trang: PageHeader".
  - **`catalog.md`**: chép nguyên bảng "ReUI Blocks (installed)" và "Custom Components" từ `app/DESIGN_RULES.md`, thêm cột `previewUrl` (`https://reui.io/blocks/...` nếu biết, không thì để trống). Thêm mục "Một loại UI, một cách làm": ô KPI → `page/stat-tiles.tsx`; bảng → `insight/insight-grid.tsx`; page header → `page/page-header.tsx`; tải → `states/page-skeleton.tsx` trong `<Suspense>`; lỗi → `states/page-error.tsx`; trống → `ui/empty`.
  - **`data-color.md`**: bậc p30/p60/p90 chỉ lấy từ `finder/bins.ts` (`BIN_COLORS`, `BIN_SWATCH`, `NO_DATA_COLOR`, `NO_DATA_COLOR_DARK`) và `page/tiers.ts` (`tierOf`). Biểu đồ: theo `reui/rules/color.md` mục Charts, chuỗi cần giữ danh tính qua sáng/tối thì dùng biến palette. Bảng màu chung cho biểu đồ chốt ở B3; tới lúc đó file này ghi "TBD ở B3". Đây là con trỏ có chủ, không phải chỗ trống.
  - **`copy-vi.md`**: mọi số đi qua `lib/format.ts` (`fmtMoney`, `fmtMoneyCompact`, `fmtCompact`, `fmtPct`, `fmtInt`, `fmtMonth`). Đơn vị "tỷ"/"triệu", `tabular-nums`. Ngân sách chữ của ReUI (`reui/rules/layout.md` mục Spacing and copy). Giọng văn trạng thái trống/lỗi: "chuyện gì + 1 hành động". Biến thể "đang thu thập" (IA §3.3). Bẫy `"use client"` chép từ DESIGN_RULES.
  - **`loop.md`**: vòng 8 bước theo spec A2 mục 8. Bước nhìn: `get_thumbnail` khi ≥2 ứng viên lệch nhau ≤15 điểm; chụp bằng Browser pane qua `.claude/launch.json` ở chế độ sáng, tối và 390px. Kết thúc bằng 5 dòng hand-back của ReUI.
- [ ] **Step 4:** `npm run test:lint-rules`. Kỳ vọng: PASS.
- [ ] **Step 5:** Commit `feat(ui): skill onehub-ui (route map máy kiểm, danh mục, màu dữ liệu, chữ VN, vòng làm việc)`.

### Task 8: Con trỏ, ổ cắm kit, sửa tài liệu

**Files:**
- Modify: `app/DESIGN_RULES.md` (thu lại thành con trỏ), `app/CLAUDE.md:3-5,75`, `.claude/rules/portals.md:22`, `AGENTS.md` (một dòng ở mục Quy ước, ngoài khối ReUI), `_acceptance/config.yaml:9-10`, `docs/architecture/invest-portal-ia.md` §3.3, `docs/ROADMAP.md` §2/§4
- Create: `.claude/rules/ui.md`

- [ ] **Step 1:** Sửa `app/DESIGN_RULES.md`:
  - Còn ≤ 40 dòng: nguồn luật là hai skill `reui` và `onehub-ui`, danh mục đã dời sang `onehub-ui/catalog.md`.
  - Giữ hai mục kỹ thuật: bẫy BASE-NOVA và lệnh cài (`npx shadcn@latest add @reui/<name> --yes`).
  - Bỏ các mục còn lại; chúng đã sang `onehub-ui` hoặc trùng với ReUI.
- [ ] **Step 2:**
  - `app/CLAUDE.md`, `.claude/rules/portals.md`: trỏ tới `onehub-ui`.
  - Tạo `.claude/rules/ui.md`, frontmatter `paths: ["app/src/components/**", "app/src/app/**"]`, thân ≤ 10 dòng: nạp `reui` rồi `onehub-ui` trước khi sửa UI; `npm run lint` phải sạch; bước nhìn.
  - `AGENTS.md`: thêm dòng "UI: luật ReUI (khối dưới) + `.claude/skills/onehub-ui/` (route map, danh mục, màu dữ liệu, chữ VN)".
- [ ] **Step 3:** `_acceptance/config.yaml`: thay hai dòng comment 9–10 bằng hai khoá thật, đúng 2 dấu cách thụt lề:
  ```yaml
  feature_loop:
    ui_standards_skill: onehub-ui
  design_pass:
    ds_skill: onehub-ui
  ```
  Kiểm: `node /Users/manhphan/.claude/plugins/cache/acceptance-gate-kit/acceptance-gate/2.32.0/scripts/product-map.mjs --root . --check` exit 0. Nếu kit có lệnh kiểm config thì chạy thêm lệnh đó.
- [ ] **Step 4:**
  - `invest-portal-ia.md` §3.3: dòng "Đang tải" đổi thành `PageSkeleton` (Skeleton đúng bố cục) trong `<Suspense>`, không dùng `loading.tsx` cấp segment (mất mã 404/307).
  - ROADMAP §2: thêm as-built "Chuẩn UI/UX ReUI (A)". ROADMAP §4: thêm trạng thái A ✅ và B1–B5 ⏳.
- [ ] **Step 5:** `cd app && npm run lint && npm run test:lint-rules && npx tsc --noEmit`. Kỳ vọng: exit 0.
- [ ] **Step 6:** Commit `docs(ui): DESIGN_RULES → con trỏ; cắm onehub-ui vào kit; sửa IA §3.3`.

### Task 9: Nghiệm thu A và PR

- [ ] **Step 1:** Chạy skill `/verify` cho `app`.
- [ ] **Step 2:** Dựng `_acceptance/ui-standards-reui/` ở hạng T3 bằng skill `acceptance-gate:acceptance`. Contract gồm 5 tiêu chí:
  - (1) MCP `reui` nối được ở phạm vi dự án, không chứa key;
  - (2) lint đỏ trên mỗi mẫu tự vẽ tay trong bảng Task 3;
  - (3) vi phạm mới không lọt qua được baseline;
  - (4) bản đồ route khớp mọi `page.tsx`;
  - (5) kit nạp `onehub-ui` ở S1 và design-pass.

  Evals kiểu `script` dùng các lệnh ở Task 5–7.
- [ ] **Step 3:** Đẩy nhánh, mở PR vào `main`. Mô tả PR có bảng số đo "trước" (dán từ `ui-baseline-2026-10.md`) và kết thúc bằng `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Kiểm job `ui-lint` và `acceptance-gate` đều xanh.
- [ ] **Step 4:** Chờ Mạnh ký Cổng Bằng chứng, rồi merge.

---

## Phần B — Dọn (mỗi đợt một nhánh, một kế hoạch con)

B chỉ bắt đầu sau khi A đã merge. Mỗi đợt mở bằng một phiên mới, nhánh `feat/ui-clean-b<N>-<mặt>`. **Bước đầu của mỗi đợt là viết kế hoạch con** `docs/superpowers/plans/2026-10-xx-ui-clean-b<N>.md` bằng `superpowers:writing-plans`. Lựa chọn block cụ thể phải qua MCP (`compose_page`/`search` → `get_thumbnail`), nên không viết trước được. Mọi đợt đi qua `/feature-loop:feature-loop` ở hạng T2 (hạng T3 nếu đụng `t3_paths`, ví dụ `(auth)/**`). Chạy vòng làm việc của `onehub-ui/loop.md`.

**Mẫu nhiệm vụ chung cho mọi đợt** (kế hoạch con điền cụ thể):
1. Viết kế hoạch 7 dòng của ReUI cho từng trang trong đợt; trang đó lấy archetype từ `routes.md`.
2. Với mỗi vùng: tra `catalog.md` trước; không có thì dùng MCP và `get_thumbnail`. Ghi block đã chọn vào `catalog.md`.
3. Chuyển thể: chỉ đổi dữ liệu, chữ, prop. Xoá các mục suppress tương ứng bằng `npx eslint . --prune-suppressions`.
4. Bước nhìn: chụp sáng, tối, 390px cho mọi trang trong đợt; ảnh đưa vào evidence.
5. Cập nhật bảng "sau" trong `docs/research/ui-baseline-2026-10.md`: chạy `npm run lint:ui-report`.

**Điều kiện xong của từng đợt:** không còn mục suppress nào thuộc các file của đợt; số kiểu UI trong phạm vi đợt về 1; ảnh chụp có đủ ba chế độ.

| Đợt | Phạm vi (theo spec mục 5) | Điều kiện vào |
|---|---|---|
| **B1 Ops** | `src/app/ops/**` (trừ `ops/deals` nếu đã có), `components/ops/**` | A merge. Hỏi Mạnh merge PR #1 (`feat/dev-ops-account`) để có tài khoản chụp `/ops` |
| **B2 Khung trang + KPI** | `[country]/page.tsx`, `so-sanh`, `saved`, `insight/insight-panels.tsx`, `revenue-mix` (phần KPI), `yield/yield-form.tsx`, `(auth)/register` (gradient: T3), `finder/finder-view.tsx` | B1 merge (dùng lại khung PageHeader/StatTiles đã kiểm ở Ops) |
| **B3 Biểu đồ** | `insight/performance/**`, `insight/revenue-mix/**`, `yield/pnl/**`; chốt bảng màu biểu đồ vào `data-color.md` | B2 merge |
| **B4 Trạng thái** | `<Suspense>` + `PageSkeleton` cho mọi trang có vùng dữ liệu; `Empty` + hành động; `error.tsx` cho `(marketing)`, `(auth)` (T3), `global-error.tsx`; Insight không ẩn mục trống | B3 merge |
| **B5 Phần còn lại** | `ops/deals`, `dau-tu` hoặc chỗ thay nó, `investment-simulator`, nav (`/ops/review`); xoá `eslint-suppressions.json` (lúc đó phải rỗng) | `fix/portal-deals-airdna` đã merge |

**Xong B** (spec mục 5): `npm run lint` không còn suppression; `eslint-suppressions.json` đã xoá; bảng trước/sau trong `ui-baseline-2026-10.md` đã đủ.
