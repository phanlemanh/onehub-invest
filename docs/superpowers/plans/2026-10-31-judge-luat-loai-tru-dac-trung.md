# judge-luat-loai-tru-dac-trung (HD2) — kế hoạch thi công

**Goal:** luật ghép căn pl25-2 loại tất định theo đặc trưng nhà; diện tích theo làm tròn 1 m² và cách đo căn hộ 10%.
**Spec:** `docs/superpowers/specs/2026-10-31-judge-luat-loai-tru-dac-trung-design.md`.

### Task 1: luật trong `apNguong` (independent: false)
Files: `agent/src/agents/judge-entity.ts`. Phục vụ E1–E4, E7, E8.
- `NGUONG` = {giaM2YesMax, giaM2NoMin, dienTichLamTronM2: 1, dienTichCanHoMax: 0.1}; `PHIEN_BAN_NGUONG` = "pl25-2".
- `khoaDuong`, `khoaMaCan`, `soTang`; năm đặc trưng + diện tích → `khac_<ma>` khi có ở cả hai bên mà khác.

### Task 2: test (independent: false)
Files: `agent/tests/judge-luat.test.ts`, `agent/tests/fixtures/judge-entity-pl25-1.ts.txt`, `agent/tests/judge-nguong.test.ts`,
`agent/tests/judge-chung.ts`, `agent/tests/judge-run.test.ts`. Phục vụ E1–E8.
- Verify: `cd agent && npm test`.
