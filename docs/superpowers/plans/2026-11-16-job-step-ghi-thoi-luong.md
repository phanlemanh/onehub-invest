# job-step-ghi-thoi-luong Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mỗi bước của job nạp in một dòng ghim `JOB STEP` ra stderr kèm giây treo, để đọc được bước nào chiếm phần lớn 5–7 phút của lượt nạp S03 15′.

**Architecture:** Thêm một hàm ghi dùng chung `job_step_ghi` vào `scripts/lib/job-step.sh`; `job_step` đo giây quanh lệnh rồi gọi nó. `zalo-import-daily.sh` gọi cùng hàm ấy từ `buoc_nhanh` và một lần cho bước gộp `truoc-lan-claude` — tất cả nằm DƯỚI dòng ranh giới làn Claude. Không mở, không ghi tệp nào.

**Tech Stack:** bash 3.2 (macOS, `/bin/bash`) · `node --test` cho phép đo · không DB, không mạng.

**Spec:** `docs/superpowers/specs/2026-11-16-job-step-ghi-thoi-luong-design.md` (hợp đồng: `_acceptance/job-step-ghi-thoi-luong/contract.md`)

## Global Constraints

- Chạy được trên `/bin/bash` 3.2 của macOS — không `date +%N`, không mảng kết hợp, không `${var^^}`.
- Mã thoát của từng bước và của cả job KHÔNG đổi.
- Dòng `JOB FAIL [<job>] bước <nhãn> mã <n>` và `BỎ LƯỢT [<job>] bước <nhãn>: đụng khoá — lượt sau làm` giữ NGUYÊN VĂN.
- Dòng mới chỉ ra **stderr**; stdout của lệnh không thêm byte nào.
- Vòng KHÔNG mở hay ghi tệp nào (không sổ, không `JOB_STEP_SO`).
- Trong `scripts/zalo-import-daily.sh` chỉ sửa phần DƯỚI dòng `# Từ đây trở xuống là làn Claude (AU3 Ngoài-3)`.
- Khuôn dòng cố định: `JOB STEP [<job>] bước <nhãn> mã <n> giây <s> nhanh <c>`.

## Review Focus

Năm lớp đầu vào mà hợp đồng hàm ý nhưng không AC nào chạm; mỗi dòng đã được gắn một ca vào task sở hữu mã.

1. **Đồng hồ lùi giữa bước** (NTP bước lùi) → `date +%s` sau nhỏ hơn trước → giây ÂM trên dòng ghim. Người đọc mong thấy `0`, không phải `-7`. → ca ở Task 1.
2. **Bước bị tín hiệu giết** (SIGTERM → mã 143) → vẫn phải có dòng `JOB STEP` và dòng `JOB FAIL`, mã thoát 143 giữ nguyên. → ca ở Task 1.
3. **`JOB_RC` chưa đặt khi tệp bọc gọi `job_run` lần đầu** → `JOB_RC=${JOB_RC:-0}` phải còn tác dụng sau khi thêm hàm mới. → ca ở Task 1.
4. **Nhãn bước chứa khoảng trắng** → bộ đọc ở design §4.4 tách trường bằng `sed` neo vào `bước … mã … giây …`; nhãn có khoảng trắng làm nhóm bắt sai. Chọn: giữ nhãn một từ như mọi nhãn đang có, và ca đo ghim rằng mọi nhãn tệp bọc truyền vào đều không có khoảng trắng. → ca ở Task 2.
5. **stderr của lệnh kết thúc KHÔNG có ký tự xuống dòng** → dòng `JOB STEP` dính vào đuôi đầu ra ấy, nên `grep '^JOB STEP'` trượt. Chọn: giữ hành vi y như dòng `JOB FAIL` cũ (không chen thêm newline) và bộ đọc ở §4.4 dùng `grep 'JOB STEP \['` KHÔNG neo đầu dòng. → ca ở Task 1 ghim đúng lựa chọn ấy.

---

### Task 1: Bộ ghi trong `scripts/lib/job-step.sh`

**Files:**
- Modify: `scripts/lib/job-step.sh`
- Create (Test): `scripts/job-step-thoi-luong.test.mjs`

