#!/bin/bash
# Phản biện AC-5: snapshot zalo-agent ở HAI thư mục city. Bản chép zalo-import-daily.sh
# trong thư mục tạm, HOME giả, stub launchctl/pkill/pgrep/osascript/curl/sleep đứng đầu
# PATH (kiểm command -v trước khi chạy), import-airbnb/transform/refresh là bản giả.
set -uo pipefail
R="$(cd "$(dirname "$0")/../../.." && pwd)"
T=$(mktemp -d "${TMPDIR:-/tmp}/acc-zc3-mc-XXXXXX"); trap 'rm -rf "$T"' EXIT
mkdir -p "$T/repo/scripts" "$T/repo/pipeline/logs" "$T/bin" "$T/home"
cp "$R/scripts/zalo-import-daily.sh" "$T/repo/scripts/"
for c in launchctl pkill pgrep osascript curl sleep; do printf '#!/bin/bash\necho "%s $*" >> "%s/calls"\n' "$c" "$T" > "$T/bin/$c"; chmod +x "$T/bin/$c"; done
NODE_DIR=$(dirname "$(command -v node)")
export HOME="$T/home" PATH="$T/bin:$NODE_DIR:/usr/bin:/bin"
for c in launchctl pkill pgrep osascript curl sleep; do p=$(command -v $c); [[ "$p" == "$T/bin/"* ]] || { echo "AN TOÀN: $c → $p, bỏ chạy"; exit 2; }; done
echo "an toàn: stub thắng PATH"
# city A (sắp trước) có snapshot MỚI hơn; city B (sắp sau) có snapshot CŨ hơn bị lỗi
mkdir -p "$T/repo/collector/snapshots/a-city/a__zalo-agent__2026-10-22T090000000" \
         "$T/repo/collector/snapshots/b-city/b__zalo-agent__2026-10-22T060000000" \
         "$T/repo/collector/snapshots/b-city/b__zalo-agent__2026-10-22T070000000"
echo "2026-10-22T050000000" > "$T/repo/pipeline/logs/apify-daily.state"
cat > "$T/repo/pipeline/import-airbnb.mjs" <<JS
import { appendFileSync } from "node:fs";
const ts = process.argv[2].split("__").at(-1);
appendFileSync("$T/calls", "import " + ts + "\n");
if (ts === "2026-10-22T060000000") { console.error("❌ JSON hỏng"); process.exit(1); }
JS
for f in transform-zalo.mjs refresh-bait-gap.mjs; do echo "import { appendFileSync } from 'node:fs'; appendFileSync('$T/calls', '$f\n');" > "$T/repo/pipeline/$f"; done
bash "$T/repo/scripts/zalo-import-daily.sh" > "$T/out" 2>&1; rc=$?
echo "lượt 1: kết thúc $( [ $rc = 0 ] && echo 'thành công' || echo 'lỗi (≠0)') · state=$(cat "$T/repo/pipeline/logs/apify-daily.state") · nạp: $(grep '^import' "$T/calls" | sed 's/import //' | tr '\n' ' ')"
: > "$T/calls"
bash "$T/repo/scripts/zalo-import-daily.sh" > "$T/out2" 2>&1
echo "lượt 2 (DB/tệp đã ổn): nạp: $(grep '^import' "$T/calls" | sed 's/import //' | tr '\n' ' ')· → T060000000 (lỗi) và T070000000 (chưa từng thử) $(grep -q 'T0[67]0000000' "$T/calls" && echo 'được nạp lại' || echo 'KHÔNG BAO GIỜ được nạp')"
