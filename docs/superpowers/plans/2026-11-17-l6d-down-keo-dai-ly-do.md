# VHZ1 heartbeat L6(d) + lý do DOWN — kế hoạch thi công (tích hợp)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps dùng `- [ ]`.

**Goal:** Nghiệm thu nhánh làn thu @1a360fa27 bằng harness riêng đo đủ AC-1…AC-8, và sửa lỗi tích hợp duy nhất đã biết (D3-5 đỏ trên CI ubuntu).

**Architecture:** Không đổi `collector/scripts/zalo-heartbeat.sh` hay `scripts/lib/s03-song.sh`. Thêm một harness Node
`scripts/l6d-down-keo-dai-ly-do/acceptance.mjs` chạy heartbeat thật (bash) trên HOME tạm, PATH tạm, CLI giả ghi sổ, osascript giả;
mỗi chốt có ca `-DO` chạy trên bản chép đã phá. Sửa một dòng skip trong test của ZCode.

**Tech Stack:** Node 22 (`node:child_process`, `node:fs`, `node:crypto`), bash.

**Spec:** `docs/superpowers/specs/2026-11-17-l6d-down-keo-dai-ly-do-design.md` + `_acceptance/l6d-down-keo-dai-ly-do/contract.md`, `evals.yaml`.

## Global Constraints

- Luật 8 (`.claude/rules/zalo-safety.md`): không lượt nào chạy trên `~/.openclaw` thật, gateway thật, CLI thật; harness thoát 2 nếu HOME lượt = `os.homedir()` hoặc PATH lượt có `openclaw` ngoài thư mục tạm.
- Không sửa logic heartbeat/s03-song (làn ZCode). Bản phá cho ca `-DO` là BẢN CHÉP trong thư mục tạm (`collector/scripts/` + `scripts/lib/` chép đúng cấu trúc vì heartbeat `source "$(dirname $0)/../../scripts/lib/s03-song.sh"`).
- Đầu ra: mỗi ca một dòng `PASS <mã>` / `FAIL <mã> <thông điệp>`; dòng cuối `NGHIEM THU PASS n/n`; thoát 0 chỉ khi đủ.
- Tạo phẩm chạy ra `os.tmpdir()`; không ghi vào `_acceptance/`.
- Nguồn chỉ ghi `S03`.

## Review Focus

1. Heartbeat chạy chậm (~0,1–0,5 s/nhịp; ca treo 20 s) — ca treo chạy song song để harness < 2 phút.
2. `chay_20s` dùng `sleep 20` thật: ca treo dùng CLI giả `sleep 60`; đo thời lượng tường < 25 s.
3. Mốc giờ lệnh nhóm: lùi mốc bằng cách ghi epoch vào tệp mốc (không giả đồng hồ).
4. Băm alerts log/pipe log thật: tệp có thể không tồn tại → băm «vắng» vẫn phải bằng nhau trước/sau.
5. Mẫu status thật chứa định danh — chỉ dùng bản đã thay `default`.

---

### Task 1: D3-5 skip khi không phải darwin (independent: true)

**Files:** Modify `pipeline/scripts/zalo-heartbeat-chan.test.mjs` (ca `D3-5`) · phục vụ E2, E10.

- [ ] Thêm `{ skip: process.platform !== "darwin" && "silent-gate dùng date -j (BSD) — chỉ đo trên máy thu" }` cho ca D3-5 (tiền lệ VHZ2 @1be76ccc6).
- [ ] Verify: `cd pipeline && node --test scripts/zalo-heartbeat-chan.test.mjs` → 9 pass, 0 skip trên macOS.
- [ ] Commit `fix(test): D3-5 skip ngoài darwin — date -j chỉ có trên BSD`.

### Task 2: Harness — khung lượt cô lập + chốt an toàn (independent: false; Task 3 dựa vào)

**Files:** Create `scripts/l6d-down-keo-dai-ly-do/acceptance.mjs` · phục vụ E8 (AC-6).

**Interfaces (Produces):**
- `dungLuot({ hbScript?, kichBan, home? }) → { home, bin, state, alerts, moc, so, pipeLog, chay(env?) → {ms, rc, stdout} }` — tạo thư mục tạm; `bin/openclaw` = CLI giả đọc `kichBan` (JSON trong `$home/kich-ban.json`: `status: "up"|"down"|"mau-that"|"treo"`, `nhom: "session"|"khac"|"treo"|"in-do"`), ghi `"$*"` vào sổ `so` từng lời gọi; `bin/osascript` ghi sổ thông báo; env lượt: `HOME`, `PATH=<bin>:/usr/bin:/bin`, `ZALO_OPENCLAW_CLI=<bin>/openclaw`, `ZALO_HEARTBEAT_STATE/ALERTS/LINH_MUC`, `ZALO_DRIFT_SH=<bin>/drift` (ghi dấu), `S03_SONG_OSASCRIPT=<bin>/osascript`, `ZALO_HEARTBEAT_ROOT=<tạm>`.
- `chotAnToan(env)` — ném `TuChoi` (thoát 2) nếu `env.HOME === os.homedir()` hoặc `command -v openclaw` dưới env ấy trỏ ra ngoài thư mục tạm.
- `banChep(phaFn)` → đường heartbeat trong bản chép đã áp `phaFn(textHb, textSong)`.
- `ca(ma, fn)` — gom kết quả, in PASS/FAIL.