**Interfaces:**
- Consumes: không có.
- Produces: `job_step_ghi <job> <nhãn> <mã> <giây>` — in ra stderr đúng một dòng
  `JOB STEP [<job>] bước <nhãn> mã <mã> giây <giây> nhanh <c>`, với `c` = 1 khi `S03_LUOT_NHANH` bằng đúng chuỗi `1`, ngược lại 0; không trả giá trị nào đáng đọc, không chạm `JOB_RC`. `job_step` và `job_run` giữ nguyên chữ ký và nguyên ngữ nghĩa mã thoát.

- [ ] **Step 1: Viết ca đỏ trước — khuôn dòng, cột nhanh, thứ tự dòng, giây là số đo**

Tạo `scripts/job-step-thoi-luong.test.mjs` theo khuôn `scripts/job-exit.test.mjs`: `mkdtempSync` dưới `realpathSync(tmpdir())`, chép NGUYÊN `scripts/lib/job-step.sh` vào `<cây>/scripts/lib/`, sinh tệp bọc thử `<cây>/thu.sh` một dòng `. "$(dirname "$0")/scripts/lib/job-step.sh"` rồi gọi `job_step`/`job_run`.

Các ca của task này (tên ca ghim đúng mã AC để lượt chấm đọc được):

```
JST-AC-1 bước mã 0: đúng một dòng JOB STEP, không JOB FAIL, stdout không đổi
JST-AC-2 giây là số đo: bước sleep 2 cho giây ≥ 2, bước true cho giây ≤ 1
JST-AC-3 bốn mã thoát 1, 3, 42, 127: mã giữ nguyên, JOB STEP đứng trước JOB FAIL nguyên văn
JST-AC-4 job_run: luôn trả 0, JOB_RC giữ mã hỏng đầu tiên, ba dòng JOB STEP
JST-AC-5 ma trận cờ: S03_LUOT_NHANH 1 | không đặt | 0 | true → nhanh 1 | 0 | 0 | 0
JST-AC-6 cây còn y nguyên và lượt chạy được trong thư mục chỉ đọc
RF-1 đồng hồ lùi: date giả trả mốc sau nhỏ hơn mốc trước → giây 0, không âm
RF-2 bước bị SIGTERM: mã thoát 143, vẫn có JOB STEP và JOB FAIL
RF-3 JOB_RC chưa đặt: lượt đầu job_run vẫn chạy, JOB_RC thành mã hỏng
RF-5 stderr không có newline cuối: grep không neo đầu dòng vẫn thấy dòng JOB STEP
```

Khẳng định chính của JST-AC-5 dùng đúng biểu thức của hợp đồng:

```js
assert.match(dong, /^JOB STEP \[[^\]]+\] bước \S+ mã \d+ giây \d+ nhanh [01]$/);
```

JST-AC-6 phần (1) chụp cây bằng một hàm `anhChup(root)` trả `Map<đường, "cỡ:mtimeMs">` duyệt đệ quy, so trước và sau lượt; phần (2) `chmodSync` thư mục làm việc và `HOME` về `0o500`, chạy lại, rồi `chmodSync` về `0o700` trong khối `finally`.

RF-1 dựng bằng một `date` giả đầu `PATH` in mốc giảm dần theo số lần gọi (tệp đếm trong cây tạm).

- [ ] **Step 2: Chạy để thấy nó đỏ**

Run: `node --test scripts/job-step-thoi-luong.test.mjs`
Expected: FAIL — mọi ca dính `JOB STEP` đỏ vì `job-step.sh` chưa in dòng nào.

- [ ] **Step 3: Viết `job_step_ghi` và đo giây trong `job_step` ở `scripts/lib/job-step.sh`**

`job_step_ghi` đọc `S03_LUOT_NHANH` để tính cột `nhanh` rồi `echo … >&2`. `job_step` lấy mốc bằng `date +%s` trước lệnh, lấy lại sau lệnh NGAY SAU khi chụp `$?`, kẹp hiệu về 0 khi âm (RF-1), gọi `job_step_ghi`, rồi mới tới khối `JOB FAIL` cũ — thứ tự ấy là điều JST-AC-3 đo. `job_run` không đổi một dòng nào.

Cập nhật khối chú thích đầu tệp: thêm khuôn dòng mới và câu «không mở, không ghi tệp nào».

- [ ] **Step 4: Chạy lại để thấy nó xanh**

