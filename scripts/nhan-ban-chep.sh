#!/bin/bash
# nhan-ban-chep.sh — bước nhận bản chép đã lọc trên máy phát triển (HT25 `day-ban-chep-sang-may-phat-trien`, ADR-0019).
# Chạy dưới dòng authorized_keys `restrict,command="<đường tuyệt đối>/nhan-ban-chep.sh" <khoá đẩy>` của máy phát triển: sshd ép
# MỌI lệnh khách gửi về tệp này, lệnh khách nằm ở SSH_ORIGINAL_COMMAND. Không có biến ấy (gọi tay, xin shell) thì từ chối.
# Lệnh con — danh sách đóng, khớp trọn `^(nhan [a-f0-9]{64}|lui|trang-thai)$` (ký tự ngoài [a-z0-9-] và một dấu cách thì từ chối):
#   nhan <sha256>   stdin = dòng "ke <n>" + đúng n byte ke.json + tệp dump (có trần cỡ). Chặng: nhan → sha → kiem
#                   (ban-chep-da-loc.mjs --kiem --khong-tu-dien của kho trên máy này) → nap (pg_restore vào <DB>_moi bằng docker exec)
#                   → dem (= ke.json) → xoa-ban-cu (<DB>_cu tạm thành <DB>_bo) → doi-ten (<DB> → <DB>_cu) → giua (<DB>_moi → <DB>)
#                   → don (xoá <DB>_bo, xoá tệp). Hỏng ở doi-ten/giua thì <DB>_bo về lại <DB>_cu: luôn đúng một bản cũ, `lui` vẫn chạy.
#   lui             đổi bản cũ thành DB chạy (DB chạy thành bản cũ) — gọi lại lần nữa là đổi về.
#   trang-thai      in DB chạy, bản cũ, bản chép đang chạy (theo ke.json), thư mục đến. Chỉ đọc.
# Lỗi ở chặng nào cũng: DB chạy đúng tên còn nguyên dữ liệu trước lượt, <DB>_moi bị xoá, tệp nhận bị xoá, thông điệp «ĐỎ chặng <tên>».
#
# Biến của lượt (test; dưới command= sshd không nhận biến của khách nên trên máy phát triển luôn là mặc định):
#   NHAN_CONTAINER (one-invest-db) · NHAN_DB (oneinvest) · NHAN_DEN (~/.local/share/onehub/den) · NHAN_KHO (~/dev/onehub-invest)
#   NHAN_NODE (node trên PATH, rồi ~/.local/bin/node) · NHAN_TRAN_BYTE (8 GiB)
#   NHAN_CAY=<chặng>   cấy lỗi một chặng (nap, dem, xoa-ban-cu, giu-ket-noi, giua) — CHỈ nhận khi DB là oneinvest_suite_*
#   NHAN_DUNG_SAU=nhan dừng ngay sau khi so sha256, không chạm DB nào (test thuần, chạy được ở CI)
# Vai máy (AC-12) đọc từ <thư mục nhà theo passwd, không theo $HOME>/.config/onehub/hai-may.env, dòng VAI=: may-phat-trien được mọi
# DB; may-thu CHỈ được DB `oneinvest_suite_*` của lượt test (máy thu: DB oneinvest chỉ đọc); thiếu tệp hay vai lạ thì từ chối.
# Kiểm vai đứng TRƯỚC mọi lệnh chạm DB (kể cả đọc).
# Mã thoát: 0 xanh · 1 đỏ ở một chặng (DB chạy giữ nguyên) · 2 lệnh con/đối số sai · 3 từ chối theo vai máy · 4 đang có lượt khác.
# Không in nội dung dữ liệu: chỉ tên chặng, tên bảng, số đếm.
set -u -o pipefail
umask 077

ra() { printf '%s\n' "$*"; }
bao() { printf '%s\n' "$*" >&2; }
tu_choi() { local ma="$1"; shift; bao "nhan-ban-chep: $*"; exit "$ma"; }

if [ -z "${SSH_ORIGINAL_COMMAND+x}" ]; then
  tu_choi 2 "từ chối: chỉ chạy qua command= của khoá đẩy (thiếu SSH_ORIGINAL_COMMAND) — không có shell"
fi
LENH="$SSH_ORIGINAL_COMMAND"
re_lenh='^(nhan [a-f0-9]{64}|lui|trang-thai)$'
if ! [[ $LENH =~ $re_lenh ]]; then
  tu_choi 2 "từ chối lệnh con: chỉ nhận «nhan <sha256>», «lui», «trang-thai» (ký tự ngoài [a-z0-9-])"
