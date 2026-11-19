# VHZ2 watchdog tự khởi động lại gateway — kế hoạch thi công (tích hợp)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps dùng `- [ ]`.

**Goal:** Nghiệm thu khối P1 của ZCode (@1be76ccc6) bằng harness riêng đo AC-1…AC-10, không sửa logic watchdog.

**Architecture:** Harness Node `scripts/watchdog-tu-khoi-dong-gateway/acceptance.mjs` dựng hộp cát theo khuôn
`scripts/canh-bao-s03-ngung-thu/acceptance.mjs`: bản chép watchdog + `scripts/lib/*.sh` trong `<tạm>/repo`, HOME giả có
`openclaw.json` hợp lệ, extension monitor, gateway.log, CLI giả ghi sổ; stub `launchctl pkill pgrep osascript curl date` ghi
sổ, đứng đầu PATH. Ca -DO phá bản chép hay hộp cát.

**Tech Stack:** Node 22, bash, sqlite3 (L4d, chỉ trên tệp tạm).

**Spec:** `docs/superpowers/specs/2026-11-18-watchdog-tu-khoi-dong-gateway-design.md` + contract, evals của hồ sơ.

## Global Constraints

- Luật 8: không spawn watchdog trước `chotAnToan(luot)` — HOME ≠ `os.homedir()`; `command -v` của bảy lệnh (gồm `openclaw`)
  trong thư mục tạm hoặc vắng; `$HOME/.openclaw/bin/openclaw` là CLI giả; env dựng từ đầu (chỉ HOME, PATH, LANG, biến WD_TEST_*,
  `ZALO_HEARTBEAT_STATE` trỏ tạm, `S03_LOOKUP_DIR`/`GATEWAY_ENV_FILE` trỏ tạm). KHÔNG đặt `ZALO_WATCHDOG_KICKSTART`.
- Bản chép chỉ đổi đúng hai dòng (đường log `/tmp/openclaw/...` và cổng `:5433`) như tiền lệ; harness tự kiểm số dòng đổi.
- Đồng hồ giả: stub `date` trả `WD_TEST_NOW` cho đúng lời `+%s` khi biến có mặt; mọi lời khác chuyển `/bin/date`.
- Đầu ra `PASS <mã>`/`FAIL <mã> <lý do>`; dòng cuối `NGHIEM THU PASS n/n`; thoát 0 chỉ khi đủ; tên ca đúng evals.yaml.
- Không đổi `scripts/zalo-watchdog.sh`, `scripts/lib/s03-song.sh`.

## Review Focus

1. `alert()` gọi `ghi_bo_canh` → tệp sự kiện theo `S03_LOOKUP_DIR`/`GATEWAY_ENV_FILE`: phải trỏ tạm (bài học ZCode 1611-5(4)).
2. L4d tạo thư mục `pipeline/logs/zalo-watchdog-agentdb.d` lần đầu (baseline) — ca thường phải chạy một lượt nền trước.
3. b-moc chỉ ghi khi L6(b) đỏ ≥120 s: gateway.log phải có attempt cũ hơn mốc và không có «starting» sau nó.
4. Ca 13/11 dùng heartbeat thật: CLI giả của heartbeat khác CLI giả của watchdog (heartbeat gọi `channels status`, watchdog gọi
   `status`) — một CLI giả phục vụ cả hai, ghi sổ chung.
5. Log thật của checkout chính: alerts, `zalo-watchdog.log`, p1 log, p1-state, p1-tat — chụp trước, so sau (log sống: tiền tố).

---

### Task 1: Hộp cát + chốt an toàn (independent: false)

**Files:** Create `scripts/watchdog-tu-khoi-dong-gateway/acceptance.mjs` · phục vụ E7.

**Interfaces (Produces):**
- `dungHop({ bo?: string[] }) → hop` với `hop.chay({ now, env? }) → Promise<{rc, stderr, ms}>`, `hop.datGw(dong[])`,
  `hop.datHb(noiDung | null)`, `hop.datCfg(obj)`, `hop.datHandler(txt)`, `hop.datPgrep(song: bool)`, `hop.so()` (dòng sổ stub),
  `hop.soCli()`, `hop.kick()` (đếm `launchctl kickstart -k gui/<uid>/ai.openclaw.gateway`), `hop.alerts()`, `hop.p1Log()`,
  `hop.p1State()`, `hop.repo`, `hop.home`; `bo` gỡ stub/CLI cho ca -DO.
- `chotAnToan(hop)` ném `TuChoi(thông điệp ghim)`.
- `banChep(pha)` trả bản chép đã phá (kiểm phá áp được).

- [ ] Ca `STUB-VANG-DO`, `CLI-VANG-DO`, `HOME-THAT-DO` (0 spawn), `CO-LAP` (chạy cuối bộ).
- [ ] Verify: `node scripts/watchdog-tu-khoi-dong-gateway/acceptance.mjs` in bốn PASS.

### Task 2: Ca hành vi AC-1…AC-5, AC-8, AC-9 (independent: false)

Phục vụ E1–E5, E8, E9. Ca và kỳ vọng chép đúng evals.yaml: `KICK-0911`, `BIEN-599`, `BIEN-599-DO`, `TRAN-6H`, `MUOI-LUOT`,
`TRAN-6H-DO`, `PHIEN-CHET-1311` (tệp heartbeat sinh bằng `collector/scripts/zalo-heartbeat.sh` với CLI giả),
`PHIEN-CHET-UNKNOWN`, `PHIEN-CHET-DO`, `LOCKDOWN-L2`, `LOCKDOWN-L3B`, `LOCKDOWN-L1`, `L4D-DO-DANG`, `LOCKDOWN-DO`,
`GATEWAY-CHET`, `GATEWAY-CHET-DO`, `TAT-ENV`, `TAT-TEP`, `SO-P1`.

- [ ] Viết ca; ca độc lập chạy song song.
- [ ] Verify: harness thoát 0.

### Task 3: An toàn tĩnh và sổ AC-6 (independent: false)

Phục vụ E6: `CAU-HINH-BAM`, `SO-STUB` (đối chứng dương ≥1 `status`/lượt), `P1-CHI-DOC`, `P1-CHI-DOC-DO` (sáu bản).

- [ ] Viết ca; verify `NGHIEM THU PASS n/n`; chạy năm lượt liền để bắt chập chờn.
- [ ] Commit `test(acceptance): harness nghiệm thu VHZ2 watchdog-tu-khoi-dong-gateway`.

### Task 4: Kiểm toàn bộ kiểu CI (independent: false)

- [ ] `node --test scripts/*.test.mjs` trên DB riêng `oneinvest_suite_u2vhz2` với `CI=true` + danh sách bỏ qua của CI.
- [ ] Eval máy E10–E15 xanh; contract `status: implemented`; S4 dưới khoá `s4`.
