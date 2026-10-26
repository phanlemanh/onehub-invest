// node --test scripts/auth-error-thu-lai-retry.test.mjs
// Hồ sơ _acceptance/auth-error-thu-lai-retry, ca «AER-AC-n»: _acceptance/config.yaml là YAML chuẩn mà không lệnh nào đổi
// nghĩa (AC-2), và ô E4 của hồ sơ đã ký auth-hop-chuan được thay đúng khuôn superseded_by (AC-4). Không cần DB.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, test } from "node:test";

const REPO = path.join(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const { resolveConfigKey } = require(path.join(REPO, "lib/evidence-core.cjs"));
const { parseEvals } = require(path.join(REPO, "lib/eval-yaml.cjs"));

const CONFIG = "_acceptance/config.yaml";
// «Không lệnh nào đổi nghĩa» là bất biến của MỘT lần sửa: so config.yaml trước và sau commit sửa của vòng (cha giống từng byte
// bc6e5120). KHÔNG so cây đang kiểm hay merge-base — PR khác thêm/sửa khoá là việc hợp lệ (hàng aer-ac2-so-cap-co-dinh).
const FIX_COMMIT = "5e396cb2";

/** So cặp blob cố định qua bộ đọc `show(rev)`; không đọc cây đang kiểm. */
export function soCapCoDinh(show) {
  const before = show(`${FIX_COMMIT}^`);
  const after = show(FIX_COMMIT);
  return { doi: before !== after, ...kitBeforeAfter(before, after) };
}
const SUPERSEDE = "auth-error-thu-lai-retry#AC-1";

/** `yaml` chỉ có ở pipeline/ — thử checkout này rồi checkout chính (worktree không có node_modules riêng). */
function loadYaml() {
  const candidates = [path.join(REPO, "pipeline/package.json")];
  try {
    const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: REPO, encoding: "utf8" }).trim();
    candidates.push(path.join(path.dirname(common), "pipeline/package.json"));
  } catch {
    /* không phải git checkout — chỉ thử pipeline/ cạnh script */
  }
  for (const pkg of candidates) {
    try {
      return createRequire(pkg)("yaml");
    } catch {
      /* thử ứng viên kế */
    }
  }
  throw new Error("không tìm thấy module yaml — chạy `cd pipeline && npm install` trước");
}
const YAML = loadYaml();

export function strictErrors(text) {
  return YAML.parseDocument(text, { uniqueKeys: true }).errors.map((e) => ({ code: e.code, line: e.linePos?.[0]?.line }));
}

/** Khoá lá 2–3 cấp (độ sâu resolveConfigKey đọc được), lấy từ bộ đọc chuẩn không ép khoá duy nhất (khoá lặp: dòng sau thắng). */
function leafKeys(obj, prefix = [], out = []) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const p = [...prefix, k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      if (p.length < 3) leafKeys(v, p, out);
    } else if (p.length >= 2 && (typeof v === "string" || typeof v === "number" || typeof v === "boolean")) {
      out.push([p.join("."), String(v)]);
    }
  }
  return out;
}
// Liệt khoá kể cả trên bản không chuẩn (bản trước vòng chính là bản hỏng) — giá trị so bằng bộ đọc kit, không lấy từ đây.
const loose = (text) => YAML.parseDocument(text, { uniqueKeys: false }).toJS() ?? {};

/** Khoá executors.<loại>.<tên> mà bộ đọc kit ra khác bộ đọc chuẩn. */
export function kitVsStrict(text) {
  const execs = leafKeys(loose(text)).filter(([k]) => k.startsWith("executors.") && k.split(".").length === 3);
  return { total: execs.length, lech: execs.filter(([k, v]) => resolveConfigKey(text, k) !== v).map(([k]) => k) };
}

/** Khoá lá (2–3 cấp) — HỢP tập khoá của hai bản, để khoá bị xoá cũng được so — mà bộ đọc kit ra giá trị khác nhau. */
export function kitBeforeAfter(oldText, newText) {
  const keys = [...new Set([...leafKeys(loose(oldText)), ...leafKeys(loose(newText))].map(([k]) => k))];
  return { total: keys.length, khac: keys.filter((k) => resolveConfigKey(oldText, k) !== resolveConfigKey(newText, k)) };
}