fi
LENH_CON="${LENH%% *}"
SHA_KY_VONG=""
[ "$LENH_CON" = "nhan" ] && SHA_KY_VONG="${LENH#nhan }"

# Thư mục nhà theo passwd: đổi $HOME không đổi được tệp vai máy.
NHA="$(perl -e 'print((getpwuid($<))[7])' 2>/dev/null)"
[ -n "$NHA" ] && [ -d "$NHA" ] || tu_choi 3 "từ chối: không đọc được thư mục nhà theo passwd"
export PATH="/opt/homebrew/bin:/usr/local/bin:$NHA/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

CONTAINER="${NHAN_CONTAINER:-one-invest-db}"
DB="${NHAN_DB:-oneinvest}"
DEN="${NHAN_DEN:-$NHA/.local/share/onehub/den}"
KHO="${NHAN_KHO:-$NHA/dev/onehub-invest}"
NODE="${NHAN_NODE:-$(command -v node || echo "$NHA/.local/bin/node")}"
TRAN="${NHAN_TRAN_BYTE:-8589934592}"
CAY="${NHAN_CAY:-}"
DUNG_SAU="${NHAN_DUNG_SAU:-}"

re_container='^[a-z0-9][a-z0-9_-]{0,62}$'
re_db='^[a-z][a-z0-9_]{0,50}$'
re_so='^[0-9]{1,14}$'
[[ $CONTAINER =~ $re_container ]] || tu_choi 2 "tên container lạ"
[[ $DB =~ $re_db ]] || tu_choi 2 "tên DB chạy lạ"
[[ $TRAN =~ $re_so ]] || tu_choi 2 "NHAN_TRAN_BYTE phải là số"
MOI="${DB}_moi"
CU="${DB}_cu"
LUI="${DB}_lui"
BO="${DB}_bo"

re_suite='^oneinvest_suite_[a-z0-9_]+$'
# AC-12: vai máy. Gọi trước mọi lệnh chạm DB.
chan_vai() {
  local cfg="$NHA/.config/onehub/hai-may.env" vai
  [ -f "$cfg" ] || tu_choi 3 "từ chối: thiếu cấu hình riêng máy ~/.config/onehub/hai-may.env (không biết vai máy)"
  vai="$(sed -n 's/^VAI=\([a-z-]*\)[[:space:]]*$/\1/p' "$cfg" | tail -1)"
  case "$vai" in
    may-phat-trien) ;;
    may-thu)
      [[ $DB =~ $re_suite ]] || tu_choi 3 "từ chối: máy thu — bước nhận chỉ chạm DB oneinvest_suite_* của lượt test, không chạm «$DB» (DB máy thu chỉ đọc)"
      ;;
    *) tu_choi 3 "từ chối: vai máy lạ trong hai-may.env (cần may-phat-trien hay may-thu)" ;;
  esac
}
# Cấy lỗi chỉ cho DB của lượt test.
cay() { [ -n "$CAY" ] && [ "$CAY" = "$1" ] && [[ $DB =~ $re_suite ]]; }

