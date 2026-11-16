# Bộ tách ô đường + probe ra khỏi suite — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** `khoaDuong` xử năm lớp L1–L5. Probe dữ liệu thật ra khỏi suite agent, chạy ở hai chỗ: executor đã ký và `/ops-check`.

**Spec:** `docs/superpowers/specs/2026-11-15-tach-o-duong-dau-vao-ban-design.md` · hợp đồng `_acceptance/tach-o-duong-dau-vao-ban/contract.md`

## Global Constraints

- Hai bản `khoaDuong` (`agent/src/agents/judge-entity.ts`, `app/src/lib/ops/review-can-cu.ts`) giống hệt từng dòng sau sửa.
  CD-AC-7 rút bản app bằng regex `function khoaDuong(...)\n}`.
- Ba dòng đột biến `DONG_CUM`, `DONG_PHAY`, `DONG_ETH` của tệp test phải còn khớp nguyên văn trong `judge-entity.ts`.
- Probe chỉ SELECT. Không DDL. Không đụng `pipeline/`.

## Review Focus

- «Đường số 7» và «Đường số 9» vẫn ra Lệch: bước L3 không áp cho «số».
- «1/ TRẦN VĂN MƯỜI» vẫn Khớp: L5 chỉ dồn khi cả hai phía gạch chéo là số.
- «Số 10, Ngõ 9, La Dương» và «Ngõ 5, Kim Mã» vẫn Khớp: dồn dấu phẩy không phá cụm đầu có phẩy.
- Ô chỉ có cụm («Ngõ 12», «Ngõ 2.5m») vẫn ra Thiếu.
- `o-duong-that.sh` chạy được từ checkout chính, dùng `agent/node_modules` qua cd.

### Task 1: Năm bước mới trong `khoaDuong` (independent: false) — phục vụ E1–E5

**Files:** Modify `agent/src/agents/judge-entity.ts`, `app/src/lib/ops/review-can-cu.ts`, `agent/tests/judge-entity-duong.test.ts`.

- [ ] Viết test `CD-AC-9 lớp đầu vào bẩn`, dùng các ma trận `L1…L5` lấy từ contract AC-1…AC-4.
  - Mỗi lớp có `kiemL<n>(mod)` ném thông điệp ghim `CD-AC-9 L<n> …`.
  - Chiều đỏ: `dotBien` bỏ đúng một dòng mới.
- [ ] Thêm các ma trận L1…L5 vào `MA_TRAN_7`. Assert `MA_TRAN_7.length` bằng tổng mới. Thêm đột biến bỏ L3.
- [ ] Chạy để thấy đỏ:
  `cd agent && node --import tsx --test --test-name-pattern 'CD-AC-(7|9)' tests/judge-entity-duong.test.ts`.
- [ ] Sửa `khoaDuong` theo design §3, chép y hệt sang bản app. Bước L3 đặt sau `.trim()` cuối chuỗi replace.
- [ ] Chạy lại: xanh, và CD-AC-1…7 cũ xanh.

### Task 2: Dời probe + CD-AC-12 + CD-AC-10 (independent: false) — phục vụ E6, E7, E8

**Files:** Create `agent/probes/o-duong-that.test.ts`. Modify `agent/tests/judge-entity-duong.test.ts` (bỏ ca probe,
thêm CD-AC-10) và `_acceptance/config.yaml` (dòng `judge_entity_duong`).

- [ ] Chuyển nguyên văn ca `CD-AC-8 probe ô đường thật` và các hàm phụ của nó sang tệp probe.
  - `boCumMod` dựng tại chỗ.
  - Ca `CD-AC-8 bộ tách` (không DB) ở lại.
- [ ] `CD-AC-12 probe lớp ô đường thật`:
  - mỗi lớp có `chon` (regex) và `ten` (bộ tách độc lập);
  - assert `soDuong(v, ten(v)) === "khop"`;
  - đếm tối thiểu L3 ≥ 30, L2 ≥ 1;
  - diagnostic `CD-AC-12 lớp: L1=… L5=…`;
  - đột biến bỏ L3 phải đỏ `CD-AC-12 L3 ra Lệch`.
- [ ] Cờ `O_DUONG_DOT_BIEN=1` làm cả hai ca chạy bằng bản đột biến bỏ cắt cụm. Ca CD-AC-8 khi đó phải đỏ.
- [ ] `CD-AC-10`:
  - đọc glob suite từ `agent/package.json`;
  - đếm dấu `t.skip("cần DB máy thu` mỗi tệp, so danh sách nợ {judge-entity-khong-dau 1, judge-luat 2};
  - cấm tên ca CD-AC-8 probe;
  - hai chiều đỏ như E6.
- [ ] Dòng `judge_entity_duong` thành `cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts`.

### Task 3: `scripts/o-duong-that.sh` + audit-all + CD-AC-11 (independent: false) — phục vụ E7

**Files:** Create `scripts/o-duong-that.sh`. Modify `scripts/audit-all.sh`, `agent/probes/o-duong-that.test.ts`.

- [ ] Script:
  - `cd "$(dirname "$0")/../agent"`, chạy `node --import tsx --test probes/o-duong-that.test.ts`;
  - bắt diagnostic;
  - in `✅ Ô đường thật: <n> giá trị · lớp: …`, thoát 0; hoặc `❌ Ô đường thật: <dòng lệch đầu>`, thoát 1.
- [ ] audit-all: thêm mục «Ô đường thật»; `OUT=$(bash "$ROOT/scripts/o-duong-that.sh")`; thoát 0 thì `pass "$OUT"`, khác thì `fail "$OUT"`.
- [ ] CD-AC-11 (trong tệp probe):
  - chạy script hai nhánh;
  - khớp dòng gọi trong audit-all;
  - chiều đỏ trên bản audit-all bỏ dòng gọi.
- [ ] Verify:
  - `cd agent && node --import tsx --test tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts`;
  - `cd agent && npx tsc --noEmit`;
  - `cd app && npx tsc --noEmit`;
  - `cd agent && npm test`.
