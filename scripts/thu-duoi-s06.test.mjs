// thu-duoi-s06.test.mjs — test wrapper launchd «thu đuôi» S06 (claudedp-2511-29).
// Không đòi DB thật / mạng thật: `node` là SHIM ghi dãy lời gọi và đáp theo kịch
// bản; môi trường dựng tường minh (KHÔNG kế thừa env nhạy cảm — luật 1511-3).
import test from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const REPO = new URL("../", import.meta.url).pathname.replace(/\/$/, "");
const LA_MAC = process.platform === "darwin";
const NUT = process.execPath;

function moiTruong() {
  const home = mkdtempSync(join(tmpdir(), "thuduois06-"));
  const bin = join(home, "bin");
  const root = join(home, "repo"); // gốc repo giả — wrapper ROOT là thư mục cha của scripts/
  const goc = join(root, "state", "thu-duoi-s06");
  mkdirSync(bin);
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, "pipeline"), { recursive: true }); // wrapper cd vào đây cho truy vấn vùng
  mkdirSync(goc, { recursive: true });
  writeFileSync(join(root, "scripts", "thu-duoi-s06.sh"), readFileSync(join(REPO, "scripts", "thu-duoi-s06.sh")));

  // SHIM node: dispatch theo chuỗi đặc trưng trong argv; mọi lời gọi ghi calls.log
  const log = join(home, "calls.log");
  const shim = `#!/bin/bash
log="${log}"
argv="$*"
case "$argv" in
  *source_groups*)                 # truy vấn vùng (đặc trưng riêng — xếp trước, vì nó import vong-doi)
    echo "vung-query" >> "$log"
    echo "\${SHIM_CITIES-hanoi hcmc}"
    exit 0 ;;
  *vong-doi.mjs*)
    echo "vong-doi" >> "$log"
    echo "\${SHIM_VD_OUT:-}"
    exit "\${SHIM_VD_RC:-0}" ;;
  *thu-duoi-moc.mjs*)
    echo "moc-tran-$3" >> "$log"
    exit 0 ;;
  *collect-s06-duoi.mjs*)
    city="$3"; goc="$7"          # node <tệp> --vung <city> --muc <m> --goc <goc>
    echo "collect $city" >> "$log"
    rc="\${SHIM_COLLECT_RC:-0}"
    [ "$rc" -ne 0 ] && exit "$rc"
    mkdir -p "$goc/snapshots/$city/\${city}__chotot-ads__20261125T060000"
    echo x > "$goc/snapshots/$city/\${city}__chotot-ads__20261125T060000/manifest.json"
    exit 0 ;;
  *stg_chotot_ads*|*airbnb_snapshots*)   # 2611-21: chọn-nạp soát sổ nạp bền airbnb_snapshots
    city="\${@: -2:1}"; goc="\${@: -1}"   # node -e <nguồn> <city> <goc>
    moi="$(ls -1 "$goc/snapshots/$city" 2>/dev/null | sort | tail -1)"
    [ -z "$moi" ] && exit 0
    case ",\${SHIM_DA_NAP-}," in
      *",$city,"*) exit 0 ;;        # vùng này coi như đã nạp → in rỗng
    esac
    echo "$goc/snapshots/$city/$moi"
    exit 0 ;;
  *import-chotot.mjs*)
    echo "import $(basename "$2")" >> "$log"
    exit "\${SHIM_IMPORT_RC:-0}" ;;
  *)
    echo "shim: lời gọi lạ — $argv" >&2
    exit 70 ;;
esac
`;
  writeFileSync(join(bin, "node"), shim, { mode: 0o755 });

  const env = {
    PATH: `${bin}:/bin:/usr/bin`,
    HOME: home,
    DATABASE_URL: "postgres://thu-dung:khong-dung@127.0.0.1:1/khong-co", // shim không nối DB thật
    SHIM_CITIES: "hanoi hcmc",
    THU_DUOI_S06_GOC: goc,
  };
  return { home, bin, root, goc, log, env };
}

function chay(t, suaEnv = {}) {
  return spawnSync("bash", [join(t.root, "scripts", "thu-duoi-s06.sh")], {
    env: { ...t.env, ...suaEnv },
    encoding: "utf8",
    timeout: 30_000,
  });
}

function docLog(t) {
  return existsSync(t.log) ? readFileSync(t.log, "utf8").trim().split("\n").filter(Boolean) : [];
}

function dung(t) {
  rmSync(t.home, { recursive: true, force: true });
}

test("khoá bận (pid lượt trước còn sống) → thoát 0 im lặng, không lời gọi nào", async () => {
  const t = moiTruong();
  const con = spawn("bash", ["-c", "sleep 30"]);
  mkdirSync(`${t.goc}.lock`);
  writeFileSync(join(`${t.goc}.lock`, "pid"), String(con.pid));
  await new Promise((r) => setTimeout(r, 200)); // pid chắc chắn còn sống khi kiểm
  const kq = chay(t);
  assert.equal(kq.status, 0, `thoát 0, được ${kq.status} (${kq.stderr})`);
  assert.deepEqual(docLog(t), [], "khoá bận phải chặn trước mọi lời gọi node");
  con.kill("SIGTERM");
  dung(t);
});

