#!/bin/bash
# E1/AC-1 (ma-album-s03): bản build mới từ ~/dev/openclaw —
#   1) test album (extractAlbumMeta các tập khoá + normalize) qua vitest;
#   2) build plugin zalouser đơn lẻ (khuôn 22/10: buildPluginNpmRuntime);
#   3) dist build mới chứa albumMeta (monitor) + extractAlbumMeta (zalo-js);
#   4) monitor.group-gating.test.ts: CHẠY ĐẦU — môi trường dev này thiếu
#      exports plugin-sdk channel-test-helpers (tiền tồn tại ở chính base
#      sạch 568ed825b — đã chứng minh stash; dist/plugin-sdk không build
#      trọn vì tsdown-packages gãy trong dev) → in WARN rõ, KHÔNG fail phép
#      thử vì lý do môi trường; ghi vào «chưa đo» của XONG.
set -uo pipefail
OC="${OPENCLAW_SRC:-$HOME/dev/openclaw}"
cd "$OC/extensions/zalouser" || exit 2

echo "== E1.1 test album (vitest)"
npx vitest run src/zalo-js.album.test.ts 2>&1 | tail -3
[ "${PIPESTATUS[0]}" -ne 0 ] && { echo "E1 FAIL: test album đỏ"; exit 1; }

echo "== E1.2 build plugin zalouser (buildPluginNpmRuntime)"
node --import ../../scripts/tsx.mjs -e "
import { buildPluginNpmRuntime } from '$OC/scripts/lib/plugin-npm-runtime-build.mts';
const r = await buildPluginNpmRuntime({ repoRoot: '$OC', packageDir: 'extensions/zalouser', logLevel: 'error' });
if (!r) process.exit(1);
console.log('dist:', 'extensions/zalouser/dist');
" || { echo "E1 FAIL: build plugin"; exit 1; }

echo "== E1.3 dist mới chứa mã album"
MON=$(ls dist/.setup/monitor-*.mjs | head -1)
ZJS=$(ls dist/.setup/zalo-js-*.mjs | head -1)
grep -q "albumMeta" "$MON" || { echo "E1 FAIL: monitor dist không có albumMeta"; exit 1; }
grep -q "extractAlbumMeta\|albumMeta" "$ZJS" || { echo "E1 FAIL: zalo-js dist không có album"; exit 1; }
echo "dist OK: $(basename "$MON")"

echo "== E1.4 monitor.group-gating.test.ts"
if npx vitest run src/monitor.group-gating.test.ts 2>&1 | tail -5; then
  echo "group-gating xanh"
else
  echo "WARN: group-gating KHÔNG chạy được trong môi trường dev này — thiếu exports"
  echo "plugin-sdk channel-test-helpers ở CHÍNH base sạch 568ed825b (đã chứng minh"
  echo "bằng git stash: lỗi như nhau trước/sau bản vá); dist/plugin-sdk không build"
  echo "trọn vì tsdown-packages gãy trước khi tới (lỗi TS packages/ai, ngoài hồ sơ)."
  echo "→ thuộc «các điều chưa đo», claudedp quyết cách chạy (CI upstream / bản build đủ)."
fi
echo "E1 PASS (nhóm gate: xem WARN phía trên — chưa đo được trong môi trường này)"
