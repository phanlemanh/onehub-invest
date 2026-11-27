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

  // SHIM pgrep (MỞ LẠI 2611-27 lần 3): wrapper dò «lượt quét đủ đang chạy» qua pgrep —
  // nếu để pgrep thật thì kết quả test phụ thuộc tiến trình đang sống trên máy thu
  // (16/26 đỏ lúc 05:46 VN khi lượt 05:30 đang chạy). PATH của test đặt $bin TRƯỚC,
  // nên wrapper luôn gặp pgrep giả này: mặc định «không có gì chạy», chỉ nói «có»
  // khi ca yêu cầu qua PGREP_GIA_QUET_DU=1.
  const shimPgrep = `#!/bin/bash
[ "\${PGREP_GIA_QUET_DU:-0}" = "1" ] && exit 0
exit 1
`;
  writeFileSync(join(bin, "pgrep"), shimPgrep, { mode: 0o755 });

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

test("2611-27 «đang có lượt quét đủ» (tiến trình giả qua PGREP_GIA_QUET_DU=1) → thoát 0, nhường lượt, không lời gọi node", async () => {
  const t = moiTruong();
  const kq = chay(t, { PGREP_GIA_QUET_DU: "1" });
  assert.equal(kq.status, 0, kq.stderr);
  assert.match(kq.stdout, /nhường lượt/);
  assert.deepEqual(docLog(t), [], "nhường lượt phải đứng trước mọi lời gọi node");
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
  const kq = chay(t, { SHIM_DA_NAP: "hanoi", THU_DUOI_S06_VUNG: "hanoi hcmc" });
  assert.equal(kq.status, 0, kq.stderr);
  const log = docLog(t);
  assert.deepEqual(log.filter((d) => d.startsWith("collect")), ["collect hanoi", "collect hcmc"]);
  const nap = log.filter((d) => d.startsWith("import"));
  assert.equal(nap.length, 1, `tối đa 1 nạp/vòng — log=${JSON.stringify(log)} stdout=${kq.stdout}`);
  assert.match(nap[0], /hcmc__chotot-ads__20261125T060000/);
  assert.match(kq.stdout, /nạp snapshot đuôi .*hcmc__chotot-ads__20261125T060000/);
  dung(t);
});

// — claudedp-2611-27 (1): tập vùng cấu hình được, MẶC ĐỊNH bằng đúng phạm vi đã đo (một vùng) —
test("2611-27 MẶC ĐỊNH chỉ vùng đã đo: hanoi bị bỏ (có dòng nhật ký), chỉ hcmc được gọi", () => {
  const t = moiTruong();
  const kq = chay(t, { SHIM_CITIES: "hanoi hcmc" });
  assert.equal(kq.status, 0, kq.stderr);
  const log = docLog(t);
  assert.deepEqual(log.filter((d) => d.startsWith("collect")), ["collect hcmc"], "mặc định chỉ thu vùng đã đo");
  assert.match(kq.stdout, /bỏ vùng hanoi: ngoài tập đã cấu hình/, "có dòng nhật ký nói rõ bị bỏ");
  const nap = log.filter((d) => d.startsWith("import"));
  assert.equal(nap.length <= 1, true, kq.stdout);
});

test("2611-27 mở thêm vùng bằng THU_DUOI_S06_VUNG → vùng đó được gọi (đối chứng hành vi)", () => {
  const t = moiTruong();
  const kq = chay(t, { SHIM_CITIES: "hanoi hcmc", THU_DUOI_S06_VUNG: "hanoi hcmc" });
  assert.equal(kq.status, 0, kq.stderr);
  assert.deepEqual(docLog(t).filter((d) => d.startsWith("collect")), ["collect hanoi", "collect hcmc"]);
  dung(t);
});

test("2611-27 vùng ngoài tập: KHÔNG phát lời gọi nào cho vùng đó, vẫn có dòng nhật ký bỏ", () => {
  const t = moiTruong();
  const kq = chay(t, { SHIM_CITIES: "hcmc da-nang hanoi", THU_DUOI_S06_VUNG: "hcmc da-nang" });
  assert.equal(kq.status, 0, kq.stderr);
  assert.deepEqual(docLog(t).filter((d) => d.startsWith("collect")), ["collect hcmc", "collect da-nang"], "hanoi ngoài tập không được gọi");
  assert.match(kq.stdout, /bỏ vùng hanoi: ngoài tập đã cấu hình/);
  dung(t);
});

