# guard-edits lấy gốc theo kho chứa tệp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa bản sửa đã có trên PR #281 qua lượt chấm độc lập của hồ sơ T3, không viết thêm mã sản phẩm.

**Architecture:** Mã hook và selftest đã commit (`789eb9bd`, `07a4e589`). Phần còn lại là chạy đường nền, đặt hợp đồng sang `implemented`, chấm bằng agent tươi, rồi trình Cổng Bằng chứng.

**Tech Stack:** bash, jq, git; `feature-loop` 2.36.0.

**Spec:** `docs/superpowers/specs/2026-11-03-guard-edits-goc-theo-tep-design.md`

## Global Constraints

- Bốn câu hỏi của Cổng Phạm vi nhận theo khuyến nghị: không sửa `typecheck-changed.sh`, giữ đường cũ khi thư mục chưa có, chấp nhận code có trước hồ sơ, không phân biệt kho khác.
- Chỉ đổi các tệp mà `probes/pham-vi.sh` cho phép.
- `duong-nen.mjs`, `s4-args.mjs`, `acceptance-verify` chạy khi phiên giữ đúng khoá đợt, lệnh nền chạy qua `giu-nhip.mjs`.
- Không gộp PR; thứ tự gộp do phiên giám sát xếp sau chữ ký của Mạnh.

## Review Focus

- Đường nền đỏ vì việc của hồ sơ khác: gọi tên trong gói Cổng Bằng chứng, không tính cho vòng này.
- Lỗi `worktree prune` của `scripts/chuyen-huong-ma-thi-truong/acceptance.mjs:235`: phiên riêng đang sửa, không sửa ở đây.
- Main đi tiếp trong lúc chấm làm hồ sơ khác lệch: hợp main trước lượt chấm, không hợp giữa lượt.

---

### Task 1: Đường nền

**Files:** `_acceptance/guard-edits-goc-theo-tep/duong-nen.md` (máy sinh)

**Interfaces:** Consumes: khoá `duong-nen` của đợt. Produces: khối «Nền hạ tầng» cho thẻ.

- [ ] **Step 1:** Chờ khoá ghi tên dãy U1, chạy `duong-nen.mjs --root . --slug guard-edits-goc-theo-tep` qua `giu-nhip.mjs`. Mã 0 là nền xanh; mã 1 đọc `duong-nen.md`.
- [ ] **Step 2:** Nhả khoá `duong-nen`. Commit `duong-nen.md`.

### Task 2: Chấm độc lập

**Files:** `_acceptance/guard-edits-goc-theo-tep/{contract.md,evidence-report.md,review-findings.md,run-log.jsonl,usage-report.md}`

**Interfaces:** Consumes: evals E1–E10 đã duyệt. Produces: báo cáo bằng chứng cho Cổng Bằng chứng. Phục vụ E1–E10.

- [ ] **Step 1:** Đặt `status: implemented`, commit. Xin khoá `s4` kèm `--uoc-phut`.
- [ ] **Step 2:** Sinh args bằng `s4-args.mjs`, chạy Workflow `acceptance-verify.js`. Verdict `REJECT` thì sửa đúng finding trong hợp đồng rồi chấm round kế, tối đa 3 round.
- [ ] **Step 3:** Ghi run-log trước, báo cáo sau, đặt `status: verified`, commit, nhả khoá `s4`.

### Task 3: Cổng Bằng chứng

**Files:** `_acceptance/guard-edits-goc-theo-tep/{card.html,evidence-page.html}`

**Interfaces:** Consumes: báo cáo của Task 2. Produces: thẻ để Mạnh ký.

- [ ] **Step 1:** Đẩy nhánh bằng `pr-san-sang.mjs`, dựng thẻ, gửi Mạnh. Máy không ký.
- [ ] **Step 2:** Sau chữ ký, đẩy commit lên PR #281. Phiên giám sát gộp.
