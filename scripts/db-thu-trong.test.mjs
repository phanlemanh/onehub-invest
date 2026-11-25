// db-thu-trong.test.mjs — hồ sơ db-thu-tach-khoi-cum-that E1, E9: chế độ --chay-trong của db/db-thu.sh (cụm PostGIS dùng một
// lần cho lượt). Chạy docker THẬT: mỗi ca dựng container dùng một lần với tiền tố riêng của lượt test, xoá hết ở after().
// Cụm thật one-invest-db chỉ được ĐỌC (danh sách DB, phiên chỉ đọc). Docker của db-thu.sh đi qua một bọc ghi đối số; bọc
// chặn mọi lệnh nhắm `one-invest-db` và chặn container thứ ba của tiền tố — chiều đỏ không bao giờ thật sự chạm cụm thật
// hay vượt trần 2 cụm.
// Chạy: node --test --test-concurrency=1 scripts/db-thu-trong.test.mjs
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const SH = path.join(import.meta.dirname, "../db/db-thu.sh");
const TEN = "oneinvest_suite_ht9thu";
const TIEN_TO = `one-invest-db-thu-t${process.pid}-`;
const d = mkdtempSync(path.join(tmpdir(), "db-thu-trong-"));
const LOG = path.join(d, "docker.log");
writeFileSync(LOG, "");
const BOC = path.join(d, "docker-boc");
writeFileSync(BOC, `#!/usr/bin/env bash
printf '%s\\n' "$*" >> ${JSON.stringify(LOG)}
for a in "$@"; do
  if [ "$a" = one-invest-db ]; then echo "CHAN one-invest-db: $*" >> ${JSON.stringify(LOG)}; exit 97; fi
done
if [ "$1" = run ]; then
  n=$(docker ps --filter "name=^${TIEN_TO}" --format '{{.Names}}' | grep -c .)
  if [ "$n" -ge 2 ]; then echo "CHAN container thứ ba" >> ${JSON.stringify(LOG)}; exit 98; fi
fi
exec docker "$@"
`);
chmodSync(BOC, 0o755);

const dk = (...a) => spawnSync("docker", a, { encoding: "utf8" });
const conLai = () => dk("ps", "-a", "--filter", `name=^${TIEN_TO}`, "--format", "{{.Names}}").stdout.split("\n").filter(Boolean);
const dbThat = () => {
  const r = dk("exec", "-e", "PGPASSWORD=oneinvest", "-e", "PGOPTIONS=-c default_transaction_read_only=on", "one-invest-db",
    "psql", "-U", "oneinvest", "-h", "localhost", "-At", "-c", `SELECT datname FROM pg_database WHERE datname LIKE '${TEN}%'`);
  assert.equal(r.status, 0, `đọc danh sách DB cụm thật lỗi: ${r.stderr}`);
  return r.stdout.split("\n").filter(Boolean);
};
after(() => { for (const c of conLai()) dk("rm", "-f", "-v", c); });

/** Chạy một lượt; `ban`: đường db-thu.sh (bản sao phá ở chiều đỏ). Trả { code, out, child }. */
function luot(lenh, { ban = SH, env = {}, onSpawn } = {}) {
  return new Promise((res) => {
    const child = spawn("bash", [ban, TEN, "--chay-trong", "bash", "-c", lenh], {
      env: { ...process.env, DB_THU_DOCKER: BOC, DB_THU_TRONG_TIEN_TO: TIEN_TO, DB_THU_TRONG_KHOA: path.join(d, "khoa"), ...env },
    });
    let out = "";
    child.stdout.on("data", (b) => { out += b; });
    child.stderr.on("data", (b) => { out += b; });
    onSpawn?.(child);
    child.on("close", (code) => res({ code, out, child }));
  });
}

