#!/bin/bash
# AC-3..AC-6: chạy s08-weekly.sh THẬT trong cây giả (cổng, bộ thu, importer đều là bản giả); không gọi nguồn, không chạm DB.
set -uo pipefail
R="${1:?gốc kho}"; T=$(mktemp -d); trap 'rm -rf "$T"' EXIT; bad=0
mkdir -p "$T/scripts/s08-danh-muc" "$T/pipeline/lib" "$T/collector/dist" "$T/home/.oneinvest"
cp "$R/scripts/s08-danh-muc/s08-weekly.sh" "$T/scripts/s08-danh-muc/"
cat > "$T/pipeline/lib/vong-doi.mjs" <<'J'
console.log("vong-doi gia"); process.exit(Number(process.env.GIA_VD ?? 0));
J
cat > "$T/collector/dist/cli.js" <<'J'
const fs=require("fs"),p=require("path");const root=p.resolve(__dirname,"../..");
fs.appendFileSync(root+"/thu.log",process.argv.slice(2).join(" ")+"\n");
if(process.env.GIA_THU_LOI)process.exit(7);
fs.mkdirSync(root+"/collector/snapshots/vn/vn__s08-danh-muc__moi",{recursive:true});
J
cat > "$T/pipeline/import-airbnb.mjs" <<'J'
import fs from "node:fs"; fs.appendFileSync(new URL("../nap.log", import.meta.url), process.argv[2] + "\n");
J
chay(){ rm -f "$T/thu.log" "$T/nap.log"; HOME="$T/home" bash "$T/scripts/s08-danh-muc/s08-weekly.sh" >"$T/out" 2>&1; echo $?; }
so(){ [ -f "$1" ] && wc -l <"$1" | tr -d ' ' || echo 0; }
kt(){ if [ "$2" = "$3" ]; then echo "$1 OK"; else echo "$1 SAI: $2 khác $3"; bad=1; fi; }
rc=$(chay); kt "THIEU ENV" "$rc/$(so "$T/thu.log")" "1/0"
touch "$T/home/.oneinvest/s08.env"
rc=$(GIA_VD=3 chay); kt "CONG 3" "$rc/$(so "$T/thu.log")" "0/0"
rc=$(GIA_VD=1 chay); kt "CONG LOI" "$rc/$(so "$T/thu.log")" "1/0"
rc=$(GIA_THU_LOI=1 chay); kt "THU LOI" "$rc/$(so "$T/thu.log")/$(so "$T/nap.log")" "1/1/0"
rc=$(chay); kt "CHAY" "$rc/$(so "$T/thu.log")/$(so "$T/nap.log")" "0/1/1"
grep -q -- '--source s08-danh-muc' "$T/thu.log" || { echo "CHAY SAI: thiếu --source"; bad=1; }
python3 - "$R/pipeline/cron/com.oneinvest.s08-danh-muc.plist" <<'P' || bad=1
import plistlib,sys
d=plistlib.load(open(sys.argv[1],"rb")); s=d["StartCalendarInterval"]
ok=isinstance(s,dict) and s=={"Weekday":0,"Hour":6,"Minute":30} and d["ProgramArguments"][-1].endswith("scripts/s08-danh-muc/s08-weekly.sh")
print("PLIST OK" if ok else f"PLIST SAI: {s}"); sys.exit(0 if ok else 1)
P
exit "$bad"
