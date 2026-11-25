#!/usr/bin/env bash
# khong-ten-that.sh — ZC15 E10 (AC-8): tên thật của host đích chuyển hướng (tầng A) không nằm trong cây nhánh hay trong
# các commit của nhánh so với main. Đọc tên từ tệp LOCAL trên máy thu, so bằng grep -F, KHÔNG in tên (chỉ đếm, đường tệp).
#   bash khong-ten-that.sh <gốc kho>            soát cây + lịch sử nhánh
#   bash khong-ten-that.sh --tu-thu <gốc kho>   chép tên thứ nhất vào bản sao cây → phải FAIL đúng thông điệp
# Nguồn tên (theo thứ tự): collector/state/media-host-suffixes.txt của checkout chính, tệp nghiên cứu local của LL.
# Không có nguồn nào → thoát 2 «không đo được ở đây» (không xanh giả).
set -uo pipefail
TU_THU=0; [ "${1:-}" = "--tu-thu" ] && { TU_THU=1; shift; }
GOC="${1:?gốc kho}"
CHINH="$(cd "$(git -C "$GOC" rev-parse --path-format=absolute --git-common-dir)/.." && pwd)"
NGUON=("$CHINH/collector/state/media-host-suffixes.txt" "$HOME/dev/onehub-invest-zcode/research-local/do-2411-46-host-redirect.txt")
DS=$(mktemp); T=$(mktemp -d); trap 'rm -rf "$DS" "$T"' EXIT; export DS
# Tên cần soát: mọi hostname và họ hai nhãn trong nguồn, TRỪ họ zdn.vn / r2.dev (đã công khai trong mã).
node -e '
const fs=require("fs");const out=new Set();
for(const f of process.argv.slice(1)){ if(!fs.existsSync(f)) continue; const t=fs.readFileSync(f,"utf8");
  const hs=[...(t.match(/https?:\/\/[^\s\/"<>)]+/g)||[]).map(u=>{try{return new URL(u).hostname.toLowerCase()}catch{return null}}),
    ...t.split("\n").map(l=>l.replace(/#.*$/,"").trim().toLowerCase()).filter(l=>/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(l))].filter(Boolean);
  for(const h of hs){ const ho=h.split(".").slice(-2).join("."); if(ho==="zdn.vn"||ho==="r2.dev") continue; out.add(h); out.add(ho); } }
fs.writeFileSync(process.env.DS,[...out].join("\n")+(out.size?"\n":""));
' "${NGUON[@]}" 2>/dev/null || true
N=$(grep -c . "$DS" 2>/dev/null || true); N=${N:-0}
if [ "${N:-0}" = 0 ]; then echo "KHONG-TEN-THAT không đo được ở đây — không có tệp nguồn tên host trên máy này"; exit 2; fi

soat_cay() {  # $1 = thư mục cây · in đường tệp chứa tên (không in tên)
  grep -rIlF -i -f "$DS" "$1" --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=state --exclude-dir=snapshots 2>/dev/null
}

if [ "$TU_THU" = 1 ]; then
  git -C "$GOC" archive HEAD | tar -x -C "$T"
  head -1 "$DS" > "$T/collector/src/core/ro-ri.txt"
  HIT=$(soat_cay "$T")
  if echo "$HIT" | grep -q 'collector/src/core/ro-ri.txt'; then
    echo "TU-THU PASS — chép tên vào bản sao → FAIL 'tên host đích có trong cây': ${HIT#$T/}"; exit 0
  fi
  echo "TU-THU FAIL — bản sao có tên mà chốt không thấy"; exit 1
fi

# DS chỉ có máy; ghi tạm ra ngoài cây. Cây nhánh = các tệp git theo dõi (không đọc tệp gitignored như state/).
CAY=$(git -C "$GOC" ls-files -z | (cd "$GOC" && xargs -0 grep -IlF -i -f "$DS" 2>/dev/null) || true)
BASE=$(git -C "$GOC" merge-base HEAD origin/main)
LS=$(git -C "$GOC" log -p "$BASE..HEAD" | grep -cF -i -f "$DS" || true)
if [ -z "$CAY" ] && [ "${LS:-0}" = 0 ]; then
  echo "KHONG-TEN-THAT PASS — $N tên soát, 0 chỗ trong cây, 0 dòng trong $(git -C "$GOC" rev-list --count "$BASE..HEAD") commit của nhánh"; exit 0
fi
[ -n "$CAY" ] && echo "FAIL tên host đích có trong cây: $(echo "$CAY" | tr '\n' ' ')"
[ "${LS:-0}" != 0 ] && echo "FAIL tên host đích có trong $LS dòng lịch sử nhánh ($BASE..HEAD)"
exit 1