Run: `node --test scripts/job-step-thoi-luong.test.mjs`
Expected: PASS — các ca JST-AC-1..AC-6 và RF-1, RF-2, RF-3, RF-5 xanh (ca của Task 2 chưa có).

- [ ] **Step 5: Dựng chiều đỏ bằng bản đột biến**

Mỗi ca ở trên có một ô đột biến CÙNG fixture theo đúng `expected` của E1–E6: bản sao `job-step.sh` in ra stdout · chỉ in khi mã ≠ 0 · ghi hằng `giây 0` · lấy mốc kết thúc trước khi chạy · trả 0 khi lệnh hỏng · nối thêm ` giây <s>` vào dòng `JOB FAIL` · `JOB_RC` lấy mã hỏng cuối · `job_run` trả mã của lệnh · bỏ trường `nhanh` · coi mọi giá trị khác rỗng là lượt nhanh · nối mỗi bản ghi vào một tệp cạnh tệp bọc. Mỗi ô đòi ca tương ứng ĐỎ với đúng thông điệp ghim đã khai trong `evals.yaml`.

Run: `node --test scripts/job-step-thoi-luong.test.mjs`
Expected: PASS — mọi ô đột biến đỏ đúng chỗ nó phải đỏ.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/job-step.sh scripts/job-step-thoi-luong.test.mjs
git commit -m "feat(job-step): ghi thời lượng từng bước ra dòng ghim JOB STEP"
```

---

### Task 2: Điểm gọi trong `scripts/zalo-import-daily.sh`

**Files:**
- Modify: `scripts/zalo-import-daily.sh` (chỉ phần dưới dòng `# Từ đây trở xuống là làn Claude (AU3 Ngoài-3)`)
- Modify (Test): `scripts/job-step-thoi-luong.test.mjs`

**Interfaces:**
- Consumes: `job_step_ghi` của Task 1 — cùng bốn đối số, cùng khuôn dòng.
- Produces: không hàm mới; thêm bước mang nhãn `truoc-lan-claude` vào chuỗi dòng ghim của job `zalo-import-daily`.

- [ ] **Step 1: Viết ca đỏ trước — ba kết cục của `buoc_nhanh`, bước gộp, lưới phạm vi làn, hai lượt**

Thêm vào `scripts/job-step-thoi-luong.test.mjs` một cây tạm thứ hai theo khuôn `scripts/s03-nap-nhanh.test.mjs` (chép NGUYÊN tệp bọc thật + `job-step.sh`, `node` giả và `sleep` giả đầu `PATH`, `HOME` tạm, `DATABASE_URL` cổng đóng, snapshot giả có `manifest.json`). `node` giả nhận `CHAM_BUOC` / `CHAM_GIAY` để ngủ THẬT bằng `/bin/sleep` ở đúng một bước.

```
JST-AC-7 buoc_nhanh ba kết cục: xanh | đụng khoá | hỏng mã 3 — mỗi kết cục một dòng JOB STEP, dòng cũ nguyên văn, mã thoát bằng bản origin/main
JST-AC-8 bước truoc-lan-claude đứng trước mọi bước transform; cấy ngủ 2s vào vòng nạp cho giây ≥ 2
JST-AC-8 lưới phạm vi làn: cây hiện tại xanh; chèn dưới mốc xanh; chèn trên mốc đỏ
JST-AC-9 hai lượt: dãy lời gọi node giả và mã thoát bằng bản origin/main; cột nhanh 1 ở lượt nhanh, 0 ở lượt 00:00
RF-4 mọi nhãn bước tệp bọc truyền vào đều không chứa khoảng trắng
```

Bản đối chứng lấy bằng `git show origin/main:scripts/zalo-import-daily.sh` ghi ra cây tạm riêng rồi chạy trên CÙNG `node` giả — không viết tay dãy nhãn hay mã thoát ở bất kỳ ô nào.

Lưới phạm vi làn là hàm `kiemRanhGioiLan()` chạy trên chính cây làm việc: `git diff -U0 origin/main -- scripts/zalo-import-daily.sh`, lấy số dòng mốc trong bản `origin/main`, đòi mọi khối `@@` có dòng bắt đầu lớn hơn số ấy và dòng mốc còn nguyên trong cây. Ô dương và ô đỏ chèn tạm một dòng rồi `git checkout -- scripts/zalo-import-daily.sh` trong khối dọn của chính ô.

