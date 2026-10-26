# _chung.sh — biến dùng chung cho probe của hồ sơ kho-tri-thuc-invest. ROOT = gốc kho tiêu thụ (đối số 1).
ROOT="$(cd "${1:-.}" && pwd)"
KIT_VER="2.34.0"
AG="${AG:-$HOME/.claude/plugins/cache/acceptance-gate-kit/acceptance-gate/$KIT_VER}"
# Gốc kho riêng giải bằng đúng luật của kit (cha của git-common-dir + kho.duong), không đoán.
GOC="$(cd "$ROOT" && node -e 'const k=require("./scripts/tri-thuc-khoa.cjs");const c=k.docTriThuc(require("fs").readFileSync("_acceptance/config.yaml","utf8"));console.log(k.giaiGoc(process.cwd(),c).goc)')"
LT="docs/plan/lo-trinh.json"
fail=0
ok()  { echo "ok   $*"; }
bad() { echo "FAIL $*"; fail=1; }