DX() { docker exec -i -e PGPASSWORD=oneinvest "$CONTAINER" "$@"; }
PSQL() { DX psql -U oneinvest -h localhost -q -At -v ON_ERROR_STOP=1 "$@"; }
co_db() { [ "$(PSQL -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '$1'")" = "1" ]; }
xoa_db() { PSQL -d postgres -c "DROP DATABASE IF EXISTS \"$1\" WITH (FORCE)" >/dev/null; }
# Đổi tên DB. $3 = 1 thì ngắt phiên của DB cũ ngay trước (cùng lời gọi). Thử ba lần (app có thể nối lại giữa hai câu).
doi_ten_db() {
  local tu="$1" sang="$2" ngat="${3:-1}" lan
  for lan in 1 2 3; do
    if [ "$ngat" = "1" ]; then
      PSQL -d postgres -c "SELECT count(pg_terminate_backend(pid)) FROM pg_stat_activity WHERE datname = '$tu' AND pid <> pg_backend_pid()" >/dev/null 2>&1
    fi
    PSQL -d postgres -c "ALTER DATABASE \"$tu\" RENAME TO \"$sang\"" >/dev/null 2>"$DEN/.loi-doi-ten" && return 0
    sleep 1
  done
  return 1
}

KHOA_LUOT="$DEN/.dang-chay"
giu_khoa() {
  mkdir -p "$DEN" || tu_choi 1 "không dựng được thư mục đến"
  if ! mkdir "$KHOA_LUOT" 2>/dev/null; then
    local chu; chu="$(cat "$KHOA_LUOT/pid" 2>/dev/null || true)"
    if [ -n "$chu" ] && kill -0 "$chu" 2>/dev/null; then tu_choi 4 "đang có lượt khác (pid $chu)"; fi
    rm -rf "$KHOA_LUOT"; mkdir "$KHOA_LUOT" || tu_choi 4 "không giữ được khoá lượt"
  fi
  echo $$ > "$KHOA_LUOT/pid"
}
don_tep() { rm -f "$DEN/ke.json.part" "$DEN/dump.part" "$DEN/ke.json" "$DEN/.loi-doi-ten" "$DEN"/oneinvest-m5-*.dump 2>/dev/null; }
tha_khoa() { rm -rf "$KHOA_LUOT" 2>/dev/null; }

T_LUOT=$SECONDS
T_CHANG=$SECONDS
CHANG=""
bat_dau() { CHANG="$1"; T_CHANG=$SECONDS; }
xong() { ra "chặng $CHANG: $((SECONDS - T_CHANG))s"; }
# Đỏ ở một chặng: xoá DB mới (không bao giờ DB chạy), xoá tệp nhận, nêu chặng.
DA_TAO_MOI=0
DA_CAT_CU=0
do_chang() {
  if [ "$DA_TAO_MOI" = "1" ]; then xoa_db "$MOI" 2>/dev/null || bao "nhan-ban-chep: chưa xoá được $MOI"; fi
  # Bản cũ đã tạm cất thành <DB>_bo mà chưa đổi xong → trả về <DB>_cu.
  if [ "$DA_CAT_CU" = "1" ] && ! co_db "$CU" && co_db "$BO"; then
    doi_ten_db "$BO" "$CU" 1 || bao "nhan-ban-chep: bản cũ đang mang tên «$BO» — đổi tay về «$CU»"
  fi
  don_tep
  bao "ĐỎ chặng $CHANG: $* — DB chạy «$DB» giữ nguyên dữ liệu trước lượt"
  tha_khoa
  exit 1
}

# ───────── trang-thai ─────────
if [ "$LENH_CON" = "trang-thai" ]; then
  chan_vai
  for d in "$DB" "$CU" "$MOI" "$BO"; do
    co="$(PSQL -d postgres -c "SELECT pg_size_pretty(pg_database_size(oid)) FROM pg_database WHERE datname = '$d'" 2>/dev/null)" \
      || tu_choi 1 "không đọc được container $CONTAINER"
    ra "$d: ${co:-không có}"
  done
  if [ -f "$DEN/ke-chay.json" ]; then
    ra "bản chép đang chạy: $("$NODE" -e 'const k=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(`${k.ten_dich} sha256 ${String(k.sha256).slice(0,12)}… ${Object.keys(k.so_dong||{}).length} bảng`)' "$DEN/ke-chay.json" 2>/dev/null || echo "ke-chay.json hỏng")"
  else
    ra "bản chép đang chạy: chưa có lượt nhận nào"
  fi
  [ -d "$KHOA_LUOT" ] && ra "đang có lượt nhận (pid $(cat "$KHOA_LUOT/pid" 2>/dev/null))"
  exit 0
fi

# ───────── lui ─────────
if [ "$LENH_CON" = "lui" ]; then
  chan_vai
  giu_khoa
  bat_dau lui
  co_db "$CU" || { bao "ĐỎ chặng lui: không có bản cũ «$CU»"; tha_khoa; exit 1; }
  if co_db "$DB"; then
    doi_ten_db "$DB" "$LUI" || { bao "ĐỎ chặng lui: đổi tên «$DB» bị từ chối (còn kết nối?) — không đổi gì"; tha_khoa; exit 1; }
    if ! doi_ten_db "$CU" "$DB"; then
      doi_ten_db "$LUI" "$DB" || bao "NGUY: «$DB» đang mang tên «$LUI» — đổi lại tay"
      bao "ĐỎ chặng lui: đổi bản cũ thành DB chạy bị từ chối — DB chạy giữ nguyên"; tha_khoa; exit 1
    fi
    doi_ten_db "$LUI" "$CU" || bao "nhan-ban-chep: bản vừa thay mang tên «$LUI» (chưa đổi thành «$CU»)"
  else
    doi_ten_db "$CU" "$DB" || { bao "ĐỎ chặng lui: đổi bản cũ thành DB chạy bị từ chối"; tha_khoa; exit 1; }
  fi
  # Bản chép đang chạy đổi theo: ke-chay.json ↔ ke-cu.json.
  if [ -f "$DEN/ke-chay.json" ] || [ -f "$DEN/ke-cu.json" ]; then
    mv -f "$DEN/ke-chay.json" "$DEN/ke-lui.json" 2>/dev/null
    mv -f "$DEN/ke-cu.json" "$DEN/ke-chay.json" 2>/dev/null
    mv -f "$DEN/ke-lui.json" "$DEN/ke-cu.json" 2>/dev/null
  fi
  xong
  ra "xanh: lui — bản cũ thành «$DB», bản vừa chạy thành «$CU»"
  tha_khoa
  exit 0
fi

# ───────── nhan <sha256> ─────────
[ "$DUNG_SAU" = "nhan" ] || chan_vai
giu_khoa
trap 'tha_khoa' EXIT
don_tep

bat_dau nhan
IFS= read -r DAU || do_chang "không đọc được đầu luồng"
re_dau='^ke [0-9]{1,7}$'
[[ $DAU =~ $re_dau ]] || do_chang "đầu luồng sai khuôn (cần «ke <số byte>»)"
N_KE="${DAU#ke }"
{ [ "$N_KE" -gt 0 ] && [ "$N_KE" -le 1048576 ]; } || do_chang "ke.json quá cỡ"
# dd bs=1: đọc đúng n byte, không đọc lố sang tệp dump.
dd bs=1 count="$N_KE" of="$DEN/ke.json.part" 2>/dev/null
[ "$(wc -c < "$DEN/ke.json.part" | tr -d ' ')" = "$N_KE" ] || do_chang "luồng đứt giữa ke.json"
head -c "$((TRAN + 1))" > "$DEN/dump.part" || do_chang "luồng đứt giữa tệp dump"
CO="$(wc -c < "$DEN/dump.part" | tr -d ' ')"
[ "$CO" -le "$TRAN" ] || do_chang "tệp dump vượt trần cỡ $TRAN byte"
[ "$CO" -gt 0 ] || do_chang "tệp dump rỗng"
xong

bat_dau sha
KE_DONG="$("$NODE" -e '
const k = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
const ok = (s) => /^[a-z0-9_]+$/.test(s);
if (typeof k.sha256 !== "string" || typeof k.tep !== "string") process.exit(3);
console.log(`sha ${k.sha256}`);
console.log(`tep ${k.tep}`);
for (const [t, n] of Object.entries(k.so_dong ?? {})) { if (!ok(t) || !Number.isInteger(n)) process.exit(3); console.log(`bang ${t} ${n}`); }
' "$DEN/ke.json.part" 2>/dev/null)" || do_chang "ke.json hỏng"
KE_SHA="$(printf '%s\n' "$KE_DONG" | sed -n 's/^sha //p')"
TEP="$(printf '%s\n' "$KE_DONG" | sed -n 's/^tep //p')"
re_tep='^oneinvest-m5-[0-9]{8}\.dump$'
[[ $TEP =~ $re_tep ]] || do_chang "ke.json nêu tên tệp lạ"
THUC="$(shasum -a 256 "$DEN/dump.part" | cut -d' ' -f1)"
[ "$THUC" = "$SHA_KY_VONG" ] || do_chang "sha256 tệp nhận không khớp sha256 lệnh đẩy gửi"
[ "$KE_SHA" = "$SHA_KY_VONG" ] || do_chang "sha256 trong ke.json không khớp sha256 lệnh đẩy gửi"
mv -f "$DEN/ke.json.part" "$DEN/ke.json" && mv -f "$DEN/dump.part" "$DEN/$TEP" || do_chang "không đổi tên tệp nhận"
xong
if [ "$DUNG_SAU" = "nhan" ]; then
  ra "xanh: đã nhận $TEP ($CO byte), sha256 khớp — dừng sau chặng nhận (NHAN_DUNG_SAU=nhan)"
  exit 0
fi

bat_dau kiem
KIEM="$(cd "$KHO" && "$NODE" scripts/ban-chep-da-loc.mjs --kiem "$DEN/$TEP" --khong-tu-dien 2>&1)"; M_KIEM=$?
printf '%s\n' "$KIEM" | sed 's/^/  kiem: /'
[ "$M_KIEM" -eq 0 ] || do_chang "ban-chep-da-loc --kiem --khong-tu-dien đỏ (mã $M_KIEM)"
xong

bat_dau nap
xoa_db "$MOI" || do_chang "không xoá được «$MOI» sót từ lượt trước"
DX createdb -U oneinvest -h localhost -T template0 -E UTF8 "$MOI" >/dev/null || do_chang "không dựng được «$MOI»"
DA_TAO_MOI=1
NGUON_NAP="$DEN/$TEP"
cay nap && NGUON_NAP=/dev/null
DX pg_restore -U oneinvest -h localhost --no-owner --no-acl --exit-on-error -d "$MOI" < "$NGUON_NAP" > /dev/null 2>"$DEN/.loi-nap" \
  || { bao "$(head -c 400 "$DEN/.loi-nap")"; rm -f "$DEN/.loi-nap"; do_chang "pg_restore vào «$MOI» lỗi"; }
rm -f "$DEN/.loi-nap"
xong

bat_dau dem
DS_BANG="$(printf '%s\n' "$KE_DONG" | sed -n 's/^bang \([a-z0-9_]*\) .*/\1/p')"
[ -n "$DS_BANG" ] || do_chang "ke.json không có số dòng bảng nào"
MANG="$(printf "'%s'," $DS_BANG)"; MANG="${MANG%,}"
DEM="$(PSQL -d "$MOI" -c "SELECT x.t || ' ' || (xpath('/row/n/text()', query_to_xml(format('SELECT count(*) AS n FROM public.%I', x.t), false, true, '')))[1]::text FROM unnest(ARRAY[$MANG]) x(t)" 2>/dev/null)" \
  || do_chang "không đếm được bảng trong «$MOI» (thiếu bảng?)"
LECH=""
CAY_CONG=0
cay dem && CAY_CONG=1
while read -r t n; do
  [ -n "$t" ] || continue
  thuc="$(printf '%s\n' "$DEM" | sed -n "s/^$t \([0-9]*\)$/\1/p")"
  [ "$CAY_CONG" = "1" ] && { n=$((n + 1)); CAY_CONG=0; }
  [ "$thuc" = "$n" ] || LECH="$LECH $t(ke.json $n, nạp ${thuc:-không có})"
done <<EOF
$(printf '%s\n' "$KE_DONG" | sed -n 's/^bang //p')
EOF
[ -z "$LECH" ] || do_chang "số dòng lệch ke.json:$LECH"
xong

bat_dau xoa-ban-cu
# Bản cũ không xoá ngay: cất thành <DB>_bo, chỉ xoá khi DB mới đã thành DB chạy (chặng don).
cay xoa-ban-cu && do_chang "xoá bản cũ «$CU» lỗi (cấy)"
xoa_db "$BO" || do_chang "xoá «$BO» sót từ lượt trước lỗi"
if co_db "$CU"; then
  doi_ten_db "$CU" "$BO" 1 || do_chang "cất bản cũ «$CU» → «$BO» bị từ chối"
  DA_CAT_CU=1
fi
xong

bat_dau doi-ten
CO_CHAY=0
co_db "$DB" && CO_CHAY=1
if [ "$CO_CHAY" = "1" ]; then
  NGAT=1
  cay giu-ket-noi && NGAT=0
  doi_ten_db "$DB" "$CU" "$NGAT" || do_chang "đổi tên «$DB» → «$CU» bị từ chối ($(tr '\n' ' ' < "$DEN/.loi-doi-ten" | head -c 200))"
fi
xong

bat_dau giua
GIUA_OK=1
if cay giua; then GIUA_OK=0; else doi_ten_db "$MOI" "$DB" 1 || GIUA_OK=0; fi
if [ "$GIUA_OK" = "0" ]; then
  # Giữa hai lần đổi tên: DB chạy đang mang tên bản cũ — đổi lại ngay để app không mất DB.
  if [ "$CO_CHAY" = "1" ] && ! doi_ten_db "$CU" "$DB" 1; then
    bao "NGUY: DB chạy đang mang tên «$CU» — chạy «lui» hoặc đổi tên tay"
  fi
  do_chang "đổi tên «$MOI» → «$DB» lỗi giữa hai lần đổi tên"
fi
DA_TAO_MOI=0
DA_CAT_CU=0
xong

bat_dau don
xoa_db "$BO" || bao "nhan-ban-chep: chưa xoá được «$BO» (bản cũ của lượt trước) — lượt sau xoá"
[ -f "$DEN/ke-chay.json" ] && mv -f "$DEN/ke-chay.json" "$DEN/ke-cu.json"
mv -f "$DEN/ke.json" "$DEN/ke-chay.json"
rm -f "$DEN/$TEP" "$DEN/.loi-doi-ten"
xong
ra "xanh: «$DB» = $TEP ($CO byte), bản cũ «$CU»$([ "$CO_CHAY" = "1" ] || echo " (trước lượt chưa có DB chạy)"), tổng $((SECONDS - T_LUOT))s"
exit 0
