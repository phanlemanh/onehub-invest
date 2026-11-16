// node --test scripts/zalo-import-job.test.mjs
// Hồ sơ transform-zalo-boc-job-run (AU3 Ngoài-3): job nạp Zalo hằng đêm (scripts/zalo-import-daily.sh) thoát ≠ 0 khi bước
// transform-zalo hoặc refresh-bait-gap hỏng. Khuôn scripts/job-exit.test.mjs: chép NGUYÊN tệp bọc thật + job-step.sh vào cây
// tạm; `node` giả đầu PATH ghi nhãn bước và hỏng theo FAIL_STEPS. HOME tạm (tệp bọc chèn $HOME/.local/node-…/bin lên đầu
// PATH — thư mục ấy không có), DATABASE_URL cổng đóng: không node thật, không DB, không OpenClaw.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = "scripts/zalo-import-daily.sh";
const BASE = "146eca2"; // main trước vòng — bản tệp bọc còn nuốt lỗi transform
const SCRATCH = mkdtempSync(path.join(realpathSync(tmpdir()), "zalo-import-job-"));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));

const SNAP = "collector/snapshots/hanoi/hanoi__zalo-agent__2026-10-25T000000Z";
const STATE = "pipeline/logs/apify-daily.state";
const MOC_CU = "2026-10-24T000000Z";
// NH1 media-canonical-reso (Hỏi-3 = B, Mạnh 30/10): transform-media đứng ngay sau transform-zalo. ZJ-AC-1, ZJ-AC-6 của
// hồ sơ transform-zalo-boc-job-run (lời «ba bước») thay bởi media-canonical-reso#AC-10. enrich-chay-sau-nap (AC-6, Mạnh
// duyệt 30/10): enrich-run đứng cuối — lời «bốn bước» của media-canonical-reso#AC-10 thay bởi enrich-chay-sau-nap#AC-6.
// pl34-lich-dem-sau-buoc (AC-1, Mạnh duyệt 09/11): doc-gop-hang-ngay sau nhả khoá nạp, trước enrich-run — lời «năm bước» của
// enrich-chay-sau-nap#AC-6 thay bởi pl34-lich-dem-sau-buoc#AC-1.
const NHAN = ["import-airbnb", "transform-zalo", "transform-media", "refresh-bait-gap", "xep-hang-gia", "doc-gop-hang-ngay", "enrich-run"];
// Tệp giả của bước đọc gộp (pl34-lich-dem-sau-buoc): gọi qua node giả nên mang nhãn doc-gop-hang-ngay, nhận FAIL_STEPS như mọi
// bước. Không chép bản thật (nó gọi node -e tính ngày rồi doc-gop-s03.ts hai lần); bản thật đo riêng ở ca PL34-AC-3 tệp thật.
const DOC_GOP = "pipeline/doc-gop-hang-ngay.sh";
const DOC_GOP_GIA = '#!/bin/bash\nexec node "$(dirname "$0")/doc-gop-hang-ngay.mjs"\n';

// node giả: nhãn = tên tệp .mjs/.js/.ts đầu tiên (không đuôi); ghi nhãn + môi trường thấy được; hỏng theo FAIL_STEPS (nhan:ma,…).
const NODE_SHIM = `#!/bin/bash
step=node
for a in "$@"; do case "$a" in *.mjs|*.js|*.ts) step="$(basename "$a")"; step="\${step%.*}"; break;; esac; done
echo "$step" >> "$CALLS"
echo "$PATH|$HOME|$DATABASE_URL" >> "$ENVS"
IFS=',' read -ra items <<< "\${FAIL_STEPS:-}"
for it in "\${items[@]}"; do
  name="\${it%%:*}"; c="\${it#*:}"
  if [ "$name" = "$step" ]; then
    if [ "\${FAIL_MSG:-}" = econn ]; then echo "Error: connect ECONNREFUSED 127.0.0.1:5433" >&2; else echo "Error: boom ($step)" >&2; fi
    exit "$c"
  fi
done
exit 0
`;
// sleep giả: nhánh ECONNREFUSED của import_one chờ 20 giây mỗi lần thử — phép đo không chờ.
const SLEEP_SHIM = "#!/bin/bash\nexit 0\n";

