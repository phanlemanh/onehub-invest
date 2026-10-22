# Bộ chuẩn UI/UX dựa trên ReUI chính chủ — thiết kế

Ngày: 2026-10-22 · Chủ: Mạnh · Phạm vi: `app/` (Invest Portal, Ops Portal, marketing, auth)

## 1. Ý định và lý do

UI của app đang lệch: IA và UX không nhất quán giữa các trang, component lệch nhau, và
có chỗ tự vẽ tay. Mạnh đã mua ReUI Pro và muốn dùng hết nó để mọi thứ đồng nhất.

Quyết định của Mạnh:

- **Dựa hẳn vào luật chính chủ của ReUI.** Khi ReUI vênh với thói quen hiện tại trong
  repo, luật ReUI thắng.
- **Thành công = không còn chỗ tự vẽ tay**, mỗi chỗ dùng đúng block hoặc component.
  Không cần dựng gì phức tạp hơn.
- Chuẩn riêng của repo cắm vào các ổ cắm sẵn có của kit nghiệm thu
  (`feature_loop.ui_standards_skill`, `design_pass.ds_skill`).
- Làm **cả A (setup) lẫn B (dọn)**. Việc này còn được dùng làm case study cho Claude Code.

Lý do lệch, rút từ kiểm kê 2026-10-22: agent chưa từng có bộ luật bố cục nào. Agent cũng
chưa có MCP để tìm và đọc API block, và chưa có bước tự kiểm.
`app/DESIGN_RULES.md` chỉ dặn "ReUI trước", không nói cách ghép một màn hình.

## 2. Mục tiêu, phi mục tiêu, phản mục tiêu

**Mục tiêu**

- G1. Mọi agent làm UI trong repo (Claude Code, Codex, Cursor, ZCode) đều nhận cùng
  một bộ luật: ReUI chính chủ, cộng một lớp mỏng riêng của onehub.
- G2. "Tự vẽ tay" thành **con số máy đếm được**, và CI chặn khi số này tăng.
- G3. Khi dọn xong (B), số đó bằng 0 trên toàn bộ code feature. Ngoại lệ nào còn lại
  phải có lý do ghi ngay tại chỗ.
- G4. Cùng một loại UI chỉ được làm theo một cách: một kiểu ô KPI, một kiểu bảng, một
  kiểu page header, một bộ trạng thái tải/trống/lỗi, một bảng màu biểu đồ.

**Phi mục tiêu**

- Không đổi màu thương hiệu hay đổi style (`base-nova` giữ nguyên). `--primary` vẫn
  neutral. *(Gọi của tôi: Mạnh không nêu, và ReUI khuyên đổi style thì phải hỏi.)*
- Không thêm tính năng hay trang mới; không đổi dữ liệu hay query, trừ khi block mới
  cần đúng hình dạng dữ liệu đó.
- Không viết lại luật ReUI bằng lời của mình. Lớp onehub chỉ chứa những gì ReUI không biết.

**Phản mục tiêu** (lint xanh mà vẫn thất bại)

- Lint xanh vì `eslint-disable` tràn lan, hoặc vì code bị dời vào `examples/` hay
  `blocks/` để né quét.
- Block ReUI bị "chỉnh cho đẹp" tới mức thành kiểu thứ 7. Sai lệch chỉ được nằm ở
  dữ liệu, chữ và prop (luật `adapting` của ReUI).
- Trang vẫn qua lint nhưng thị giác lệch: không ai nhìn bằng mắt ở chế độ sáng và tối.
- Gỡ bớt thông tin người dùng đang cần chỉ để vừa block.

## 3. Ràng buộc

- Luật bất biến trong `AGENTS.md`: TS strict; metrics tính sẵn phía server; cổng
  Invest/Ops (`portals.md`); SPL; AirDNA chỉ ở `/ops/quality`.
- Checkout chính luôn ở `main` vì launchd chạy từ đó. Việc làm ở worktree
  `.claude/worktrees/`, nhánh `feat/…`, merge sau khi Mạnh ký.
- Thư mục vendor không sửa tay: `components/ui`, `components/reui`, `components/blocks`.
  Lint hiện đã bỏ qua `reui/**` và `blocks/**`.
