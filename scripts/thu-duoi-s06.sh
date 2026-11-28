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
# 2611-27 (1): tập vùng được thu — MẶC ĐỊNH bằng đúng phạm vi phép đo 24 giờ (2411-6):
# MỘT vùng × một mục — đây là giá trị «MỘT vùng (vùng đã đo)» Mạnh duyệt ở Cổng Phạm vi
# ZC18 sáng 27/11, test khóa. Mở thêm bằng THU_DUOI_S06_VUNG="vùng1 vùng2 …" (dấu cách).
VUNG_MAC_DINH="hcmc"
VUNG_CHAY="${THU_DUOI_S06_VUNG:-$VUNG_MAC_DINH}"
# 2611-27 (2): nghỉ có hạn sau khi nguồn trả 403/429 (bộ thu thoát 3) — các vòng kế trong
# khoảng này KHÔNG gọi nguồn; hết nghỉ xoá mốc và chạy lại.
# MẶC ĐỊNH 60 PHÚT là giá trị Mạnh duyệt ở Cổng Phạm vi ZC18 (sáng 27/11) — test khóa
# (scripts/thu-duoi-s06.test.mjs ca «mặc định ZC18»); đổi mặc định phải qua cổng.
NGHI_SAU_CHAN_PHUT="${THU_DUOI_S06_NGHI_SAU_CHAN_PHUT:-60}"
BI_CHAN="$GOC/bi-chan.json"
# 2611-27 (3, ZC18 — khuyến nghị Cổng Phạm vi, Mạnh duyệt sáng 27/11, khớp chính sách
# «chỗ chặn thì dừng» 14/11): nguồn chặn LẦN HAI trong 24 giờ kể từ lần chặn trước →
# DỪNG HẲN: không gọi nguồn ở các lượt sau cho tới khi NGƯỜI gỡ dấu bằng tay (rm tệp dấu).
# Tắt bằng THU_DUOI_S06_DUNG_LAN_HAI=0 — tắt thì chặn lần hai chỉ nghỉ như lần đầu,
# đúng hành vi fc3fa4a7a. Giờ chặn gần nhất vẫn ghi mọi khi (forensic).
DUNG_LAN_HAI="${THU_DUOI_S06_DUNG_LAN_HAI:-1}"
dung_lan_hai_tat() {
  case "$DUNG_LAN_HAI" in 0|false|FALSE|False|off|OFF|Off|tat|TAT|Tat) return 0 ;; *) return 1 ;; esac
}
LAN_CHAN="$GOC/lan-chan.json"  # giờ chặn gần nhất — mọi lần chặn đều cập nhật
DUNG_HAN="$GOC/dung-han.json" # dấu dừng hẳn — CHỈ người gỡ bằng tay: rm tệp này

# Giờ ISO UTC cột giây từ epoch — GNU (-d @) trước, BSD (-r) sau; lỗi thì thoát 1
# (MỞ LẠI 2611-27: wrapper phải chạy đúng cả Linux CI lẫn macOS máy thu)
iso_tu_epoch() {
  local s="$1" kq=""
  case "$s" in ''|*[!0-9]*) return 1 ;; esac # GNU date -d "" không lỗi mà trả 0h hôm nay — chặn đầu vào trước
  kq="$(date -u -d "@${s}" '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null)" && [ -n "$kq" ] && { printf '%s' "$kq"; return 0; }
  kq="$(date -u -r "${s}" '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null)" && [ -n "$kq" ] && { printf '%s' "$kq"; return 0; }
  return 1
}
# epoch từ ISO (chấp nhận có/không mili-giây và Z) — GNU (-d) trước, BSD (-j -f) sau;
# không parse được thì in rỗng (gọi bên phải tự coi là mốc hỏng)
epoch_tu_iso() {
  local v="$1" kq=""
  [ -n "$v" ] || return 1 # GNU date -d "" trả 0h hôm nay, không lỗi — đầu vào rỗng phải dừng trước
  kq="$(date -u -d "${v}" '+%s' 2>/dev/null)" && [ -n "$kq" ] && { printf '%s' "$kq"; return 0; }
  kq="$(date -ju -f '%Y-%m-%dT%H:%M:%S' "${v%%.*}" '+%s' 2>/dev/null)" && [ -n "$kq" ] && { printf '%s' "$kq"; return 0; }
  return 1
}

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

