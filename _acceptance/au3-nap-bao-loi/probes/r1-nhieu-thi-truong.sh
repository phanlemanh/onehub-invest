#!/bin/bash
# Phép thử R1 (phản biện): snapshot zalo-agent ở HAI thị trường; chạy BẢN CHÉP apify-facebook-daily.sh
# trong thư mục tạm, HOME giả, sleep stub thắng PATH, mọi module pipeline là bản giả (không DB, không mạng).
set -u
WT="$1"; SP="${2:-${TMPDIR:-/tmp}}"
S=$(mktemp -d "$SP/probe-XXXX"); R="$S/repo"
mkdir -p "$R/scripts/lib" "$R/pipeline/logs" "$S/bin" "$S/home"
cp "$WT/scripts/apify-facebook-daily.sh" "$R/scripts/"; cp "$WT/scripts/lib/job-step.sh" "$R/scripts/lib/"
printf '#!/bin/bash\necho "sleep $*" >> "%s/calls"\n' "$S" > "$S/bin/sleep"; chmod +x "$S/bin/sleep"
for f in apify-facebook-collector transform-fb refresh-bait-gap; do
  printf 'import{appendFileSync}from"node:fs";appendFileSync("%s/calls","%s\\n");\n' "$S" "$f" > "$R/pipeline/$f.mjs"
done
cat > "$R/pipeline/import-airbnb.mjs" <<EOF
import{appendFileSync}from"node:fs";appendFileSync("$S/calls","import "+process.argv[2].split("/").slice(-2).join("/")+"\n");
if(process.argv[2].includes("/hcmc/")&&process.env.FAIL_HCMC==="1"){console.error("JSON hỏng (lỗi giả)");process.exit(1);}
EOF
mkdir -p "$R/collector/snapshots/hanoi/hanoi__zalo-agent__2026-10-23T130000000" "$R/collector/snapshots/hcmc/hcmc__zalo-agent__2026-10-23T070000000"
# 2510-8: tệp bọc có cổng manifest (thiếu manifest <30′ = snapshot chưa xong) — fixture lành phải có manifest
for d in hanoi/hanoi__zalo-agent__2026-10-23T130000000 hcmc/hcmc__zalo-agent__2026-10-23T070000000; do
  echo "{\"snapshotId\":\"$(basename "$d")\",\"files\":[]}" > "$R/collector/snapshots/$d/manifest.json"
done
echo "2026-10-22T120000000" > "$R/pipeline/logs/apify-daily.state"
P="$S/bin:$(dirname "$(command -v node)"):/usr/bin:/bin"
W=$(env -i HOME="$S/home" PATH="$P" /bin/bash -c 'command -v sleep')
[ "$W" = "$S/bin/sleep" ] || { echo "AN TOÀN: stub sleep không thắng PATH ($W) — bỏ chạy"; rm -rf "$S"; exit 2; }
echo "stub sleep thắng PATH: ok"
: > "$S/calls"
echo "--- lượt 1: hcmc T07 nạp lỗi"
env -i HOME="$S/home" PATH="$P" FAIL_HCMC=1 /bin/bash "$R/scripts/apify-facebook-daily.sh" 2>&1 | sed "s#$S#<tmp>#g"
echo "lượt 1 mã ${PIPESTATUS[0]} · state $(cat "$R/pipeline/logs/apify-daily.state")"; sed 's/^/  gọi: /' "$S/calls"; : > "$S/calls"
echo "--- lượt 2: DB lành"
env -i HOME="$S/home" PATH="$P" /bin/bash "$R/scripts/apify-facebook-daily.sh" 2>&1 | sed "s#$S#<tmp>#g"
echo "lượt 2 mã ${PIPESTATUS[0]} · state $(cat "$R/pipeline/logs/apify-daily.state")"; sed 's/^/  gọi: /' "$S/calls"
grep -q "import hcmc/" "$S/calls" && echo "R1: hcmc T07 được nạp lại" || echo "R1: hcmc T07 KHÔNG BAO GIỜ được nạp lại (state đã vượt nó)"
rm -rf "$S"