- License: dùng OAuth tài khoản ReUI của Mạnh cho MCP. Không đưa key vào file đã
  commit. `.env.local` đang chứa `REUI_LICENSE_KEY` cho shadcn CLI; giữ nguyên.
- Cổng nghiệm thu: `_acceptance/config.yaml` (app chạy `tsc --noEmit && npm run lint`).
  Đổi UI là T2, phải đi kèm `_acceptance/<slug>/`.
- **Nhánh song song** `fix/portal-deals-airdna` (đã vá xong, chờ Mạnh ký) dời `/deals` sang
  `/ops/deals` và gỡ AirDNA khỏi `/dau-tu`. Nhánh này đụng `shell/nav.tsx`,
  `investment-simulator.tsx`, `dau-tu/page.tsx` và `deals/**`. B không đụng các file đó cho
  tới khi nhánh merge; những bề mặt này dọn ở B5. *(Gọi của tôi)* A merge trước. Khi nhánh
  kia merge sau A, nó phải qua lint ở các file nó đụng. Đường dẫn bị dời (`deals` →
  `ops/deals`) được phép đổi tên trong danh sách baseline, nhưng số mục không được tăng.
- **Block gốc có sẵn mẫu mà lint cấm** (ví dụ `blocks/hero-8` có `text-emerald-700/300`,
  hex `#0850dd`). *(Gọi của tôi, theo luật `color` của ReUI)*
  - Màu mang **nghĩa** (trạng thái, nhấn mạnh) ở bản chuyển thể: đổi sang token hoặc
    variant Badge/Alert.
  - Màu thuần **danh tính/trang trí** của block: giữ, kèm cặp `dark:`, và
    `eslint-disable-next-line <luật> -- nguyên bản <block>`.
  - Các ngoại lệ này vẫn tính là "có lý do" khi chốt xong B.

## 4. Những gì đã chốt (A — setup)

### A1. Tầng nền: ReUI chính chủ

- Cài **ReUI Agent Skill** (bản `68f0e6fa91`, 15 file) vào `.claude/skills/reui/` và
  `.agents/skills/reui/`, rồi commit. Đường cài: installer chính chủ
  `curl -fsSL https://mcp.reui.io/install | node -`. Chạy `REUI_DRY_RUN=1` trước để xem
  file nào sẽ bị ghi.
- Installer chèn khối luật ReUI vào `AGENTS.md`, nằm giữa
  `<!-- BEGIN:reui-agent-rules -->` và `<!-- END:reui-agent-rules -->`. Nhờ vậy Codex,
  Cursor và ZCode (agent không có `.claude/`) cũng đọc được.
- Nối **ReUI MCP** ở phạm vi dự án (`.mcp.json`, `https://mcp.reui.io/api/mcp`). Mạnh
  đăng nhập một lần bằng `claude mcp login reui`, hoặc chạy `/mcp` trong terminal `claude`.
  Không đặt header Authorization (nếu đặt, header sẽ đè OAuth).
- Kiểm: `claude mcp list` hiện `reui ✔ Connected`. Gọi thử `get_project_context` hoặc
  `search` mà không bị `locked`.

### A2. Tầng repo: skill `onehub-ui`

Đường dẫn: `.claude/skills/onehub-ui/SKILL.md`, cộng các file tham chiếu cạnh nó.
Skill ghi rõ thứ tự thẩm quyền: **ReUI skill > onehub-ui > `acceptance-gate:ux-ui-craft`**.
Từ giờ ux-ui-craft chỉ giữ vai sàn a11y, còn chỗ nào vênh với ReUI thì ReUI thắng.

Nội dung (chỉ những gì ReUI không biết):

1. **Bản đồ route → bề mặt → mẫu màn hình → họ khung**, cho mọi `page.tsx`. Ví dụ:
   - Invest Finder: operational, Dashboard grid, Frame-led.
   - Insight: Record detail, Frame-led.
   - Ops collections/quality: Table-backed management, Frame-led, dense.
   - `/`: Marketing spine, Card-led.
   - `/login`: Auth card.

   Mỗi route mới phải thêm một dòng vào bảng này.
