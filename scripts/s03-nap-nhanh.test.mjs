// node --test scripts/s03-nap-nhanh.test.mjs
// claudedp-1011-3 nấc 1 «S03 lên nhanh» (Mạnh chốt 10/11; giám sát cho bật 10/11 sau N1 đo ≈ 76s/lượt): lượt nạp S03
// 15′ ban ngày gọi tệp bọc với --luot-nhanh. Cờ chỉ đổi (1) lấy khoá — bận thì bỏ lượt, thoát 0; (2) export
// S03_LUOT_NHANH=1; chuỗi chạy nạp → transform → media → refresh, BỎ đọc gộp + enrich (giữ ở lượt 00:00).
// Khuôn scripts/<job nạp S03>.test.mjs: chép NGUYÊN tệp bọc thật + job-step.sh vào cây tạm; `node` giả đầu PATH ghi
// nhãn bước + S03_LUOT_NHANH; HOME tạm, DATABASE_URL cổng đóng — không node thật, không DB, không launchctl.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Tên tệp bọc đọc từ plist của lượt nhanh (đối số thứ hai của ProgramArguments) — test không tự gõ tên nguồn.
const PLIST = "pipeline/cron/com.oneinvest.s03-nap-15phut.plist";
const PLIST_SRC = readFileSync(path.join(REPO, PLIST), "utf8");
const SCRIPT = PLIST_SRC.match(/<string>__ROOT__\/(scripts\/[^<]+\.sh)<\/string>/)[1];
const KENH = SCRIPT.match(/scripts\/([a-z]+)-import-daily\.sh/)[1];
const SCRATCH = mkdtempSync(path.join(realpathSync(tmpdir()), "s03-nap-nhanh-"));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));

const SNAP = `collector/snapshots/hanoi/hanoi__${KENH}-agent__2026-10-25T000000Z`;
const STATE = "pipeline/logs/apify-daily.state";
const KHOA = `${STATE}.lock`;
const MOC_CU = "2026-10-24T000000Z";
const MOC_MOI = "2026-10-25T000000Z";
const NHAN_DU = ["import-airbnb", `transform-${KENH}`, "transform-media", "refresh-bait-gap", "doc-gop-hang-ngay", "enrich-run"];
const NHAN_NHANH = NHAN_DU.slice(0, 4);
const DOC_GOP = "pipeline/doc-gop-hang-ngay.sh";
const DOC_GOP_GIA = '#!/bin/bash\nexec node "$(dirname "$0")/doc-gop-hang-ngay.mjs"\n';

// node giả: nhãn = tên tệp .mjs/.js/.ts đầu tiên; ghi «nhãn S03_LUOT_NHANH»; hỏng theo FAIL_STEPS (nhan:ma,…);
// CHAM_BUOC=<nhãn> thì ngủ CHAM_GIAY giây bằng /bin/sleep thật (để dựng hai lượt chồng nhau).
const NODE_SHIM = `#!/bin/bash
step=node
for a in "$@"; do case "$a" in *.mjs|*.js|*.ts) step="$(basename "$a")"; step="\${step%.*}"; break;; esac; done
echo "$step \${S03_LUOT_NHANH:-unset}" >> "$CALLS"
[ -n "\${CHAM_BUOC:-}" ] && [ "$step" = "$CHAM_BUOC" ] && /bin/sleep "\${CHAM_GIAY:-2}"
IFS=',' read -ra items <<< "\${FAIL_STEPS:-}"
for it in "\${items[@]}"; do
  name="\${it%%:*}"; c="\${it#*:}"
  [ "$name" = "$step" ] && { echo "Error: boom ($step)" >&2; exit "$c"; }
done
exit 0
`;
// sleep giả: vòng chờ khoá của lượt 00:00 (60 × 5s) và retry ECONNREFUSED không chờ thật.
const SLEEP_SHIM = "#!/bin/bash\nexit 0\n";

function cay() {
  const root = mkdtempSync(path.join(SCRATCH, "cay-"));
  for (const rel of [SCRIPT, "scripts/lib/job-step.sh"]) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    copyFileSync(path.join(REPO, rel), path.join(root, rel));
  }
  mkdirSync(path.join(root, SNAP), { recursive: true });
  writeFileSync(path.join(root, SNAP, "manifest.json"), "{}\n");
  mkdirSync(path.join(root, "pipeline/logs"), { recursive: true });
  mkdirSync(path.join(root, "agent"));
  writeFileSync(path.join(root, DOC_GOP), DOC_GOP_GIA);
  writeFileSync(path.join(root, STATE), MOC_CU);
  const bin = path.join(root, ".shim-bin");
  mkdirSync(bin);
  writeFileSync(path.join(bin, "node"), NODE_SHIM);
  chmodSync(path.join(bin, "node"), 0o755);
  writeFileSync(path.join(bin, "sleep"), SLEEP_SHIM);
  chmodSync(path.join(bin, "sleep"), 0o755);
  mkdirSync(path.join(root, ".home"));
  return root;
}

