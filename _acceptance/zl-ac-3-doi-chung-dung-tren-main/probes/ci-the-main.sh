#!/bin/bash
# Chạy đúng bước test của job `scripts` trong .github/workflows/ci-test.yml (dòng 159–160) ở THẾ MAIN: bản clone tạm của
# kho tại HEAD, refs/remotes/origin/main = HEAD (merge-base = HEAD, như main sau gộp). Môi trường như CI: env -i, CI=true,
# HOME tạm (không có ~/.local/node-v24.21.0), PATH chỉ có node/npm + /usr/bin:/bin, DATABASE_URL = DB thử của riêng lượt
# (bash db/db-thu.sh … --chay — không chạm DB oneinvest của máy thu), docker trong PATH như runner. Thoát = mã của `node --test scripts/*.test.mjs`.
set -u
REPO="$(cd "$(dirname "$0")/../../.." && pwd)"
[ -z "$(git -C "$REPO" status --porcelain -- scripts)" ] || { echo "ci-the-main: scripts/ có thay đổi chưa commit"; exit 2; }
HEAD=$(git -C "$REPO" rev-parse HEAD)
T=$(mktemp -d); C="$T/c"; H="$T/home"; B="$T/bin"; mkdir -p "$H" "$B"
trap 'rm -rf "$T"' EXIT
git clone -q --no-checkout "file://$REPO" "$C" && git -C "$C" checkout -q --detach "$HEAD" && git -C "$C" update-ref refs/remotes/origin/main "$HEAD"
git -C "$REPO" config --local --get-all secrets.allowed | while IFS= read -r v; do git -C "$C" config --add secrets.allowed "$v"; done
for m in app pipeline agent; do ln -s "$REPO/$m/node_modules" "$C/$m/node_modules"; done
NB=$(dirname "$(readlink -f "$(command -v node)")"); for x in node npm npx; do ln -s "$NB/$x" "$B/$x"; done
# Runner ubuntu của CI có docker trong PATH (/usr/bin); máy dev để docker ở chỗ khác — chép đúng một symlink.
D=$(command -v docker) && ln -s "$D" "$B/docker"
echo "ci-the-main: HEAD=$HEAD merge-base=$(git -C "$C" merge-base HEAD origin/main) node=$("$B/node" -v)"
cd "$C" || exit 2
cat > "$T/trong.sh" <<'IN'
opts="$(node scripts/lib/ci-can-du-lieu.mjs scripts)"
NODE_OPTIONS="$opts" node --test scripts/*.test.mjs
IN
cat > "$T/ngoai.sh" <<'OUT'
exec env -i HOME="$H" PATH="$B:/usr/bin:/bin" CI=true DATABASE_URL="$DATABASE_URL" bash "$T/trong.sh"
OUT
export H B T
bash "$REPO/db/db-thu.sh" oneinvest_suite_zlci --chay bash "$T/ngoai.sh" 2>&1 | tee "$T/log" | grep -E '^✖|^ℹ (tests|pass|fail|skipped|duration_ms)'
rc=${PIPESTATUS[0]}
echo "ci-the-main: rc=$rc"
exit $rc