/** Cây tạm: tệp bọc (nội dung cho trước hoặc bản thật) + job-step.sh + một snapshot Zalo mới + state ở mốc cũ. */
function cay(noiDung) {
  const root = mkdtempSync(path.join(SCRATCH, "cay-"));
  for (const rel of [SCRIPT, "scripts/lib/job-step.sh"]) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    copyFileSync(path.join(REPO, rel), path.join(root, rel));
  }
  if (noiDung !== undefined) writeFileSync(path.join(root, SCRIPT), noiDung);
  mkdirSync(path.join(root, SNAP), { recursive: true });
  // 2510-8: tệp bọc chỉ nạp snapshot đã có manifest (thiếu manifest < 30′ = đang ghi → dừng chuỗi)
  writeFileSync(path.join(root, SNAP, "manifest.json"), "{}\n");
  mkdirSync(path.join(root, "pipeline/logs"), { recursive: true });
  mkdirSync(path.join(root, "agent")); // bước enrich-run chạy trong agent/
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

function chay(root, failSteps = "", failMsg = "") {
  const calls = path.join(root, ".calls");
  const envs = path.join(root, ".envs");
  writeFileSync(calls, "");
  writeFileSync(envs, "");
  const env = {
    PATH: `${path.join(root, ".shim-bin")}:/usr/bin:/bin`,
    HOME: path.join(root, ".home"),
    DATABASE_URL: "postgres://127.0.0.1:9/khong-co",
    CALLS: calls,
    ENVS: envs,
    FAIL_STEPS: failSteps,
    FAIL_MSG: failMsg,
  };
  const r = spawnSync("/bin/bash", [path.join(root, SCRIPT)], { cwd: root, env, encoding: "utf8", timeout: 60_000 });
  const doc = (f) => readFileSync(f, "utf8").split("\n").filter(Boolean);
  return {
    root,
    code: r.status,
    stderr: r.stderr,
    calls: doc(calls),
    envs: doc(envs),
    jobFail: r.stderr.split("\n").filter((l) => l.startsWith("JOB FAIL")),
    state: readFileSync(path.join(root, STATE), "utf8").trim(),
    env,
  };
}

const daChay = [];
const ghi = (r) => (daChay.push(r), r);

test("ZJ-AC-1 mọi bước lành → mã 0, đúng thứ tự sáu bước (NH-AC-10, pl34-lich-dem-sau-buoc AC-1), không JOB FAIL", () => {
  const r = ghi(chay(cay()));
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(r.calls, NHAN);
  assert.deepEqual(r.jobFail, [], "ZJ-AC-1 bước lành mà có dòng JOB FAIL");
  // Đối chứng dương cho ZJ-AC-3: tệp state này là tệp tệp bọc thật sự ghi.
  assert.equal(r.state, "2026-10-25T000000Z", `ZJ-AC-1 ${STATE} không chuyển sang mốc snapshot mới`);
});

test("NH-AC-10 zalo-import-daily: transform-media hỏng → ≠0, dòng ghim, bước sau vẫn chạy", () => {
  const r = ghi(chay(cay(), "transform-media:1"));
  assert.equal(r.code, 1, `NH-AC-10 transform-media hỏng: mã thoát — stderr: ${r.stderr}`);
  assert.deepEqual(r.jobFail, ["JOB FAIL [zalo-import-daily] bước transform-media mã 1"], "NH-AC-10 dòng JOB FAIL của bước ảnh");
  assert.deepEqual(r.calls, NHAN, "NH-AC-10 refresh-bait-gap vẫn chạy sau bước ảnh hỏng");
});

test("ZJ-AC-2 ma trận ba tổ hợp hỏng của hai bước làn Claude", () => {
  const MA_TRAN = [
    ["transform-zalo:3", 3, [["transform-zalo", 3]]],
    ["refresh-bait-gap:4", 4, [["refresh-bait-gap", 4]]],
    ["transform-zalo:3,refresh-bait-gap:5", 3, [["transform-zalo", 3], ["refresh-bait-gap", 5]]],
  ];
  let dem = 0;
  for (const [fail, ma, hong] of MA_TRAN) {
    const r = ghi(chay(cay(), fail));
    assert.equal(r.code, ma, `ZJ-AC-2 ${fail}: mã thoát — stderr: ${r.stderr}`);
    assert.ok(r.calls.includes("transform-zalo") && r.calls.includes("refresh-bait-gap"), `ZJ-AC-2 ${fail}: thiếu bước — ${r.calls}`);
    assert.deepEqual(
      r.jobFail,
      hong.map(([nhan, n]) => `JOB FAIL [zalo-import-daily] bước ${nhan} mã ${n}`),
      `ZJ-AC-2 ${fail}: dòng JOB FAIL`,
    );
    dem++;
  }
  assert.equal(dem, 3, "số dòng ma trận");
});

