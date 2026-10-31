# Chuẩn hoá ô đường Implementation Plan

**Goal:** `khoaDuong` bỏ cụm vị trí, số nhà và đuôi địa chỉ, để thẻ duyệt và luật ghép căn không còn loại oan «đường khác».

**Architecture:** Chỉ sửa thân `khoaDuong` trong `app/src/lib/ops/review-can-cu.ts`, rồi chép nguyên văn sang `agent/src/agents/judge-entity.ts`. Test mới `agent/tests/judge-entity-duong.test.ts` có các ca CD-AC-n.

**Spec:** `docs/superpowers/specs/2026-10-31-chuan-hoa-o-duong-design.md` · `_acceptance/chuan-hoa-o-duong/contract.md`

## Global Constraints

- Không thêm hàm mới ở cả hai tệp (LT-AC-9 rút đúng bảy hàm theo tên).
- Không sửa test của hồ sơ đã ký (AC-9).
- `PHIEN_BAN_NGUONG` giữ `pl25-2`.

## Review Focus

- Tiền tố có dấu «Dương Lâm» không được sinh cách đọc thừa (dấu giữ tới bước cuối) — đo ở E7 (cặp HD2) và E9.
- «Ngõ 5, Kim Mã»: cụm vị trí bỏ trước khi cắt dấu phẩy — đo ở E1.
- «30 Tháng 4» ↔ «2 Tháng 4» không khớp nhầm — đo ở E3.

### Task 1: khoaDuong mới + test CD-AC-1..8 (independent: false)

**Files:** sửa `app/src/lib/ops/review-can-cu.ts` (thân `khoaDuong`), sửa `agent/src/agents/judge-entity.ts` (bản chép), tạo `agent/tests/judge-entity-duong.test.ts`.
**Phục vụ:** E1–E8. **Verify:** `cd agent && node --import tsx --test tests/judge-entity-duong.test.ts tests/judge-luat.test.ts` cùng ba test app (E10–E12), tất cả exit 0; mỗi chiều đỏ ghim đúng thông điệp ở evals.yaml.

- [ ] Viết ma trận test theo evals.yaml E1–E8 (đếm đúng số ô), kèm chiều đỏ bằng bản đột biến chép tạm cạnh judge-entity.ts.
- [ ] Sửa `khoaDuong` ở tệp app theo thứ tự sáu bước trong design, rồi chép sang agent.
- [ ] Chạy lệnh verify; commit.