export function checkE4Supersede(evalsText) {
  const e4 = parseEvals(evalsText, ["status", "superseded_by"]).find((e) => e.id === "E4");
  if (!e4) return ["auth-hop-chuan không có ô E4"];
  const errs = [];
  if (e4.status !== "not-run") errs.push("auth-hop-chuan/E4 chưa khai status: not-run");
  if (e4.superseded_by !== SUPERSEDE) errs.push(`superseded_by của auth-hop-chuan/E4 là ${e4.superseded_by || "(trống)"}, cần ${SUPERSEDE}`);
  return errs;
}

const read = (f) => readFileSync(path.join(REPO, f), "utf8");
const fmt = (errs) => errs.map((e) => `${CONFIG} không phải YAML chuẩn: ${e.code} dòng ${e.line}`).join("; ");
/** Chèn một dòng ngay dưới «  script:» của executors (bản sao chuỗi). */
const plantInScript = (text, line) => text.replace(/^ {2}script:\n/m, (m) => `${m}${line}\n`);

describe("AER-AC-2 YAML chuẩn", () => {
  test("config.yaml đọc bằng bộ đọc chuẩn (khoá duy nhất) không lỗi", () => {
    const errs = strictErrors(read(CONFIG));
    assert.deepEqual(errs, [], fmt(errs));
  });
  test("chiều đỏ: thiếu dấu cách sau dấu hai chấm, và khoá lặp — bộ đọc chuẩn gọi đúng mã", () => {
    const text = read(CONFIG);
    assert.deepEqual(strictErrors(plantInScript(text, '    x:"y"')).map((e) => e.code), ["MULTILINE_IMPLICIT_KEY"]);
    const firstKey = text.match(/^ {2}script:\n {4}([a-z_0-9]+):/m)[1];
    assert.deepEqual(strictErrors(plantInScript(text, `    ${firstKey}: "lap"`)).map((e) => e.code), ["DUPLICATE_KEY"]);
  });
});

