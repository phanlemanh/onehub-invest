# Đọc số m² bị sót trong bài S03 Implementation Plan

> **For agentic workers:** thực thi tuần tự trong phiên chính, mỗi task có lệnh kiểm riêng.

**Goal:** `parsePost` đọc ra `areaM2` cho bài ghi «Diện tích» không đơn vị và bài viết chữ kiểu Unicode, không đổi số nào đã đọc được.

**Architecture:** Chỉ khâu diện tích trong `parsePost` đổi. Đọc cũ trên chữ cũ trước, còn rỗng thì đọc lại trên chữ NFKC, còn rỗng thì tới luật nhãn. Các trường khác không đi qua NFKC.

**Tech Stack:** Node .mjs, `node:test`, PostgreSQL :5433.

**Spec:** `docs/superpowers/specs/2026-11-05-doc-so-m2-bi-sot-design.md`

## Global Constraints

- Không ghi DB `oneinvest`, không sao lưu, không áp migration.
- Không sửa `mau-do.json`, `mau-bai-doi.json` sau khi sửa bộ đọc.
- Lệnh đầy đủ và S4 chạy dưới khoá của dãy P4.

## Review Focus

- Bài có cả số đậm và số thường: số thường đã đọc phải giữ (ca «200M2» và 173).
- «Diện tích: 20 x 30», «60 - 70» có dấu cách: không thành số.
- Link chứa M2 và SĐT đậm: không thành diện tích.
- Bài viết giá đậm: giá vẫn rỗng, vì giá không đi qua NFKC.
- Bản sao DB nhiễm từ lượt trước: E4 dựng lại mỗi lần.

---

### Task 1: Phép đo (independent: false)

**Files:** Create `_acceptance/doc-so-m2-bi-sot/probes/_goc.mjs`, `dot-bien.mjs`, `so-bo-doc.mjs`, `transform-thu.mjs`.
Phục vụ E2, E3, E4. Kiểm: chạy mỗi probe trước khi sửa bộ đọc phải đỏ với thông điệp ghim.

### Task 2: Ca test và bộ đọc (independent: false)

**Files:** Modify `pipeline/parse.test.mjs`, `pipeline/transform-zalo.mjs`.
Phục vụ E1, E5, E6.

**Interfaces:** Produces `dienTichSauNhan(so: string): number | null` export từ `pipeline/transform-zalo.mjs`.

- [ ] Viết ca `GC1-AC-1`, `GC1-AC-2`, `GC1-AC-3`, `GC1-AC-4`; chạy `node --test pipeline/parse.test.mjs`, ca mới đỏ.
- [ ] Sửa `parsePost` và thêm `NHAN_DIEN_TICH`, `dienTichCoDonVi`, `dienTichSauNhan`; chạy lại, xanh.
- [ ] Chạy E2, E3, E4 bằng lệnh trong `_acceptance/config.yaml`, xanh.
- [ ] Commit.
