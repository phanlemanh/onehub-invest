# judge-nguong-la-code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Kết luận ghép căn do hàm luật trong code quyết; LLM chỉ viết lời giải thích; thẻ mang model + trace; judge-run sinh thẻ cho mọi cặp needs_llm.

**Architecture:** `judge-entity.ts` giữ hằng `NGUONG`, hàm thuần `lech`/`apNguong`, prompt giải thích và bộ đọc `parseGiaiThich`. `judge-run.ts` xuất `chamMotLuot(db, deps)` (tiêm `queryPair`, model, `recordCall`, `khongLlm`) và chỉ chạy `main()` khi gọi trực tiếp. Test thuần cho luật/prompt; test DB thử cho luồng thẻ.

**Tech Stack:** TypeScript strict, node:test qua tsx, pg, AI SDK `MockLanguageModelV4`.

**Spec:** `docs/superpowers/specs/2026-10-30-judge-nguong-la-code-design.md` · `_acceptance/judge-nguong-la-code/contract.md` · `evals.yaml`

## Global Constraints

- Chỉ sửa `agent/src/agents/judge-entity.ts`, `agent/scripts/judge-*.ts`, `agent/tests/judge-*` (vùng hẹp của giám sát).
- `NGUONG = { giaM2YesMax: 0.15, dienTichYesMax: 0.10, giaM2NoMin: 0.30 }`; `lech = |a−b|/max(a,b)`; so chặt.
- Không prompt nào chứa số ngưỡng hay phép so sánh kèm số.
- `ai_confidence` = NULL; `ai_reasoning` kết bằng `LLM <model> · trace <tệp>` khi có model.
- Không ghi `property_candidates`, `sale_offers`; thẻ đã quyết không bị sửa.
- Test DB: DB riêng `oneinvest_p3_judge_test_<pid>` trên :5433, xoá cuối tệp; không chạm `oneinvest`.

## Review Focus

- Phường chỉ một bên có / chuỗi rỗng → không được thành «khác phường» (E1 ô 9).
- Lệch đúng bằng ngưỡng → không yes/không no (E1 ô 10, 12).
- Thẻ cũ ghi cặp chiều ngược → cập nhật, không sinh thẻ thứ hai (E7).
- Model ném lỗi có thân chứa prompt → lớp lỗi ≤ 80 ký tự, không chép prompt (E5a).
- Bản bọc recordCall phải gọi tiếp sổ thật (E4).

---

### Task 1: Luật ngưỡng + prompt giải thích (judge-entity.ts)

**Files:** Modify `agent/src/agents/judge-entity.ts` · Create `agent/tests/judge-nguong.test.ts` · Modify `agent/scripts/judge-eval.ts`

**Interfaces — Produces:**
- `NGUONG`, `PHIEN_BAN_NGUONG = "pl25-1"`
- `lech(x: number | null, y: number | null): number | null`
- `chuanHoaPhuong(s: string | null): string | null`
- `type KetLuan = "yes" | "no" | "unsure"`; `type LyDo = { ma: string; cau: string }`
- `apNguong(pair: PairData): { same_house: KetLuan; ly_do: LyDo[]; lech: { gia_m2: number | null; dien_tich: number | null } }`
- `judgeEntityAgent` (prompt giải thích, budget 1); `buildJudgeInput(pair, kq)`; `parseGiaiThich(output): string | null`
- `lyDoChu(kq): string` (nối câu lý do)
- Test xuất `soiNguong(text): string[]` (hàm soi dùng chung với Task 2)

- [x] Viết `judge-nguong.test.ts`: ma trận 12 ô E1 (hai chiều), đối chứng đỏ (dt 12%, mẫu số min); E2a soi prompt ô 1–9 + đối chứng đỏ prompt cũ nhúng nguyên văn.
- [x] Chạy `cd agent && node --import tsx --test tests/judge-nguong.test.ts` → đỏ (chưa có hàm).
- [x] Viết code; `judge-eval.ts` in kết luận luật + lời giải thích.
- [x] Chạy lại → xanh; `npx tsc --noEmit` không thêm lỗi mới ngoài 2 lỗi tồn đọng.
- [x] Commit.

### Task 2: chamMotLuot sinh/cập nhật thẻ (judge-run.ts)

**Files:** Modify `agent/scripts/judge-run.ts` · Create `agent/tests/judge-run.test.ts`

**Interfaces — Consumes:** Task 1. **Produces:**
- `type ChamDeps = { queryPair: (a: string, b: string) => Promise<PairData | null>; model?: LanguageModel; recordCall?: RecordCall; khongLlm?: boolean }`
- `chamMotLuot(db: pg.ClientBase, deps: ChamDeps): Promise<{ sinh: number; capNhat: number; boQua: number; loi: number }>`
- `CAU_DEM_THIEU_THE` (câu SQL đường đo, xuất để test chạy)

Luồng: tập cặp = needs_llm ∪ thẻ entity_match pending; mỗi cặp tra thẻ hai chiều mọi trạng thái → đã quyết: bỏ qua; pending: UPDATE; không có: INSERT. Gọi model qua `runAgent(judgeEntityAgent, input, {}, { model, recordCall: bọc })` trừ khi `khongLlm`; bản bọc chép bản ghi rồi gọi `(deps.recordCall ?? recordCallDb)`. Lỗi/sai khuôn → `cham.ok=false`, `loi` = `tenLop(err)` hoặc `"sai-khuon"`.

- [x] Viết `judge-run.test.ts`: DB thử (DDL property_candidates rút từ 027, review_queue rút từ 029 trước `-- Seed`, 052_ai_calls thật, `sale_offers` tối thiểu); ca E2b, E3, E4, E5 (3 ô), E6 (bộ khoá rút từ seed 029), E7, E8 (3 ô), E9 — mỗi ca có đối chứng đỏ, thông điệp ghim theo evals.yaml.
- [x] Chạy → đỏ.
- [x] Viết code, `main()` giữ hành vi CLI (`--khong-llm`).
- [x] Chạy `cd agent && npm test` → xanh toàn bộ.
- [x] Commit.
