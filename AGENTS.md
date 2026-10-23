# onehub-invest — hướng dẫn cho mọi AI coding agent

> Nguồn chỉ dẫn DUY NHẤT dùng chung cho Claude Code (qua `@AGENTS.md` trong
> `CLAUDE.md`), Codex, Cursor… Trạng thái + quyết định đã chốt: **`docs/ROADMAP.md`**
> (đọc §1 hiến pháp + §3 quyết định trước khi đề xuất việc mới; KHÔNG hỏi lại
> điều đã chốt). Làm xong việc: cập nhật ROADMAP §2 as-built + §4 trạng thái.
> **Việc phát triển sắp làm + mốc: `docs/plan/lo-trinh.json`** (trang `LO-TRINH.html` vẽ tự động; trạng thái máy suy
> từ `_acceptance/<slug>/`, không ghi tay). Thêm việc bằng `/acceptance-gate:cat-luot`; mở vòng bằng
> `/feature-loop:feature-loop <mã>`. Bảng «mỗi loại thông tin một chỗ»: ROADMAP §0.

Nền tảng insight đầu tư BĐS Việt Nam (cho thuê ngắn hạn + mua bán). North star:
pipeline đầu tư 4 giai đoạn (`docs/research/investment-pipeline-4-stages.md`).
Bối cảnh sản phẩm một trang (người dùng, thị trường, hai cổng, nguồn + SPL):
**`docs/product/CONTEXT-PRODUCT.md`**. Từ vựng chuẩn (nhãn UI, tên code, slug URL):
**`CONTEXT.md`**. Làm việc với user bằng **tiếng Việt**.

## Bản đồ monorepo

```
app/        Next.js 16 — Invest Portal (/vn/**) + Ops Portal (/ops/**); prod Vercel + Supabase
data-api/   API công khai độc lập (Hono) → subtree sang repo public onehub-data-api
collector/  thu thập đa nguồn (Playwright, launchd); hook Zalo ở collector/openclaw
pipeline/   import → transform → canonical → properties → metrics (Node .mjs + SQL)
agent/      onehub-ai-agent: runtime TS (Vercel AI SDK), judge/enrich agents, memory
db/         migrations đánh số + docker-compose (PostGIS :5433)
docs/       ROADMAP, ADR, architecture/, research/, ops/runtime-map.md
scripts/    cron/launchd, setup.sh, audit-all.sh, check-freshness.mjs
tools/      sync-public.sh + public-overlay (sanitise bản public)
```

Mỗi module có `CLAUDE.md`/README riêng — đọc khi làm trong module đó.

## Dòng chảy dữ liệu (một chiều, không đảo)

```
Nguồn S01–S07 → collector/ → raw snapshots (bất biến) → pipeline/ (stg_* → transform)
→ sale_offers / listings (canonical) → properties ("Một Căn Nhà") → metrics precompute
→ app/ + data-api/ (chỉ đọc)
```

app/ không thu dữ liệu; collector/ không phục vụ HTTP cho người dùng; agent/
không sửa dữ liệu trực tiếp.

## Phân làn hai agent: ZCode ↔ Claude Code (chốt 2026-10-22)

Hai agent cùng làm trên máy này. Ranh giới là **DATA-CONTRACT + bảng `stg_*`**, không
phải tên thư mục (script thu của S02/S05/S06 nằm trong `pipeline/`).

| Làn | Sở hữu |
|---|---|
| **ZCode — thu thập** (nguồn → raw snapshot → `stg_*`) | `collector/` (kể cả `openclaw/`) · trong `pipeline/`: `collect-*`, `import-*`, `apify-*`, `airdna-rotate.mjs`, `fetch-data.sh`, `import.sh`, `cron/*.plist` · trong `scripts/`: `*-daily.sh` (bước thu/nạp), `install-*`, `zalo-*.sh` · `collector/docs/DATA-CONTRACT.md` |
| **Claude Code — phần còn lại** (`stg_*` → canonical → sản phẩm) | `transform-*` trở đi trong `pipeline/` (`sql/`, `mappings.yaml`, `resolve-properties`, `reassign-areas`, `sync-cloud`, `push-ops-facts`…) · `db/` · `agent/` · `app/` · `data-api/` · `tools/` · `scripts/` còn lại · `docs/` nền · `_acceptance/` |

- **Git**: checkout chính `~/dev/onehub-invest` luôn đứng ở `main` — launchd chạy code
  từ đây (qua symlink `~/dev/one-invest`). Không agent nào checkout nhánh khác trong đó.
  ZCode làm ở worktree `~/dev/onehub-invest-zcode`, nhánh `zcode/<việc>`; Claude ở
  `.claude/worktrees/`, nhánh `feat|fix|…/<việc>`. Worktree mới thiếu file gitignored:
  chép `.env` theo `.worktreeinclude`. Hook git (`core.hooksPath` = `.git/hooks-onehub`,
  chuyển tiếp git-secrets) chặn mọi commit/merge-commit trong checkout chính.