// — claudedp-2611-27 (2): nghỉ có hạn sau khi nguồn trả 403/429 —
test("2611-27 vừa bị chặn (collect RC 3) → ghi mốc nghỉ và thoát 3", () => {
  const t = moiTruong();
  const kq = chay(t, { SHIM_COLLECT_RC: 3, SHIM_CITIES: "hcmc" });
  assert.equal(kq.status, 3);
  const moc = JSON.parse(readFileSync(join(t.goc, "bi-chan.json"), "utf8"));
  assert.ok(Date.parse(moc.hetLuc) > Date.now(), "mốc nghỉ phải ghi giờ hết trong tương lai");
  // ZC18 (Mạnh duyệt Cổng Phạm vi 27/11): mặc định KHÔNG đặt biến nào phải nghỉ đúng 60 PHÚT —
  // đổi mặc định wrapper về 30 (hay giá trị khác) là ca này đỏ.
  const phut = (Date.parse(moc.hetLuc) - Date.now()) / 60_000;
  assert.ok(phut >= 58 && phut <= 62, `nghỉ mặc định phải ~60 phút (ZC18 duyệt), thực tế ${phut.toFixed(1)} phút`);
  dung(t);
});

test("2611-27 ĐANG trong khoảng nghỉ sau bị chặn → thoát 0, KHÔNG lời gọi nào tới nguồn (kể cả thu)", async () => {
  const t = moiTruong();
  const con = spawn("bash", ["-c", "sleep 30"]);
  mkdirSync(`${t.goc}.lock`);
  writeFileSync(join(`${t.goc}.lock`, "pid"), String(con.pid));
  await new Promise((r) => setTimeout(r, 200));
  con.kill("SIGTERM");
  // bash -c "sleep 30" có thể chưa chết ngay sau SIGTERM — chờ chết hẳn, nếu không
  // wrapper thấy khoá bận và thoát 0 im lặng (stdout rỗng, ca đỏ giả)
  for (let i = 0; i < 50 && spawnSync("kill", ["-0", String(con.pid)]).status === 0; i++) {
    await new Promise((r) => setTimeout(r, 20));
  }
  // vòng trước vừa bị chặn: ghi mốc nghỉ còn 20 phút
  writeFileSync(join(t.goc, "bi-chan.json"), JSON.stringify({ hetLuc: new Date(Date.now() + 20 * 60_000).toISOString() })); // ISO JS có mili-giây — ca này bắt lỗi parse mili-giây trước khi sửa mã
  const kq = chay(t);
  assert.equal(kq.status, 0, kq.stderr);
  assert.deepEqual(docLog(t), [], "trong khoảng nghỉ không được gọi node nào — kể cả thu");
  assert.match(kq.stdout, /nghỉ sau bị chặn nguồn/, "phải có dòng nhật ký nghỉ");
  assert.ok(existsSync(join(t.goc, "bi-chan.json")), "mốc nghỉ còn hạn phải giữ nguyên");
  dung(t);
});

// — claudedp-2611-27 (3, ZC18): chặn LẦN HAI trong 24 giờ → DỪNG HẲN cho tới khi NGƯỜI gỡ dấu —
test("2611-27 chặn lần hai trong 24 giờ → ghi dấu dừng hẳn, thoát 3, in dòng nói rõ + cách gỡ", () => {
  const t = moiTruong();
  // lần chặn trước cách đây 1 giờ — lần chặn này là «lần hai trong 24 giờ»
  writeFileSync(join(t.goc, "lan-chan.json"), JSON.stringify({ lanCuoi: new Date(Date.now() - 3600_000).toISOString() }));
  const kq = chay(t, { SHIM_COLLECT_RC: 3, SHIM_CITIES: "hcmc" });
  assert.equal(kq.status, 3, kq.stdout + kq.stderr);
  assert.match(kq.stdout, /DỪNG HẲN.*chặn lần hai trong 24 giờ.*rm /, "lượt bị dừng phải in dòng nói rõ và cách gỡ");
  assert.ok(existsSync(join(t.goc, "dung-han.json")), "phải ghi dấu dừng hẳn (dung-han.json)");
  assert.ok(!existsSync(join(t.goc, "bi-chan.json")), "dừng hẳn thay nghỉ — không ghi mốc nghỉ");
  dung(t);
});

test("2611-27 ĐÃ dừng hẳn: các lượt sau không gọi nguồn DÙ hết hạn nghỉ, chỉ in dòng gỡ dấu, thoát 0", () => {
  const t = moiTruong();
  writeFileSync(join(t.goc, "dung-han.json"), JSON.stringify({ lanTruoc: "2026-11-26T00:00:00Z", lanHai: "2026-11-26T01:00:00Z" }));
  // mốc nghỉ ĐÃ quá hạn — dấu dừng hẳn vẫn phải chặn trước mọi lời gọi node
  writeFileSync(join(t.goc, "bi-chan.json"), JSON.stringify({ hetLuc: new Date(Date.now() - 60_000).toISOString() }));
  const kq = chay(t);
  assert.equal(kq.status, 0, kq.stderr);
  assert.match(kq.stdout, /DỪNG HẲN.*rm /, "phải in dòng nói rõ đang dừng và cách gỡ");
  assert.deepEqual(docLog(t), [], "đang dừng hẳn thì không một lời gọi node nào — kể cả thu");
  assert.ok(existsSync(join(t.goc, "dung-han.json")), "dấu phải còn nguyên — hết hạn nghỉ không tự gỡ");
  dung(t);
});

