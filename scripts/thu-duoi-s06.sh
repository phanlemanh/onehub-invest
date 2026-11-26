#!/bin/bash
# thu-duoi-s06.sh — wrapper launchd cho «thu đuôi» S06 (claudedp-2511-29, theo
# đề xuất TRẢ claudedp-2511-24): mỗi nhịp 3–5 phút chạy bộ thu đuôi từng vùng,
# rồi chọn-nạp TỐI ĐA 1 snapshot/vùng — snapshot mới nhất mà stg chưa có
# snapshot_id. Transform KHÔNG chạy ở đây: stg tích luỹ, chuỗi ngày biến đổi
# hết (transform-chotot đọc đủ stg mỗi lượt).
#
# Ranh giới (GIAO 2511-29):
#   - snapshot đuôi ghi vào GỐC RIÊNG state/thu-duoi-s06/ — KHÔNG BAO GIỜ ghi
#     vào collector/snapshots (nạp-lấy-tên-mới-nhất của chotot-daily.sh phải
#     không bao giờ thấy snapshot đuôi; hàng rào --goc của ZT trong
#     collect-s06-duoi.mjs là lớp hai độc lập).
#   - KHÔNG tự cài launchd: plist template ở pipeline/cron/, cài bằng
#     scripts/install-cron.sh --chi thu-duoi-s06 — chỉ làm SAU khi Mạnh ký.
#
# Mã thoát: 0 xong hoặc bỏ qua im lặng (khoá bận / nạp ngày đang chạy / cổng
# vòng đời từ chối / không vùng) · 1 lỗi hệ thống/DB/nạp · 3 bị chặn nguồn ·
# 4 cổng vòng đời đóng · 5 vượt trần lỗi (3/4/5 nhiễm nguyên trạng từ bộ thu).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.local/node-v24.21.0/bin:$PATH"
export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"

GOC="${THU_DUOI_S06_GOC:-$ROOT/state/thu-duoi-s06}"
KHOA="$GOC.lock"
MUC="${THU_DUOI_S06_MUC:-1000/u}"
MOC_TOIDA="${THU_DUOI_S06_MOC_TOIDA:-200000}" # trần số id giữ lại trong moc.json