- **Ba vai, không chồng nhau** (chốt 2026-10-23):
  - *Mạnh* — quyết định, ký cổng; bảo ZCode «đọc tin» khi có việc.
  - *Điều phối liên làn* (phiên Claude «Phân chia công việc Claude/Zcode») — đầu mối DUY
    NHẤT với ZCode: giao việc, review `zcode/*`, giữ luật làn + hợp đồng dữ liệu + sổ số
    migration, giao bước triển khai sau merge. Không merge vào `main`.
  - *Điều phối làn merge* (phiên Claude «Setup project Invest và Điều phối») — thứ tự PR,
    CI, merge trên GitHub bằng `gh pr merge`, rồi `git -C ~/dev/onehub-invest pull --ff-only origin main`.
    Không merge trên máy rồi `git push` lên main — branch protection của `main` từ chối, kể cả
    token admin (chốt 2026-10-23, hồ sơ `narrow-ask-rules`).
    Không nhắn ZCode, không review `zcode/*`.
- **Giao tiếp Claude ↔ ZCode = luật tin của plugin `dieu-phoi`** (khối LUAT-TIN): khẩu lệnh
  `GIAO · HỎI · BÁO · NHẬN · XONG · KẸT · TRẢ · HUỶ · MỞ LẠI`, mỗi yêu cầu là một vòng mở có
  mã. Kênh: issue riêng tư `phanlemanh/onehub-invest#9`, qua lệnh bọc `~/dev/onehub-coord/bin/tin
  <claude|zcode> …` (mỗi bên giữ kênh ở `~/dev/onehub-coord/<bên>` vì trạng thái kênh gắn với
  gốc kho git). Chi tiết cho ZCode: `collector/AGENTS.md` mục «Giao tiếp với Claude».
  KHÔNG đưa PII tầng A lên kênh (kênh nằm trên GitHub).
- **Tích hợp**: ZCode không merge vào `main`. Xong việc → `tin XONG` kèm nhánh, sha, lệnh kiểm;
  điều phối liên làn review, chạy `/verify`, dựng `_acceptance/<slug>/` khi T2/T3, chuyển
  điều phối làn merge mở PR sau khi Mạnh ký. Claude chỉ sửa code làn ZCode khi là lỗi tích
  hợp; lỗi logic thu → `tin MỞ LẠI` trả ZCode.
- **Triển khai sau merge** (merge ≠ đang chạy): việc làn ZCode có runtime (collector API,
  plist launchd, OpenClaw, `dist/`) cần một `tin GIAO` triển khai riêng. Đây là ngoại lệ DUY
  NHẤT cho phép ZCode thao tác trong checkout chính: chỉ build/khởi động lại theo checklist
  trong lời giao, không sửa tệp, rồi `tin XONG` kèm bằng chứng hai phía (watchdog ok, có
  snapshot mới).
- **Chỗ giáp ranh**:
  - Đổi DATA-CONTRACT / thêm cột `stg_*`: ZCode đề xuất và tăng `schemaVersion`; Claude
    viết migration (Claude sở hữu `db/migrations/` — tránh hai bên cùng lấy số NNN) và
    cập nhật transform trước khi merge.
  - `scripts/chotot-daily.sh` chạy cả chuỗi collect → import → transform → resolve:
    ZCode sửa bước thu/nạp, bước transform trở đi để Claude.
  - ROADMAP: ZCode chỉ sửa §2.3 Nguồn, §2.4 Chạy đêm và Track 3; phần còn lại Claude.
  - DB local :5433 dùng chung: ZCode chỉ ghi `stg_*`/`airbnb_snapshots`, không
    TRUNCATE/DROP bảng ngoài làn, không chạy migration.
- **ZCode không có rào của `.claude/`** (hook, deny, luật tự nạp) → trước khi làm phải đọc
  `collector/AGENTS.md` (an toàn Zalo, SPL, snapshot bất biến).

## Luật bất biến

1. **Raw snapshot BẤT BIẾN** — collector chỉ ghi mới, không sửa/xoá. Mọi diễn giải nằm ở pipeline.
2. **Schema chỉ đổi qua migration mới** trong `db/migrations/` (số kế tiếp). Không sửa
   migration đã commit, không sửa tay DB production.
3. **RESO-first (ADR-0011)**: field/enum mới phải tra RESO Data Dictionary trước; chỉ tạo
   mới khi là đặc trưng VN và khai đủ 6 điều kiện trong `pipeline/mappings.yaml`.
