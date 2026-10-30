// node --test scripts/zalo-import-job.test.mjs
// Hồ sơ transform-zalo-boc-job-run (AU3 Ngoài-3): job nạp Zalo hằng đêm (scripts/zalo-import-daily.sh) thoát ≠ 0 khi bước
// transform-zalo hoặc refresh-bait-gap hỏng. Khuôn scripts/job-exit.test.mjs: chép NGUYÊN tệp bọc thật + job-step.sh vào cây
// tạm; `node` giả đầu PATH ghi nhãn bước và hỏng theo FAIL_STEPS. HOME tạm (tệp bọc chèn $HOME/.local/node-…/bin lên đầu
// PATH — thư mục ấy không có), DATABASE_URL cổng đóng: không node thật, không DB, không OpenClaw.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
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
const NHAN = ["import-airbnb", "transform-zalo", "transform-media", "refresh-bait-gap", "enrich-run"];

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

test("ZJ-AC-1 mọi bước lành → mã 0, đúng thứ tự năm bước (NH-AC-10, enrich-chay-sau-nap AC-6), không JOB FAIL", () => {
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

test("ZJ-AC-6 rào: node giả, HOME tạm không có node thật, DB cổng đóng, nhãn trong ba bước", () => {
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