# Rào trước mọi thao tác: goc cấm nằm trong collector/ của checkout nào
# (chặn 2511-26 — lượt nạp ngày lấy tên mới nhất sẽ nhận nhầm).
case "$GOC" in */collector|*/collector/*)
  echo "❌ THU_DUOI_S06_GOC cấm trỏ vào collector/ — snapshot đuôi phải ở kho riêng"; exit 1 ;;
esac

mkdir -p "$GOC"

# 1) khoá một lượt — mkdir nguyên tử + pid: lượt trước chưa xong → thoát 0 im
#    lặng. Chọn mkdir thay flock (macOS không có flock hệ thống); khoá sót sau
#    kill -9 được nhận lại qua pid đã chết.
if ! mkdir "$KHOA" 2>/dev/null; then
  PID_CU="$(cat "$KHOA/pid" 2>/dev/null)"
  if [ -n "$PID_CU" ] && kill -0 "$PID_CU" 2>/dev/null; then
    exit 0 # lượt trước còn sống — im lặng nhường
  fi
  rm -rf "$KHOA"
  mkdir "$KHOA" 2>/dev/null || exit 0
fi
echo "$$" > "$KHOA/pid"
trap 'rm -rf "$KHOA"' EXIT
trap 'exit 1' TERM INT

# 2) nhường lượt quét đủ (05:30 + 14:00) — script nạp ngày đang chạy → thoát 0
if pgrep -f "scripts/chotot-daily.sh" >/dev/null 2>&1; then
  echo "$(date -u +%FT%TZ) nhường lượt — script nạp ngày đang chạy"
  exit 0
fi

# 3) cổng vòng đời nguồn S06 — như chotot-daily.sh: từ chối (3) → 0 lời gọi,
#    thoát 0 kèm một dòng mã + lý do; lỗi khác → dừng fail-closed.
VD_RC=0
VD_KQ="$(node "$ROOT/pipeline/lib/vong-doi.mjs" S06)" || VD_RC=$?
if [ "$VD_RC" -eq 3 ]; then echo "$VD_KQ — bỏ qua lượt thu đuôi S06"; exit 0; fi
if [ "$VD_RC" -ne 0 ]; then echo "❌ vong-doi S06 lỗi — dừng (fail-closed)"; exit 1; fi

# 4) cắt mốc theo trần số id (an toàn: phần cắt là id cũ nhất — đã nằm trong
#    stg; tin lọt kềnh chỉ bị thu lại, tốn lời gọi chứ không mất dữ liệu).
node "$ROOT/pipeline/lib/thu-duoi-moc.mjs" "$GOC" "$MOC_TOIDA" \
  || echo "⚠️ cắt mốc lỗi — bỏ qua, vòng thu vẫn chạy"

# 5) vùng chạy được từ DB — đúng truy vấn của chotot-daily.sh (fail-closed)
CITIES="$(cd "$ROOT/pipeline" && node --input-type=module -e '
  const pg = (await import("pg")).default;
  const { isRunnable } = await import("./lib/vong-doi.mjs");
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await c.connect();
    const src = (await c.query("SELECT code, status FROM source_registry WHERE code = $1", ["S06"])).rows[0] ?? null;
    const { rows } = await c.query("SELECT group_key, status FROM source_groups WHERE source_code = $1 ORDER BY id", ["S06"]);
    await c.end();
    console.log(rows.filter((r) => isRunnable(src, { status: r.status }).run).map((r) => r.group_key).join(" "));
  } catch (e) { console.error("S06 vung-doc-loi: " + e.message); process.exit(1); }
')" || { echo "❌ đọc vùng S06 từ DB fail — dừng (fail-closed)"; exit 1; }
[ -z "$CITIES" ] && exit 0

RC=0
for CITY in $CITIES; do
  # 6) thu đuôi vùng này — mã thoát giữ nguyên trạng của bộ thu; mã ≠0 dừng
  #    cả vòng, snapshot đã thu để cho vòng nạp sau (5 phút nữa)
  node "$ROOT/pipeline/collect-s06-duoi.mjs" --vung "$CITY" --muc "$MUC" --goc "$GOC" \
    || { RC=$?; echo "❌ thu đuôi vùng $CITY thoát $RC — dừng vòng, nạp để vòng sau"; exit "$RC"; }

  # 7) chọn-nạp: duyệt snapshot mới nhất → cũ, nạp TỐI ĐA 1 snapshot/vùng/vòng
  #    — snapshot đầu tiên (tính từ mới nhất) mà stg CHƯA có snapshot_id
  SNAP="$(cd "$ROOT/pipeline" && node --input-type=module -e '
    import pg from "pg";
    import { readdirSync } from "node:fs";
    const [city, goc] = process.argv.slice(1); // với -e: argv = [node, <đối số>…] — slice(2) mất đối số đầu
    const muc = `${goc}/snapshots/${city}`;
    let tatCa;
    try { tatCa = readdirSync(muc).filter((n) => n.startsWith(`${city}__chotot-ads__`)).sort().reverse(); }
    catch { process.exit(0); } // chưa có snapshot nào — không nạp gì
    if (tatCa.length === 0) process.exit(0);
    const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
    try {
      await c.connect();
      // SỔ NẠP BỀN (2611-21): import ghi airbnb_snapshots cho MỌI snapshot đã nạp và KHÔNG bao giờ
      // bị lượt sau đè (upsert stg theo list_id ghi đè snapshot_id về bản mới hơn) — soát theo stg thì
      // snapshot đuôi sau lượt quét đủ trông như chưa nạp và bị nạp lại mỗi vòng.
      const co = await c.query("SELECT snapshot_id FROM airbnb_snapshots WHERE snapshot_id = ANY($1)", [tatCa]);
      await c.end();
      const daCo = new Set(co.rows.map((r) => r.snapshot_id));
      const chua = tatCa.find((id) => !daCo.has(id));
      if (chua) console.log(`${muc}/${chua}`);
    } catch (e) { console.error("S06 tra-stg-loi: " + e.message); process.exit(1); }
  ' "$CITY" "$GOC")" || { echo "❌ tra stg vùng $CITY lỗi — dừng (fail-closed)"; exit 1; }

  if [ -n "$SNAP" ]; then
    echo "$(date -u +%FT%TZ) nạp snapshot đuôi $SNAP"
    node "$ROOT/pipeline/import-chotot.mjs" "$SNAP" \
      || { RC=1; echo "❌ nạp $SNAP lỗi — vùng khác vẫn thử, thoát 1 cuối vòng"; }
  fi
done
exit "$RC"
