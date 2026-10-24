// node --test scripts/ops-nhan-ma-nguon.test.mjs
// ON7 `ops-nhan-ma-nguon` AC-3: bộ quét chữ hiển thị của Ops (mục 12 check-portal-compliance). Tên nguồn thật lấy lúc
// chạy từ db/migrations (scripts/lib/tier-a-source-names.mjs) — tệp này không chứa tên nào. Tên ca mở đầu bằng mã AC.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";
import { scanSource } from "./lib/ops-visible-strings.mjs";
import { findSourceNames, sourceRegistrySeeds } from "./lib/tier-a-source-names.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEEDS = sourceRegistrySeeds();
const NAME = SEEDS.find((s) => s.code === "S02").realName; // dựng lúc chạy, không viết cứng
const TMP = realpathSync(mkdtempSync(path.join(tmpdir(), "ops-tier-a-")));
after(() => rmSync(TMP, { recursive: true, force: true }));

describe("ON7-AC-3 ma trận viết trước", () => {
  test("ON7-AC-3 ma trận: bộ quét trên tệp ở cây gốc 460e61a bắt đúng scripts/fixtures/ops-tier-a-matrix.json (không thiếu, không thừa)", () => {
    const m = JSON.parse(readFileSync(path.join(REPO, "scripts/fixtures/ops-tier-a-matrix.json"), "utf8"));
    assert.ok(m.hits.length >= 30 && m.files.length >= 20, `ma trận quá nhỏ (${m.hits.length} chỗ / ${m.files.length} tệp) — khuôn rút sai`);
    const got = new Set();
    for (const f of m.files) {
      const src = execFileSync("git", ["show", `${m.base}:${f}`], { cwd: REPO, maxBuffer: 1 << 24 }).toString();
      for (const h of scanSource(f, src, SEEDS)) got.add(`${h.code}|${h.file}|${h.line}`);
    }
    const want = new Set(m.hits.map((h) => `${h.code}|${h.file}|${h.line}`));
    assert.deepEqual([...want].filter((k) => !got.has(k)), [], "bộ quét SÓT chỗ chữ hiển thị đã kê trong ma trận");
    assert.deepEqual([...got].filter((k) => !want.has(k)), [], "bộ quét bắt THỪA chỗ không phải chữ hiển thị");
  });
});

// Cây sao tối thiểu: một component lành (chỉ mã S0x) trong phạm vi + một tệp ở sources/ có tên (đối chứng dương).
const CLEAN = `export function Ok({ n }: { n: number }) {
  const items = [{ key: "s02", value: "s02", title: "S02 · Hiệu chuẩn", detail: "Đối chiếu S02" }]
  return (
    <section title="Thị trường S02 · Hiệu chuẩn">
      {\`Rotation S02 · Hiệu chuẩn \${n}\`}
      {items.map((i) => <p key={i.key}>{i.title}</p>)}
    </section>
  )
}
`;
function tree(name, component) {
  const root = path.join(TMP, name);
  mkdirSync(path.join(root, "app/src/components/ops/sources"), { recursive: true });
  writeFileSync(path.join(root, "app/src/components/ops/ok.tsx"), component);
  writeFileSync(path.join(root, "app/src/components/ops/sources/accounts.tsx"), `export const A = () => <p>Tài khoản ${NAME}</p>\n`);
  return root;
}
function run(root) {
  const r = spawnSync(process.execPath, ["scripts/check-portal-compliance.mjs", "--only", "ops-tier-a", "--root", root], { cwd: REPO, encoding: "utf8" });
  // đầu ra thước không bao giờ được chứa tên nguồn thật
  assert.deepEqual(findSourceNames(r.stdout + r.stderr, SEEDS), [], "đầu ra của thước làm lộ tên nguồn thật");
  return r;
}

describe("ON7-AC-3 cây sao", () => {
  test("ON7-AC-3 cây lành → thoát 0", () => {
    const r = run(tree("lanh", CLEAN));
    assert.equal(r.status, 0, r.stdout);
    assert.match(r.stdout, /đối chứng dương: bộ quét thấy tên thật ở components\/ops\/sources\/ \(1 chỗ\)/);
  });
  for (const [label, mutate] of [
    ["tên thật trong tiêu đề", (s) => s.replace('title="Thị trường S02 · Hiệu chuẩn"', `title="Thị trường ${NAME}"`)],
    ["tên thật trong template literal render qua {…}", (s) => s.replace("{`Rotation S02 · Hiệu chuẩn", `{\`Rotation ${NAME}`)],
    ["tên thật ở khoá đối tượng ngoài danh sách", (s) => s.replace('detail: "Đối chiếu S02"', `note: "Đối chiếu ${NAME}"`)],
    ["tên thật trong nhánh ternary bên trong ${…} của template", (s) => s.replace('Hiệu chuẩn ${n}`}', 'Hiệu chuẩn ${n ? "' + NAME + '" : ""}`}')],
  ]) {
    test(`ON7-AC-3 chiều đỏ: ${label} → thoát 1, báo mã S0x + tệp:dòng, không in tên`, () => {
      const bad = mutate(CLEAN);
      assert.notEqual(bad, CLEAN, `khuôn đột biến «${label}» không khớp mã nguồn`);
      const line = bad.split("\n").findIndex((l) => l.includes(NAME)) + 1;
      const r = run(tree(`do-${encodeURIComponent(label).length}-${line}`, bad));
      assert.equal(r.status, 1, `bộ quét không bắt «${label}»\n${r.stdout}`);
      assert.ok(r.stdout.includes(`tên nguồn thật (S02) ở chữ hiển thị app/src/components/ops/ok.tsx:${line}`), r.stdout);
    });
  }
});