# 1a) 2611-27 (3): dấu dừng hẳn còn nguyên → không gọi nguồn lượt này, chỉ in dòng gỡ dấu;
#     dấu chỉ NGƯỜI gỡ bằng tay (rm) — hết hạn nghỉ cũng không tự chạy lại.
if [ -f "$DUNG_HAN" ]; then
  echo "$(date -u +%FT%TZ) DỪNG HẲN: nguồn chặn lần hai trong 24 giờ — không gọi nguồn lượt này; gỡ dấu bằng tay để chạy lại: rm $DUNG_HAN"
  exit 0
fi

# 1b) 2611-27 (2): còn trong khoảng nghỉ sau bị chặn → thoát 0 kèm dòng nhật ký,
#     KHÔNG gọi node nào (kể cả thu); mốc hỏng/xong thì xoá và đi tiếp.
#     Thuần bash + date hai chuẩn (GNU Linux CI / BSD macOS) — không gọi node,
#     để môi trường shim test không xuyên lời gọi thật.
if [ -f "$BI_CHAN" ]; then
  HET="$(sed -E 's/.*"hetLuc":"([^"]*)".*/\1/' "$BI_CHAN" 2>/dev/null)"
  HET_S="$(epoch_tu_iso "$HET")"
  case "$HET_S" in ''|*[!0-9]*) HET_S=0 ;; esac # mốc hỏng/mốc rỗng → coi như hết nghỉ, xoá dưới đây
  CON_LAI=$(( (HET_S - $(date -u +%s) + 59) / 60 ))
  if [ "$CON_LAI" -le 0 ]; then rm -f "$BI_CHAN"; fi # hết nghỉ / mốc hỏng — chạy lại
  if [ "$CON_LAI" -gt 0 ]; then
    echo "$(date -u +%FT%TZ) nghỉ sau bị chặn nguồn — còn $CON_LAI phút, không gọi nguồn vòng này"
    exit 0
  fi
fi

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
# 5b) 2611-27 (1): lọc tập vùng — mặc định chỉ vùng đã đo; vùng ngoài tập bị bỏ
#     CÓ DÒNG NHẬT KÝ, 0 lời gọi tới nguồn cho vùng đó.
CHAY=""
for v in $CITIES; do
  case " $VUNG_CHAY " in
    *" $v "*) CHAY="$CHAY $v" ;;
    *) echo "$(date -u +%FT%TZ) bỏ vùng $v: ngoài tập đã cấu hình (THU_DUOI_S06_VUNG)" ;;
  esac
done
CITIES="$CHAY"
[ -z "$CITIES" ] && exit 0