2. **Khung trang chung**: `PageHeader` (breadcrumb + tiêu đề 1–3 chữ + mô tả 1 mệnh đề +
   actions bên phải) cho mọi trang operational của cả hai cổng.
3. **Danh mục block đã chuyển thể**, dời từ `DESIGN_RULES.md`: block gốc → file dùng →
   điểm đã đổi. Đây là thứ tìm đầu tiên, trước cả MCP `search`.
4. **Màu dữ liệu**: bậc p30/p60/p90 chỉ lấy từ `finder/bins.ts` và `page/tiers.ts`. Biểu
   đồ dùng một bảng màu chung (xem A4). Ô "chưa có số" luôn có cặp màu sáng/tối.
5. **Ngoại lệ MapLibre**: hex chỉ được dùng trong các file bản đồ (danh sách đóng), qua
   `lib/map-style.ts`. Popup dùng `setDOMContent`.
6. **Chữ tiếng Việt**: số, tiền, ngày, phần trăm đều đi qua `lib/format.ts`. Đơn vị "tỷ",
   "triệu"; dấu phẩy thập phân; `tabular-nums`. Độ dài chữ theo ngân sách của ReUI
   (tiêu đề 1–3 chữ, nút 1–2 chữ, toast tối đa 4 chữ). Giọng văn cho trạng thái trống và
   lỗi: nói chuyện gì đang xảy ra + một hành động. Có biến thể "đang thu thập" cho khu
   vực chưa có dữ liệu (IA §3.3).
7. **Bước nhìn**: khi có ≥2 ứng viên sát điểm nhau thì gọi `get_thumbnail` trước khi cài.
   Sau khi dựng thì chụp trên Browser pane (`.claude/launch.json` → app :3456) ở cả sáng
   và tối, và ở bề rộng 390px.
8. **Vòng làm việc**: kế hoạch 7 dòng của ReUI → tra danh mục (mục 3) → MCP
   `compose_page`/`search` → cài → `get_component`/`validate_usage` → chuyển thể (chỉ đổi
   dữ liệu, chữ, prop) → `npm run lint` → bước nhìn → 5 dòng hand-back của ReUI.

`app/DESIGN_RULES.md` thu lại thành con trỏ tới hai skill, giữ lại các bẫy kỹ thuật đặc
thù (base-nova, `"use client"`). `app/CLAUDE.md` và `.claude/rules/portals.md` trỏ tới
`onehub-ui`.

### A3. Luật tự nạp và cắm vào kit

- `.claude/rules/ui.md`, áp cho `app/src/components/**` và `app/src/app/**`: vài dòng nhắc
  nạp skill `reui` và `onehub-ui` trước khi sửa UI.
- `AGENTS.md`: ngoài khối ReUI do installer chèn, thêm một dòng trỏ tới `onehub-ui`
  trong mục Bản đồ/Quy ước, cho agent không đọc `.claude/`.
- `_acceptance/config.yaml`: bỏ comment và khai
  `feature_loop.ui_standards_skill: onehub-ui` và `design_pass.ds_skill: onehub-ui`.
  Bỏ hai dòng comment "chưa khai".

### A4. Máy chặn: lint UI

**Chốt:** các phép kiểm đi vào **`npm run lint`** (ESLint flat config hiện có). Lệnh này
đã chạy ở bước S4 của cổng nghiệm thu, tức chạy ở máy. CI hiện **chưa** chạy lint:
`acceptance-gate.yml` chỉ chạy `product-map` và `pre-merge-check`.
*(Gọi của tôi)* Thêm **một workflow riêng** `.github/workflows/ui-lint.yml`, không sửa file
workflow của kit: cài deps `app/`, chạy lint, so với danh sách baseline; chạy khi PR đụng
`app/**`. Quét mọi file trong
`app/src/**`, trừ `components/ui/**`, `components/reui/**`, `components/blocks/**`,
`components/examples/**` (đều là vendor).

Phải bắt được, mỗi mục là một luật có tên và thông báo lỗi tiếng Việt chỉ ra cái thay thế:

| Luật | Bắt | Thay bằng |
|---|---|---|
| bảng tay | JSX `<table>` | `data-grid` (qua `InsightGrid`) |
| điều khiển thô | JSX `<select>`, `<input>`, `<textarea>`, `<button>` | `Select`/`NumberField`/`Input`/`Textarea`/`Button` |
| hộp thoại tay | `window.confirm`/`confirm(`/`alert(`, `fixed inset-0` | `AlertDialog`, `sonner` |
| màu trạng thái thô | lớp palette thô (`text-emerald-600`…) | Badge `*-light`, Alert, token |
| màu thô nói chung | lớp palette thô không có cặp `dark:` | token, hoặc cặp `dark:` có chủ đích |
| hex/rgb cứng | `#xxxxxx`, `bg-[#…]`, `rgb(`/`oklch(` trong className hay style | token (trừ danh sách file bản đồ) |
| cỡ chữ tuỳ ý | `text-[Npx]`, chữ nhỏ hơn `text-xs` | `text-xs`/`text-sm` |
| motion cấm | C1–C2 của ReUI (`transition-all`, `animate-bounce`, `framer-motion`…) | bảng motion của ReUI |
| Radix trên Base UI | `asChild` | `render` |
| emoji làm icon | emoji trong JSX text | icon lucide |
| render không thuần | `Math.random()`, `Date.now()` trong render | `useId`, đọc trong effect |

- Ngoại lệ chỉ hợp lệ khi đi kèm `eslint-disable-next-line <luật> -- <lý do>`. Một luật
  meta chặn mọi disable thiếu lý do.
- **Số "trước"**: chạy lint mới trên `main` trước khi dọn, lưu kết quả (đếm theo luật,
  theo thư mục) vào `docs/research/ui-baseline-2026-10.md`.
- **Chống lùi trong lúc B chưa xong** (gọi của tôi): luật mới bật mức `error` ngay. Lỗi
  tồn đọng được giữ bằng một danh sách baseline đóng; danh sách này chỉ được giảm, không
  được tăng. CI fail khi xuất hiện vi phạm mới ngoài danh sách. Cách hiện thực để builder
  chọn.
- Hook `Stop` (`typecheck-changed.sh`) chỉ chạy tsc. *Gọi của tôi:* thêm lint các file UI
  vừa đổi vào cùng hook để agent tự sửa trước khi kết thúc lượt, kiểu báo lỗi giống tsc.

### A5. Sửa mâu thuẫn tài liệu

- `invest-portal-ia.md` §3.3: thay "`loading.tsx` theo segment" bằng "`PageSkeleton` (hoặc
  Skeleton đúng bố cục) trong `<Suspense>`; không dùng `loading.tsx` cấp segment (mất mã
  404/307)". Bảng block của §3.3 đối chiếu lại với tên block thật trong danh mục ReUI.
- ROADMAP: §2 as-built và §4 trạng thái thêm mục "Chuẩn UI/UX ReUI".

## 5. Những gì đã chốt (B — dọn)

Dọn theo từng bề mặt, mỗi đợt một nhánh và PR riêng, chạy vòng ReUI (kế hoạch 7 dòng →
block → lint → bước nhìn). Thứ tự: bề mặt lệch nhiều nhất và ít đụng phiên khác làm trước.

1. **B1 — Cổng Ops**: `/ops`, `/ops/collections`, `/ops/quality`, `/ops/sources`,
   `/ops/review`, `/ops/design`, cùng `ops/review-card`, `ops/source-groups-admin`,
   `ops/zalo-accounts`.
   - Bảng tay → `data-grid`.
   - Nút, toggle, select, input thô → primitive.
   - `window.confirm` → `AlertDialog`.
   - `setMsg("✓/❌")` → `sonner`.
   - Badge tự tô → Badge variant.
   - Mọi trang dùng `PageHeader` + Frame.
   - Sửa lỗi bố cục: h1 giữa trang ở `/ops/quality`, section lồng trong header ở
     `/ops/collections`.
   - `/ops/design` chuyển thành trang trưng bày danh mục đúng khung.
   - Bước nhìn cần đăng nhập `/ops`. Dùng tài khoản ops thử ở PR #1
     (`feat/dev-ops-account`): trước khi bắt đầu B1, hỏi Mạnh có merge PR đó không. Nếu
     chưa merge, Mạnh tự đăng nhập Browser pane khi tới bước chụp.
