#!/usr/bin/env bash
# s06-thu-duoi-lich-va-chon-snapshot E9 (AC-9) + vế __ROOT__ của AC-8.
# 1) Không cài lịch: launchctl list và ~/Library/LaunchAgents không có com.oneinvest.thu-duoi-s06.
#    Đối chứng dương: launchctl list phải thấy ít nhất một job com.oneinvest.* khác (chứng minh lệnh đọc được domain).
# 2) Phạm vi: ngoài vật hồ sơ chỉ có sáu tệp của ZC18 (+ ba tệp ZC17 khi ZC17 chưa vào main). Tự kiểm bằng danh sách giả.
# 3) Cài thử trong HOME giả (launchctl giả): plist ghi ra không còn chữ __ROOT__, trỏ đúng gốc kho.
# 4) Hai tệp test chạy với HOME tạm rỗng, không DATABASE_URL, fetch và socket bị chặn và đếm; tự kiểm bộ đếm bắt 1 lời.
set -u
cd "$(dirname "$0")/../../.." || exit 2
ROOT="$PWD"; n=0
NHAN=com.oneinvest.thu-duoi-s06

# 1) lịch
LC="$(launchctl list 2>/dev/null)"
if printf '%s\n' "$LC" | grep -q 'com\.oneinvest\.' ; then echo "doi chung launchctl: thay $(printf '%s\n' "$LC" | grep -c 'com\.oneinvest\.') job com.oneinvest.*"
else echo "DOI CHUNG HONG: launchctl list không thấy job com.oneinvest.* nào"; n=$((n+1)); fi
if printf '%s\n' "$LC" | grep -q "$NHAN"; then echo "DA CAI LICH: launchctl có $NHAN"; n=$((n+1)); else echo "launchctl: khong co $NHAN"; fi
if [ -e "$HOME/Library/LaunchAgents/$NHAN.plist" ]; then echo "DA CAI LICH: LaunchAgents có $NHAN.plist"; n=$((n+1))
else echo "LaunchAgents: khong co $NHAN.plist"; fi

# 2) phạm vi
CHO_PHEP='^(scripts/thu-duoi-s06\.sh|scripts/thu-duoi-s06\.test\.mjs|scripts/install-cron\.sh|scripts/install-cron-chi\.test\.mjs|pipeline/lib/thu-duoi-moc\.mjs|pipeline/scripts/thu-duoi-chon-nap-e2e\.test\.mjs|pipeline/scripts/thu-duoi-moc-symlink\.test\.mjs|pipeline/cron/com\.oneinvest\.thu-duoi-s06\.plist|pipeline/collect-s06-duoi\.mjs|pipeline/scripts/collect-s06-duoi\.test\.mjs|pipeline/test-nua\.json|_acceptance/.*|docs/.*|PRODUCT-MAP\.md|LO-TRINH\.html)$'
xet() { local k=0; while IFS= read -r f; do [ -z "$f" ] && continue
  if [[ "$f" =~ $CHO_PHEP ]]; then echo "ok $f"; else echo "NGOAI PHAM VI $f"; k=$((k+1)); fi; done; return $k; }
if printf 'scripts/thu-duoi-s06.sh\napp/src/app/page.tsx\n' | xet | grep -q '^NGOAI PHAM VI app/src/app/page.tsx$'; then
  echo "tự kiểm: app/src/app/page.tsx → NGOAI PHAM VI"; else echo "TU KIEM HONG"; exit 1; fi
BASE=$(git merge-base origin/main HEAD) || exit 2
git diff --name-only "$BASE"..HEAD | xet || n=$((n+1))

# 3) cài thử trong HOME giả
H="$(mktemp -d)"; mkdir -p "$H/bin"
printf '#!/bin/bash\necho "$@" >> "%s/launchctl.log"\nexit 0\n' "$H" > "$H/bin/launchctl"; chmod +x "$H/bin/launchctl"
if HOME="$H" PATH="$H/bin:$PATH" bash scripts/install-cron.sh --chi thu-duoi-s06 >/dev/null 2>&1; then
  P="$H/Library/LaunchAgents/$NHAN.plist"
  if grep -q '__ROOT__' "$P"; then echo "PLIST CON __ROOT__"; n=$((n+1))
  elif grep -q "$ROOT/scripts/thu-duoi-s06.sh" "$P"; then echo "plist cai thu: __ROOT__ da thay bang goc kho"
  else echo "PLIST SAI GOC"; n=$((n+1)); fi
else echo "CAI THU LOI"; n=$((n+1)); fi
rm -rf "$H"

# 4) test cách ly
node --input-type=module - "$ROOT" <<'JS' || n=$((n+1))
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
const ROOT = process.argv[2];
const CHAN = join(ROOT, "_acceptance/s06-thu-duoi-do/probes/chan-mang.mjs");
function chay(...tep) {
  const home = mkdtempSync(join(tmpdir(), "zc18-home-"));
  const ghi = join(mkdtempSync(join(tmpdir(), "zc18-mang-")), "dem.txt");
  const env = { ...process.env, HOME: home, CHAN_MANG_GHI: ghi }; delete env.DATABASE_URL;
  const r = spawnSync(process.execPath, ["--import", CHAN, "--test", ...tep], { cwd: ROOT, env, encoding: "utf8", timeout: 300_000 });
  const mang = existsSync(ghi) ? readFileSync(ghi, "utf8").split("\n").filter(Boolean) : [];
  const homeCon = readdirSync(home); rmSync(home, { recursive: true, force: true }); rmSync(dirname(ghi), { recursive: true, force: true });
  return { exit: r.status, mang, homeCon };
}
let loi = 0;
const a = chay("scripts/thu-duoi-s06.test.mjs", "scripts/install-cron-chi.test.mjs");
console.log(`test cach ly: exit ${a.exit} · loi goi mang that ${a.mang.length} · HOME tam ${a.homeCon.length ? "CO TEP" : "rong"}`);
if (a.exit !== 0) { loi++; console.log("TEST DO"); }
if (a.mang.length) { loi++; console.log("GOI MANG THAT"); }
if (a.homeCon.length) { loi++; console.log("GHI VAO HOME"); }
const tam = mkdtempSync(join(tmpdir(), "zc18-tu-kiem-"));
const t = join(tam, "goi-that.test.mjs");
writeFileSync(t, `import test from "node:test";\ntest("gọi thật", async () => { try { await fetch("https://example.com/"); } catch {} });\n`);
const b = chay(t); rmSync(tam, { recursive: true, force: true });
console.log(`tu kiem mang: bộ đếm bắt ${b.mang.length} lời ${b.mang.length === 1 ? "(TRUNG)" : "(HONG)"}`);
if (b.mang.length !== 1) { loi++; console.log("TU KIEM HONG"); }
process.exit(loi ? 1 : 0);
JS
[ "$n" -eq 0 ] && echo "PHAM-VI OK" || { echo "PHAM-VI DO ($n)"; exit 1; }