RC=0
for CITY in $CITIES; do
  # 6) thu đuôi vùng này — mã thoát giữ nguyên trạng của bộ thu; mã ≠0 dừng
  #    cả vòng, snapshot đã thu để cho vòng nạp sau (5 phút nữa)
  node "$ROOT/pipeline/collect-s06-duoi.mjs" --vung "$CITY" --muc "$MUC" --goc "$GOC" \
    || { RC=$?
         echo "❌ thu đuôi vùng $CITY thoát $RC — dừng vòng, nạp để vòng sau"
         if [ "$RC" = "3" ]; then
           # 2611-27 (2): bị chặn nguồn → nghỉ NGHI_SAU_CHAN_PHUT phút. (3): chặn LẦN HAI trong
           # 24 giờ kể từ lần trước → DỪNG HẲN (dấu chỉ người gỡ). Giờ hết tính hai chuẩn
           # GNU/BSD (MỞ LẠI 2611-27); KHÔNG tính được thì KHÔNG ghi mốc rỗng/sai.
           BAY="$(date -u +%s)"
           CU_S="$(epoch_tu_iso "$(sed -E 's/.*"lanCuoi":"([^"]*)".*/\1/' "$LAN_CHAN" 2>/dev/null)")"
           case "$CU_S" in ''|*[!0-9]*) CU_S=0 ;; esac
           GIO_CHAN="$(iso_tu_epoch "$BAY")"
           [ -n "$GIO_CHAN" ] && printf '{"lanCuoi":"%s"}' "$GIO_CHAN" > "$LAN_CHAN"
           if ! dung_lan_hai_tat && [ "$CU_S" -gt 0 ] && [ $(( BAY - CU_S )) -lt 86400 ]; then
             printf '{"lanTruoc":"%s","lanHai":"%s"}' "$(iso_tu_epoch "$CU_S")" "$GIO_CHAN" > "$DUNG_HAN"
             echo "$(date -u +%FT%TZ) DỪNG HẲN: nguồn chặn lần hai trong 24 giờ — không gọi nguồn ở các lượt sau; gỡ dấu bằng tay để chạy lại: rm $DUNG_HAN"
             exit "$RC" # lượt này bị chặn thật — giữ mã 3
           fi
           HET_MOI="$(iso_tu_epoch "$(( BAY + NGHI_SAU_CHAN_PHUT * 60 ))")" \
             && printf '{"hetLuc":"%s"}' "$HET_MOI" > "$BI_CHAN" \
             || echo "⚠️ không tính được giờ hết nghỉ trên date của máy này — không ghi mốc nghỉ, vòng kế chạy lại như thường" >&2
         fi
         exit "$RC"; }

  # 7) chọn-nạp: duyệt snapshot mới nhất → cũ, nạp TỐI ĐA 1 snapshot/vùng/vòng
  #    — snapshot đầu tiên (tính từ mới nhất) mà sổ nạp CHƯA có snapshot_id VÀ đọc được.
  #    ZC26 (s06-thu-duoi-snapshot-hong-khong-chan): bản đọc không được (readSnapshot của bộ nạp từ
  #    chối, hoặc source khác) được ghi dấu vào $GOC/bo-qua-hong.json, in MỘT dòng log, rồi xét bản
  #    cũ hơn trong cùng vòng — thư mục snapshot KHÔNG bị xoá, KHÔNG bị sửa (raw bất biến). Dòng cờ
  #    BO-QUA-MOI trên stdout → vòng thoát 1 để người vận hành thấy; vòng kế bản đã đánh dấu bị lọc.
  KQ="$(cd "$ROOT/pipeline" && node --input-type=module -e '
    import pg from "pg";
    import { readdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
    import { pathToFileURL } from "node:url";
    const [city, goc] = process.argv.slice(1); // với -e: argv = [node, <đối số>…] — slice(2) mất đối số đầu
    const muc = `${goc}/snapshots/${city}`;
    let tatCa;
    try { tatCa = readdirSync(muc).filter((n) => n.startsWith(`${city}__chotot-ads__`)).sort().reverse(); }
    catch { process.exit(0); } // chưa có snapshot nào — không nạp gì
    if (tatCa.length === 0) process.exit(0);
    let daCo;
    const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
    try {
      await c.connect();
      // SỔ NẠP BỀN (2611-21): import ghi airbnb_snapshots cho MỌI snapshot đã nạp và KHÔNG bao giờ
      // bị lượt sau đè (upsert stg theo list_id ghi đè snapshot_id về bản mới hơn) — soát theo stg thì
      // snapshot đuôi sau lượt quét đủ trông như chưa nạp và bị nạp lại mỗi vòng.
      const co = await c.query("SELECT snapshot_id FROM airbnb_snapshots WHERE snapshot_id = ANY($1)", [tatCa]);
      await c.end();
      daCo = new Set(co.rows.map((r) => r.snapshot_id));
    } catch (e) { console.error("S06 tra-stg-loi: " + e.message); process.exit(1); }

    // ZC26: tệp đánh dấu { <tên thư mục>: { lyDo, luc } } — tên mang tiền tố vùng nên hai vùng không
    // trùng khoá; vắng hay hỏng → coi như chưa đánh dấu bản nào (kiểm lại, ghi lại tệp hợp lệ).
    const tepDau = `${goc}/bo-qua-hong.json`;
    let dau = {};
    try { const x = JSON.parse(readFileSync(tepDau, "utf8")); if (x && typeof x === "object" && !Array.isArray(x)) dau = x; } catch {}
    const gio = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");
    const ungVien = tatCa.filter((id) => !daCo.has(id) && !Object.hasOwn(dau, id));
    if (ungVien.length === 0) process.exit(0);

    // Bước kiểm dùng CHÍNH readSnapshot của bộ nạp (cùng luật schema, finishedAt, sha256, parse items —
    // không chép luật sang đây). Mô-đun bộ nạp không nạp được (hỏng, thoát lúc nạp) là lỗi của BỘ KIỂM,
    // không phải của bản thu → không đánh dấu bản nào; bản ấy đi tiếp tới bộ nạp, nạp lỗi thì vòng sau thử lại.
    const thoatGoc = process.exit;
    process.exit = (m) => { throw new Error(`thoát ${m}`); }; // readSnapshot thoát tiến trình ở nhánh source khác
    let readSnapshot = null;
    try { ({ readSnapshot } = await import(pathToFileURL(`${process.cwd()}/import-chotot.mjs`).href)); }
    catch (e) { console.error(`${gio()} không nạp được bộ kiểm snapshot (${e.message}) — vòng này không đánh dấu bản nào`); }
    let hongVi = async (dir) => {
      let m;
      try { m = JSON.parse(readFileSync(`${dir}/manifest.json`, "utf8")); }
      catch (e) { return "manifest không đọc được: " + e.message; }
      // kiểm source TRƯỚC: readSnapshot gọi process.exit(0) ở nhánh này (bộ nạp thoát 0 trong im lặng)
      if (!m || m.source !== "chotot-ads") return `source khác chotot-ads (${JSON.stringify(m?.source)})`;
      if (typeof readSnapshot !== "function") return null;
      try { await readSnapshot(dir); return null; } catch (e) { return String(e?.message || e) || "readSnapshot từ chối"; }
    };
    /* ZC26-KIEM */

    let chon = null, boQuaMoi = false;
    try {
      for (const id of ungVien) {
        const lyDo = await hongVi(`${muc}/${id}`);
        if (lyDo == null) { chon = id; break; }
        dau[id] = { lyDo: String(lyDo), luc: gio() };
        writeFileSync(tepDau + ".tmp", JSON.stringify(dau, null, 2) + "\n");
        renameSync(tepDau + ".tmp", tepDau);
        console.error(`${gio()} bỏ qua snapshot hỏng ${id}: ${lyDo} — không xoá, không sửa`);
        boQuaMoi = true;
      }
    } catch (e) { console.error("S06 chon-nap-loi: " + e.message); thoatGoc(1); }
    process.exit = thoatGoc;
    if (boQuaMoi) console.log("BO-QUA-MOI");
    if (chon) console.log(`${muc}/${chon}`);
  ' "$CITY" "$GOC")" || { echo "❌ tra stg vùng $CITY lỗi — dừng (fail-closed)"; exit 1; }

  # tách kết quả: dòng cờ → thoát 1 cuối vòng; dòng đường dẫn (nếu có) → nạp; không có → không gọi bộ nạp
  SNAP=""
  while IFS= read -r DONG; do
    case "$DONG" in
      BO-QUA-MOI) RC=1 ;;
      "") ;;
      *) SNAP="$DONG" ;;
    esac
  done <<EOF_KQ
$KQ
EOF_KQ

  if [ -n "$SNAP" ]; then
    echo "$(date -u +%FT%TZ) nạp snapshot đuôi $SNAP"
    node "$ROOT/pipeline/import-chotot.mjs" "$SNAP" \
      || { RC=1; echo "❌ nạp $SNAP lỗi — vùng khác vẫn thử, thoát 1 cuối vòng"; }
  fi
done
exit "$RC"
