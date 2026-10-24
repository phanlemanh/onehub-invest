# mcp-tools-theo-so-be-mat (ON15) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bản khai công cụ MCP `app/docs/api/mcp-tools.json` mang chế độ theo từng công cụ khớp sổ bề mặt, và một phép đo đỏ khi hai bên lệch.

**Architecture:** Hàm thuần `checkMcpTools({ entries, manifest })` trong `scripts/check-mcp-tools.mjs` so từng công cụ với dòng sổ (`loadEntries()` của `check-api-surface.mjs`). Ba chế độ CLI: `static`, `mutation` (MT1–MT10 + W1), `historic` (B0 ở `1c6389b`). `check-portal-compliance.mjs` gọi hàm này ở mục 13.

**Tech Stack:** Node ESM `.mjs` (import `.ts` bằng type stripping như `check-api-surface.mjs`), không framework test — repo đo bằng script tự kiểm (`ok`/`FAIL`, exit 0/1).

**Spec:** `docs/superpowers/specs/2026-10-24-mcp-tools-theo-so-be-mat-design.md` · hợp đồng `_acceptance/mcp-tools-theo-so-be-mat/contract.md`

## Global Constraints

- Năm chế độ đúng chữ: `public` · `ops` · `ops-session` · `admin` · `session-or-noop` (lấy từ `ApiMode` của sổ, không chép lại danh sách nếu đọc được).
- Thông điệp ghim nguyên văn: «công cụ trỏ route không có trong sổ» · «phương thức công cụ lệch sổ» · «công cụ thiếu chế độ» · «chế độ công cụ không có trong sổ» · «chế độ công cụ lệch sổ».
- Gốc kho suy từ vị trí script (`path.resolve(dirname(fileURLToPath(import.meta.url)), "..")`), không hardcode.
- Không sửa `check-api-surface.mjs` (thước của hồ sơ đã ký `so-be-mat-api`) ngoài việc import từ nó.
- Không chạm tệp thật trong `mutation`: W1 chạy trên bản chép ở `os.tmpdir()`, so băm bản khai thật trước/sau.

## Review Focus

1. Công cụ thiếu `endpoint`/`method` bị bỏ qua lặng → MT9/MT10 ở Task 1.
2. Đột biến cố định `ops`/`public` vỡ khi PL2 mở lại offers → MT1/MT3/MT7 chọn «chế độ khác sổ hiện tại» (Task 1).
3. `historic` chạy nơi thiếu lịch sử → exit 1 «thiếu lịch sử git 1c6389b» (Task 1).
4. W1 để lại thư mục tạm hoặc sửa tệp thật → dọn trong `finally`, so băm (Task 2).
5. Endpoint có dấu `/` cuối hoặc query → coi là không có trong sổ (không chuẩn hoá ngầm), MT5 phủ.

---

### Task 1: Phép đo `check-mcp-tools.mjs` + bản khai mới + khoá config

**Files:**
- Create: `scripts/check-mcp-tools.mjs`
- Modify: `app/docs/api/mcp-tools.json`
- Modify: `_acceptance/config.yaml` (khối `executors.script`, cạnh `api_surface_mutation`)

**Phục vụ:** E1, E2, E3 · **independent:** false (Task 2, 3 dùng nó)

**Interfaces:**
- Produces: `export const MCP_MSG` (năm thông điệp trên); `export function checkMcpTools({ entries, manifest }) -> { violations: string[], tools: number, lines: string[] }` (`lines` = dòng ok từng công cụ dạng `<tên> → <route> <METHOD>: <khai> = sổ <mode>`); `export function loadManifest(root?: string) -> object`; `export const MCP_MUTATIONS: [id, tên, thông điệp | null, fn({entries, manifest}) -> {entries, manifest} | null][]` (thông điệp `null` = đối chứng dương, phải 0 vi phạm).