describe("AER-AC-2 bộ đọc kit khớp bộ đọc chuẩn", () => {
  test("mọi khoá executors.<loại>.<tên> ra cùng giá trị ở hai bộ đọc", () => {
    const { total, lech } = kitVsStrict(read(CONFIG));
    console.log(`so ${total} khoá executors`);
    assert.ok(total > 50, `chỉ đọc được ${total} khoá executors — bộ liệt khoá hỏng?`);
    assert.deepEqual(lech, [], `bộ đọc kit lệch bộ đọc chuẩn ở: ${lech.join(", ")}`);
  });
  test("chiều đỏ: khoá lặp mang giá trị khác ở cuối executors.script → bộ so gọi đúng khoá đó", () => {
    const text = read(CONFIG);
    const firstKey = text.match(/^ {2}script:\n {4}([a-z_0-9]+):/m)[1];
    const planted = text.replace(/^(executors:\n[\s\S]*?\n {2}script:\n(?: {4}.*\n|\s*#.*\n|\n)*)/m, `$1    ${firstKey}: "khac-nghia"\n`);
    assert.deepEqual(kitVsStrict(planted).lech, [`executors.script.${firstKey}`]);
  });
});

describe("AER-AC-2 không lệnh nào đổi nghĩa", () => {
  const gitShow = (rev) => execFileSync("git", ["show", `${rev}:${CONFIG}`], { cwd: REPO, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  test(`bộ đọc kit ra cùng giá trị cho mọi khoá trước và sau commit sửa ${FIX_COMMIT} (hợp tập khoá)`, (t) => {
    let r;
    try {
      r = soCapCoDinh(gitShow);
    } catch {
      return t.skip(`không đọc được ${FIX_COMMIT}^ / ${FIX_COMMIT} (clone nông?) — ca so trước-sau không chạy ở đây`);
    }
    assert.ok(r.doi, `${FIX_COMMIT} không đổi ${CONFIG} — sai commit mốc`);
    console.log(`so ${r.total} khoá trước-sau`);
    assert.ok(r.total > 100, `chỉ so được ${r.total} khoá — bộ liệt khoá hỏng?`);
    assert.deepEqual(r.khac, [], `giá trị đổi qua commit ${FIX_COMMIT}: ${r.khac.join(", ")}`);
  });
  test("chiều đỏ: bản «sau» đổi giá trị một lệnh, hay xoá hẳn một khoá → bộ so gọi đúng khoá đó", (t) => {
    let after;
    try {
      after = gitShow(FIX_COMMIT);
    } catch {
      return t.skip(`không đọc được ${FIX_COMMIT} (clone nông?)`);
    }
    const withAfter = (planted) => (rev) => (rev === FIX_COMMIT ? planted : gitShow(rev));
    const changed = after.replace(/^( {4}app_ui: )"[^"]*"/m, '$1"cd app && npm test -- --doi-nghia"');
    assert.notEqual(changed, after, "không tìm thấy dòng app_ui để cấy");
    assert.deepEqual(soCapCoDinh(withAfter(changed)).khac, ["executors.test.app_ui"]);
    const removed = after.replace(/^ {4}app_ui: .*\n/m, "");
    assert.notEqual(removed, after, "không tìm thấy dòng app_ui để xoá");
    assert.deepEqual(soCapCoDinh(withAfter(removed)).khac, ["executors.test.app_ui"]);
  });
  test("PR khác thêm hay sửa khoá ở cây đang kiểm không làm ca này đỏ (ca so không đọc cây đang kiểm)", (t) => {
    // Đối chứng: cùng bộ so, nếu đem so cây đang kiểm (có thêm khoá) với bản sau sửa thì báo khoá thêm — chứng bộ so nhạy;
    // còn soCapCoDinh chỉ nhận blob từ bộ đọc git nên kết quả không đổi theo cây.
    let base;
    try {
      base = soCapCoDinh(gitShow);
    } catch {
      return t.skip(`không đọc được ${FIX_COMMIT} (clone nông?)`);
    }
    const head = read(CONFIG).replace(/^ {2}script:\n/m, (m) => `${m}    pr_khac_them_khoa: "node --test scripts/x.test.mjs"\n`);
    assert.deepEqual(kitBeforeAfter(gitShow(FIX_COMMIT), head).khac.filter((k) => k.endsWith("pr_khac_them_khoa")), ["executors.script.pr_khac_them_khoa"]);
    assert.deepEqual(base.khac, [], "ca so cặp cố định phải xanh bất kể cây đang kiểm");
  });
});

describe("AER-AC-4 ô E4 của auth-hop-chuan được thay đúng", () => {
  const evals = read("_acceptance/auth-hop-chuan/evals.yaml");
  test("E4 khai not-run + superseded_by đúng đích; AC-1 có ở hồ sơ thay; ca AH-AC-4 đã rời tệp test", () => {
    assert.deepEqual(checkE4Supersede(evals), []);
    assert.match(read("_acceptance/auth-error-thu-lai-retry/contract.md"), /^- AC-1:/m, "hồ sơ thay phải có AC-1");
    // Bộ khớp ca test (mọi kiểu nháy) — đối chứng dương: nó bắt được ca AH-AC-5 còn trong tệp.
    const caseRe = (id) => new RegExp(`\\btest\\s*\\(\\s*["'\`]${id}\\b`);
    const ahc = read("app/tests/auth-hop-chuan.test.tsx");
    assert.match(ahc, caseRe("AH-AC-5"), "bộ khớp ca test phải bắt được ca AH-AC-5");
    assert.doesNotMatch(ahc, caseRe("AH-AC-4"), "ca AH-AC-4 phải rời auth-hop-chuan.test.tsx");
    assert.match("test('AH-AC-4 x', () => {})", caseRe("AH-AC-4"), "bộ khớp ca test phải bắt cả nháy đơn");
  });
  test("chiều đỏ: sai đích, thiếu status → bộ kiểm gọi đúng lỗi", () => {
    const wrong = evals.replace(`superseded_by: ${SUPERSEDE}`, "superseded_by: auth-error-khac#AC-1");
    assert.deepEqual(checkE4Supersede(wrong), [`superseded_by của auth-hop-chuan/E4 là auth-error-khac#AC-1, cần ${SUPERSEDE}`]);
    const noStatus = evals.replace(/^(\s*- id: E4\n(?:\s{4}.*\n)*?)\s{4}status: not-run\n/m, "$1");
    assert.deepEqual(checkE4Supersede(noStatus), ["auth-hop-chuan/E4 chưa khai status: not-run"]);
  });
});