- [ ] **Step 2: Chạy để thấy nó đỏ**

Run: `node --test scripts/job-step-thoi-luong.test.mjs`
Expected: FAIL — các ca JST-AC-7, JST-AC-8, JST-AC-9 đỏ vì tệp bọc chưa ghi dòng nào; ô «chèn trên mốc đỏ» của lưới phạm vi làn đã xanh sẵn.

- [ ] **Step 3: Sửa `scripts/zalo-import-daily.sh` dưới dòng ranh giới làn**

Ngay sau dòng `. "$ROOT/scripts/lib/job-step.sh"`, thêm một dòng gọi `job_step_ghi` cho bước `truoc-lan-claude` với mã là `$HS_RC` và giây là `$SECONDS` (đồng hồ của shell, đếm từ lúc tệp bọc khởi động — nên không phải chạm dòng nào phía trên). Trong `buoc_nhanh`, lấy mốc trước lệnh, tính giây ngay sau `rc=${PIPESTATUS[0]}`, gọi `job_step_ghi` TRƯỚC khi vào nhánh `BỎ LƯỢT` hay `JOB FAIL`.

- [ ] **Step 4: Chạy lại để thấy nó xanh**

Run: `node --test scripts/job-step-thoi-luong.test.mjs`
Expected: PASS — toàn bộ ca của Task 1 và Task 2 xanh.

- [ ] **Step 5: Dựng chiều đỏ bằng bản đột biến**

Theo `expected` của E7, E8, E9: bản sao tệp bọc bỏ lời gọi ghi trong `buoc_nhanh` · ghi rồi `return` trước nhánh `BỎ LƯỢT` · bỏ dòng ghi `truoc-lan-claude` · bỏ bước `xep-hang-gia` khỏi lượt 00:00 · export `S03_LUOT_NHANH=1` cho cả lượt 00:00. Mỗi ô đòi ca tương ứng ĐỎ với thông điệp ghim đã khai.

Run: `node --test scripts/job-step-thoi-luong.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/zalo-import-daily.sh scripts/job-step-thoi-luong.test.mjs
git commit -m "feat(zalo-import): ghi thời lượng buoc_nhanh và bước gộp truoc-lan-claude"
```

---

### Task 3: Lưới hồi quy năm bộ test job có sẵn

**Files:**
- Modify (nếu và chỉ nếu đỏ): `scripts/lib/job-step.sh` hoặc `scripts/zalo-import-daily.sh`
- Không sửa kỳ vọng của năm bộ test cũ.

**Interfaces:**
- Consumes: mã của Task 1 và Task 2.
- Produces: không gì mới — đây là cổng chặn của cross-cutting «dòng cũ không đổi».

- [ ] **Step 1: Chạy năm bộ test job có sẵn**

Run: `node --test scripts/job-exit.test.mjs scripts/s03-nap-nhanh.test.mjs scripts/zalo-import-job.test.mjs scripts/zalo-import-job-nhe.test.mjs scripts/enrich-buoc-job.test.mjs`
Expected: PASS cả năm.

- [ ] **Step 2: Bộ nào đỏ thì sửa MÃ CỦA VÒNG, không sửa kỳ vọng của bộ cũ**

Đỏ ở đây nghĩa là dòng mới đã lọt vào stdout, đè dòng cũ, hay đổi mã thoát — tức vi phạm một Global Constraint. Sửa `job-step.sh` hay `zalo-import-daily.sh` rồi chạy lại từ Step 1. Nếu một bộ cũ đỏ vì lý do KHÔNG liên quan tới vòng (đỏ sẵn trên nền), ghi một dòng vào `## Notes` của hợp đồng thay vì sửa.

- [ ] **Step 3: Chạy lại trọn phép đo của vòng**

Run: `node --test scripts/job-step-thoi-luong.test.mjs`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test(job-step): lưới hồi quy năm bộ test job xanh sau khi thêm dòng JOB STEP"
```

---

## Thứ tự và tính độc lập

| Task | Phụ thuộc | `independent` |
|---|---|---|
| 1 | — | false |
| 2 | Task 1 (`job_step_ghi`) | false |
| 3 | Task 1 + Task 2 | false |

Ba task nối tiếp nhau qua đúng một hàm dùng chung, nên S3 chạy TUẦN TỰ trong phiên chính, không fan-out.
