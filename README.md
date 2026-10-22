# onehub-invest

Monorepo private cho nền tảng đầu tư BĐS cho thuê onehub (2026-10-22, gom từ
one-invest + onehub-data-api; ADR-0012 + quyết định user).

```
app/         Invest + Ops portal — source of truth đầy đủ (Next.js)
data-api/    standalone public API (Hono) → subtree-push onehub-data-api
collector/   thu thập đa nguồn: AirDNA, Airbnb, Zalo, Chợ Tốt (CCP, SPL)
agent/       onehub-ai-agent — nền tảng agentic (ADR-0012)
pipeline/    transform → canonical (RESO-first ADR-0011) → entity → sync cloud
db/          migrations (không sửa tay production — AGENTS.md #3)
docs/        ADR + research; tools/ sync-public (overlay sanitise)
```

Public mirrors: `bash tools/sync-public.sh` (data-api subtree + app overlay
sanitise → phanlemanh/onehub-invest-app, onehub-data-api).

Quy tắc: AGENTS.md; dữ liệu: ADR-0011 RESO-first; nguồn: SPL S0x (ADR-0007);
an toàn Zalo: watchdog 5′ (docs/research/unified-property-pipeline.md).
