#!/bin/bash
# AC-2/AC-3/AC-5: nạp một snapshot GIẢ (U+0000 trong text, senderName, media lồng, meta.mediaFiles) vào một DB TẠM
# (chỉ hai bảng airbnb_snapshots + stg_zalo_posts, chép schema từ DB local) — không ghi DB local dùng chung.
# $2 = đường importer (mặc định bản của cây); bản baseline truyền importer cũ.
set -uo pipefail
R="${1:?gốc kho}"; IMP="${2:-$R/pipeline/import-airbnb.mjs}"
DB=s03nb_$$; PG="docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -v ON_ERROR_STOP=1 -q"
T=$(mktemp -d); trap '$PG -d oneinvest -c "DROP DATABASE IF EXISTS $DB" >/dev/null 2>&1; rm -rf "$T"' EXIT
$PG -d oneinvest -c "CREATE DATABASE $DB" >/dev/null
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -U oneinvest -h localhost -s -t airbnb_snapshots -t stg_zalo_posts oneinvest \
  | grep -v '^\\\(un\)\?restrict' | $PG -d $DB >/dev/null
S=$T/hanoi__zalo-agent__2026-10-30T000000000; mkdir -p "$S"
node -e '
const fs=require("fs"),zlib=require("zlib"),c=require("crypto"),[d]=process.argv.slice(1);
const items=[{source:"zalo-agent",sourceId:"s03nb-1",fetchedAt:"2026-10-30T00:00:00Z",
 payload:{group:"nhóm\u0000A",author:"a1",text:"bán căn\u0000hộ 2PN",senderName:"Người\u0000Bán",senderId:"u1",conversationId:"c1",
  media:[{url:"http://x.test/a\u0000b.jpg",meta:{cap:"chú\u0000thích"}}],agent_id:"ag1"},
 meta:{mediaFiles:[{file:"media/1.jpg",url:"http://x.test/a\u0000b.jpg",note:"n\u0000"}]}}];
const gz=zlib.gzipSync(Buffer.from(JSON.stringify(items)));fs.writeFileSync(d+"/items-0.json.gz",gz);
fs.mkdirSync(d+"/media");fs.writeFileSync(d+"/media/1.jpg","x");
const sha=b=>c.createHash("sha256").update(b).digest("hex");
fs.writeFileSync(d+"/manifest.json",JSON.stringify({schemaVersion:4,snapshotId:"hanoi__zalo-agent__2026-10-30T000000000",city:"hanoi",source:"zalo-agent",
 finishedAt:"2026-10-30T00:00:00Z",files:[{name:"items-0.json.gz",sha256:sha(gz)},{name:"media/1.jpg",sha256:sha("x")}]}));' "$S"
export DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/$DB"
q(){ $PG -d $DB -Atc "$1"; }
o1=$(node "$IMP" "$S" 2>&1); r1=$?; echo "lượt 1 exit $r1: $(echo "$o1" | tail -2 | tr '\n' ' ')"
echo "lỗi lượt 1: $(echo "$o1" | grep -m1 -E 'invalid byte|Unicode escape|error:' || echo không)"
o2=$(node "$IMP" "$S" 2>&1); r2=$?; echo "lượt 2 exit $r2: $(echo "$o2" | tail -1)"
n=$(q "select count(*) from stg_zalo_posts"); echo "số dòng: $n"
row=$(q "select text||'|'||sender_name||'|'||group_name||'|'||(media->0->>'url')||'|'||(media->0->'meta'->>'cap')||'|'||(media_files->0->>'note')||'|'||(media_files->0->>'snapshotId') from stg_zalo_posts" 2>&1)
echo "dòng: $row"
[ "$r1" = 0 ] && [ "$r2" = 0 ] || { echo "NẠP ĐỎ"; exit 1; }
[ "$n" = 1 ] || { echo "nạp lại nhân dòng hoặc mất dòng"; exit 1; }
[ "$row" = "bán cănhộ 2PN|NgườiBán|nhómA|http://x.test/ab.jpg|chúthích|n|hanoi__zalo-agent__2026-10-30T000000000" ] || { echo "giá trị sai"; exit 1; }
echo "FIXTURE OK"