test("2611-27 chặn lần hai SAU 24 giờ → chỉ nghỉ như lần đầu, không dừng hẳn", () => {
  const t = moiTruong();
  writeFileSync(join(t.goc, "lan-chan.json"), JSON.stringify({ lanCuoi: new Date(Date.now() - 25 * 3600_000).toISOString() }));
  const kq = chay(t, { SHIM_COLLECT_RC: 3, SHIM_CITIES: "hcmc" });
  assert.equal(kq.status, 3, kq.stdout + kq.stderr);
  assert.ok(!existsSync(join(t.goc, "dung-han.json")), "lần chặn cách đây hơn 24 giờ chỉ được nghỉ như lần đầu");
  const moc = JSON.parse(readFileSync(join(t.goc, "bi-chan.json"), "utf8"));
  assert.ok(Date.parse(moc.hetLuc) > Date.now(), "vẫn ghi mốc nghỉ trong tương lai");
  const lc = JSON.parse(readFileSync(join(t.goc, "lan-chan.json"), "utf8"));
  assert.ok(Math.abs(Date.parse(lc.lanCuoi) - Date.now()) < 120_000, "sổ giờ chặn cập nhật giờ chặn mới nhất");
  dung(t);
});

test("2611-27 người gỡ dấu bằng tay (rm dung-han.json) → chạy lại bình thường, gọi nguồn lại", () => {
  const t = moiTruong();
  writeFileSync(join(t.goc, "dung-han.json"), JSON.stringify({ lanTruoc: "x", lanHai: "y" }));
  rmSync(join(t.goc, "dung-han.json")); // đúng hành động gỡ: rm <tệp>
  const kq = chay(t, { SHIM_CITIES: "hcmc", SHIM_DA_NAP: "hcmc" });
  assert.equal(kq.status, 0, kq.stderr);
  assert.deepEqual(docLog(t).filter((d) => d.startsWith("collect")), ["collect hcmc"], "gỡ dấu xong phải gọi nguồn lại");
  assert.doesNotMatch(kq.stdout, /DỪNG HẲN/);
  dung(t);
});

test("2611-27 tắt THU_DUOI_S06_DUNG_LAN_HAI=0 → chặn lần hai chỉ nghỉ, không dấu dừng (như fc3fa4a7a)", () => {
  const t = moiTruong();
  writeFileSync(join(t.goc, "lan-chan.json"), JSON.stringify({ lanCuoi: new Date(Date.now() - 3600_000).toISOString() }));
  const kq = chay(t, { SHIM_COLLECT_RC: 3, SHIM_CITIES: "hcmc", THU_DUOI_S06_DUNG_LAN_HAI: "0" });
  assert.equal(kq.status, 3, kq.stdout + kq.stderr);
  assert.ok(!existsSync(join(t.goc, "dung-han.json")), "tắt biến thì không bao giờ dừng hẳn");
  const moc = JSON.parse(readFileSync(join(t.goc, "bi-chan.json"), "utf8"));
  assert.ok(Date.parse(moc.hetLuc) > Date.now(), "chỉ nghỉ có hạn như hành vi cũ");
  assert.doesNotMatch(kq.stdout, /DỪNG HẲN/);
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
  const kq = chay(t, { SHIM_IMPORT_RC: 1, SHIM_CITIES: "hanoi", THU_DUOI_S06_VUNG: "hanoi" });
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

test("ZC18 khuôn plist KHÔNG đè ba giá trị duyệt (một vùng đã đo, nghỉ 60 phút, luật lần hai bật)", () => {
  const nd = readFileSync(join(REPO, "pipeline", "cron", "com.oneinvest.thu-duoi-s06.plist"), "utf8");
  assert.doesNotMatch(nd, /EnvironmentVariables/, "plist không được cài khối biến môi trường — ba giá trị ZC18 là mặc định wrapper (nguồn duy nhất, test khóa)");
  for (const khoa of ["THU_DUOI_S06_VUNG", "THU_DUOI_S06_NGHI_SAU_CHAN_PHUT", "THU_DUOI_S06_DUNG_LAN_HAI"]) {
    assert.doesNotMatch(nd, new RegExp(khoa), `plist không được đè ${khoa}`);
  }
});