- [ ] **Step 1:** Viết `checkMcpTools` + chế độ `static`. Vi phạm có dạng `<tên công cụ>: <thông điệp>[ (khai X, sổ Y)]`. Chế độ hiệu lực = `tool.auth ?? rootMode` với `rootMode` = tên chế độ mở đầu chuỗi `manifest.auth` (regex `^(ops-session|session-or-noop|public|ops|admin)\b`), không có → «công cụ thiếu chế độ». Static in mỗi dòng `lines`, dòng `khoá auth gốc: không khai chế độ chung` (hoặc `khai mặc định <mode>`), dòng tổng `mcp-tools: <k>/<n> công cụ khớp sổ`.
- [ ] **Step 2:** Chạy `node scripts/check-mcp-tools.mjs static` trên bản khai CŨ → FAIL `oneinvest_get_offers: chế độ công cụ lệch sổ (khai public, sổ ops)`, exit 1 (chiều đỏ trên vật thật trước khi sửa).
- [ ] **Step 3:** Sửa bản khai: thêm `"auth": "public"` cho asset-stats, `"auth": "ops"` cho offers (mô tả thêm «đang tạm đóng cho ops», cách gửi token ops), khoá gốc `auth` = câu tả «theo từng công cụ — khoá auth là chế độ trong sổ; ops = bearer token ops hoặc phiên ops» (không mở đầu bằng tên chế độ), `updated: "2026-10-24"`. Giữ `cloud_base_url` (check-cloud-url.sh đọc).
- [ ] **Step 4:** `static` → exit 0, hai dòng ok + `mcp-tools: 2/2 công cụ khớp sổ`.
- [ ] **Step 5:** Viết `MCP_MUTATIONS` MT1–MT10 theo bảng design §3 (dựng bằng `structuredClone` từ bản khai/sổ thật; «chế độ khác» = chế độ đầu tiên trong năm chế độ ≠ chế độ sổ; MT7 đổi `mode` của dòng sổ route offers trong bản sao `entries`), chế độ `mutation`: `ok bản nguyên ĐẠT — …`, mỗi MT `ok MTn «tên» TRƯỢT với «thông điệp»` (MT4: `ok MT4 «…» ĐẠT (0 vi phạm)`), không áp được → FAIL có tên.
- [ ] **Step 6:** Phá thử: tạm sửa `checkMcpTools` bỏ kiểm `method` vắng → `mutation` phải FAIL ở MT10 với tên; hoàn lại, xanh lại.
- [ ] **Step 7:** Chế độ `historic`: `git -C <root> show 1c6389b:app/docs/api/mcp-tools.json` và `…:app/src/lib/api-surface.ts` (ghi ra tệp `.ts` tạm trong `os.tmpdir()` rồi `import()`), so bằng `checkMcpTools` → `ok B0 «bản khai + sổ ở 1c6389b (trước vòng)» TRƯỢT với «chế độ công cụ lệch sổ»` khi vi phạm nêu `oneinvest_get_offers`; cộng `ok B0+ bản khai HEAD với sổ HEAD ĐẠT`; `git show` lỗi → `FAIL thiếu lịch sử git 1c6389b`, exit 1.
- [ ] **Step 8:** Thêm ba khoá config `mcp_tools_static`, `mcp_tools_mutation`, `mcp_tools_historic` (`node scripts/check-mcp-tools.mjs <chế độ>`).
- [ ] **Step 9:** Verify: `node scripts/check-mcp-tools.mjs static && node scripts/check-mcp-tools.mjs mutation && node scripts/check-mcp-tools.mjs historic` → ba exit 0. `bash scripts/check-cloud-url.sh .` không đổi kết quả mục mcp-tools.json.
- [ ] **Step 10:** Commit `feat(scripts): check-mcp-tools — bản khai MCP theo chế độ sổ bề mặt (ON15)`.

### Task 2: Rào trong làn `portal_static` + ca W1

**Files:**
- Modify: `scripts/check-portal-compliance.mjs` (mục 13, sau mục 12 `opsTierA(root)`; comment đầu tệp thêm một gạch)
- Modify: `scripts/check-mcp-tools.mjs` (ca W1 trong `mutation`)

**Phục vụ:** E4, E5 · **independent:** false

**Interfaces:**
- Consumes: `checkMcpTools`, `loadManifest`, `loadEntries` (Task 1).

- [ ] **Step 1:** Mục 13: mỗi vi phạm → `check(false, "công cụ MCP: <v>")`; tổng `check(ok, "công cụ MCP: <k>/<n> công cụ khớp sổ bề mặt")`.
- [ ] **Step 2:** W1 trong `mutation`: `mkdtemp`, chép `scripts/`, `app/src/`, `app/docs/` (cp đệ quy), symlink `app/node_modules` và `app/package.json`; chạy `node <tmp>/scripts/check-portal-compliance.mjs` → kỳ vọng exit 0 (`ok W1 bản chép nguyên → portal-compliance exit 0`); ghi bản khai MT1 vào bản chép, chạy lại → exit 1 và stdout có `FAIL công cụ MCP` (`ok W1 bản chép với bản khai MT1 → portal-compliance exit 1, dòng FAIL nhắc «công cụ MCP»`); băm sha256 bản khai thật trước/sau phải bằng; `rm -rf` tmp trong `finally`.
- [ ] **Step 3:** Phá thử: tạm comment mục 13 → W1 chiều đỏ phải FAIL có tên; hoàn lại.
- [ ] **Step 4:** Verify: `node scripts/check-portal-compliance.mjs` → `portal-compliance: ĐẠT` với dòng `ok   công cụ MCP: 2/2 công cụ khớp sổ bề mặt`; `node scripts/check-mcp-tools.mjs mutation` exit 0.
- [ ] **Step 5:** Commit `feat(scripts): portal-compliance kiểm bản khai MCP theo sổ (ON15)`.

### Task 3: Luật viết ra

**Files:**
- Modify: `app/src/lib/api-surface.ts` (khối comment đầu tệp)
- Modify: `docs/architecture/portals.md` (mục sổ bề mặt)

**Phục vụ:** E6 · **independent:** true (chỉ cần tên phép đo của Task 1)

- [ ] **Step 1:** Mỗi tệp nêu ba ý (a) đổi chế độ route có công cụ MCP hoặc thêm công cụ MCP → sửa `app/docs/api/mcp-tools.json` cùng commit; (b) khoá `auth` mỗi công cụ là một trong năm chế độ, bằng chế độ route nó gọi (gốc chỉ là mặc định, bản khai không dùng); (c) phép đo `scripts/check-mcp-tools.mjs`, chạy trong làn `portal_static`.
- [ ] **Step 2:** Verify: `cd app && npx tsc --noEmit` (chỉ comment đổi); `node scripts/check-api-surface.mjs static` exit 0.
- [ ] **Step 3:** Commit `docs: luật bản khai MCP theo sổ bề mặt (ON15)`.