test("khoá sót của tiến trình đã chết → nhận lại khoá, vòng chạy bình thường", () => {
  const t = moiTruong();
  mkdirSync(`${t.goc}.lock`);
  writeFileSync(join(`${t.goc}.lock`, "pid"), "999999999"); // pid không tồn tại
  const kq = chay(t, { SHIM_CITIES: "" });
  assert.equal(kq.status, 0, kq.stderr);
  assert.deepEqual(docLog(t), ["vong-doi", "moc-tran-200000", "vung-query"], "phải đi tiếp sau khi nhận lại khoá");
  assert.equal(existsSync(`${t.goc}.lock`), false, "thoát xong phải dọn khoá");
  dung(t);
});

test("script nạp ngày đang chạy → thoát 0, nhường lượt, không lời gọi node", async () => {
  const t = moiTruong();
  const con = spawn("bash", ["-c", `exec -a "${t.root}/scripts/chotot-daily.sh" sleep 30`]);
  await new Promise((r) => setTimeout(r, 300));
  const kq = chay(t);
  assert.equal(kq.status, 0);
  assert.match(kq.stdout, /nhường lượt/);
  assert.deepEqual(docLog(t), [], "nhường lượt phải đứng trước mọi lời gọi node");
  con.kill("SIGTERM");
  dung(t);
});

test("cổng vòng đời từ chối (RC 3) → thoát 0 kèm lý do, không thu không nạp", () => {
  const t = moiTruong();
  const kq = chay(t, { SHIM_VD_RC: 3, SHIM_VD_OUT: "S06 chua-den-luot: bao-tri" });
  assert.equal(kq.status, 0);
  assert.match(kq.stdout, /chua-den-luot/);
  assert.deepEqual(docLog(t), ["vong-doi"]);
  dung(t);
});

test("cổng vòng đời lỗi (RC 1) → thoát 1 fail-closed", () => {
  const t = moiTruong();
  const kq = chay(t, { SHIM_VD_RC: 1 });
  assert.equal(kq.status, 1);
  assert.deepEqual(docLog(t), ["vong-doi"]);
  dung(t);
});

test("không vùng chạy được → thoát 0 (đã gọi cắt mốc với trần mặc định)", () => {
  const t = moiTruong();
  const kq = chay(t, { SHIM_CITIES: "" });
  assert.equal(kq.status, 0);
  assert.deepEqual(docLog(t), ["vong-doi", "moc-tran-200000", "vung-query"]);
  dung(t);
});

test("vui: thu 2 vùng, hanoi đã nạp → import ĐÚNG 1 snapshot mới nhất của hcmc, thoát 0", () => {
  const t = moiTruong();
  const kq = chay(t, { SHIM_DA_NAP: "hanoi" });
  assert.equal(kq.status, 0, kq.stderr);
  const log = docLog(t);
  assert.deepEqual(log.filter((d) => d.startsWith("collect")), ["collect hanoi", "collect hcmc"]);
  const nap = log.filter((d) => d.startsWith("import"));
  assert.equal(nap.length, 1, `tối đa 1 nạp/vòng — log=${JSON.stringify(log)} stdout=${kq.stdout}`);
  assert.match(nap[0], /hcmc__chotot-ads__20261125T060000/);
  assert.match(kq.stdout, /nạp snapshot đuôi .*hcmc__chotot-ads__20261125T060000/);
  dung(t);
});

test("bị chặn nguồn (collect RC 3) → thoát 3, KHÔNG nạp gì", () => {
  const t = moiTruong();
  const kq = chay(t, { SHIM_COLLECT_RC: 3 });
  assert.equal(kq.status, 3);
  assert.match(kq.stdout, /thoát 3/);
  assert.equal(docLog(t).filter((d) => d.startsWith("import")).length, 0);
  dung(t);
});

test("nạp lỗi → thoát 1 cuối vòng", () => {
  const t = moiTruong();
  const kq = chay(t, { SHIM_IMPORT_RC: 1, SHIM_CITIES: "hanoi" });
  assert.equal(kq.status, 1, `log=${JSON.stringify(docLog(t))} stdout=${kq.stdout} stderr=${kq.stderr}`);
  assert.equal(docLog(t).filter((d) => d.startsWith("import")).length, 1);
  assert.match(kq.stdout, /thoát 1 cuối vòng/);
  dung(t);
});

test("GOC trỏ vào collector/ → thoát 1 trước mọi thao tác", () => {
  const t = moiTruong();
  const kq = chay(t, { THU_DUOI_S06_GOC: join(t.root, "collector", "snapshots") });
  assert.equal(kq.status, 1);
  assert.match(kq.stdout, /cấm trỏ vào collector/);
  assert.deepEqual(docLog(t), []);
  dung(t);
});