function moiTruong(root, ten, extra = {}) {
  const calls = path.join(root, `.calls-${ten}`);
  writeFileSync(calls, "");
  return {
    calls,
    env: {
      PATH: `${path.join(root, ".shim-bin")}:/usr/bin:/bin`,
      HOME: path.join(root, ".home"),
      DATABASE_URL: "postgres://127.0.0.1:9/khong-co",
      CALLS: calls,
      ...extra,
    },
  };
}

const docDong = (f) => readFileSync(f, "utf8").split("\n").filter(Boolean);

function chay(root, args = [], extra = {}, ten = "a") {
  const { calls, env } = moiTruong(root, ten, extra);
  const r = spawnSync("/bin/bash", [path.join(root, SCRIPT), ...args], { cwd: root, env, encoding: "utf8", timeout: 60_000 });
  const goi = docDong(calls);
  return {
    code: r.status,
    out: r.stdout + r.stderr,
    buoc: goi.map((l) => l.split(" ")[0]),
    co: goi.map((l) => l.split(" ")[1]),
    state: readFileSync(path.join(root, STATE), "utf8").trim(),
    conKhoa: existsSync(path.join(root, KHOA)),
  };
}

/** Khoá do «lượt khác» giữ: PID còn sống (chính tiến trình test), lấy lúc vừa xong. */
function khoaSong(root) {
  mkdirSync(path.join(root, KHOA));
  writeFileSync(path.join(root, KHOA, "pid"), `${process.pid}\n`);
  writeFileSync(path.join(root, KHOA, "luc"), `${Math.floor(Date.now() / 1000)}\n`);
}

test("NN-1 lượt nhanh lành: nạp → transform → media → refresh, BỎ đọc gộp + enrich, mã 0, state tiến, nhả khoá", () => {
  const r = chay(cay(), ["--luot-nhanh"]);
  assert.equal(r.code, 0, r.out);
  assert.deepEqual(r.buoc, NHAN_NHANH, "lượt nhanh phải dừng sau refresh");
  assert.ok(r.out.includes("lượt nhanh: bỏ đọc gộp + enrich"), r.out);
  assert.equal(r.state, MOC_MOI, "lượt nhanh phải nạp snapshot mới vào stg (state tiến)");
  assert.equal(r.conKhoa, false, "lượt nhanh phải nhả khoá nạp khi thoát");
  assert.deepEqual([...new Set(r.co)], ["1"], "mọi bước của lượt nhanh thấy S03_LUOT_NHANH=1");
});

test("NN-2 lượt 00:00 (không cờ) giữ nguyên: đủ sáu bước, S03_LUOT_NHANH=0, mã 0", () => {
  const r = chay(cay());
  assert.equal(r.code, 0, r.out);
  assert.deepEqual(r.buoc, NHAN_DU);
  assert.equal(r.out.includes("lượt nhanh"), false, "lượt thường không được in dòng lượt nhanh");
  assert.deepEqual([...new Set(r.co)], ["0"]);
  assert.equal(r.state, MOC_MOI);
  assert.equal(r.conKhoa, false);
});

test("NN-3 lượt nhanh gặp khoá sống: in «bỏ lượt», mã 0, không bước nào chạy, không đụng state lẫn khoá", () => {
  const root = cay();
  khoaSong(root);
  const r = chay(root, ["--luot-nhanh"]);
  assert.equal(r.code, 0, r.out);
  assert.ok(r.out.includes("bỏ lượt"), r.out);
  assert.deepEqual(r.buoc, []);
  assert.equal(r.state, MOC_CU, "bỏ lượt mà state vẫn đổi");
  assert.equal(r.conKhoa, true, "lượt nhanh bỏ lượt không được xoá khoá của lượt khác");
  assert.equal(readFileSync(path.join(root, KHOA, "pid"), "utf8").trim(), String(process.pid));
});

test("NN-4 đối chứng: lượt 00:00 gặp khoá sống thì CHỜ (không bỏ lượt) rồi thoát 1 khi bận quá trần — hành vi cũ", () => {
  const root = cay();
  khoaSong(root);
  const r = chay(root);
  assert.equal(r.code, 1, r.out);
  assert.equal(r.out.includes("bỏ lượt"), false);
  assert.ok(r.out.includes("bận >5′"), r.out);
  assert.deepEqual(r.buoc, []);
  assert.equal(r.state, MOC_CU);
});