/** Phán một lượt đã xong. Ném lỗi ghim đúng điều hỏng; đọc bọc docker và danh sách DB cụm thật trước/sau. */
export function kiemLuot({ out, truoc, sau, log = readFileSync(LOG, "utf8") }) {
  const con = conLai();
  if (con.length) throw new Error(`container còn sau lượt: ${con.join(", ")}`);
  const moi = sau.filter((x) => !truoc.includes(x));
  if (moi.length) throw new Error(`DB suite trong cụm thật: ${moi.join(", ")}`);
  if (/CHAN one-invest-db/.test(log)) throw new Error("DB suite trong cụm thật: lệnh docker nhắm one-invest-db");
  const url = /URL=(\S+)/.exec(out)?.[1] ?? "";
  if (/:5433\//.test(url)) throw new Error(`DB suite trong cụm thật: lệnh thấy ${url}`);
  if (/CHAN container thứ ba/.test(log)) throw new Error("container thứ ba: lượt dựng quá trần 2 cụm");
}

const DO = `echo "URL=$DATABASE_URL CI=$CI CT=$DB_THU_CONTAINER"
docker ps --format '{{.Names}}' | grep -qx "$DB_THU_CONTAINER" && echo SONG=1
docker port "$DB_THU_CONTAINER" 5432/tcp | sed 's/^/PORT=/'
q() { docker exec -e PGPASSWORD=oneinvest "$DB_THU_CONTAINER" psql -U oneinvest -h localhost -d oneinvest -Atc "$1"; }
echo "SO=$(q "SELECT to_regclass('public.sale_offers') IS NOT NULL")"
echo "BANG=$(q "SELECT count(*) FROM pg_tables WHERE schemaname='public'")"`;

const banSao = (ten, sua) => {
  const p = path.join(d, ten);
  writeFileSync(p, sua(readFileSync(SH, "utf8")));
  return p;
};

test("chay-trong: lượt lành — container riêng, DB trống từ migration, CI=true, dọn sạch, mã lượt = mã lệnh", async () => {
  writeFileSync(LOG, "");
  const truoc = dbThat();
  const r = await luot(DO);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, new RegExp(`CT=${TIEN_TO}\\d+`));
  assert.match(r.out, /SONG=1/);
  assert.match(r.out, /CI=true/);
  assert.match(r.out, /URL=postgres:\/\/oneinvest:oneinvest@127\.0\.0\.1:\d+\/oneinvest/);
  const cong = [...r.out.matchAll(/PORT=(\S+)/g)].map((m) => m[1]);
  assert.ok(cong.length > 0 && cong.every((c) => c.startsWith("127.0.0.1:")), `cổng phải chỉ gắn 127.0.0.1: ${cong}`);
  assert.match(r.out, /SO=t/, "DB trống phải có bảng của migration (sale_offers)");
  assert.ok(Number(/BANG=(\d+)/.exec(r.out)?.[1]) > 50, r.out);
  assert.match(r.out, /dựng cụm \+ migration \d+ s/);
  kiemLuot({ out: r.out, truoc, sau: dbThat() });
  const r3 = await luot("exit 3", { env: { DB_THU_TRONG_INIT: "true" } });
  assert.equal(r3.code, 3, r3.out);
  kiemLuot({ out: r3.out, truoc, sau: dbThat() });
});

test("chay-trong: bị TERM giữa chừng — container bị xoá, mã 143", async () => {
  writeFileSync(LOG, "");
  const truoc = dbThat();
  const r = await luot("echo BAT_DAU; exec sleep 120", {
    env: { DB_THU_TRONG_INIT: "true" },
    onSpawn: (child) => child.stdout.on("data", (b) => { if (String(b).includes("BAT_DAU")) child.kill("SIGTERM"); }),
  });
  assert.equal(r.code, 143, r.out);
  kiemLuot({ out: r.out, truoc, sau: dbThat() });
});

test("chay-trong chiều đỏ: bỏ bước xoá container → ghim «container còn sau lượt»", async () => {
  writeFileSync(LOG, "");
  const truoc = dbThat();
  const ban = banSao("bo-xoa.sh", (s) => s.replace(/xoa_ct\(\) \{[^\n]*\}/, "xoa_ct() { :; }"));
  assert.notEqual(readFileSync(ban, "utf8"), readFileSync(SH, "utf8"), "bản sao phải khác bản thật");
  const r = await luot("echo URL=$DATABASE_URL", { ban, env: { DB_THU_TRONG_INIT: "true" } });
  assert.equal(r.code, 0, r.out);
  assert.throws(() => kiemLuot({ out: r.out, truoc, sau: dbThat() }), /container còn sau lượt/);
  for (const c of conLai()) dk("rm", "-f", "-v", c);
});

test("chay-trong chiều đỏ: rơi về cụm thật → ghim «DB suite trong cụm thật»", async () => {
  writeFileSync(LOG, "");
  const truoc = dbThat();
  const ban = banSao("roi-cum-that.sh", (s) =>
    s.replace('export DATABASE_URL="postgres://$NGUOI:$NGUOI@127.0.0.1:$CONG/oneinvest"',
      `export DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/${TEN}_$$"`));
  assert.notEqual(readFileSync(ban, "utf8"), readFileSync(SH, "utf8"), "bản sao phải khác bản thật");
  // Lệnh chỉ in URL nó thấy — không nối DB nào; DB_THU_TRONG_INIT=true để bản sao không nối cụm thật.
  const r = await luot("echo URL=$DATABASE_URL", { ban, env: { DB_THU_TRONG_INIT: "true" } });
  assert.throws(() => kiemLuot({ out: r.out, truoc, sau: dbThat() }), /DB suite trong cụm thật/);
});