test("trần mốc theo env THU_DUOI_S06_MOC_TOIDA đi vào lời gọi cắt", () => {
  const t = moiTruong();
  const kq = chay(t, { THU_DUOI_S06_MOC_TOIDA: "123", SHIM_CITIES: "" });
  assert.equal(kq.status, 0, `log=${JSON.stringify(docLog(t))} stdout=${kq.stdout} stderr=${kq.stderr}`);
  assert.deepEqual(docLog(t), ["vong-doi", "moc-tran-123", "vung-query"]);
  dung(t);
});

// ─── catMoc (pipeline/lib/thu-duoi-moc.mjs) ───

const { catMoc } = await import(pathToFileURL(join(REPO, "pipeline", "lib", "thu-duoi-moc.mjs")).href);

async function vietMoc(goc, ids) {
  const { writeFile } = await import("node:fs/promises");
  await writeFile(join(goc, "moc.json"), JSON.stringify({ daCo: ids }));
}

test("catMoc: vượt trần → giữ N id CUỐI, ghi tmp+rename không sót tmp", async () => {
  const home = mkdtempSync(join(tmpdir(), "moc-"));
  const goc = join(home, "goc");
  mkdirSync(goc, { recursive: true });
  await vietMoc(goc, [1, 2, 3, 4, 5]);
  assert.deepEqual(await catMoc(goc, 3), { daCat: true, truoc: 5, sau: 3 });
  assert.deepEqual(JSON.parse(readFileSync(join(goc, "moc.json"), "utf8")).daCo, [3, 4, 5]);
  assert.deepEqual(readdirSync(goc), ["moc.json"], "không được sót tệp tạm");
  rmSync(home, { recursive: true, force: true });
});

test("catMoc: dưới trần → không cắt, KHÔNG ghi lại file", async () => {
  const home = mkdtempSync(join(tmpdir(), "moc-"));
  const goc = join(home, "goc");
  mkdirSync(goc, { recursive: true });
  await vietMoc(goc, [1, 2]);
  assert.deepEqual(await catMoc(goc, 200), { daCat: false, truoc: 2 });
  assert.deepEqual(readdirSync(goc), ["moc.json"]);
  rmSync(home, { recursive: true, force: true });
});

test("catMoc: thiếu file / JSON hỏng / trần vô nghĩa → không nổ, không cắt", async () => {
  const { writeFile } = await import("node:fs/promises");
  const home = mkdtempSync(join(tmpdir(), "moc-"));
  const goc = join(home, "goc");
  mkdirSync(goc, { recursive: true });
  assert.deepEqual(await catMoc(goc, 10), null, "thiếu file → null");
  await writeFile(join(goc, "moc.json"), "{o i");
  assert.deepEqual(await catMoc(goc, 10), null, "JSON hỏng → null");
  await vietMoc(goc, [1]);
  assert.deepEqual(await catMoc(goc, 0), { daCat: false, lyDo: "tran-khong-hop-le" });
  assert.deepEqual(await catMoc(goc, NaN), { daCat: false, lyDo: "tran-khong-hop-le" });
  assert.deepEqual(JSON.parse(readFileSync(join(goc, "moc.json"), "utf8")).daCo, [1], "file phải nguyên");
  rmSync(home, { recursive: true, force: true });
});

test("CLI entry của helper in JSON một dòng (khuôn wrapper gọi)", async () => {
  const home = mkdtempSync(join(tmpdir(), "moc-"));
  const goc = join(home, "goc");
  mkdirSync(goc, { recursive: true });
  await vietMoc(goc, [1, 2, 3, 4]);
  const kq = spawnSync(NUT, [join(REPO, "pipeline", "lib", "thu-duoi-moc.mjs"), goc, "2"], { encoding: "utf8" });
  assert.equal(kq.status, 0);
  assert.deepEqual(JSON.parse(kq.stdout.trim()), { daCat: true, truoc: 4, sau: 2 });
  rmSync(home, { recursive: true, force: true });
});

// ─── plist template ───

test("plist template: Label đúng, StartInterval 300, wrapper qua __ROOT__ (thay lúc cài)", () => {
  const nd = readFileSync(join(REPO, "pipeline", "cron", "com.oneinvest.thu-duoi-s06.plist"), "utf8");
  assert.match(nd, /<string>com\.oneinvest\.thu-duoi-s06<\/string>/);
  assert.match(nd, /<key>StartInterval<\/key><integer>300<\/integer>/);
  assert.match(nd, /__ROOT__\/scripts\/thu-duoi-s06\.sh/);
  if (LA_MAC) {
    const tam = join(mkdtempSync(join(tmpdir(), "plist-")), "p.plist");
    writeFileSync(tam, nd.replace(/__ROOT__/g, "/tmp/gia"));
    const lint = spawnSync("/usr/bin/plutil", ["-lint", tam], { encoding: "utf8" });
    assert.equal(lint.status, 0, lint.stdout + lint.stderr);
  }
});
