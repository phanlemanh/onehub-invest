// ops-apply-plist.test.mjs — hồ sơ _acceptance/so-lenh-sua-sau-tv4, ca «SS-AC-6» (plist neo node bằng chỗ giữ __NODE__)
// và «SS-AC-7» (chạy ĐÚNG dòng cài trong docs/ops/runtime-map.md vào thư mục tạm, node chạy được dưới PATH tối giản
// của launchd). Không DB, không mạng, không chạm ~/Library/LaunchAgents thật, không gọi launchctl.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { accessSync, constants, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const GOC = path.join(DIR, "..", "..");
const PLIST = path.join(GOC, "pipeline", "cron", "com.oneinvest.ops-apply.plist");
const RUNTIME_MAP = path.join(GOC, "docs", "ops", "runtime-map.md");
const LAUNCH_THAT = path.join(homedir(), "Library", "LaunchAgents");
// plist và launchd chỉ có trên macOS (máy thu); runner CI Linux không có plutil → bỏ qua có tên, không đỏ giả.
const KHONG_PLUTIL = spawnSync("plutil", ["-help"], { encoding: "utf8" }).error
  ? "cần plutil của macOS (máy thu) — runner này không có"
  : false;

/** plist → JSON qua plutil. */
function docPlist(tep) {
  const r = spawnSync("plutil", ["-convert", "json", "-o", "-", tep], { encoding: "utf8" });
  assert.equal(r.status, 0, `plutil đọc ${tep}: ${r.stderr}`);
  return JSON.parse(r.stdout);
}

/** Kiểm plist nguồn (AC-6). Ném AssertionError nêu chỗ sai. */
function kiemPlistNguon(tep) {
  const chu = readFileSync(tep, "utf8");
  assert.ok(!chu.includes("/usr/bin/env"), "plist còn /usr/bin/env — launchd không tìm thấy node");
  assert.deepEqual(docPlist(tep).ProgramArguments, ["__NODE__", "__ROOT__/pipeline/ops-apply.mjs"]);
}

/** Rút dòng cài: đúng một dòng mang tên plist và __NODE__. */
function rutDongCai(chu) {
  const dong = chu.split("\n").filter((d) => d.includes("com.oneinvest.ops-apply.plist") && d.includes("__NODE__"));
  assert.equal(dong.length, 1, `runtime-map phải có đúng 1 dòng cài, thấy ${dong.length}`);
  return dong[0].trim();
}

/** Kiểm rồi chạy dòng cài vào thư mục tạm; trả đường plist sinh ra. Ném trước khi chạy nếu dòng chạm launchd. */
function chayDongCai(dong, tam) {
  assert.ok(!dong.includes("launchctl"), "dòng cài chứa launchctl — chạy trong phép đo sẽ nạp job vào launchd thật");
  assert.equal(dong.split("~/Library/LaunchAgents").length, 2, "dòng cài phải ghi vào ~/Library/LaunchAgents đúng một lần");
  const thay = dong.replace("~/Library/LaunchAgents", tam);
  assert.ok(!thay.includes("Library/LaunchAgents"), "sau thay vẫn còn đường LaunchAgents");
  const r = spawnSync("bash", ["-c", thay], { cwd: GOC, encoding: "utf8", env: { ...process.env, HOME: tam } });
  assert.equal(r.status, 0, `dòng cài thoát ${r.status}: ${r.stderr}`);
  return path.join(tam, "com.oneinvest.ops-apply.plist");
}

/** Kiểm plist đã cài (AC-7). */
function kiemPlistDaCai(tep) {
  assert.equal(spawnSync("plutil", ["-lint", tep], { encoding: "utf8" }).status, 0, "plutil -lint plist sinh ra");
  const chu = readFileSync(tep, "utf8");
  assert.ok(!chu.includes("__NODE__"), "plist sinh ra còn __NODE__");
  assert.ok(!chu.includes("__ROOT__"), "plist sinh ra còn __ROOT__");
  const [node, tepApply] = docPlist(tep).ProgramArguments;
  assert.ok(path.isAbsolute(node), `ProgramArguments[0] không tuyệt đối: ${node}`);
  accessSync(node, constants.X_OK);
  const v = spawnSync("env", ["-i", "PATH=/usr/bin:/bin:/usr/sbin:/sbin", node, "-v"], { encoding: "utf8" });
  assert.equal(v.status, 0, `node không chạy dưới PATH tối giản: ${v.stderr}`);
  assert.ok(existsSync(tepApply) && tepApply.endsWith("/pipeline/ops-apply.mjs"), `ProgramArguments[1] sai: ${tepApply}`);
}

const chupThat = () =>
  existsSync(LAUNCH_THAT) ? readdirSync(LAUNCH_THAT).sort().map((f) => [f, statSync(path.join(LAUNCH_THAT, f)).mtimeMs]) : null;

test("SS-AC-6 plist neo node bằng __NODE__, không còn /usr/bin/env", { skip: KHONG_PLUTIL }, () => {
  kiemPlistNguon(PLIST);
  // Đối chứng đỏ: plist đời TV4.
  const tam = mkdtempSync(path.join(tmpdir(), "plist-tv4-"));
  try {
    const cu = readFileSync(PLIST, "utf8").replace("<string>__NODE__</string>", "<string>/usr/bin/env</string>\n    <string>node</string>");
    const tep = path.join(tam, "cu.plist");
    writeFileSync(tep, cu);
    assert.throws(() => kiemPlistNguon(tep), /\/usr\/bin\/env/);
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
});

test("SS-AC-7 chạy đúng dòng cài của runtime-map vào thư mục tạm: node tuyệt đối chạy dưới PATH launchd", { skip: KHONG_PLUTIL }, () => {
  const dong = rutDongCai(readFileSync(RUNTIME_MAP, "utf8"));
  const truoc = chupThat();
  const tam = mkdtempSync(path.join(tmpdir(), "launch-tam-"));
  try {
    kiemPlistDaCai(chayDongCai(dong, tam));
    // Đối chứng đỏ 1: dòng cài bỏ vế thay __NODE__.
    const boNode = dong.replace(/-e "s#__NODE__#[^"]*" /, "");
    assert.notEqual(boNode, dong, "không gỡ được vế thay __NODE__ để làm đối chứng");
    const tam2 = mkdtempSync(path.join(tmpdir(), "launch-tam-"));
    try {
      assert.throws(() => kiemPlistDaCai(chayDongCai(boNode, tam2)), /__NODE__/);
    } finally {
      rmSync(tam2, { recursive: true, force: true });
    }
    // Đối chứng đỏ 2: dòng cài thêm launchctl — bị chặn TRƯỚC khi chạy.
    assert.throws(() => chayDongCai(`${dong} && launchctl load ~/x.plist`, tam), /launchctl/);
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
  assert.deepEqual(chupThat(), truoc, "~/Library/LaunchAgents thật đã bị chạm");
});