- [ ] Viết ca `HOME-THAT-DO`, `PATH-THAT-DO` (đặt tệp canh `openclaw` ngoài tạm, chốt từ chối, tệp canh không chạy), `GO-CLI-GIA-DO` (không đặt `ZALO_OPENCLAW_CLI`, HOME tạm không CLI → sổ rỗng → chốt «CLI giả đã được dùng» đỏ đúng thông điệp), `CO-LAP` (băm `~/.openclaw/logs/oneinvest-zalo-pipe.log` + `pipeline/logs/zalo-watchdog-alerts.log` của checkout chính trước/sau cả bộ — CHỈ ĐỌC).
- [ ] Verify: `node scripts/l6d-down-keo-dai-ly-do/acceptance.mjs` in 4 dòng PASS.

### Task 3: Harness — ca hành vi AC-1…AC-5, AC-7 (independent: false)

**Files:** Modify `scripts/l6d-down-keo-dai-ly-do/acceptance.mjs` · phục vụ E1, E3, E4, E6, E7, E9.

Ca và kỳ vọng chép đúng `evals.yaml`:
- AC-1: `NHIP` (L6(d) 0/1/1, thông báo 0/1/1), `TAI-PHAT`, `UP-MAU-THAT` (dòng `up accs=1/1`, tệp trạng thái vắng), `UP-MAU-THAT-DO` (bản chép bỏ `-w` + mẫu `disconnected` → «disconnected bị đọc là up»), `NHIP-DO` (gỡ `song_d_down_kdai` → «L6(d) không bắn ở nhịp 2»).
- AC-2: `PHAT-LAI-1311` (reason=session; `song_c_notlinked` trên đầu ra status «linked» trả 1), `PHAT-LAI-1311-DO` (đổi cụm khớp → «reason khác session»).
- AC-3: `PHAT-LAI-0911`, `STATUS-TREO`, `NHOM-TREO`, `NHOM-IN-DO`, `STATUS-TREO-DO` (bản chép gọi status trực tiếp → «heartbeat vượt 25 s»).
- AC-4: `TAN-SUAT` (4 nhịp → 1; mốc −3601 → 2; −3599 → không), `UP-KHONG-GOI`, `TAN-SUAT-DO` (bỏ chặn mốc → «lệnh nhóm gọi quá 1 lần/giờ»).
- AC-5: `SO-LOI-GOI` (gom sổ mọi ca; mọi dòng thuộc hai dạng), `MA-CHI-DOC` (quét tĩnh hai tệp), `MA-CHI-DOC-DO`, `SO-LOI-GOI-DO`.
- AC-7: `KHUON-TRANG-THAI`, `TREO-SAU-SESSION`, `KHUON-DO` (đổi `reason=` thành `ly_do=` → «tệp trạng thái lệch khuôn VHZ2 đọc»).

- [ ] Viết ca; ca treo chạy song song (`Promise.all` trên `spawn`).
- [ ] Verify: `node scripts/l6d-down-keo-dai-ly-do/acceptance.mjs` → `NGHIEM THU PASS n/n`, thoát 0, < 2 phút.
- [ ] Đối chứng tay một lần: tạm gỡ `-w` trong bản làm việc của heartbeat → harness đỏ ở `UP-MAU-THAT-DO`/`UP-MAU-THAT`; trả lại (không commit).
- [ ] Commit `test(acceptance): harness nghiệm thu VHZ1 l6d-down-keo-dai-ly-do`.

### Task 4: Kiểm toàn bộ kiểu CI (independent: false)

- [ ] `node --test scripts/*.test.mjs` từ gốc kho (DB riêng nếu cần: tên `oneinvest_u2_vhz1`, không dùng `oneinvest_suite_*`).
- [ ] Evals máy: `s03_hb_chan`, `s03_hb_syntax`, `s03_song_lib`, `s03_song_tron`, `s03_song_bien` xanh.
- [ ] Contract `status: implemented`; vào S4 dưới khoá `s4`.
