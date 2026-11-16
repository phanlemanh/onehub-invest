# DA4 tu-vung-du-an-muc-39 — kế hoạch thi công

**Spec:** `docs/superpowers/specs/2026-11-11-tu-vung-du-an-muc-39-design.md` · hợp đồng `_acceptance/tu-vung-du-an-muc-39/`.

Thước đã có trước: `pipeline/scripts/tu-vung-du-an.test.mjs` (đỏ trên cây chưa sửa, mọi ca có đối chứng đỏ).
Verify mỗi task: `cd pipeline && node --test scripts/tu-vung-du-an.test.mjs` (ca của task xanh).

| Task | Files | Phục vụ | independent |
|---|---|---|---|
| 1. CONTEXT họ Địa lý: «Dự án» thay «Khu đô thị», «Phân khu», «Danh mục dự án», «Mức gắn», «Trạng thái dự án», «Mã định danh nhà nước»; các dòng «khu đô thị» thực thể → «dự án» | `CONTEXT.md` | E1, E2, E6 | false |
| 2. CONTEXT họ Tài sản & tin: «Tin sơ cấp», «Độ đủ hồ sơ», khối «Bẫy tên RESO» | `CONTEXT.md` | E2, E3 | false |
| 3. ADR-0011 Qđ 2, ADR-0013 §2, ADR-0016 §1/§3/§7 sửa tại chỗ kèm dấu | `docs/adr/0011…`, `0013…`, `0016…` | E4, E6 | true |
| 4. mappings.yaml: property_type, block_raw, S08 label/policy/project_id/project_name | `pipeline/mappings.yaml` | E5, E6 | true |
| 5. Chạy `vocab.mjs --check`, test của hàng, test vocab | — | E6 | false |

Ba task chạm hai tệp nhỏ, làm tuần tự trong vòng chính (không fan-out).