4. **DATA-CONTRACT** (`collector/docs/DATA-CONTRACT.md`) là giao diện collector↔pipeline;
   thêm field phải tăng `schemaVersion`.
5. **AirDNA chỉ để hiệu chuẩn** (ToS) — không đưa số AirDNA lên Invest Portal; chỉ ở `/ops/quality`.
6. **SPL (ADR-0007)**: nguồn gọi bằng mã `S0x`. Tầng A (tên nguồn thật, hồ sơ người dùng app,
   `user_events/user_profile`, `review_queue`) KHÔNG rời máy local — cloud chỉ nhận hash + aggregate.
   **Định danh người bán trên tin rao (tên, SĐT, ID tài khoản) là tầng C — công khai, KHÔNG tính là
   lộ danh tính**: người đăng rao bán đang làm hoạt động bán hàng/môi giới (Mạnh chốt 2026-10-23,
   sửa đổi ADR-0007 mục 9). `sale_offers` được lên cloud; vẫn loại mọi cột lộ tên nguồn thật.
7. **LLM-off-data-path**: LLM/agent chỉ gate/judge/extract kèm audit + evidence; quyết định
   ghi dữ liệu đi qua người (`/ops/review`) hoặc luật xác định.
8. **An toàn Zalo**: agent KHÔNG BAO GIỜ gửi tin vào nhóm xã hội (lockdown 7 lớp + watchdog;
   đã có 2 sự cố). Đừng đụng cấu hình OpenClaw khi chưa đọc `docs/ops/runtime-map.md`.
9. **Cổng (portals.md)**: mọi trang thuộc Invest (`/vn/**`, công khai) hoặc Ops (`/ops/**`,
   bắt buộc đăng nhập). Không route nội bộ nào nằm ngoài `/ops`.
10. **Metrics precompute server-side** (pipeline/sql) — React chỉ đọc.
11. **Đo trước khi build**: không thêm graph/vector/infra mới khi chưa có số liệu chứng minh.
12. **TypeScript strict** ở app/collector/data-api/agent.

## Quy ước

- **Đặt tên** (Mạnh chốt 2026-10-23; từ vựng ở `CONTEXT.md`):
  - Code, API, tên bảng/cột, types: tiếng Anh; field/enum dữ liệu theo RESO Data Dictionary khi có
    (ADR-0011). Comment domain logic tiếng Việt.
  - Chữ UI tiếng Việt, nhãn lấy từ `CONTEXT.md`. Khái niệm chưa có trong đó → thêm thuật ngữ
    (nhãn · code · slug · định nghĩa · `_Avoid_`) cùng commit với nhãn mới.
  - **URL tiếng Anh toàn bộ**: ASCII, kebab-case, mỗi đoạn tĩnh có trong `Slug URL` của
    `CONTEXT.md`. Ngoại lệ duy nhất: slug địa lý là tên riêng (`hanoi`, `vn-hanoi-…`, sinh bằng
    `slugifyName()`) và mã quốc gia (`vn`). Test `app/eslint-plugin-onehub-ui/tests/route-slugs.test.mjs`
    đỏ khi thêm route ngoài danh sách.
  - Đổi slug cũ (route tiếng Việt còn sót) phải kèm redirect vĩnh viễn trong `app/next.config.ts`,
    làm trong đợt dọn của nhóm trang đó — không đổi lẻ từng route.
- SQL đánh số theo thứ tự chạy: `db/migrations/NNN_*.sql`; `pipeline/sql/` 200 transform →
  300 metrics → 400 breakdowns → 410 listing_stats → 450 DQ → 500 asset_stats.
- UI: luật ReUI (khối dưới) + `.claude/skills/onehub-ui/` (route map, danh mục, màu dữ liệu, chữ VN).
- Prefix: `abnb_` listing Airbnb, `vn-hanoi-…` khu vực phường.
- Commit theo Conventional Commits (`feat(scope):`, `fix:`, `docs:`, `ops:`…).
- **Không bao giờ commit**: `.env*` (trừ `.env.example`), `snapshots/`, `state/`,
  `.airdna-profile/`, `*.har`, `research-local/`.

## Cổng nghiệm thu (`_acceptance/`)

Tính năng T2/T3 đi qua Acceptance-Gate Kit: contract → evals → evidence → chữ ký người
(`/feature-loop:feature-loop` hoặc skill `acceptance-gate:acceptance`). CI
(`.github/workflows/acceptance-gate.yml`) chặn PR đổi file ngoài `t1_skip_globs` mà không
kèm `_acceptance/<slug>/`. Tầng rủi ro, lệnh kiểm, `t3_paths`: `_acceptance/config.yaml`.
`scripts/pre-merge-check.sh`, `scripts/product-map.mjs` … và `lib/*.cjs` là bản chép từ kit —
không sửa tay, cập nhật bằng cách chép lại từ plugin. `PRODUCT-MAP.md` máy sinh.