test("ZJ-AC-3 nạp hỏng (lỗi thường · DB chưa lên) → mã 1, không transform/refresh, không JOB FAIL, state giữ mốc cũ", () => {
  const MA_TRAN = [
    ["lỗi thường", "", ["import-airbnb"]],
    ["ECONNREFUSED", "econn", Array(5).fill("import-airbnb")],
  ];
  for (const [ten, msg, goi] of MA_TRAN) {
    const r = ghi(chay(cay(), "import-airbnb:2", msg));
    assert.equal(r.code, 1, `ZJ-AC-3 ${ten}: ${r.stderr}`);
    assert.deepEqual(r.calls, goi, `ZJ-AC-3 ${ten}: lời gọi`);
    assert.deepEqual(r.jobFail, [], `ZJ-AC-3 ${ten}: có dòng JOB FAIL`);
    assert.equal(r.state, MOC_CU, `ZJ-AC-3 ${ten}: ${STATE} nhảy qua snapshot hỏng`);
  }
});

const git = (...a) => execFileSync("git", ["-C", REPO, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
function banO(rev) {
  try {
    git("cat-file", "-e", `${rev}^{commit}`);
  } catch {
    assert.fail(`thiếu lịch sử git — không có commit ${rev} (checkout nông? cần fetch-depth 0)`);
  }
  return git("show", `${rev}:${SCRIPT}`);
}
const banCu = () => banO(BASE);

test("ZJ-AC-4 đối chứng: bản cũ nuốt lỗi transform, bản mới báo", () => {
  const cu = banCu();
  assert.notEqual(cu, readFileSync(path.join(REPO, SCRIPT), "utf8"), "bản hiện tại chưa khác bản cũ");
  const rCu = ghi(chay(cay(cu), "transform-zalo:3"));
  assert.equal(rCu.code, 0, "bản cũ nuốt lỗi transform — đối chứng phải thoát 0");
  const rMoi = ghi(chay(cay(), "transform-zalo:3"));
  assert.equal(rMoi.code, 3);
});

/** Phần nạp: từ đầu tệp tới hết khối «nạp hỏng thì thoát 1». */
function phanNap(src) {
  const m = src.match(/if \[ "\$FAILED" != "0" \]; then\n[^\n]*\nfi\n/);
  assert.ok(m, "ZJ-AC-5 không thấy mốc 'if [ \"$FAILED\" != \"0\" ]' (nạp hỏng thì thoát 1)");
  return src.slice(0, m.index + m[0].length);
}

test("ZJ-AC-5 vòng transform-zalo-boc-job-run (PR #96) không đổi phần nạp làn ZCode", () => {
  // Lời hứa của MỘT vòng, chứng trên tác động ròng của PR #96 lên main (merge commit e962e78: cha 1 = main trước PR) —
  // sự thật cố định, không đọc cây làm việc, không so với mốc trôi theo nhánh: ZCode sửa hợp lệ phần nạp sau này không làm ca đỏ.
  const truoc = banO("e962e78^1");
  const sau = banO("e962e78");
  const napTruoc = phanNap(truoc);
  assert.ok(napTruoc.includes("for try in 1 2 3 4 5"), "ZJ-AC-5 phần cắt của e962e78^1 không chứa vòng thử của import_one");
  const thongDiep = (rev) => `ZJ-AC-5 PR #96 đổi phần nạp của ${SCRIPT} (e962e78^1 → ${rev})`;
  assert.equal(phanNap(sau), napTruoc, thongDiep("e962e78"));
  // Đối chứng: cặp giả sửa một ký tự trong import_one → phép so báo lệch, thông điệp nêu ca, tệp và rev.
  const gia = truoc.replace("for try in 1 2 3 4 5", "for try in 1 2 3 4");
  assert.notEqual(gia, truoc, "đột biến không đổi gì");
  assert.throws(() => assert.equal(phanNap(gia), napTruoc, thongDiep("bản giả")), /ZJ-AC-5 PR #96 đổi phần nạp của scripts\/zalo-import-daily\.sh \(e962e78\^1 → bản giả\)/);
});

test("ZJ-AC-6 rào: node giả, HOME tạm không có node thật, DB cổng đóng, nhãn trong sáu bước", () => {
  assert.ok(daChay.length >= 7, "các ca chạy phải đi trước");
  for (const r of daChay) {
    assert.ok(r.env.HOME.startsWith(SCRATCH), "HOME ngoài thư mục tạm");
    assert.ok(!existsSync(path.join(r.env.HOME, ".local")), "HOME tạm có .local — node thật có thể chen lên đầu PATH");
    assert.ok(r.envs.length > 0, "node giả không ghi môi trường nào");
    for (const e of r.envs) {
      // Đo PATH mà node giả THẬT SỰ thấy (tệp bọc chèn $HOME/.local/node-…/bin lên đầu): mọi thư mục có thật trên
      // PATH ấy chỉ là node giả + /usr/bin + /bin.
      const [seen, home, db] = e.split("|");
      assert.deepEqual(
        seen.split(":").filter((d) => d && existsSync(d)),
        [path.join(r.root, ".shim-bin"), "/usr/bin", "/bin"],
        `ZJ-AC-6 PATH node giả thấy có thư mục thật ngoài rào: ${seen}`,
      );
      assert.equal(home, r.env.HOME);
      assert.equal(db, "postgres://127.0.0.1:9/khong-co");
    }
    for (const c of r.calls) assert.ok(NHAN.includes(c), `nhãn lạ: ${c}`);
  }
});

// ---- pl34-lich-dem-sau-buoc ----
// Đọc khi cần, không lúc nạp tệp: ZL-AC-1 chạy ZJ-AC-5 trên cây đã xoá tệp bọc.
const that = () => readFileSync(path.join(REPO, SCRIPT), "utf8");
const DONG_DOC_GOP = 'job_run zalo-import-daily doc-gop-hang-ngay bash "$ROOT/pipeline/doc-gop-hang-ngay.sh"\n';
const DONG_ENRICH = "job_run zalo-import-daily enrich-run enrich_run\n";
/** Bản sao tệp bọc: thay đúng một chuỗi (phải có mặt). */
function dotBien(cu, moi, src = that()) {
  assert.ok(src.includes(cu), `đột biến không khớp chuỗi: ${cu}`);
  return src.replace(cu, moi);
}
/** Dãy bước của một lượt lành phải có doc-gop-hang-ngay ngay trước enrich-run. */
function kiemSauBuoc(calls) {
  if (!calls.includes("doc-gop-hang-ngay")) throw new Error("PL34-AC-1 thiếu bước doc-gop-hang-ngay");
  if (calls.indexOf("doc-gop-hang-ngay") > calls.indexOf("enrich-run")) throw new Error("PL34-AC-1 doc-gop-hang-ngay phải đứng trước enrich-run");
  assert.deepEqual(calls, NHAN, "PL34-AC-1 dãy sáu bước");
}

test("PL34-AC-1 thứ tự: doc-gop-hang-ngay đứng giữa refresh-bait-gap và enrich-run; bỏ dòng hay dời sau enrich-run thì đỏ", () => {
  kiemSauBuoc(ghi(chay(cay())).calls);
  assert.throws(() => kiemSauBuoc(chay(cay(dotBien(DONG_DOC_GOP, ""))).calls), /PL34-AC-1 thiếu bước doc-gop-hang-ngay/);
  const sau = dotBien(DONG_ENRICH, DONG_ENRICH + DONG_DOC_GOP, dotBien(DONG_DOC_GOP, ""));
  assert.throws(() => kiemSauBuoc(chay(cay(sau)).calls), /PL34-AC-1 doc-gop-hang-ngay phải đứng trước enrich-run/);
});

test("PL34-AC-1 không mới: state đã ở snapshot mới nhất → mã 0, không nạp, năm bước sau vẫn chạy kể cả doc-gop-hang-ngay", () => {
  const moi = cay();
  writeFileSync(path.join(moi, STATE), "2026-10-25T000000Z");
  const r = chay(moi);
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(r.jobFail, [], "PL34-AC-1 không mới: có dòng JOB FAIL");
  assert.deepEqual(r.calls, NHAN.slice(1), "PL34-AC-1 không có snapshot mới thì bỏ nạp mà vẫn chạy năm bước sau");
  // Đối chứng dương cùng ca: state ở mốc cũ thì có bước nạp.
  assert.equal(chay(cay()).calls[0], "import-airbnb", "PL34-AC-1 đối chứng: state cũ mà không nạp");
});

/** Đường tệp bước đọc gộp mà dòng job_run trỏ; ném khi tệp không có trong kho. */
function kiemTepBuoc(src) {
  const m = src.match(/^job_run zalo-import-daily doc-gop-hang-ngay bash "\$ROOT\/([^"]+)"$/m);
  assert.ok(m, "PL34-AC-3 không thấy dòng job_run doc-gop-hang-ngay");
  if (!existsSync(path.join(REPO, m[1]))) throw new Error(`PL34-AC-3 tệp bước không có trong kho: ${m[1]}`);
  return m[1];
}

test("PL34-AC-3 dòng job_run trỏ đúng tệp bước có trong kho; đường sai thì đỏ gọi tên", () => {
  assert.equal(kiemTepBuoc(that()), DOC_GOP);
  assert.throws(() => kiemTepBuoc(that().replace(`$ROOT/${DOC_GOP}`, "$ROOT/pipeline/doc-gop-khong-co.sh")),
    /PL34-AC-3 tệp bước không có trong kho: pipeline\/doc-gop-khong-co\.sh/);
});

// node giả cho ca tệp thật: `node -e` (tính ngày VN) chạy node thật; lời gọi khác ghi cwd + argv, thoát 0.
const NODE_THAT = process.execPath;
const NODE_SHIM_THAT = `#!/bin/bash
if [ "\${1:-}" = -e ]; then exec "${NODE_THAT}" "$@"; fi
step=node
for a in "$@"; do case "$a" in *.mjs|*.js|*.ts) step="$(basename "$a")"; step="\${step%.*}"; break;; esac; done
echo "$step" >> "$CALLS"
printf '%s' "$PWD" >> "$ARGV"; for a in "$@"; do printf '\\t%s' "$a" >> "$ARGV"; done; printf '\\n' >> "$ARGV"
exit 0
`;
/** Lời gọi doc-gop-s03.ts của tệp bước thật khi chạy trong job; `tepThat` là nội dung tệp bước đặt vào cây. */
function chayTepThat(tepThat) {
  const root = cay();
  writeFileSync(path.join(root, DOC_GOP), tepThat);
  // Máy thu có .env ở gốc kho; tệp bước truyền --env-file khi có (không có thì bash 3.2 + set -u báo ENV_FILE[@] unbound).
  writeFileSync(path.join(root, ".env"), "");
  writeFileSync(path.join(root, ".shim-bin/node"), NODE_SHIM_THAT);
  const argv = path.join(root, ".argv");
  writeFileSync(argv, "");
  const r = chay(root);
  // chay() dựng env mới; chạy lại với ARGV + DOC_GOP_BAY_GIO cố định.
  writeFileSync(path.join(root, ".calls"), "");
  writeFileSync(path.join(root, STATE), MOC_CU);
  const env = { ...r.env, ARGV: argv, DOC_GOP_BAY_GIO: "2026-11-09T01:00:00Z" };
  const k = spawnSync("/bin/bash", [path.join(root, SCRIPT)], { cwd: root, env, encoding: "utf8", timeout: 60_000 });
  const goi = readFileSync(argv, "utf8").split("\n").filter(Boolean).map((l) => l.split("\t"))
    .filter((a) => a.includes("scripts/doc-gop-s03.ts"));
  return { root, code: k.status, stderr: k.stderr, goi };
}
function kiemTepThat({ root, code, stderr, goi }) {
  assert.equal(code, 0, `PL34-AC-3 job với tệp thật thoát khác 0 — ${stderr}`);
  assert.equal(goi.length, 2, `PL34-AC-3 số lời gọi doc-gop-s03.ts: ${goi.length}`);
  for (const [cwd] of goi) if (cwd !== path.join(root, "agent")) throw new Error(`PL34-AC-3 doc-gop-s03 không chạy trong agent/: ${cwd}`);
  assert.deepEqual(goi.map((a) => a.slice(1)), ["2026-11-08", "2026-11-07"].map((ngay) =>
    [`--env-file=${path.join(root, ".env")}`, "--import", "tsx", "scripts/doc-gop-s03.ts", "hang-ngay", "--ngay", ngay, "--tran-ngay-usd", "20"]),
  "PL34-AC-3 đối số hai lời gọi");
}

test("PL34-AC-3 tệp thật: chạy trong job gọi doc-gop-s03.ts hai lần trong agent/, hôm qua rồi hôm kia giờ VN", () => {
  const that = readFileSync(path.join(REPO, DOC_GOP), "utf8");
  kiemTepThat(chayTepThat(that));
  const lech = that.replace('cd "$ROOT/agent"', 'cd "$ROOT"');
  assert.notEqual(lech, that, "đột biến không đổi gì");
  assert.throws(() => kiemTepThat(chayTepThat(lech)), /PL34-AC-3 doc-gop-s03 không chạy trong agent\//);
});

// Bảy tệp test của kho nhắc zalo-import-daily (đo 09/11) — thêm tệp mới thì kê vào đây và vào AC-4 của hồ sơ.
const TEP_NHAC = [
  "pipeline/scripts/hang-gia.test.mjs",   // CG9 AC-11: thứ tự bước xep-hang-gia
  "pipeline/scripts/importer-bo-qua-du-lieu-thu.test.mjs",
  "pipeline/scripts/media-wiring.test.mjs",
  "scripts/enrich-buoc-job.test.mjs",
  "scripts/nap-argmax.test.mjs",
  "scripts/nap-ts-order.test.mjs",
  "scripts/zalo-import-job-khoa.itest.mjs",
  "scripts/zalo-import-job-lan.test.mjs",
  "scripts/zalo-import-job-nhe.test.mjs",
  "scripts/zalo-import-job.test.mjs",
];
function quetTepNhac() {
  const ra = [];
  const di = (d) => {
    for (const e of readdirSync(path.join(REPO, d), { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const rel = path.join(d, e.name);
      if (e.isDirectory()) di(rel);
      else if (/\.(test|itest)\.(mjs|js|ts|tsx)$/.test(e.name) && readFileSync(path.join(REPO, rel), "utf8").includes("zalo-import-daily")) ra.push(rel);
    }
  };
  for (const d of ["scripts", "pipeline", "app/tests", "agent/tests"]) if (existsSync(path.join(REPO, d))) di(d);
  return ra.sort();
}
function soTepNhac(thay, ke) {
  for (const f of thay) if (!ke.includes(f)) throw new Error(`PL34-AC-4 tệp test nhắc zalo-import-daily chưa kê: ${f}`);
  assert.deepEqual(thay, [...ke].sort(), "PL34-AC-4 tập tệp kê có tệp không còn nhắc zalo-import-daily");
}

test("PL34-AC-4 tập tệp: mọi tệp test nhắc zalo-import-daily đúng bằng mười tệp kê trước (s03-len-nhanh-nac-1 thêm hai, CG9 thêm một); thiếu một thì đỏ gọi tên", () => {
  const thay = quetTepNhac();
  assert.equal(thay.length, 10, `PL34-AC-4 số tệp quét: ${thay.join(", ")}`);
  soTepNhac(thay, TEP_NHAC);
  assert.throws(() => soTepNhac(thay, TEP_NHAC.filter((f) => f !== "scripts/nap-argmax.test.mjs")),
    /PL34-AC-4 tệp test nhắc zalo-import-daily chưa kê: scripts\/nap-argmax\.test\.mjs/);
});

/** Đường log trong lệnh `grep 'JOB FAIL' <tệp>` nói về zalo-import; null khi không có. */
function duongGrep(doc) {
  const m = doc.match(/grep 'JOB FAIL' (\S*zalo-import\S*?)`/);
  return m ? m[1] : null;
}

test("ZJ-AC-7 sổ vận hành: dòng zalo-import trong bảng job đêm, lệnh grep trỏ đúng log của plist", () => {
  const doc = readFileSync(path.join(REPO, "docs/ops/runtime-map.md"), "utf8");
  const dong = doc.split("\n").find((l) => l.startsWith("|") && l.includes("com.oneinvest.zalo-import"));
  assert.ok(dong, "ZJ-AC-7 thiếu dòng bảng com.oneinvest.zalo-import");
  assert.ok(dong.includes("scripts/zalo-import-daily.sh") && dong.includes("thoát ≠ 0 (mã của bước hỏng đầu)"), dong);
  const plist = readFileSync(path.join(REPO, "pipeline/cron/com.oneinvest.zalo-import.plist"), "utf8");
  const err = plist.match(/<key>StandardErrorPath<\/key><string>__ROOT__\/([^<]+)<\/string>/)?.[1];
  assert.ok(err, "ZJ-AC-7 plist không có StandardErrorPath dưới __ROOT__");
  assert.equal(duongGrep(doc), err, "ZJ-AC-7 lệnh grep trỏ khác tệp log stderr của plist");
  // Đối chứng: bản sao tài liệu đổi đường log → phép so lệch.
  assert.notEqual(duongGrep(doc.replace(`grep 'JOB FAIL' ${err}`, "grep 'JOB FAIL' pipeline/logs/zalo-import.err")), err);
});
