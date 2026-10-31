# Phát biểu đi theo bài đăng (063) + test tự dọn — kế hoạch thi công

> Phương thức: tuần tự trong phiên (Native). Bước dùng ô `- [ ]`.

**Goal:** Áp/hoàn tác đề xuất phân xử lại mọi tin chung post; 063 sửa dữ liệu lệch một lần; PD-AC-1/PD-AC-8 xanh;
test dòng chảy cloud tự dọn lược đồ tạm.

**Architecture:** Một migration 063 (hàm trợ giúp + định nghĩa lại hai bộ ghi + mục sửa dữ liệu tách bằng dấu mục). Bộ
nạp test nạp lại phần hàm của 063 sau 059. Test mới chạy trong giao dịch ROLLBACK trên DB thử. Hai thay đổi test nhỏ.

**Spec:** `docs/superpowers/specs/2026-10-31-phat-bieu-db-do-tren-main-design.md` · hợp đồng
`_acceptance/phat-bieu-db-do-tren-main/contract.md` (Mạnh duyệt 31/10: Hỏi-1 sửa trong 063, Hỏi-2 sáu tiền tố) · E1–E10.

## Global Constraints

- 063 chỉ `CREATE OR REPLACE FUNCTION` + mục sửa dữ liệu idempotent; không DDL bảng. Dấu mục sửa dữ liệu:
  `-- 4. Sửa dữ liệu một lần` — bộ nạp test cắt tới dấu này.
- `apply_enrichment` = nguyên thân 059 · `revert_enrichment` = nguyên thân 045; chỉ đổi tập tin đưa vào
  `resolve_offer_fields`.
- Mục sửa dữ liệu: chỉ khi đã cắt chuyển; ghi `ops_audit` action `phat-bieu:phan-xu-lai-063` (detail `offers`,
  `offers_changed`); không ghi dòng audit khi lượt đổi 0 bản ghi (áp lần hai = 0 dòng ghi).
- Mọi phép đo GHI chạy trên DB thử `oneinvest_p2_pd` (`bash db/db-thu.sh oneinvest_p2_pd`), không áp 063 lên `oneinvest`.
- `phat-bieu-db.itest.mjs`: sửa đúng một dòng (PL5 cũng sửa tệp).
- Quét lược đồ của test dòng chảy cloud: đúng regex `^dc_(local|cloud|noflow|ta|mut|mig)_(\d+)$`, chỉ khi `process.kill(pid, 0)` ném lỗi.

## Review Focus

1. Áp hai đề xuất cùng post trong một lượt — tập tin phân xử không trùng lặp gây lỗi.
2. Tin chung post với tin đã nghỉ đổi khoá: phát biểu `legacy` vẫn chỉ đỡ tin sinh ra nó (luật 045 giữ nguyên).
3. Bộ nạp test trên DB chưa có 059 (không có `history_transactional`): không nạp 063.
4. Quét lược đồ khi pid tái sử dụng bởi tiến trình khác — giữ lược đồ (an toàn hơn xoá nhầm).
5. Tín hiệu SIGTERM giữa `before()`: dọn xong rồi thoát mã ≠ 0, không treo.

---

### Task 1: migration 063 + bộ nạp test + test chung post (E1–E4) — independent: false

**Files:** Create `db/migrations/063_phat_bieu_theo_bai_dang.sql` · Modify `pipeline/lib/nap-045.mjs` · Create
`pipeline/scripts/phat-bieu-chung-bai.itest.mjs`.

- [ ] Viết itest: fixture tin mồi nguồn TST, A và B chung post (B sống / B nghỉ), C riêng; đề xuất `enrichment_proposals`
  queued cho A (máy `e2_llm` / người `hitl:`). Ca `PB-AC-1`…`PB-AC-4` đúng expected E1–E4, chiều đỏ nạp bản hàm 059/045 trong
  cùng giao dịch, thông điệp ghim.
- [ ] Chạy `config:executors.test.pb_chung_bai` — đỏ.
- [ ] Viết 063 §1–§3: `offers_chung_chu_the(text[]) RETURNS text[]`, `apply_enrichment`, `revert_enrichment`; §4 sửa dữ liệu.
- [ ] `nap-045.mjs`: `napLai063(client)` nạp phần 063 trước dấu §4, gọi cuối `napLai059` khi đã nạp 059.
- [ ] `pb_chung_bai` xanh · `cd pipeline && npm test` xanh · commit.

### Task 2: phép đo 063 trên bản chép (E5) — independent: false

**Files:** Create `pipeline/scripts/idem-063.mjs`.

- [ ] Script: từ chối DB `oneinvest`; BEGIN; đo thời gian một `apply_enrichment` trước 063 (savepoint); áp 063 → in
  'idem-063 lượt 1: xét n · đổi m'; resolve(NULL) + `catChuyen` thử → 'sau áp: resolve(NULL) đổi 0 · cắt chuyển lệch 0';
  áp lại → 'lượt 2: đổi 0'; đếm dòng audit = 1; thời gian sau 063; chiều đỏ trong savepoint mới: chỉ phần hàm → lệch k > 0;
  ROLLBACK.
- [ ] `config:executors.script.idem_063` xanh · commit.

### Task 3: PD-AC-1 lọc lược đồ (E6) — independent: false

**Files:** Modify `pipeline/scripts/phat-bieu-db.itest.mjs` (một dòng).

- [ ] Thêm `AND table_schema = current_schema()` vào câu đếm cột.
- [ ] `config:executors.test.phat_bieu_db_063` xanh (dựng lại DB thử, áp 063, trọn bộ PD-AC) · commit.

### Task 4: test dòng chảy cloud tự dọn (E7) — independent: true

**Files:** Modify `app/tests/dong-chay-cloud.test.tsx` · Create `app/scripts/dc-tu-don.ts`.

- [ ] Test: hàm `donLuocDoChet(admin)` chạy đầu `before()`; `process.once('SIGTERM'|'SIGINT')` xoá SCHEMAS của mình rồi
  `process.exit(130|143)`.
- [ ] Script đo: gieo bốn lược đồ (pid chết ×2 tiền tố, pid sống, tiền tố khác), chạy test → dòng quét; chạy test rồi
  SIGTERM khi lược đồ của nó đã có → dòng ngắt; chiều đỏ trên bản chép tạm của test bỏ bước quét; dọn lược đồ gieo.
- [ ] `config:executors.script.dc_tu_don` xanh · `cd app && npm test` xanh · commit.

### Task 5: suite và bàn giao S4

- [ ] `cd app && npx tsc --noEmit && npm run lint`, `cd app && npm test`, `cd pipeline && npm test` xanh; `/verify`;
  contract `status: implemented`; vào S4.