const SONG_SONG = `echo "URL=$DATABASE_URL CT=$DB_THU_CONTAINER"
docker port "$DB_THU_CONTAINER" 5432/tcp | sed 's/^/PORT=/'
q() { docker exec -e PGPASSWORD=oneinvest "$DB_THU_CONTAINER" psql -U oneinvest -h localhost -d oneinvest -Atc "$1"; }
q "CREATE TABLE luot_$$ (x int)" >/dev/null
sleep 4
echo "THAY=$(q "SELECT count(*) FROM pg_tables WHERE tablename LIKE 'luot_%'")"`;

test("chay-trong: hai lượt song song — container và cổng riêng, không thấy bảng của nhau, cả hai thoát 0", async () => {
  writeFileSync(LOG, "");
  const truoc = dbThat();
  const [a, b] = await Promise.all([luot(SONG_SONG, { env: { DB_THU_TRONG_INIT: "true" } }), luot(SONG_SONG, { env: { DB_THU_TRONG_INIT: "true" } })]);
  assert.equal(a.code, 0, a.out);
  assert.equal(b.code, 0, b.out);
  const ct = (o) => /CT=(\S+)/.exec(o)?.[1];
  const cong = (o) => /PORT=(\S+)/.exec(o)?.[1];
  assert.notEqual(ct(a.out), ct(b.out));
  assert.notEqual(cong(a.out), cong(b.out));
  assert.match(a.out, /THAY=1\b/, "lượt A chỉ thấy bảng của mình");
  assert.match(b.out, /THAY=1\b/, "lượt B chỉ thấy bảng của mình");
  kiemLuot({ out: a.out + b.out, truoc, sau: dbThat() });
});

/** Hai lượt treo giữ hai chỗ; trả hàm nhả (TERM cả hai rồi chờ chúng dọn container). */
async function giuHaiCho() {
  const con = [];
  const xong = [];
  const san = [];
  for (let i = 0; i < 2; i++) {
    san.push(new Promise((ok) => {
      xong.push(luot("echo GIU; exec sleep 300", {
        env: { DB_THU_TRONG_INIT: "true" },
        onSpawn: (child) => { con.push(child); child.stdout.on("data", (b) => { if (String(b).includes("GIU")) ok(); }); },
      }));
    }));
  }
  await Promise.all(san);
  return async () => { for (const c of con) c.kill("SIGTERM"); await Promise.all(xong); };
}

test("chay-trong: lượt thứ ba khi đã có hai cụm sống — không dựng container, chờ quá trần thì thoát 4", async () => {
  writeFileSync(LOG, "");
  const truoc = dbThat();
  const nha = await giuHaiCho();
  try {
    assert.equal(conLai().length, 2);
    const r = await luot("echo KHONG_DUOC_CHAY", { env: { DB_THU_TRONG_INIT: "true", DB_THU_TRONG_CHO_GIAY: "3" } });
    assert.equal(r.code, 4, r.out);
    assert.match(r.out, /đã đủ 2 cụm dùng một lần/);
    assert.doesNotMatch(r.out, /KHONG_DUOC_CHAY/);
    assert.equal((readFileSync(LOG, "utf8").match(/^run /gm) ?? []).length, 2, "lượt thứ ba không được gọi docker run");
  } finally { await nha(); }
  kiemLuot({ out: "", truoc, sau: dbThat() });
});

test("chay-trong chiều đỏ: bỏ trần → ghim «container thứ ba»", async () => {
  writeFileSync(LOG, "");
  const truoc = dbThat();
  const ban = banSao("bo-tran.sh", (s) => s.replace(/^  TRAN=2$/m, "  TRAN=9"));
  assert.notEqual(readFileSync(ban, "utf8"), readFileSync(SH, "utf8"), "bản sao phải khác bản thật");
  const nha = await giuHaiCho();
  let r;
  try {
    r = await luot("echo X", { ban, env: { DB_THU_TRONG_INIT: "true", DB_THU_TRONG_CHO_GIAY: "3" } });
  } finally { await nha(); }
  assert.throws(() => kiemLuot({ out: r.out, truoc, sau: dbThat() }), /container thứ ba/);
});
