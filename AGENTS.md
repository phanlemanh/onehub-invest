# onehub-invest — hướng dẫn cho mọi AI coding agent

> Nguồn chỉ dẫn DUY NHẤT dùng chung cho Claude Code (qua `@AGENTS.md` trong
> `CLAUDE.md`), Codex, Cursor… Trạng thái + quyết định đã chốt: **`docs/ROADMAP.md`**
> (đọc §1 hiến pháp + §3 quyết định trước khi đề xuất việc mới; KHÔNG hỏi lại
> điều đã chốt). Làm xong việc: cập nhật ROADMAP §2 as-built + §4 trạng thái.

Nền tảng insight đầu tư BĐS Việt Nam (cho thuê ngắn hạn + mua bán). North star:
pipeline đầu tư 4 giai đoạn (`docs/research/investment-pipeline-4-stages.md`).
Làm việc với user bằng **tiếng Việt**.

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

## Luật bất biến

1. **Raw snapshot BẤT BIẾN** — collector chỉ ghi mới, không sửa/xoá. Mọi diễn giải nằm ở pipeline.
2. **Schema chỉ đổi qua migration mới** trong `db/migrations/` (số kế tiếp). Không sửa
   migration đã commit, không sửa tay DB production.
3. **RESO-first (ADR-0011)**: field/enum mới phải tra RESO Data Dictionary trước; chỉ tạo
   mới khi là đặc trưng VN và khai đủ 6 điều kiện trong `pipeline/mappings.yaml`.
4. **DATA-CONTRACT** (`collector/docs/DATA-CONTRACT.md`) là giao diện collector↔pipeline;
   thêm field phải tăng `schemaVersion`.
5. **AirDNA chỉ để hiệu chuẩn** (ToS) — không đưa số AirDNA lên Invest Portal; chỉ ở `/ops/quality`.
6. **SPL (ADR-0007)**: nguồn gọi bằng mã `S0x`. Tầng A (tên nguồn thật, SĐT, hồ sơ cá nhân)
   KHÔNG rời máy local — cloud chỉ nhận hash + aggregate. `sale_offers` không sync cloud.
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

- Comment domain logic tiếng Việt; API/types tiếng Anh. UI tiếng Việt, URL ASCII không dấu
  (`slugifyName()`).
- SQL đánh số theo thứ tự chạy: `db/migrations/NNN_*.sql`; `pipeline/sql/` 200 transform →
  300 metrics → 400 breakdowns → 410 listing_stats → 450 DQ → 500 asset_stats.
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
