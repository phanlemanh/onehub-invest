#!/usr/bin/env bash
# GT5 E9 (AC-9): thước chất lượng. Dựng trạng thái bằng cong-tac.sh (GT5_GIU=1: đường chuẩn S1 từ origin/main, lượt bật S4 trên
# oneinvest_gt5_bat), rồi gt5-thuoc.mjs tính từ nhãn thô của mẫu giữ riêng (research-local, máy thu) và 40 cặp audit.
# Báo cáo số ghi ở _acceptance/khoa-gom-hai-tang/thuoc-ket-qua.json; lượt sau chạy --kiem để đỏ khi báo cáo lệch số tính lại.
# Chiều đỏ: (1) sửa một số trong bản sao báo cáo → --kiem thoát 1; (2) bớt một nhãn → số tính lại lệch báo cáo → thoát 1;
# (3) cấy một tên nguồn thật vào bản sao payload → thoát 1, ghim mã bản chữ.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
D=_acceptance/khoa-gom-hai-tang/probes/gt5-db.mjs; K=_acceptance/khoa-gom-hai-tang/probes/gt5-thuoc.mjs
GOC="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
MAU="${GT5_MAU:-$GOC/research-local/s03-gom-tin-giu-rieng-20261120}"; AUD="${GT5_AUDIT:-$GOC/research-local/s03-gom-tin-audit-20261109}"
BC="${GT5_BC:-_acceptance/khoa-gom-hai-tang/thuoc-ket-qua.json}"  # mẫu hai: GT5_MAU=<thư mục mẫu hai> GT5_BC=…/thuoc-ket-qua-2.json
U() { echo "postgres://oneinvest:oneinvest@localhost:5433/$1"; }
[ -f "$MAU/payload.json" ] && [ -f "$AUD/sample_tach.csv" ] || { echo "ĐỎ: không thấy mẫu giữ riêng hay nhãn audit ở research-local của máy thu"; exit 2; }
RA="$(mktemp -d)"; trap 'node $D xoa oneinvest_gt5_bat >/dev/null 2>&1 || true' EXIT
GT5_GIU=1 GT5_RA="$RA" bash _acceptance/khoa-gom-hai-tang/probes/cong-tac.sh > "$RA/cong-tac.txt" 2>&1 || { tail -20 "$RA/cong-tac.txt"; echo "ĐỎ: cong-tac.sh không xanh, không chấm được"; exit 2; }
TN=(); [ "${GT5_TACH_NHOM:-0}" = 1 ] && TN=(--tach-nhom)  # mẫu ba: GT5_TACH_NHOM=1 bật thước tách nhóm ≤ 35% (Hỏi-6 B)
CHAM() { DATABASE_URL="$(U oneinvest_gt5_bat)" node $K --mau "$1" --audit "$AUD" --truoc "$RA/s1.json" --sau "$RA/s4.json" ${TN[@]+"${TN[@]}"} "${@:2}"; }
RC=0
if [ -f "$BC" ]; then CHAM "$MAU" --kiem "$BC" || RC=1; else CHAM "$MAU" --ra "$BC" || RC=1; fi
echo "== chiều đỏ 1: sửa một số trong bản sao báo cáo"
python3 - "$BC" "$RA/bc-sua.json" <<'PY'
import json,sys; b=json.load(open(sys.argv[1])); b["gop_nham"]["sau"]["k"]+=1; json.dump(b,open(sys.argv[2],"w"),ensure_ascii=False,indent=1)
PY
if CHAM "$MAU" --kiem "$RA/bc-sua.json" > "$RA/d1.txt" 2>&1; then echo "ĐỎ: thước mù — báo cáo bị sửa mà vẫn khớp"; RC=1
else grep -q "lệch số tính lại" "$RA/d1.txt" && echo "đạt: báo cáo sửa số bị bắt" || { tail -3 "$RA/d1.txt"; echo "ĐỎ: chiều đỏ 1 sai thông điệp"; RC=1; }; fi
echo "== chiều đỏ 2: bớt một nhãn"
mkdir -p "$RA/mau2"; cp "$MAU"/payload.json "$MAU"/payload.sha256 "$MAU"/map.json "$MAU"/nhan-*.json "$RA/mau2/"
python3 - "$RA/mau2/nhan-opus.json" <<'PY'
import json,sys; p=sys.argv[1]; d=json.load(open(p)); i=next(i for i,x in enumerate(d) if x["loai"]=="mot-can"); d.pop(i); json.dump(d,open(p,"w"),ensure_ascii=False)
PY
if CHAM "$RA/mau2" --kiem "$BC" > "$RA/d2.txt" 2>&1; then echo "ĐỎ: thước mù — bớt một nhãn mà số không đổi"; RC=1
else grep -q "lệch số tính lại" "$RA/d2.txt" && echo "đạt: bớt một nhãn bị bắt" || { tail -3 "$RA/d2.txt"; echo "ĐỎ: chiều đỏ 2 sai thông điệp"; RC=1; }; fi
echo "== chiều đỏ 3: cấy tên nguồn vào bản sao payload"
mkdir -p "$RA/mau3"; cp "$MAU"/map.json "$MAU"/nhan-*.json "$RA/mau3/"
DATABASE_URL="$(U oneinvest_gt5_bat)" node -e '
const pg=require(process.argv[1]);const fs=require("fs");const cr=require("crypto");const c=new pg.Client({connectionString:process.env.DATABASE_URL});
c.connect().then(async()=>{const r=await c.query(`SELECT real_name FROM source_registry WHERE code=$$S03$$ AND real_name IS NOT NULL LIMIT 1`);await c.end();
const p=JSON.parse(fs.readFileSync(process.argv[2]+"/payload.json","utf8"));p[0].ban_chu[0].chu+=" "+r.rows[0].real_name;
const s=JSON.stringify(p,null,1)+"\n";fs.writeFileSync(process.argv[3]+"/payload.json",s);fs.writeFileSync(process.argv[3]+"/payload.sha256",cr.createHash("sha256").update(s).digest("hex")+"  payload.json\n");console.log(p[0].ban_chu[0].id)})' "$ROOT/pipeline/node_modules/pg" "$MAU" "$RA/mau3" > "$RA/cay.txt"
ID="$(cat "$RA/cay.txt")"
if CHAM "$RA/mau3" > "$RA/d3.txt" 2>&1; then echo "ĐỎ: thước mù — payload có tên nguồn mà vẫn xanh"; RC=1
else grep -qF "$ID" "$RA/d3.txt" && echo "đạt: tên nguồn cấy bị bắt ở $ID" || { tail -3 "$RA/d3.txt"; echo "ĐỎ: chiều đỏ 3 không ghim $ID"; RC=1; }; fi
[ $RC = 0 ] && echo "XANH: thuoc" || echo "ĐỎ: thuoc"
exit $RC