2. **B2 — Khung trang & ô KPI (Invest + marketing)**:
   - Một kiểu ô KPI (`StatTiles`); bỏ 5 biến thể còn lại.
   - `PageHeader` + breadcrumb cho Finder, So sánh, Đã lưu.
   - Một thang h1 và một khoảng cách gốc (`gap-6`).
   - Gradient tự chọn ở `yield-form` và `register-form` về token hoặc bản gốc của block.
   - `finder-view` có ô "chưa đủ mẫu" ở chế độ tối.
3. **B3 — Biểu đồ**: một bảng màu chung cho chuỗi dữ liệu (theo luật `color` của ReUI:
   chuỗi cần giữ danh tính qua sáng/tối thì dùng biến palette cố định). Gom code chép
   trùng (`use-trigger-tooltip`, `value-faces`, `chart-toolbar`, `format`, `icons`) về một
   chỗ dùng chung. Tách các file biểu đồ quá 200 dòng (`margin-plot` 779, `metric-plot` 509).
4. **B4 — Trạng thái**:
   - Mọi vùng dữ liệu phía server có Skeleton đúng bố cục trong `<Suspense>`.
   - Mọi danh sách và bảng có `Empty` kèm một hành động; dùng biến thể "đang thu thập" ở
     chỗ cần.
   - Thêm `error.tsx` cho `(marketing)`, `(auth)` và `global-error.tsx`.
   - Lỗi thao tác hiện inline có nút Thử lại.
   - Insight không lặng lẽ ẩn mục trống.
5. **B5 — Phần còn lại sau khi `fix/portal-deals-airdna` merge**: `/ops/deals`, `/dau-tu`
   hoặc chỗ thay nó, `investment-simulator` nếu còn, và đưa `/ops/review` vào nav Ops
   (`shell/nav.tsx`). Cuối cùng gỡ danh sách baseline của A4 (lúc đó phải rỗng).

**Xong B khi:** lint UI ra 0 lỗi, danh sách baseline rỗng, và mỗi ngoại lệ còn lại có lý
do. Mỗi trang đã chụp ở sáng, tối và 390px. Ghi số "trước/sau" vào
`docs/research/ui-baseline-2026-10.md` làm tư liệu case study.

## 6. Để builder quyết

- Cách hiện thực từng luật lint: `no-restricted-syntax` với selector AST, plugin ESLint cục
  bộ trong repo, hay kết hợp. Cách hiện thực danh sách baseline.
- Chọn block cụ thể cho từng vùng ở B: theo vòng ReUI (danh mục → `compose_page`/`search`
  → `get_thumbnail`), ghi lựa chọn vào danh mục của `onehub-ui`.
- Chia nhỏ B1–B4 thành PR, và `_acceptance/<slug>/` cho từng đợt (T2 theo config).
- Giữ hay bỏ `/ops/design`. Gợi ý: giữ làm trang trưng bày danh mục.
- Cấu trúc file tham chiếu bên trong `onehub-ui`.

## 7. Đo đạc cho case study

| Chỉ số | Nguồn | Trước | Đích |
|---|---|---|---|
| Vi phạm lint UI, theo luật | lint A4 | đo ở A4 | 0 |
| Chỗ tự vẽ tay (bảng, điều khiển thô, hộp thoại tay) | lint A4 | ~5 bảng tay, 4 cụm component tay | 0 |
| Màu Tailwind thô | lint A4 | 62 chỗ / 13 file | 0 ngoài ngoại lệ có lý do |
| `text-[Npx]` | lint A4 | 32 chỗ / 12 file | 0 |
| Số kiểu ô KPI / bảng / page header | kiểm kê tay | 6 / 3 / 5 | 1 / 1 / 1 |
| Trang có trạng thái tải | kiểm kê tay | 0 / 21 | mọi trang có vùng dữ liệu |
| File feature > 200 dòng | `wc -l` | 19 | giảm; không ép số |