test("NN-5 lượt nhanh gặp khoá của PID đã chết: dọn khoá rồi chạy lượt bình thường", () => {
  const root = cay();
  mkdirSync(path.join(root, KHOA));
  writeFileSync(path.join(root, KHOA, "pid"), "999999\n");
  writeFileSync(path.join(root, KHOA, "luc"), `${Math.floor(Date.now() / 1000)}\n`);
  const r = chay(root, ["--luot-nhanh"]);
  assert.equal(r.code, 0, r.out);
  assert.ok(r.out.includes("PID 999999"), r.out);
  assert.deepEqual(r.buoc, NHAN_NHANH);
  assert.equal(r.conKhoa, false);
});

test("NN-6 lượt nhanh: transform hỏng → mã ≠0 + JOB FAIL, refresh vẫn chạy, vẫn KHÔNG đọc gộp + enrich", () => {
  const r = chay(cay(), ["--luot-nhanh"], { FAIL_STEPS: `transform-${KENH}:4` });
  assert.equal(r.code, 4, r.out);
  assert.ok(r.out.includes(`JOB FAIL [${KENH}-import-daily] bước transform-${KENH} mã 4`), r.out);
  assert.deepEqual(r.buoc, NHAN_NHANH);
  assert.equal(r.conKhoa, false);
});

test("NN-7 lượt nhanh: nạp hỏng → mã 1, state giữ, không bước sau nào chạy", () => {
  const r = chay(cay(), ["--luot-nhanh"], { FAIL_STEPS: "import-airbnb:2" });
  assert.equal(r.code, 1, r.out);
  assert.deepEqual(r.buoc, ["import-airbnb"]);
  assert.equal(r.state, MOC_CU);
  assert.equal(r.conKhoa, false);
});

test("NN-8 hai lượt nhanh chồng nhau: lượt sau bỏ lượt (mã 0, không bước nào), lượt trước chạy trọn; lượt kế sau đó chạy bình thường", async () => {
  const root = cay();
  const a = moiTruong(root, "truoc", { CHAM_BUOC: `transform-${KENH}`, CHAM_GIAY: "3" });
  const pa = spawn("/bin/bash", [path.join(root, SCRIPT), "--luot-nhanh"], { cwd: root, env: a.env });
  let outA = "";
  pa.stdout.on("data", (d) => (outA += d));
  pa.stderr.on("data", (d) => (outA += d));
  const xongA = new Promise((res) => pa.on("close", res));
  // chờ lượt trước cầm khoá và tới bước chậm
  for (let i = 0; i < 100 && !docDong(a.calls).some((l) => l.startsWith(`transform-${KENH}`)); i++) await new Promise((r) => setTimeout(r, 50));
  assert.ok(existsSync(path.join(root, KHOA)), "lượt trước chưa cầm khoá");
  const b = chay(root, ["--luot-nhanh"], {}, "sau");
  assert.equal(b.code, 0, b.out);
  assert.ok(b.out.includes("bỏ lượt"), b.out);
  assert.deepEqual(b.buoc, [], "lượt sau chạy chồng lên lượt trước");
  const codeA = await xongA;
  assert.equal(codeA, 0, outA);
  assert.deepEqual(docDong(a.calls).map((l) => l.split(" ")[0]), NHAN_NHANH);
  assert.equal(existsSync(path.join(root, KHOA)), false);
  const c = chay(root, ["--luot-nhanh"], {}, "ke");
  assert.equal(c.code, 0, c.out);
  assert.equal(c.out.includes("bỏ lượt"), false, c.out);
  assert.equal(c.state, MOC_MOI);
});

test("NN-9 plist: 61 mốc mỗi 15′ từ 7:00 tới 22:00, gọi --luot-nhanh, log riêng, không mốc sau 22:00", () => {
  const moc = [...PLIST_SRC.matchAll(/<key>Hour<\/key><integer>(\d+)<\/integer><key>Minute<\/key><integer>(\d+)<\/integer>/g)].map(
    (m) => Number(m[1]) * 60 + Number(m[2]),
  );
  const mong = [];
  for (let t = 7 * 60; t <= 22 * 60; t += 15) mong.push(t);
  assert.deepEqual(moc, mong);
  assert.ok(PLIST_SRC.includes("<string>--luot-nhanh</string>"));
  assert.equal(PLIST_SRC.includes("--chi-nap"), false);
  assert.ok(PLIST_SRC.includes("<string>com.oneinvest.s03-nap-15phut</string>"));
  assert.ok(PLIST_SRC.includes("pipeline/logs/s03-nap-15phut.log"));
  const r = spawnSync("plutil", ["-lint", path.join(REPO, PLIST)], { encoding: "utf8" });
  if (r.error?.code !== "ENOENT") assert.equal(r.status, 0, r.stdout + r.stderr);
});
