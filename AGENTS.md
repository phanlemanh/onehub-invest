# One Invest — hướng dẫn workspace

Công cụ đầu tư BĐS cho thuê ngắn hạn. **Tính năng lõi là Market Insights**
(trang chi tiết thị trường — ADR-0002); Market Finder (map + filter) là lớp
discovery xây sau. Ngôn ngữ làm việc với user: tiếng Việt.

## Trạng thái hiện tại

Repo mới — **Next.js app chưa scaffold**. Khi được yêu cầu scaffold, chạy trong `src/`
(sau khi xóa `.gitkeep`):

```bash
cd src && npx create-next-app@latest . --typescript --app --tailwind --eslint --src-dir --import-alias "@/*"
```

Thêm dependencies theo ADR-0001 khi cần: `@tanstack/react-query`, `recharts`, `maplibre-gl`.

## Quy tắc bắt buộc

1. **Dữ liệu**: KHÔNG scrape AirDNA hoặc dùng dữ liệu của họ trong sản phẩm.
   Nguồn hợp lệ liệt kê ở `docs/research/data-sources.md` (Inside Airbnb, Census,
   Natural Earth). Tham khảo AirDNA chỉ để học kiến trúc/UX.
2. **`research-local/` và `*.har` không bao giờ được commit** — HAR chứa cookie/token
   session của user. Artifacts điều tra để ở đó; chưng cất kết quả vào `docs/research/`.
3. **Schema DB thay đổi qua migration** trong `db/` (không sửa tay production).
4. Metrics precompute server-side (pipeline/), React chỉ đọc — mirror kiến trúc
   đã quan sát ở AirDNA.
5. **Dữ liệu listing theo ADR-0011 (RESO-first)**: field/enum mới phải tra RESO
   Data Dictionary (dd.reso.org) trước; chỉ tạo mới khi là đặc trưng VN và khai
   báo đủ 6 điều kiện trong `pipeline/mappings.yaml`.

## Điều tra tiếp tục bằng REA + chrome-devtools-mcp

- REA MCP đã đăng ký ở mức user (ZCode) — tool `mcp__rea__*` dùng được ở mọi workspace.
  REA là "evidence spine": mọi kết luận cite evidence_id, export bundle về `research-local/`.
- **`chrome-devtools` MCP** (đã đăng ký user-scope, pin `1.11.0`, trỏ
  `--browserUrl=http://127.0.0.1:9222`): dùng để **điều khiển tab đã login**
  của user (navigate, click, đọc network bodies) — việc REA cố tình không làm.
  Khi dùng: chỉ phạm vi trong tab mục tiêu đã thống nhất, không đụng tab khác;
  kết quả đọc được là runtime thô (không phải REA Evidence) — ghi rõ nguồn trong ledger.
- Chrome của user expose CDP tại `http://127.0.0.1:9222`; tab AirDNA đã login.
  Passive inspect (`inspect_web_page`) được; connect-mode scenario của REA sẽ fail.
- Launch-mode headless bị Cloudflare Turnstile chặn; **headless: false** thì qua.
- Evidence sau điều tra: `export_evidence_bundle` vào `research-local/`,
  sau đó `jq` để trích xuất (tránh transport truncation).
- Khoảng trống còn lại và bước tiếp theo: xem cuối file
  `docs/research/airdna-market-explorer-architecture.md` và ledger trong
  `docs/research/market-finder-spec.md`.

## Lệnh (sau scaffold)

```bash
cd src && npm run dev      # app
docker compose up -d       # Postgres+PostGIS (khi có db/docker-compose.yml)
```
