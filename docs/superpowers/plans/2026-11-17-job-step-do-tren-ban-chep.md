# job-step-do-tren-ban-chep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Hai ô đột biến của ca `JST-AC-8 lưới phạm vi làn` đo trên bản chép, không ghi một byte nào vào cây làm việc.

**Architecture:** Tách một hàm thuần `khoiTrenMoc(diff, socMoc)`; ô (i) cấp diff theo ref của cây thật (chỉ đọc), ô
(ii)/(iii) cấp diff `git diff --no-index -U0` của hai tệp trong thư mục tạm. Ca mới dựng một kho git tạm và chạy riêng ca
lưới làn trong đó để đo «không ghi», cùng các đột biến chiều đỏ trên bản chép của tệp test.

**Tech Stack:** Node `node:test`, git CLI, bash 3.2 (macOS).

**Spec:** `docs/superpowers/specs/2026-11-17-job-step-do-tren-ban-chep-design.md`

## Global Constraints

- Chỉ sửa `scripts/job-step-thoi-luong.test.mjs` (mã) và `_acceptance/job-step-ghi-thoi-luong/decisions.jsonl` (một dòng trỏ).
- `scripts/zalo-import-daily.sh`, `scripts/lib/job-step.sh` không đổi.
- Vị trí chèn giữ nguyên: dưới mốc dòng i+2, trên mốc dòng i−1.
- Thông điệp ghim nguyên văn: «JST-AC-8 sửa phần trên ranh giới làn Claude», «JST-AC-8 không đọc được bản origin/main của
  tệp bọc», «JST-AC-1-bc ô đột biến đã ghi vào cây làm việc», «JST-AC-1-bc phép đo đã chạm tệp bọc thật»,
  «JST-AC-2-bc mất lời báo thiếu origin/main».
- Gốc kho suy từ `import.meta.url` (đã có, dòng `const REPO`).

## Review Focus

- Kho tạm có `--test-name-pattern` khớp 0 ca → `node --test` vẫn thoát 0: ca phải đòi đúng một ca khớp đã chạy (đếm `# pass 1`).
- `git diff --no-index` thoát 1 khi có khác — không được coi là lỗi.
- Ca đệ quy: kho tạm chạy chính tệp test — pattern không được khớp ca mới (tránh chạy lồng vô hạn).
- Thư mục tạm dọn ở `after`/`finally`; ngắt giữa chừng chỉ để rác trong tmpdir, không trong kho.
- Đột biến phải thật sự đổi nguồn: khẳng định chuỗi thay có mặt đúng một lần.

---

### Task 1: Tách hàm tách khối và đưa hai ô đột biến sang bản chép

**Files:** Modify `scripts/job-step-thoi-luong.test.mjs` (khối `kiemRanhGioiLan`/`voiDongChen`, ca `JST-AC-8 lưới`)

**Interfaces:** Produces `khoiTrenMoc(diff: string, socMoc: number): string[]`; `banGocChat(): string` (ném lỗi với thông
điệp «JST-AC-8 không đọc được bản origin/main của tệp bọc» khi `git show` thoát ≠ 0 hoặc đầu ra rỗng);
`kiemRanhGioiLan(): {lan, socMoc}` (chỉ đọc); `voiDongChen(truocMoc, doc)` nay trả `khoiTrenMoc` trên diff `--no-index`.

- [ ] Viết lại ba hàm theo interfaces; `voiDongChen` không còn `writeFileSync` vào `REPO`.
- [ ] Chạy `node --test --test-name-pattern 'JST-AC-8 lưới phạm vi làn' scripts/job-step-thoi-luong.test.mjs` → pass 1.

### Task 2: Ca kho tạm — AC-1 không ghi, AC-2 đột biến chiều đỏ và thiếu origin/main

**Files:** Modify `scripts/job-step-thoi-luong.test.mjs` (thêm ca `JST-AC-1-bc`, `JST-AC-2-bc`)

**Interfaces:** Consumes Task 1. Produces `khoTam(nguonTest: string): string` (kho git tạm có tệp bọc, lib, tệp test, một
commit, `refs/remotes/origin/main`); `chayLuoiTrong(kho): {ma, ra}`; `chupTep(p): {bam, mtime, ctime}`.

- [ ] JST-AC-1-bc: xanh trên bản hiện tại (chụp kho tạm + cây thật y nguyên, porcelain rỗng, đúng 1 ca pass); đỏ trên bản
      đột biến ghi vào `path.join(REPO, BOC)` (kho tạm đổi), cây thật vẫn y nguyên.
- [ ] JST-AC-2-bc: thiếu `origin/main` → thoát ≠ 0 kèm thông điệp; ba đột biến (rỗng → ô iii đỏ; một khối giả → ô i đỏ;
      bỏ kiểm mã git show → mất thông điệp).
- [ ] Chạy trọn `node --test scripts/job-step-thoi-luong.test.mjs` và `jst_regress` → xanh.
- [ ] Ghi một dòng trỏ vào `_acceptance/job-step-ghi-thoi-luong/decisions.jsonl`; commit.
