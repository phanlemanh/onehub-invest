// node --test scripts/ci-bo-qua-df-ac-3.test.mjs
// Ngoài-1 của ops-dong-chay-df0 (Cổng Bằng chứng 26/10): ca «DF-AC-3 DB thật» đòi sale_offers có tin nên đỏ trên DB CI
// dựng từ migration. Mục của nó trong scripts/ci-bo-qua.json phải lọc được ca LỒNG trong describe khi CI=true, và ở máy
// local (không CI) ca vẫn chạy. Đo trên một tệp test tạm cùng hình (describe > test, ca đỏ khi thiếu dữ liệu), không đụng DB.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";

import { loiDanhSach, nodeOptions } from "./lib/ci-can-du-lieu.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEP_THAT = "app/tests/ops-dong-chay.test.tsx";
const all = JSON.parse(readFileSync(path.join(REPO, "scripts/ci-bo-qua.json"), "utf8"));
const muc = all.app.find((m) => m.tep === TEP_THAT && m.ca.startsWith("DF-AC-3 DB thật"));
const TMP = realpathSync(mkdtempSync(path.join(tmpdir(), "df-ac-3-")));
after(() => rmSync(TMP, { recursive: true, force: true }));

/** Môi trường cho tiến trình node --test con: bỏ NODE_TEST_CONTEXT của tiến trình cha (không thì con báo về cha, stdout rỗng). */
const envCon = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== "NODE_TEST_CONTEXT"));

describe("Ngoài-1 DF-AC-3 bỏ qua trên CI", () => {
  test("mục DF-AC-3 có trong danh sách app và khớp ca thật lồng trong describe", () => {
    assert.ok(muc, `scripts/ci-bo-qua.json thiếu mục «DF-AC-3 DB thật» của ${TEP_THAT}`);
    assert.deepEqual(loiDanhSach([muc]), []);
    const src = readFileSync(path.join(REPO, TEP_THAT), "utf8");
    assert.match(src, /describe\("DF-AC-3 SQL khớp levelOf"/);
    assert.ok(src.includes(`test("${muc.ca}"`), "tên ca trong danh sách phải trùng nguyên văn tên test thật");
  });

  // Tệp tạm cùng hình ca thật: một ca thường xanh, ca DB thật đỏ vì thiếu dữ liệu.
  const tep = path.join(TMP, "df-ac-3.test.mjs");
  const chay = (list, ci) => {
    writeFileSync(
      tep,
      `import { describe, test } from "node:test";\ndescribe("DF-AC-3 SQL khớp levelOf", () => {\n  test("ca thường", () => {});\n  test(${JSON.stringify(muc?.ca ?? "")}, () => { throw new Error("thiếu dữ liệu thật"); });\n});\n`,
    );
    return spawnSync(process.execPath, ["--test", tep], { env: { ...envCon(), CI: ci ? "true" : "", NODE_OPTIONS: nodeOptions(list, ci) }, encoding: "utf8" });
  };
  const tom = (r) => `exit ${r.status} · ${r.stdout.match(/^ℹ (tests|pass|fail) \d+/gm)?.join(" · ")}`;

  test("CI=true với mục DF-AC-3 → ca DB thật bị lọc, job xanh", () => {
    const r = chay([muc], true);
    console.log(`# DF-AC-3 CI=true: ${tom(r)}`);
    assert.equal(r.status, 0, r.stdout);
    assert.match(r.stdout, /^ℹ tests 1$/m);
  });

  test("không CI → ca DB thật vẫn chạy và đỏ khi thiếu dữ liệu", () => {
    const r = chay([muc], false);
    console.log(`# DF-AC-3 không CI: ${tom(r)}`);
    assert.notEqual(r.status, 0, "ở máy local ca DB thật phải chạy, không bị lọc");
    assert.match(r.stdout, /thiếu dữ liệu thật/);
  });

  test("chiều đỏ: CI=true thiếu mục DF-AC-3 → job đỏ như trước bản sửa", () => {
    const r = chay(all.app.filter((m) => m !== muc), true);
    console.log(`# DF-AC-3 chiều đỏ thiếu mục: ${tom(r)}`);
    assert.notEqual(r.status, 0, "thiếu mục thì ca DB thật phải chạy và đỏ trên CI");
    assert.match(r.stdout, /thiếu dữ liệu thật/);
  });
});