## Lệnh

```bash
# DB local (PostGIS :5433, user/pass/db = oneinvest)
docker compose -f db/docker-compose.yml up -d
export DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest

# app — :3456
cd app && npm run dev -- -p 3456          # dev
cd app && npx tsc --noEmit && npm run build

# collector
cd collector && npm run check && npm run build && npm run collect -- list-sources
cd collector && npm test

# pipeline (Node .mjs)
cd pipeline && npm test
cd pipeline && bash finalize-hanoi.sh     # import → transform → metrics (Hà Nội)

# data-api — :3001
cd data-api && npm install && npm run typecheck && npm run dev

# agent
cd agent && npx tsc --noEmit && npm test && npm run smoke

# vận hành
node scripts/check-freshness.mjs          # SLO độ tươi từng nguồn (exit 1 khi quá hạn)
bash scripts/audit-all.sh                 # kiểm toàn hệ thống PASS/FAIL/LIMITED

# tài khoản ops THỬ cho máy đăng nhập dev (chỉ DB local; mật khẩu ở .claude/ops-test-account.json, gitignored)
node scripts/dev-ops-account.mjs          # tạo/giữ ops-test@local.test (role admin); --rotate để xoay
node --test scripts/*.test.mjs            # test script ở scripts/
bash scripts/dev-ops-login-check.sh       # đăng nhập đầu-cuối bằng tài khoản thử (cần dev :3456 đang chạy)
```

## Bẫy kỹ thuật

1. **MapLibre + Turbopack**: bắt buộc `setWorkerUrl` (`app/src/lib/map-worker.ts`), không thì map trắng.
2. **Airbnb/AirDNA**: chỉ headful Chrome (headless bị anti-bot). Phân trang Airbnb dùng
   link `A[aria-label^='Trang N']`.
3. **OSM boundaries**: `out geom` (không phải `out tags geom`); cần header UA.
4. **Market rollup**: `300_metrics.sql` DELETE dòng cấp market trước INSERT (tránh
   `ON CONFLICT DO NOTHING` giữ số cũ).
5. **Sau mọi transform VN**: `node reassign-areas.mjs` rồi 300 + 400.
6. **Root repo không có node_modules** — script ở `scripts/` mượn `pg` từ `app/`.
7. `~/dev/one-invest` là symlink → repo này (launchd cũ còn trỏ đường đó).

## Tài liệu nền

ROADMAP v4 · ADR 0001–0012 (`docs/adr/`) · `docs/architecture/portals.md` ·
`docs/architecture/invest-portal-ia.md` · `docs/ops/runtime-map.md` ·
`docs/research/reso-standards.md` · `docs/research/property-master-record.md`.
Điều tra web: kết quả thô để ở `research-local/` (gitignored), chưng cất vào `docs/research/`.

<!-- BEGIN:reui-agent-rules -->
## ReUI design rules (every UI edit, follow-ups included)

This project uses an existing design system: ReUI on shadcn/ui. Keep its look. Generic frontend advice (vary fonts or themes, gradients, page-load or staggered reveals, "2-3 intentional motions", Framer Motion) does not apply here, and other design skills lose where they disagree.

1. Use installed components first (`components/ui`, `components/reui`): tables `data-grid`, filtering `filters`, boards `kanban`, modals `Dialog` or `AlertDialog`, toasts `sonner`. Never set height, radius, padding, shadow or motion on them; use `size`, `variant`, `spacing`.
2. Color: semantic tokens. State: `<Badge variant="success-light">` from `@/components/reui/badge` at default size, or Alert variants. Raw palette only for categorical identity, with its `dark:` pair.
3. Spacing: `gap-*` on the parent: `gap-1` to `gap-2` in a row, `gap-3` to `gap-4` between groups, `gap-6` to `gap-8` between sections. Type: `text-sm` body, `text-xs` meta, nothing smaller; never resize FrameTitle or CardTitle.
4. Motion: installed parts already animate; never retime them. Yours: hover `transition-colors`; reveal `duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]`; transform and opacity only; never `transition-all`, bounce, or a stagger on table rows or lists of 20+; at most 1 entrance per view; `MotionConfig reducedMotion="user"` plus `motion-reduce:`.
5. Every data region: empty state with an action, `Skeleton` loading, inline error with Retry.
6. Before UI code, write the plan from `.agents/skills/reui/SKILL.md` in your reply. Before you finish, run its self-check on the files you changed and fix every hit (2 rounds at most). Full rules: `.agents/skills/reui/SKILL.md`. If that folder is missing, call the `reui` MCP tool `get_agent_skill`.

Managed by the ReUI installer. Edits between the markers are replaced on the next run.
<!-- END:reui-agent-rules -->
